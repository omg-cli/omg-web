import { Schema } from 'effect';
import {
  batchInChunks,
  chunkArray,
  readDb,
  sha256Hex,
  writeDb,
  type D1Bound,
  type D1Client,
  type D1Executor,
} from './d1.ts';
import { cveId } from './advisories.ts';
import { collectEuvd } from './euvd.ts';
import { collectMsrc } from './msrc.ts';
import { collectOsvPackages, osvPackageFeed } from './osv-packages.ts';
import { mergePackageFeeds } from './package-advisories.ts';
import { collectPackageAdvisories, packageFeed } from './package-store.ts';
import { streamName, streamPath, type DashboardBinding } from './stream.ts';
import { loadEvidence, zeroDayView, type ZeroDay, type ZeroDayView } from './zero-days.ts';
import {
  collectChrome,
  recentPublisherExploitation,
  vendorSignals,
  watchStatuses,
} from './vendor-store.ts';

interface Environment extends DashboardBinding {
  DB: D1Client;
}

type Feed = Awaited<ReturnType<typeof loadEvidence>>[number];

function toInput(feed: Feed) {
  const distinct = new Map<
    string,
    {
      cve_id: string;
      vendor: string | null;
      product: string;
      discovered: string | null;
      patched: string | null;
      evidence: string;
      vendor_url: string | null;
      catalog_year: number | null;
    }
  >();
  for (const row of feed.rows) {
    if (distinct.has(row.id)) continue;
    distinct.set(row.id, {
      cve_id: row.id,
      vendor: row.vendor ?? null,
      product: row.product,
      discovered: row.discovered ?? null,
      patched: row.patched,
      evidence: row.evidence,
      vendor_url: row.vendorAdvisory ?? null,
      catalog_year: row.year ?? null,
    });
  }
  return [...distinct.values()];
}

const pendingEvidenceList = zeroDayView.fields.entries;

function parsePendingEvidence(raw: string | null | undefined): ZeroDay[] {
  if (!raw) return [];
  try {
    return [...Schema.decodeUnknownSync(pendingEvidenceList)(JSON.parse(raw))];
  } catch {
    return [];
  }
}

async function ingest(db: D1Executor, feed: Feed, checkedAt: string) {
  const input = toInput(feed);
  const previous = await db
    .prepare(
      `SELECT CASE WHEN successful_at IS NULL THEN 1 ELSE 0 END AS baseline,
              checked_at AS checkedAt,
              pending_evidence_json AS pendingJson
         FROM cve_exploitation_source
        WHERE source = ?`
    )
    .bind(feed.source)
    .first<{ baseline: number; checkedAt: string; pendingJson: string }>();
  if (previous && previous.checkedAt > checkedAt) return;

  const previousPending = parsePendingEvidence(previous?.pendingJson);
  const before = new Map(previousPending.map(entry => [entry.id, entry]));
  const pending = feed.complete ? new Map<string, ZeroDay>() : new Map(before);
  for (const row of feed.rows) pending.delete(row.id);

  let matchedCount = 0;
  const statements: D1Bound[] = [];

  if (input.length > 0) {
    const archiveShaById = new Map<string, string>();
    const chunks = chunkArray(input, 200);
    const pages = await Promise.all(
      chunks.map(chunk =>
        db
          .prepare(
            `SELECT id, payload_sha256
               FROM source_record
              WHERE state = 'PUBLISHED' AND id IN (SELECT value FROM json_each(?))`
          )
          .bind(JSON.stringify(chunk.map(item => item.cve_id)))
          .all<{ id: string; payload_sha256: string }>()
      )
    );
    for (const page of pages) {
      for (const row of page.results) archiveShaById.set(row.id, row.payload_sha256);
    }

    const baseline = previous?.baseline ?? 1;
    const unmatched = new Set<string>();
    const matchedInputs = input.filter(item => {
      if (archiveShaById.has(item.cve_id)) return true;
      unmatched.add(item.cve_id);
      return false;
    });
    matchedCount = matchedInputs.length;

    const evidenceHashes = await Promise.all(
      matchedInputs.map(item => sha256Hex(JSON.stringify(item)))
    );

    for (let index = 0; index < matchedInputs.length; index++) {
      const item = matchedInputs[index]!;
      const archiveSha = archiveShaById.get(item.cve_id)!;
      const evidenceSha = evidenceHashes[index]!;
      const firstSeen = before.get(item.cve_id)?.observedAt ?? checkedAt;
      statements.push(
        db
          .prepare(
            `INSERT INTO cve_exploitation_evidence (
               cve_id, source, vendor, product, discovered_on, patched_on, evidence_url, vendor_url,
               catalog_year, archive_revision_sha256, evidence_sha256, first_seen_at, last_changed_at, baseline
             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
             ON CONFLICT (cve_id, source) DO UPDATE SET
               vendor = excluded.vendor,
               product = excluded.product,
               discovered_on = excluded.discovered_on,
               patched_on = excluded.patched_on,
               evidence_url = excluded.evidence_url,
               vendor_url = excluded.vendor_url,
               catalog_year = excluded.catalog_year,
               archive_revision_sha256 = excluded.archive_revision_sha256,
               evidence_sha256 = excluded.evidence_sha256,
               last_changed_at = excluded.last_changed_at,
               withdrawn_at = NULL
             WHERE cve_exploitation_evidence.evidence_sha256 <> excluded.evidence_sha256
                OR cve_exploitation_evidence.archive_revision_sha256 <> excluded.archive_revision_sha256
                OR cve_exploitation_evidence.withdrawn_at IS NOT NULL`
          )
          .bind(
            item.cve_id,
            feed.source,
            item.vendor,
            item.product,
            item.discovered,
            item.patched,
            item.evidence,
            item.vendor_url,
            item.catalog_year,
            archiveSha,
            evidenceSha,
            firstSeen,
            checkedAt,
            baseline
          )
      );
    }

    for (const row of feed.rows) {
      if (unmatched.has(row.id)) {
        pending.set(row.id, {
          ...row,
          archived: false,
          observedAt: before.get(row.id)?.observedAt ?? checkedAt,
        });
      }
    }
  }

  if (feed.complete && feed.coverageYears.length > 0) {
    const activeIds = new Set(input.map(entry => entry.cve_id));
    const { results: existingRows } = await db
      .prepare(
        `SELECT cve_id
           FROM cve_exploitation_evidence
          WHERE source = ? AND withdrawn_at IS NULL
            AND catalog_year IN (SELECT CAST(value AS INTEGER) FROM json_each(?))`
      )
      .bind(feed.source, JSON.stringify(feed.coverageYears))
      .all<{ cve_id: string }>();
    const toWithdraw = existingRows.map(row => row.cve_id).filter(cve => !activeIds.has(cve));
    for (const chunk of chunkArray(toWithdraw, 200)) {
      statements.push(
        db
          .prepare(
            `UPDATE cve_exploitation_evidence
                SET withdrawn_at = ?
              WHERE source = ? AND withdrawn_at IS NULL
                AND cve_id IN (SELECT value FROM json_each(?))`
          )
          .bind(checkedAt, feed.source, JSON.stringify(chunk))
      );
    }
  }

  statements.push(
    db
      .prepare(
        `INSERT INTO cve_exploitation_source (
           source, checked_at, successful_at, coverage_years_json, observed_count, matched_count, complete, error_code, pending_evidence_json
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (source) DO UPDATE SET
           checked_at = excluded.checked_at,
           complete = excluded.complete,
           error_code = excluded.error_code,
           successful_at = COALESCE(excluded.successful_at, cve_exploitation_source.successful_at),
           coverage_years_json = excluded.coverage_years_json,
           observed_count = excluded.observed_count,
           matched_count = excluded.matched_count,
           pending_evidence_json = excluded.pending_evidence_json`
      )
      .bind(
        feed.source,
        checkedAt,
        feed.complete ? checkedAt : null,
        JSON.stringify(feed.coverageYears),
        input.length,
        matchedCount,
        feed.complete ? 1 : 0,
        feed.complete ? null : 'source_unavailable',
        JSON.stringify([...pending.values()])
      )
  );

  await batchInChunks(db, statements);
}

async function persist(db: D1Executor) {
  const now = new Date();
  const feeds = await loadEvidence(now);
  const checkedAt = now.toISOString();
  for (const feed of feeds) await ingest(db, feed, checkedAt);
}

interface EntryRow {
  id: string;
  vendor: string | null;
  product: string;
  discovered: string | null;
  patched: string | null;
  evidence: string;
  vendorAdvisory: string | null;
  source: ZeroDay['source'];
  observedAt: string | null;
  kevAdded: string | null;
  epss: number | null;
  epssDate: string | null;
  euvd: number;
}

async function entries(db: D1Executor, id: string | null): Promise<ZeroDay[]> {
  const { results } = await db
    .prepare(
      `WITH ranked AS (
         SELECT e.*,
                r.published_at,
                ROW_NUMBER() OVER (
                  PARTITION BY e.cve_id
                  ORDER BY CASE WHEN e.source = 'Project Zero' THEN 0 ELSE 1 END, e.first_seen_at DESC
                ) AS rank_num
           FROM cve_exploitation_evidence e
           JOIN source_record r ON r.id = e.cve_id AND r.state = 'PUBLISHED'
          WHERE e.withdrawn_at IS NULL AND (? IS NULL OR e.cve_id = ?)
       )
       SELECT b.cve_id AS id,
              b.vendor,
              b.product,
              b.discovered_on AS discovered,
              b.patched_on AS patched,
              b.evidence_url AS evidence,
              b.vendor_url AS vendorAdvisory,
              b.source,
              CASE WHEN b.baseline = 0 THEN b.first_seen_at END AS observedAt,
              json_extract(k.payload_json, '$.dateAdded') AS kevAdded,
              ep.epss,
              ep.score_date AS epssDate,
              CASE WHEN ev.cve_id IS NOT NULL THEN 1 ELSE 0 END AS euvd
         FROM ranked b
         LEFT JOIN kev_annotation k ON k.cve_id = b.cve_id
         LEFT JOIN epss_scores ep ON ep.cve_id = b.cve_id
         LEFT JOIN euvd_exploited ev ON ev.cve_id = b.cve_id
        WHERE b.rank_num = 1
        ORDER BY b.baseline ASC,
                 CASE WHEN b.baseline = 0 THEN b.first_seen_at END DESC NULLS LAST,
                 COALESCE(b.patched_on, substr(b.published_at, 1, 10)) DESC NULLS LAST,
                 b.cve_id DESC
        LIMIT 40`
    )
    .bind(id, id)
    .all<EntryRow>();
  return results.map(row => ({
    id: row.id,
    vendor: row.vendor,
    product: row.product,
    discovered: row.discovered,
    patched: row.patched,
    evidence: row.evidence,
    vendorAdvisory: row.vendorAdvisory,
    source: row.source,
    observedAt: row.observedAt,
    kevAdded: row.kevAdded,
    epss: row.epss,
    epssDate: row.epssDate,
    euvd: row.euvd === 1,
  }));
}

async function view(db: D1Executor): Promise<ZeroDayView> {
  const [sourcesResult, records, publishers, reports, github, osv] = await Promise.all([
    db
      .prepare(
        `SELECT source, complete, successful_at AS checked, pending_evidence_json AS pendingJson
           FROM cve_exploitation_source
          ORDER BY source`
      )
      .bind()
      .all<{ source: string; complete: number; checked: string | null; pendingJson: string }>(),
    entries(db, null),
    watchStatuses(db),
    recentPublisherExploitation(db),
    packageFeed(db),
    osvPackageFeed(db),
  ]);
  const sources = sourcesResult.results.map(row => ({
    source: row.source,
    complete: row.complete === 1,
    checked: row.checked,
    pending: parsePendingEvidence(row.pendingJson),
  }));
  const source = sources.find(feed => feed.source === 'Project Zero');
  const entriesById = new Map(
    sources.flatMap(feed => feed.pending).map(entry => [entry.id, entry])
  );
  for (const entry of records) entriesById.set(entry.id, entry);
  return {
    entries: [...entriesById.values()].slice(0, 40),
    checkedAt: source?.checked ?? null,
    current: source?.complete ?? false,
    publishers: publishers.map(publisher => ({
      ...publisher,
      recentExploitation: reports.filter(report => report.provider === publisher.provider),
    })),
    packages: mergePackageFeeds(github, osv),
  };
}

async function packagesDue(db: D1Executor, minute: number) {
  if (minute % 15 === 0) return true;
  const cutoff = new Date(Date.now() - 3 * 60_000).toISOString();
  const checkpoint = await db
    .prepare(
      `SELECT 1 AS ok
         FROM cve_package_advisory_source
        WHERE checked_at > ?
           OR EXISTS (SELECT 1 FROM cve_package_advisory LIMIT 1)
        LIMIT 1`
    )
    .bind(cutoff)
    .first<{ ok: number }>();
  return !checkpoint;
}

async function osvDue(db: D1Executor, minute: number) {
  if (minute % 5 === 0) return true;
  const checkpoint = await db
    .prepare('SELECT 1 AS ok FROM cve_osv_package_source LIMIT 1')
    .bind()
    .first<{ ok: number }>();
  return !checkpoint;
}

export default {
  async scheduled(event: { scheduledTime: number }, env: Environment) {
    const db = writeDb(env.DB);
    const minute = Math.floor(event.scheduledTime / 60_000);
    const stream = env.ADVISORY_STREAM.getByName(streamName);
    let delivery = Promise.resolve();
    async function publishAfter(collectors: readonly Promise<void>[]) {
      const results = await Promise.allSettled(collectors);
      const failures = results.filter(result => result.status === 'rejected').length;
      if (failures) console.warn('advisory_collectors_failed', failures);
      delivery = delivery
        .catch(() => undefined)
        .then(async () => {
          const generation = Date.now();
          const zeroDays = await view(db);
          const result = await stream.fetch(
            new Request(streamPath + '/evidence', {
              method: 'POST',
              body: JSON.stringify({ generation, zeroDays }),
            })
          );
          if (!result.ok) throw new Error('Could not publish committed advisory evidence');
        });
      await delivery;
    }

    const work = [
      publishAfter([persist(db), collectChrome(db)]),
      packagesDue(db, minute).then(due =>
        due ? publishAfter([collectPackageAdvisories(db)]) : undefined
      ),
      osvDue(db, minute).then(due => (due ? publishAfter([collectOsvPackages(db)]) : undefined)),
    ];
    if (minute % 2 === 0) work.push(publishAfter([collectMsrc(db)]));
    if (minute % 10 === 0) work.push(publishAfter([collectEuvd(db)]));
    const results = await Promise.allSettled(work);
    if (results.some(result => result.status === 'rejected'))
      throw new Error('Advisory publication failed');
  },
  async fetch(request: Request, env: Environment) {
    const path = new URL(request.url).pathname;
    const legacy = request.method === 'POST' && path === '/sync';
    const read = request.method === 'GET' && path === '/zero-days';
    const id = path.startsWith('/records/') && path.slice('/records/'.length);
    const record = request.method === 'GET' && id && cveId.test(id);
    if (!legacy && !read && !record) return new Response(null, { status: 404 });

    const db = readDb(env.DB);
    try {
      if (record) {
        const [documented, vendor] = await Promise.all([entries(db, id), vendorSignals(db, id)]);
        return Response.json({ zeroDay: documented[0] ?? null, vendor });
      }
      return Response.json(await view(db), { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
      console.error('advisory_evidence_sync_failed', {
        operation: 'read',
        error: error instanceof Error ? error.name : 'Unexpected failure',
      });
      return new Response(null, { status: 503 });
    }
  },
};
