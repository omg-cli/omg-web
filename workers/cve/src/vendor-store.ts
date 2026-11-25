import type postgres from 'postgres';
import {
  chromeProvider,
  fetchChrome,
  type publisherExploitation,
  type VendorSignal,
  vendorFeedStatus,
} from './vendor-signals.ts';

type WatchStatus = typeof vendorFeedStatus.Type;

export async function collectChrome(sql: postgres.Sql) {
  const [before] = await sql<{ etag: string | null; successful: Date | null }[]>`
    SELECT etag, successful_at AS successful
      FROM public.cve_vendor_signal_source WHERE provider = ${chromeProvider}
  `;
  try {
    const feed = await fetchChrome(before?.etag ?? null);
    const now = new Date().toISOString();
    const changed = await sql.begin(async transaction => {
      await transaction`SET LOCAL statement_timeout = '8s'`;
      const [lock] = await transaction<{ locked: boolean }[]>`
        SELECT pg_try_advisory_xact_lock(213770071, 2) AS locked
      `;
      if (!lock?.locked) return 0;
      let changes = 0;
      if (feed.records?.length) {
        const [written] = await transaction<{ count: number }[]>`
          WITH distinct_input AS (
            SELECT DISTINCT ON (advisory_url, cve_id) *
            FROM jsonb_to_recordset(${JSON.stringify(feed.records)}::text::jsonb)
              AS r(cve_id text, advisory_url text, published timestamptz, modified timestamptz, exploited boolean)
            ORDER BY advisory_url, cve_id, modified DESC
          ), saved AS (
            INSERT INTO public.cve_vendor_signal AS existing (
              provider, cve_id, advisory_url, publisher_published_at, publisher_modified_at,
              reported_exploited, first_received_at, first_exploitation_received_at, baseline
            )
            SELECT ${chromeProvider}, cve_id, advisory_url, published, modified,
                   exploited, ${now}::timestamptz,
                   CASE WHEN exploited THEN ${now}::timestamptz END,
                   ${!before?.successful}
              FROM distinct_input
             ORDER BY advisory_url, cve_id
            ON CONFLICT (provider, advisory_url, cve_id) DO UPDATE SET
              publisher_modified_at=excluded.publisher_modified_at,
              reported_exploited=excluded.reported_exploited,
              first_exploitation_received_at=coalesce(existing.first_exploitation_received_at,
                                                       excluded.first_exploitation_received_at)
            WHERE excluded.publisher_modified_at > existing.publisher_modified_at
               OR (excluded.publisher_modified_at = existing.publisher_modified_at
                   AND existing.reported_exploited IS DISTINCT FROM excluded.reported_exploited)
            RETURNING 1
          ) SELECT COUNT(*)::int AS count FROM saved
        `;
        changes = written?.count ?? 0;
      }
      await transaction`
        INSERT INTO public.cve_vendor_signal_source AS existing (
          provider, etag, checked_at, successful_at, complete
        ) VALUES (${chromeProvider}, ${feed.etag}, ${now}::timestamptz, ${now}::timestamptz, TRUE)
        ON CONFLICT (provider) DO UPDATE SET etag=excluded.etag, checked_at=excluded.checked_at,
          successful_at=excluded.successful_at, complete=excluded.complete
        WHERE existing.checked_at <= excluded.checked_at
      `;
      return changes;
    });
    if (changed > 0 || !before?.successful) console.info('vendor_intake_changed', changed);
  } catch (error) {
    const now = new Date().toISOString();
    await sql`
      INSERT INTO public.cve_vendor_signal_source AS existing (provider, checked_at, complete)
        VALUES (${chromeProvider}, ${now}::timestamptz, FALSE)
      ON CONFLICT (provider) DO UPDATE SET checked_at=excluded.checked_at, complete=FALSE
      WHERE existing.checked_at <= excluded.checked_at
    `;
    throw error;
  }
}

export async function watchStatus(sql: postgres.Sql): Promise<WatchStatus | null> {
  const [status] = await sql<WatchStatus[]>`
    SELECT to_char(s.checked_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "checkedAt",
           s.complete, to_char(q.latest AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "lastNewSignal",
           q.signals::int, q.known_exploited::int AS "knownExploited"
      FROM public.cve_vendor_signal_source s
      CROSS JOIN LATERAL (
        SELECT COUNT(DISTINCT cve_id) AS signals, COUNT(DISTINCT cve_id) FILTER (WHERE reported_exploited) AS known_exploited,
               MAX(first_received_at) FILTER (WHERE NOT baseline) AS latest
          FROM public.cve_vendor_signal WHERE provider=s.provider
      ) q
     WHERE s.provider=${chromeProvider}
  `;
  return status ?? null;
}

export async function recentChromeExploitation(sql: postgres.Sql) {
  return sql<(typeof publisherExploitation.Type)[]>`
    WITH latest AS (
      SELECT DISTINCT ON (cve_id) cve_id, advisory_url, publisher_published_at
        FROM public.cve_vendor_signal
       WHERE provider=${chromeProvider} AND reported_exploited
       ORDER BY cve_id, publisher_published_at DESC, advisory_url
    )
    SELECT v.cve_id AS id, v.advisory_url AS "advisoryUrl",
           to_char(v.publisher_published_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS published,
           coalesce(r.state = 'PUBLISHED', false) AS archived
      FROM latest v
      LEFT JOIN public.source_record r ON r.id=v.cve_id
     ORDER BY v.publisher_published_at DESC, v.cve_id DESC LIMIT 5
  `;
}

export async function vendorSignals(sql: postgres.Sql, id: string) {
  return sql<VendorSignal[]>`
    SELECT provider, advisory_url AS "advisoryUrl", reported_exploited AS exploited,
           to_char(publisher_published_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS published,
           to_char(first_received_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS received,
           to_char(first_exploitation_received_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "exploitationReceived"
      FROM public.cve_vendor_signal WHERE cve_id=${id}
     ORDER BY reported_exploited DESC, publisher_published_at DESC LIMIT 8
  `;
}
