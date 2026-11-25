import { Schema } from 'effect';
import type postgres from 'postgres';
import { cveId } from './advisories.ts';
import type { PackageFeed } from './package-advisories.ts';
import { readLimitedText } from './sources.ts';

const origin = 'https://osv-vulnerabilities.storage.googleapis.com/';
const evidenceUrl = 'https://osv.dev/vulnerability/';
const ecosystems = ['npm', 'PyPI', '[EMPTY]'] as const;
const manifestBytes = 32 * 1024;
const monitoredRecords = 200;
const batchSize = 6;
const idPattern = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/u;
const timestampPattern = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{1,9}))?Z$/u;

const fieldValue = Schema.String.pipe(Schema.minLength(1), Schema.maxLength(512));
const ecosystemName = Schema.String.pipe(Schema.minLength(1), Schema.maxLength(64));
const event = Schema.Struct({
  introduced: Schema.optional(fieldValue),
  fixed: Schema.optional(fieldValue),
  last_affected: Schema.optional(fieldValue),
  limit: Schema.optional(fieldValue),
});
const rangeInput = Schema.Struct({
  type: Schema.String,
  events: Schema.Array(event).pipe(Schema.maxItems(256)),
});
const advisory = Schema.Struct({
  id: Schema.String.pipe(Schema.pattern(idPattern)),
  aliases: Schema.optional(Schema.Array(Schema.String).pipe(Schema.maxItems(100))),
  modified: Schema.String,
  published: Schema.optional(Schema.String),
  withdrawn: Schema.optional(Schema.String),
  affected: Schema.optional(
    Schema.Array(
      Schema.Struct({
        package: Schema.optional(Schema.Struct({ ecosystem: ecosystemName, name: fieldValue })),
        ranges: Schema.optional(Schema.Array(rangeInput).pipe(Schema.maxItems(128))),
        versions: Schema.optional(Schema.Array(fieldValue).pipe(Schema.maxItems(4096))),
      })
    ).pipe(Schema.maxItems(256))
  ),
});

interface Revision {
  id: string;
  modified: string;
}

type Ecosystem = (typeof ecosystems)[number];
type Package = PackageFeed['recent'][number]['packages'][number];

function sourceTime(value: string) {
  const parts = timestampPattern.exec(value);
  const millis = Date.parse(value);
  if (
    !parts?.[1] ||
    !Number.isFinite(millis) ||
    new Date(millis).toISOString().slice(0, 19) !== parts[1]
  ) {
    throw new Error('Invalid OSV revision timestamp');
  }
  return `${parts[1]}.${(parts[2] ?? '').padEnd(9, '0')}Z`;
}

export function parseOsvManifest(body: string, partial: boolean): Revision[] {
  const lines = body.split(/\r?\n/u);
  if (partial && !body.endsWith('\n')) lines.pop();
  const revisions = new Map<string, Revision>();
  let previous: string | undefined;
  for (const line of lines) {
    if (line === '') continue;
    const [rawTime, id, extra] = line.split(',');
    if (!rawTime || !id || extra !== undefined || !idPattern.test(id)) {
      throw new Error('Invalid OSV manifest row');
    }
    const modified = sourceTime(rawTime);
    if (previous && previous < modified) throw new Error('Unordered OSV manifest');
    previous = modified;
    if (!revisions.has(id)) revisions.set(id, { id, modified });
  }
  return [...revisions.values()];
}

function packageRanges(events: readonly (typeof event.Type)[]) {
  const ranges: Pick<Package, 'range' | 'fixed'>[] = [];
  let start: string | undefined;
  for (const entry of events) {
    if (entry.introduced !== undefined) start = entry.introduced;
    const end = entry.fixed ?? entry.last_affected ?? entry.limit;
    if (end !== undefined && start !== undefined) {
      const lower = start !== '0' ? `>= ${start}, ` : '';
      const upper = entry.last_affected !== undefined ? '<=' : '<';
      ranges.push({ range: `${lower}${upper} ${end}`, fixed: entry.fixed ?? null });
      start = undefined;
    }
  }
  if (start && start !== '0') ranges.push({ range: `>= ${start}`, fixed: null });
  return ranges;
}

function packagesFrom(record: typeof advisory.Type): Package[] {
  const packages: Package[] = [];
  for (const item of record.affected ?? []) {
    if (!item.package) continue;
    const coordinate = item.package;
    const ranges = (item.ranges ?? [])
      .filter(candidate => candidate.type === 'SEMVER' || candidate.type === 'ECOSYSTEM')
      .flatMap(candidate => packageRanges(candidate.events));
    for (const range of ranges) packages.push({ ...coordinate, ...range });
    const versions = item.versions ?? [];
    for (let at = 0; at < versions.length; at += 7) {
      packages.push({
        ...coordinate,
        range: versions.slice(at, at + 7).join(', '),
        fixed: null,
      });
    }
    if (!ranges.length && !versions.length)
      packages.push({ ...coordinate, range: '', fixed: null });
  }
  return packages;
}

export function parseOsvPackage(body: string, expected: string) {
  const record = Schema.decodeUnknownSync(advisory)(JSON.parse(body));
  if (record.id !== expected) throw new Error('OSV advisory identity mismatch');
  const kind: PackageFeed['recent'][number]['kind'] = record.id.startsWith('MAL-')
    ? 'malware'
    : 'reviewed';
  const aliases = record.aliases ?? [];
  return {
    id: record.id,
    cveId: cveId.test(record.id) ? record.id : (aliases.find(alias => cveId.test(alias)) ?? null),
    kind,
    advisoryUrl: evidenceUrl + encodeURIComponent(record.id),
    modified: sourceTime(record.modified),
    published: record.published ? sourceTime(record.published) : null,
    withdrawn: record.withdrawn ? sourceTime(record.withdrawn) : null,
    packages: packagesFrom(record),
  };
}

function resource(ecosystem: Ecosystem, file: string) {
  return origin + encodeURIComponent(ecosystem) + '/' + file;
}

async function readManifest(ecosystem: Ecosystem) {
  const response = await fetch(resource(ecosystem, 'modified_id.csv'), {
    headers: { Range: `bytes=0-${manifestBytes - 1}` },
    signal: AbortSignal.timeout(6_000),
    redirect: 'manual',
  });
  if (response.status !== 200 && response.status !== 206) throw new Error('OSV manifest failed');
  const range = /^bytes 0-(\d+)\/(\d+)$/u.exec(response.headers.get('Content-Range') ?? '');
  if (response.status === 206 && (!range?.[1] || !range[2] || Number(range[1]) >= manifestBytes)) {
    throw new Error('Invalid OSV manifest range');
  }
  const partial = Boolean(range?.[1] && range[2] && Number(range[1]) + 1 < Number(range[2]));
  const entries = parseOsvManifest(await readLimitedText(response, manifestBytes), partial);
  if (!entries.length) throw new Error('OSV manifest is empty');
  return entries;
}

async function readRecord(ecosystem: Ecosystem, revision: Revision) {
  const response = await fetch(resource(ecosystem, encodeURIComponent(revision.id) + '.json'), {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(6_000),
    redirect: 'manual',
  });
  if (!response.ok) throw new Error('OSV package advisory failed');
  const record = parseOsvPackage(await readLimitedText(response, 512 * 1024), revision.id);
  if (record.modified < revision.modified) throw new Error('OSV file predates its manifest');
  return record;
}

async function saveRecords(
  sql: postgres.Sql,
  ecosystem: Ecosystem,
  captured: Date,
  complete: boolean,
  records: readonly ReturnType<typeof parseOsvPackage>[]
) {
  await sql.begin(async transaction => {
    await transaction`SET LOCAL statement_timeout = '8s'`;
    if (records.length) {
      await transaction`
        INSERT INTO public.cve_osv_package_advisory AS stored (
          id, cve_id, kind, advisory_url, published_at, revision, withdrawn_at, observed_at, packages
        )
        SELECT id, "cveId", kind, "advisoryUrl", published, modified, withdrawn, ${captured}, packages
          FROM jsonb_to_recordset(${JSON.stringify(records)}::text::jsonb)
               AS record(id text, "cveId" text, kind text, "advisoryUrl" text, published timestamptz,
                         modified text, withdrawn timestamptz, packages jsonb)
         ORDER BY id
        ON CONFLICT (id) DO UPDATE SET
          cve_id = excluded.cve_id, kind = excluded.kind, published_at = excluded.published_at,
          revision = excluded.revision, withdrawn_at = excluded.withdrawn_at, packages = excluded.packages
        WHERE excluded.revision > stored.revision
      `;
    }
    await transaction`
      INSERT INTO public.cve_osv_package_source AS stored (ecosystem, checked_at, successful_at, complete)
      VALUES (${ecosystem}, ${captured}, CASE WHEN ${complete} THEN ${captured}::timestamptz END, ${complete})
      ON CONFLICT (ecosystem) DO UPDATE SET
        checked_at = excluded.checked_at, successful_at = coalesce(excluded.successful_at, stored.successful_at),
        complete = excluded.complete
      WHERE excluded.checked_at >= stored.checked_at
    `;
  });
}

async function collectEcosystem(sql: postgres.Sql, ecosystem: Ecosystem) {
  const captured = new Date();
  try {
    const revisions = await readManifest(ecosystem);
    const knownOnly = ecosystem === '[EMPTY]';
    const candidates = knownOnly ? revisions : revisions.slice(0, monitoredRecords);
    const pending = await sql<Revision[]>`
      SELECT candidate.id, candidate.modified
        FROM jsonb_to_recordset(${JSON.stringify(candidates)}::text::jsonb) AS candidate(id text, modified text)
        LEFT JOIN public.cve_osv_package_advisory stored ON stored.id = candidate.id
       WHERE (NOT ${knownOnly} OR stored.id IS NOT NULL)
         AND (stored.revision IS NULL OR candidate.modified COLLATE "C" > stored.revision)
       ORDER BY candidate.modified COLLATE "C" DESC, candidate.id
       LIMIT ${batchSize + 1}
    `;
    const results = await Promise.allSettled(
      pending.slice(0, batchSize).map(revision => readRecord(ecosystem, revision))
    );
    const records = results.flatMap(result =>
      result.status === 'fulfilled' ? [result.value] : []
    );
    await saveRecords(sql, ecosystem, captured, records.length === pending.length, records);
    if (records.length < results.length) console.warn('osv_package_documents_failed', ecosystem);
  } catch (error) {
    await saveRecords(sql, ecosystem, captured, false, []);
    throw error;
  }
}

export async function collectOsvPackages(sql: postgres.Sql) {
  const results = await Promise.allSettled(
    ecosystems.map(ecosystem => collectEcosystem(sql, ecosystem))
  );
  if (results.some(result => result.status === 'rejected')) {
    throw new Error('OSV package collection incomplete');
  }
}

export async function osvPackageFeed(sql: postgres.Sql) {
  const [sources, recent] = await Promise.all([
    sql<(PackageFeed['sources'][number] & { provider: 'OSV' })[]>`
      WITH status AS (
        SELECT min(checked_at) AS checked_at, count(*) = 3 AND bool_and(complete) AS complete
          FROM public.cve_osv_package_source
      )
      SELECT feed.kind, 'OSV' AS provider,
             to_char(status.checked_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "checkedAt",
             status.complete,
             (SELECT count(*)::int FROM public.cve_osv_package_advisory a
               WHERE a.kind = feed.kind AND a.withdrawn_at IS NULL AND a.published_at IS NOT NULL
                 AND jsonb_array_length(a.packages) > 0
                 AND NOT EXISTS (SELECT 1 FROM public.cve_package_advisory ghsa
                                  WHERE ghsa.id = a.id AND ghsa.withdrawn_at IS NOT NULL)) AS total
        FROM (VALUES ('reviewed'), ('malware')) AS feed(kind) CROSS JOIN status
       WHERE status.checked_at IS NOT NULL
       ORDER BY feed.kind
    `,
    sql<PackageFeed['recent'][number][]>`
      SELECT a.id, a.cve_id AS "cveId", a.kind, a.advisory_url AS "advisoryUrl",
             to_char(a.published_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "publishedAt",
             to_char(a.observed_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "observedAt",
             jsonb_path_query_array(a.packages, '$[0 to 7]') AS packages
        FROM (VALUES ('reviewed'), ('malware')) AS feeds(kind)
        CROSS JOIN LATERAL (
          SELECT osv.* FROM public.cve_osv_package_advisory osv
           WHERE osv.kind = feeds.kind AND osv.withdrawn_at IS NULL AND osv.published_at IS NOT NULL
             AND jsonb_array_length(osv.packages) > 0
             AND NOT EXISTS (SELECT 1 FROM public.cve_package_advisory ghsa
                              WHERE ghsa.id = osv.id AND ghsa.withdrawn_at IS NOT NULL)
           ORDER BY osv.published_at DESC, osv.id DESC
           LIMIT 4
        ) a
       ORDER BY a.published_at DESC, a.id DESC
    `,
  ]);
  return { sources, recent };
}
