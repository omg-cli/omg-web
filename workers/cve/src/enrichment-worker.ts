import postgres from 'postgres';
import { cveId } from './advisories.ts';
import { loadEvidence, type ZeroDay, type ZeroDayView } from './zero-days.ts';
import {
  collectChrome,
  recentChromeExploitation,
  vendorSignals,
  watchStatus,
} from './vendor-store.ts';

interface Environment {
  ADVISORY_DATABASE: { connectionString: string };
}

type Feed = Awaited<ReturnType<typeof loadEvidence>>[number];

function client(connectionString: string) {
  return postgres(connectionString, {
    max: 1,
    connect_timeout: 5,
    idle_timeout: 5,
    fetch_types: false,
    prepare: false,
    connection: { application_name: 'omg-cve-enrichment' },
  });
}

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

async function ingest(transaction: postgres.TransactionSql, feed: Feed, checkedAt: string) {
  const input = toInput(feed);
  const [previous] = await transaction<{ baseline: boolean }[]>`
    SELECT successful_at IS NULL AS baseline FROM public.cve_exploitation_source WHERE source = ${feed.source}
  `;
  let matchedCount = 0;
  if (input.length > 0) {
    const [result] = await transaction<{ matched: number }[]>`
      WITH input AS MATERIALIZED (
        SELECT * FROM jsonb_to_recordset(${JSON.stringify(input)}::text::jsonb)
          AS incoming(cve_id text, vendor text, product text, discovered date, patched date,
                 evidence text, vendor_url text, catalog_year smallint)
      ), matched AS MATERIALIZED (
        SELECT i.*, r.payload_sha256 AS archive_sha256,
               encode(sha256(convert_to(row_to_json(i)::text, 'UTF8')), 'hex') AS evidence_sha256
          FROM input i JOIN public.source_record r ON r.id = i.cve_id
         WHERE r.state = 'PUBLISHED'
      ), stored AS (
        INSERT INTO public.cve_exploitation_evidence AS evidence (
          cve_id, source, vendor, product, discovered_on, patched_on, evidence_url, vendor_url,
          catalog_year, archive_revision_sha256, evidence_sha256, first_seen_at, last_changed_at, baseline
        )
        SELECT cve_id, ${feed.source}, vendor, product, discovered, patched, evidence, vendor_url,
               catalog_year, archive_sha256, evidence_sha256, ${checkedAt}::timestamptz,
               ${checkedAt}::timestamptz, ${previous?.baseline ?? true}
          FROM matched
         ORDER BY cve_id
        ON CONFLICT (cve_id, source) DO UPDATE SET
          vendor = excluded.vendor, product = excluded.product, discovered_on = excluded.discovered_on,
          patched_on = excluded.patched_on, evidence_url = excluded.evidence_url, vendor_url = excluded.vendor_url,
          catalog_year = excluded.catalog_year, archive_revision_sha256 = excluded.archive_revision_sha256,
          evidence_sha256 = excluded.evidence_sha256, last_changed_at = excluded.last_changed_at,
          withdrawn_at = NULL
        WHERE evidence.evidence_sha256 IS DISTINCT FROM excluded.evidence_sha256
           OR evidence.archive_revision_sha256 IS DISTINCT FROM excluded.archive_revision_sha256
           OR evidence.withdrawn_at IS NOT NULL
      )
      SELECT COUNT(*)::int AS matched FROM matched
    `;
    matchedCount = result?.matched ?? 0;
  }

  if (feed.complete && feed.coverageYears.length > 0) {
    await transaction`
      UPDATE public.cve_exploitation_evidence
         SET withdrawn_at = ${checkedAt}::timestamptz
       WHERE source = ${feed.source} AND withdrawn_at IS NULL
         AND catalog_year IN (SELECT value::smallint FROM jsonb_array_elements_text(${JSON.stringify(feed.coverageYears)}::text::jsonb))
         AND cve_id NOT IN (SELECT value FROM jsonb_array_elements_text(${JSON.stringify(input.map(entry => entry.cve_id))}::text::jsonb))
    `;
  }

  await transaction`
    INSERT INTO public.cve_exploitation_source AS previous (
      source, checked_at, successful_at, coverage_years, observed_count, matched_count, complete, error_code
    ) VALUES (
      ${feed.source}, ${checkedAt}::timestamptz, ${feed.complete ? checkedAt : null}::timestamptz,
      ARRAY(SELECT value::smallint FROM jsonb_array_elements_text(${JSON.stringify(feed.coverageYears)}::text::jsonb)), ${input.length}, ${matchedCount},
      ${feed.complete}, ${feed.complete ? null : 'source_unavailable'}
    )
    ON CONFLICT (source) DO UPDATE SET
      checked_at = excluded.checked_at, complete = excluded.complete, error_code = excluded.error_code,
      successful_at = coalesce(excluded.successful_at, previous.successful_at),
      coverage_years = excluded.coverage_years, observed_count = excluded.observed_count,
      matched_count = excluded.matched_count
  `;
}

async function persist(sql: postgres.Sql) {
  const now = new Date();
  const feeds = await loadEvidence(now);
  await sql.begin(async transaction => {
    await transaction`SET LOCAL statement_timeout = '8s'`;
    await transaction`SET LOCAL lock_timeout = '1s'`;
    const [lock] = await transaction<{ locked: boolean }[]>`
      SELECT pg_try_advisory_xact_lock(213770071, 1) AS locked
    `;
    if (!lock?.locked) return;
    for (const feed of feeds) await ingest(transaction, feed, now.toISOString());
  });
}

async function entries(sql: postgres.Sql, id: string | null) {
  return sql<ZeroDay[]>`
    WITH best AS (
      SELECT DISTINCT ON (e.cve_id)
             e.*, r.published_at
        FROM public.cve_exploitation_evidence e
        JOIN public.source_record r ON r.id = e.cve_id AND r.state = 'PUBLISHED'
       WHERE e.withdrawn_at IS NULL AND (${id}::text IS NULL OR e.cve_id = ${id})
       ORDER BY e.cve_id, (e.source = 'Project Zero'), e.first_seen_at DESC
    )
    SELECT b.cve_id AS id, b.vendor, b.product, b.discovered_on::text AS discovered,
           b.patched_on::text AS patched, b.evidence_url AS evidence, b.vendor_url AS "vendorAdvisory",
           b.source, CASE WHEN NOT b.baseline THEN to_char(b.first_seen_at AT TIME ZONE 'UTC',
             'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') END AS "observedAt",
           k.payload_json::jsonb->>'dateAdded' AS "kevAdded",
           ep.epss, ep.model_date AS "epssDate",
           EXISTS (SELECT 1 FROM public.euvd_exploited n WHERE n.cve_id=b.cve_id AND n.exploited) AS euvd
      FROM best b
      LEFT JOIN public.kev_annotation k ON k.cve_id=b.cve_id
      LEFT JOIN public.epss_scores ep ON ep.cve_id=b.cve_id
     ORDER BY b.baseline, CASE WHEN NOT b.baseline THEN b.first_seen_at END DESC NULLS LAST,
              coalesce(b.patched_on::text, left(b.published_at, 10)) DESC NULLS LAST, b.cve_id DESC
     LIMIT 40
  `;
}

async function view(sql: postgres.Sql): Promise<ZeroDayView> {
  const [[source], records, publisher, recentExploitation] = await Promise.all([
    sql<{ complete: boolean; checked: Date | null }[]>`
      SELECT complete, successful_at AS checked FROM public.cve_exploitation_source
       WHERE source = 'Project Zero'
    `,
    entries(sql, null),
    watchStatus(sql),
    recentChromeExploitation(sql),
  ]);
  return {
    entries: records,
    checkedAt: source?.checked?.toISOString() ?? null,
    current: source?.complete ?? false,
    publisher: publisher ? { ...publisher, recentExploitation } : null,
  };
}

export default {
  async scheduled(_event: { scheduledTime: number }, env: Environment) {
    const sql = client(env.ADVISORY_DATABASE.connectionString);
    try {
      await collectChrome(sql);
    } finally {
      await sql.end({ timeout: 1 });
    }
  },
  async fetch(request: Request, env: Environment) {
    const path = new URL(request.url).pathname;
    const sync = request.method === 'POST' && path === '/sync';
    const read = request.method === 'GET' && path === '/zero-days';
    const id = path.startsWith('/records/') && path.slice('/records/'.length);
    const record = request.method === 'GET' && id && cveId.test(id);
    if (!sync && !read && !record) return new Response(null, { status: 404 });

    const sql = client(env.ADVISORY_DATABASE.connectionString);
    try {
      if (sync) {
        await persist(sql);
        if (!(await watchStatus(sql))) {
          await collectChrome(sql).catch(() => undefined);
        }
      }
      if (record) {
        const [documented, vendor] = await Promise.all([entries(sql, id), vendorSignals(sql, id)]);
        return Response.json({ zeroDay: documented[0] ?? null, vendor });
      }
      return Response.json(await view(sql), { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
      console.error('advisory_evidence_sync_failed', {
        operation: sync ? 'sync' : 'read',
        code: error instanceof postgres.PostgresError ? error.code : null,
        error: error instanceof Error ? error.name : 'Unexpected failure',
      });
      return new Response(null, { status: 503 });
    } finally {
      await sql.end({ timeout: 1 });
    }
  },
};
