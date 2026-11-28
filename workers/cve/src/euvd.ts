import { Schema } from 'effect';
import { batchInChunks, type D1Bound, type D1Executor } from './d1.ts';
import { cveId } from './advisories.ts';
import { readLimitedText } from './sources.ts';

export const euvdProvider = 'ENISA EUVD';
const pageSize = 100;
const feedUrl = 'https://euvdservices.enisa.europa.eu/api/search?exploited=true&page=0&size=100';
const evidenceUrl = 'https://euvd.enisa.europa.eu/vulnerability/';
const datePattern =
  /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) (\d{1,2}), (\d{4}), (?:[1-9]|1[0-2]):[0-5]\d:[0-5]\d (?:AM|PM)$/u;

const feed = Schema.Struct({
  total: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
  items: Schema.Array(
    Schema.Struct({
      id: Schema.String.pipe(Schema.pattern(/^EUVD-\d{4}-\d{1,19}$/u)),
      aliases: Schema.optional(Schema.NullOr(Schema.String)),
      datePublished: Schema.String,
      dateUpdated: Schema.String,
      exploitedSince: Schema.String,
    })
  ).pipe(Schema.maxItems(pageSize)),
});

interface EuvdSignal {
  cve_id: string;
  advisory_url: string;
  published: string;
  modified: string;
  exploited_since: string;
}

function calendarDay(input: string) {
  const parts = datePattern.exec(input);
  if (!parts) throw new Error('Source returned an invalid EUVD date');
  const [, month, day, year] = parts;
  const date = new Date(`${month} ${day}, ${year} UTC`);
  if (date.getUTCDate() !== Number(day) || date.getUTCFullYear() !== Number(year)) {
    throw new Error('Source returned an invalid EUVD date');
  }
  return date.toISOString().slice(0, 10);
}

export function parseEuvd(input: typeof feed.Type) {
  const { total, items } = Schema.decodeUnknownSync(feed)(input);
  if (items.length !== Math.min(total, pageSize)) throw new Error('EUVD page is incomplete');
  const signals = new Map<string, EuvdSignal>();
  for (const item of items) {
    const advisory_url = evidenceUrl + item.id;
    const published = calendarDay(item.datePublished);
    const modified = calendarDay(item.dateUpdated);
    const exploited_since = calendarDay(item.exploitedSince);
    for (const alias of item.aliases?.split('\n') ?? []) {
      const cve_id = alias.trim();
      if (!cveId.test(cve_id)) continue;
      const key = `${item.id}/${cve_id}`;
      const previous = signals.get(key);
      if (!previous || previous.modified < modified) {
        signals.set(key, { cve_id, advisory_url, published, modified, exploited_since });
      }
      if (signals.size > 500) throw new Error('EUVD CVE alias count exceeded');
    }
  }
  return [...signals.values()];
}

export async function collectEuvd(db: D1Executor): Promise<void> {
  const began = new Date().toISOString();
  try {
    const response = await fetch(feedUrl, {
      headers: { Accept: 'application/json' },
      redirect: 'manual',
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok || !response.headers.get('Content-Type')?.includes('application/json')) {
      throw new Error('EUVD source unavailable');
    }
    const records = parseEuvd(JSON.parse(await readLimitedText(response, 1024 * 1024)));
    const received = new Date().toISOString();
    const existing = await db
      .prepare('SELECT checked_at, successful_at FROM cve_vendor_signal_source WHERE provider = ?')
      .bind(euvdProvider)
      .first<{ checked_at: string; successful_at: string | null }>();
    if (existing && existing.checked_at > began) return;
    const baseline = existing?.successful_at ? 0 : 1;

    const statements: D1Bound[] = [];
    for (const record of records) {
      const publishedIso = `${record.published}T00:00:00.000Z`;
      const modifiedIso = `${record.modified}T00:00:00.000Z`;
      statements.push(
        db
          .prepare(
            `INSERT INTO cve_vendor_signal (
               provider, cve_id, advisory_url, publisher_published_at, publisher_modified_at,
               reported_exploited, first_received_at, first_exploitation_received_at, baseline, exploited_since
             ) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
             ON CONFLICT (provider, advisory_url, cve_id) DO UPDATE SET
               publisher_published_at = excluded.publisher_published_at,
               publisher_modified_at = excluded.publisher_modified_at,
               exploited_since = excluded.exploited_since
             WHERE excluded.publisher_modified_at >= cve_vendor_signal.publisher_modified_at`
          )
          .bind(
            euvdProvider,
            record.cve_id,
            record.advisory_url,
            publishedIso,
            modifiedIso,
            received,
            received,
            baseline,
            record.exploited_since
          ),
        db
          .prepare(
            `INSERT INTO euvd_exploited (cve_id, euvd_id, updated_at)
             VALUES (?, ?, ?)
             ON CONFLICT (cve_id) DO UPDATE SET
               euvd_id = excluded.euvd_id,
               updated_at = excluded.updated_at`
          )
          .bind(record.cve_id, record.advisory_url.slice(evidenceUrl.length), received)
      );
    }
    statements.push(
      db
        .prepare(
          `INSERT INTO cve_vendor_signal_source (provider, checked_at, successful_at, complete)
           VALUES (?, ?, ?, 1)
           ON CONFLICT (provider) DO UPDATE SET
             checked_at = excluded.checked_at,
             successful_at = excluded.successful_at,
             complete = 1
           WHERE cve_vendor_signal_source.checked_at <= ?`
        )
        .bind(euvdProvider, received, received, began)
    );
    await batchInChunks(db, statements);
  } catch (error) {
    const checked = new Date().toISOString();
    await db
      .prepare(
        `INSERT INTO cve_vendor_signal_source (provider, checked_at, complete)
         VALUES (?, ?, 0)
         ON CONFLICT (provider) DO UPDATE SET checked_at = excluded.checked_at, complete = 0
         WHERE cve_vendor_signal_source.checked_at <= ?`
      )
      .bind(euvdProvider, checked, began)
      .run();
    throw error;
  }
}
