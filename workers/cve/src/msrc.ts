import { Schema } from 'effect';
import type postgres from 'postgres';
import { readLimitedText } from './sources.ts';

export const msrcProvider = 'Microsoft MSRC';
const directory = new URL('https://msrc.microsoft.com/csaf/advisories/');
const manifestUrl = new URL('changes.csv', directory);
const changesPath = /^(\d{4}\/msrc_cve-(\d{4}-\d{4,19})\.json)$/u;
const changeLine = /^"([^"]+)","([^"]+)"$/u;
const utc = Schema.String.pipe(
  Schema.pattern(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/u)
);
const advisory = Schema.Struct({
  document: Schema.Struct({
    tracking: Schema.Struct({ initial_release_date: utc, current_release_date: utc }),
  }),
  vulnerabilities: Schema.Array(
    Schema.Struct({
      cve: Schema.optional(Schema.String),
      threats: Schema.optional(
        Schema.Array(Schema.Struct({ category: Schema.String, details: Schema.String }))
      ),
    })
  ),
});
const checkpoint = Schema.Struct({
  since: utc,
  baselineThrough: utc,
});
const baselineSize = 48;
const batchSize = 3;
const sourceLimit = 1024 * 1024;
const advisoryLimit = 512 * 1024;
const lookbackMs = 24 * 60 * 60_000;

interface Change {
  id: string;
  path: string;
  modified: string;
}

function isoTime(value: string) {
  const timestamp = Date.parse(Schema.decodeUnknownSync(utc)(value));
  if (!Number.isFinite(timestamp)) throw new Error('Invalid Microsoft CSAF date');
  const normalized = new Date(timestamp).toISOString();
  if (normalized.slice(0, 19) !== value.slice(0, 19)) {
    throw new Error('Invalid Microsoft CSAF date');
  }
  return normalized;
}

export function parseMsrcChanges(csv: string, truncated: boolean): Change[] {
  const lines = csv.split(/\r?\n/u);
  if (truncated && !csv.endsWith('\n')) lines.pop();
  const changes = new Map<string, Change>();
  let previousDate: string | null = null;
  for (const line of lines) {
    if (!line) continue;
    const row = changeLine.exec(line);
    if (!row?.[1] || !row[2]) throw new Error('Invalid Microsoft CSAF change');
    const [, path, number] = changesPath.exec(row[1]) ?? [];
    const modified = isoTime(row[2]);
    if (previousDate && modified > previousDate)
      throw new Error('Unordered Microsoft CSAF changes');
    previousDate = modified;
    if (!path || !number) {
      if (/^\d{4}\/msrc_adv\d+\.json$/u.test(row[1])) continue;
      throw new Error('Invalid Microsoft CSAF change path');
    }
    const id = 'CVE-' + number;
    if (!changes.has(id)) changes.set(id, { id, path, modified });
  }
  return Array.from(changes.values());
}

export function parseMsrcAdvisory(raw: Schema.Schema.Type<typeof advisory>, change: Change) {
  const decoded = Schema.decodeUnknownSync(advisory)(raw);
  const { initial_release_date, current_release_date } = decoded.document.tracking;
  const published = isoTime(initial_release_date);
  const modified = isoTime(current_release_date);
  const record = decoded.vulnerabilities.find(vulnerability => vulnerability.cve === change.id);
  if (!record || published > modified || modified < change.modified) {
    throw new Error('Microsoft CSAF record does not match its manifest entry');
  }
  const statuses = (record.threats ?? [])
    .filter(threat => threat.category === 'exploit_status')
    .flatMap(threat => threat.details.split(';').map(status => status.trim()));
  return {
    cve_id: change.id,
    advisory_url: 'https://msrc.microsoft.com/update-guide/vulnerability/' + change.id,
    published,
    modified,
    exploited: statuses.includes('Exploited:Yes') && !statuses.includes('Exploited:No'),
  };
}

async function manifest(limit: number) {
  const response = await fetch(manifestUrl, {
    headers: { Range: `bytes=0-${limit - 1}` },
    redirect: 'manual',
    signal: AbortSignal.timeout(6_000),
  });
  if (response.status !== 200 && response.status !== 206) {
    throw new Error('Microsoft CSAF manifest unavailable');
  }
  let partial = false;
  if (response.status === 206) {
    const range = /^bytes 0-(\d+)\/(\d+)$/u.exec(response.headers.get('Content-Range') ?? '');
    if (
      !range?.[1] ||
      !range[2] ||
      Number(range[1]) >= limit ||
      Number(range[1]) >= Number(range[2])
    ) {
      throw new Error('Invalid Microsoft CSAF manifest range');
    }
    partial = Number(range[1]) + 1 < Number(range[2]);
  }
  const raw = await readLimitedText(response, response.status === 206 ? limit : sourceLimit);
  return { changes: parseMsrcChanges(raw, partial), partial };
}

async function readAdvisory(change: Change) {
  const response = await fetch(new URL(change.path, directory), {
    headers: { Accept: 'application/json' },
    redirect: 'manual',
    signal: AbortSignal.timeout(6_000),
  });
  if (!response.ok) throw new Error(`Microsoft CSAF advisory returned HTTP ${response.status}`);
  const raw = await readLimitedText(response, advisoryLimit);
  return parseMsrcAdvisory(JSON.parse(raw), change);
}

async function pendingChanges(sql: postgres.Sql, entries: readonly Change[]) {
  return sql<Change[]>`
    SELECT candidate.id, candidate.path, candidate.modified
      FROM jsonb_to_recordset(${JSON.stringify(entries)}::text::jsonb)
           AS candidate(id text, path text, modified text)
      LEFT JOIN public.cve_vendor_signal stored
        ON stored.provider = ${msrcProvider}
       AND stored.cve_id = candidate.id
       AND stored.advisory_url = 'https://msrc.microsoft.com/update-guide/vulnerability/' || candidate.id
     WHERE stored.publisher_modified_at IS NULL OR stored.publisher_modified_at < candidate.modified::timestamptz
     ORDER BY candidate.modified, candidate.path
     LIMIT ${batchSize + 1}
  `;
}

export async function collectMsrc(sql: postgres.Sql): Promise<void> {
  const started = new Date();
  try {
    const [before] = await sql<{ etag: string | null }[]>`
      SELECT etag FROM public.cve_vendor_signal_source WHERE provider = ${msrcProvider}
    `;
    let window = await manifest(8192);
    const latest = window.changes.at(0);
    const baseline = window.changes.at(baselineSize - 1) ?? window.changes.at(-1);
    if (!latest || !baseline) throw new Error('Microsoft CSAF manifest is empty');
    const state = before?.etag
      ? Schema.decodeUnknownSync(checkpoint)(JSON.parse(before.etag))
      : { since: baseline.modified, baselineThrough: latest.modified };
    if (window.partial && (window.changes.at(-1)?.modified ?? '') >= state.since) {
      window = await manifest(sourceLimit);
    }
    const newest = window.changes.at(0);
    if (
      !newest ||
      newest.modified < state.since ||
      (window.partial && (window.changes.at(-1)?.modified ?? '') >= state.since)
    ) {
      throw new Error('Microsoft CSAF manifest does not cover the saved checkpoint');
    }
    const pending = await pendingChanges(
      sql,
      window.changes.filter(change => change.modified >= state.since)
    );
    const records: (Awaited<ReturnType<typeof readAdvisory>> & {
      received: string;
      baseline: boolean;
    })[] = [];
    let failure: unknown;
    for (const change of pending.slice(0, batchSize)) {
      try {
        const record = await readAdvisory(change);
        records.push({
          ...record,
          received: new Date().toISOString(),
          baseline: record.modified <= state.baselineThrough,
        });
      } catch (error) {
        failure = error;
        break;
      }
    }
    const complete = records.length === pending.length;
    const since = new Date(Date.parse(newest.modified) - lookbackMs).toISOString();
    const saved = {
      since: complete && since > state.since ? since : state.since,
      baselineThrough: state.baselineThrough,
    };
    const checked = new Date().toISOString();
    await sql.begin(async transaction => {
      await transaction`SET LOCAL statement_timeout = '8s'`;
      const [lock] = await transaction<{ locked: boolean }[]>`
        SELECT pg_try_advisory_xact_lock(213770071, 3) AS locked
      `;
      if (!lock?.locked) return;
      const [moreRecent] = await transaction<{ checked: Date }[]>`
        SELECT checked_at AS checked FROM public.cve_vendor_signal_source
         WHERE provider = ${msrcProvider} AND checked_at >= ${started.toISOString()}::timestamptz
      `;
      if (moreRecent) return;
      if (records.length) {
        await transaction`
          INSERT INTO public.cve_vendor_signal AS stored (
            provider, cve_id, advisory_url, publisher_published_at, publisher_modified_at,
            reported_exploited, first_received_at, first_exploitation_received_at, baseline
          )
          SELECT ${msrcProvider}, cve_id, advisory_url, published, modified,
                 exploited, received, CASE WHEN exploited THEN received END, baseline
            FROM jsonb_to_recordset(${JSON.stringify(records)}::text::jsonb)
                 AS incoming(cve_id text, advisory_url text, published timestamptz, modified timestamptz,
                             exploited boolean, received timestamptz, baseline boolean)
          ON CONFLICT (provider, advisory_url, cve_id) DO UPDATE
            SET publisher_published_at = excluded.publisher_published_at,
                publisher_modified_at = excluded.publisher_modified_at,
                reported_exploited = excluded.reported_exploited,
                first_exploitation_received_at = coalesce(
                  stored.first_exploitation_received_at, excluded.first_exploitation_received_at
                )
          WHERE excluded.publisher_modified_at > stored.publisher_modified_at
        `;
      }
      await transaction`
        INSERT INTO public.cve_vendor_signal_source AS source (
          provider, etag, checked_at, successful_at, complete
        ) VALUES (
          ${msrcProvider}, ${JSON.stringify(saved)}, ${checked}::timestamptz,
          CASE WHEN ${complete} THEN ${checked}::timestamptz END, ${complete}
        )
        ON CONFLICT (provider) DO UPDATE
           SET etag = excluded.etag, checked_at = excluded.checked_at,
               successful_at = coalesce(excluded.successful_at, source.successful_at),
               complete = excluded.complete
      `;
    });
    if (failure) throw failure;
  } catch (error) {
    await sql`
      INSERT INTO public.cve_vendor_signal_source AS source (provider, checked_at, complete)
      VALUES (${msrcProvider}, now(), FALSE)
      ON CONFLICT (provider) DO UPDATE SET checked_at = excluded.checked_at, complete = FALSE
      WHERE source.checked_at < ${started.toISOString()}::timestamptz
    `;
    throw error;
  }
}
