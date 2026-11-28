import { batchInChunks, type D1Bound, type D1Executor } from './d1.ts';
import {
  chromeProvider,
  fetchChrome,
  type publisherExploitation,
  type publisherFeedStatus,
  type VendorSignal,
} from './vendor-signals.ts';

type WatchStatus = typeof publisherFeedStatus.Type;

export async function collectChrome(db: D1Executor) {
  const before = await db
    .prepare(
      'SELECT etag, successful_at AS successful FROM cve_vendor_signal_source WHERE provider = ?'
    )
    .bind(chromeProvider)
    .first<{ etag: string | null; successful: string | null }>();
  try {
    const feed = await fetchChrome(before?.etag ?? null);
    const now = new Date().toISOString();
    const statements: D1Bound[] = [];
    let changed = 0;

    if (feed.records?.length) {
      const distinct = new Map<string, (typeof feed.records)[number]>();
      for (const record of feed.records) {
        const key = `${record.advisory_url}\0${record.cve_id}`;
        const existing = distinct.get(key);
        if (!existing || record.modified > existing.modified) {
          distinct.set(key, record);
        }
      }
      const baseline = before?.successful ? 0 : 1;
      for (const record of distinct.values()) {
        const exploited = record.exploited ? 1 : 0;
        statements.push(
          db
            .prepare(
              `INSERT INTO cve_vendor_signal (
                 provider, cve_id, advisory_url, publisher_published_at, publisher_modified_at,
                 reported_exploited, first_received_at, first_exploitation_received_at, baseline
               ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
               ON CONFLICT (provider, advisory_url, cve_id) DO UPDATE SET
                 publisher_modified_at = excluded.publisher_modified_at,
                 reported_exploited = excluded.reported_exploited,
                 first_exploitation_received_at = COALESCE(
                   cve_vendor_signal.first_exploitation_received_at,
                   excluded.first_exploitation_received_at
                 )
               WHERE excluded.publisher_modified_at > cve_vendor_signal.publisher_modified_at
                  OR (excluded.publisher_modified_at = cve_vendor_signal.publisher_modified_at
                      AND cve_vendor_signal.reported_exploited <> excluded.reported_exploited)`
            )
            .bind(
              chromeProvider,
              record.cve_id,
              record.advisory_url,
              record.published,
              record.modified,
              exploited,
              now,
              exploited ? now : null,
              baseline
            )
        );
      }
      changed = distinct.size;
    }

    statements.push(
      db
        .prepare(
          `INSERT INTO cve_vendor_signal_source (provider, etag, checked_at, successful_at, complete)
           VALUES (?, ?, ?, ?, 1)
           ON CONFLICT (provider) DO UPDATE SET
             etag = excluded.etag,
             checked_at = excluded.checked_at,
             successful_at = excluded.successful_at,
             complete = excluded.complete
           WHERE cve_vendor_signal_source.checked_at <= excluded.checked_at`
        )
        .bind(chromeProvider, feed.etag, now, now)
    );

    await batchInChunks(db, statements);
    if (changed > 0 || !before?.successful) console.info('vendor_intake_changed', changed);
  } catch (error) {
    const now = new Date().toISOString();
    await db
      .prepare(
        `INSERT INTO cve_vendor_signal_source (provider, checked_at, complete)
         VALUES (?, ?, 0)
         ON CONFLICT (provider) DO UPDATE SET checked_at = excluded.checked_at, complete = 0
         WHERE cve_vendor_signal_source.checked_at <= excluded.checked_at`
      )
      .bind(chromeProvider, now)
      .run();
    throw error;
  }
}

export async function watchStatuses(db: D1Executor): Promise<WatchStatus[]> {
  const { results } = await db
    .prepare(
      `SELECT s.provider,
              s.checked_at AS checkedAt,
              s.complete,
              COUNT(DISTINCT v.cve_id) AS signals,
              COUNT(DISTINCT CASE WHEN v.reported_exploited = 1 THEN v.cve_id END) AS knownExploited,
              MAX(CASE WHEN v.baseline = 0 THEN v.first_received_at END) AS lastNewSignal
         FROM cve_vendor_signal_source s
         LEFT JOIN cve_vendor_signal v ON v.provider = s.provider
        GROUP BY s.provider
        ORDER BY s.provider`
    )
    .bind()
    .all<{
      provider: string;
      checkedAt: string;
      complete: number;
      lastNewSignal: string | null;
      signals: number;
      knownExploited: number;
    }>();
  return results.map(row => ({
    provider: row.provider,
    checkedAt: row.checkedAt,
    complete: row.complete === 1,
    lastNewSignal: row.lastNewSignal,
    signals: Number(row.signals ?? 0),
    knownExploited: Number(row.knownExploited ?? 0),
  }));
}

export async function recentPublisherExploitation(
  db: D1Executor
): Promise<(typeof publisherExploitation.Type & { provider: string })[]> {
  const { results } = await db
    .prepare(
      `WITH latest AS (
         SELECT provider, cve_id, advisory_url, publisher_published_at, exploited_since,
                ROW_NUMBER() OVER (
                  PARTITION BY provider, cve_id
                  ORDER BY publisher_published_at DESC, advisory_url ASC
                ) AS dup_rank
           FROM cve_vendor_signal
          WHERE reported_exploited = 1
       ), ranked AS (
         SELECT provider, cve_id, advisory_url, publisher_published_at, exploited_since,
                ROW_NUMBER() OVER (
                  PARTITION BY provider
                  ORDER BY publisher_published_at DESC, cve_id DESC
                ) AS position
           FROM latest
          WHERE dup_rank = 1
       )
       SELECT v.provider,
              v.cve_id AS id,
              v.advisory_url AS advisoryUrl,
              v.publisher_published_at AS published,
              v.exploited_since AS exploitedSince,
              CASE WHEN r.state = 'PUBLISHED' THEN 1 ELSE 0 END AS archived
         FROM ranked v
         LEFT JOIN source_record r ON r.id = v.cve_id
        WHERE v.position <= 4
        ORDER BY v.publisher_published_at DESC, v.cve_id DESC`
    )
    .bind()
    .all<{
      provider: string;
      id: string;
      advisoryUrl: string;
      published: string;
      exploitedSince: string | null;
      archived: number;
    }>();
  return results.map(row => ({
    provider: row.provider,
    id: row.id,
    advisoryUrl: row.advisoryUrl,
    published: row.published,
    exploitedSince: row.exploitedSince,
    archived: row.archived === 1,
  }));
}

export async function vendorSignals(db: D1Executor, id: string): Promise<VendorSignal[]> {
  const { results } = await db
    .prepare(
      `SELECT provider,
              advisory_url AS advisoryUrl,
              reported_exploited AS exploited,
              publisher_published_at AS published,
              first_received_at AS received,
              exploited_since AS exploitedSince,
              first_exploitation_received_at AS exploitationReceived
         FROM cve_vendor_signal
        WHERE cve_id = ?
        ORDER BY reported_exploited DESC, publisher_published_at DESC
        LIMIT 8`
    )
    .bind(id)
    .all<{
      provider: string;
      advisoryUrl: string;
      exploited: number;
      published: string;
      received: string;
      exploitedSince: string | null;
      exploitationReceived: string | null;
    }>();
  return results.map(row => ({
    provider: row.provider,
    advisoryUrl: row.advisoryUrl,
    exploited: row.exploited === 1,
    published: row.published,
    received: row.received,
    exploitedSince: row.exploitedSince,
    exploitationReceived: row.exploitationReceived,
  }));
}
