import { Schema } from 'effect';
import type postgres from 'postgres';
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

export async function collectEuvd(sql: postgres.Sql): Promise<void> {
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
    await sql.begin(async transaction => {
      await transaction`SET LOCAL statement_timeout = '8s'`;
      const [lock] = await transaction<{ locked: boolean }[]>`
        SELECT pg_try_advisory_xact_lock(213770071, 4) AS locked
      `;
      if (!lock?.locked) return;
      const [source] = await transaction<{ baseline: boolean }[]>`
        INSERT INTO public.cve_vendor_signal_source AS existing (
          provider, checked_at, successful_at, complete
        ) VALUES (${euvdProvider}, ${received}::timestamptz, NULL, TRUE)
        ON CONFLICT (provider) DO UPDATE SET checked_at=excluded.checked_at, complete=TRUE
        WHERE existing.checked_at <= ${began}::timestamptz
        RETURNING successful_at IS NULL AS baseline
      `;
      if (!source) return;
      await transaction`
        INSERT INTO public.cve_vendor_signal AS existing (
          provider, cve_id, advisory_url, publisher_published_at, publisher_modified_at,
          reported_exploited, first_received_at, first_exploitation_received_at, baseline, exploited_since
        )
        SELECT ${euvdProvider}, cve_id, advisory_url,
               published::timestamp AT TIME ZONE 'UTC', modified::timestamp AT TIME ZONE 'UTC',
               TRUE, ${received}::timestamptz, ${received}::timestamptz, ${source.baseline}, exploited_since
          FROM jsonb_to_recordset(${JSON.stringify(records)}::text::jsonb)
            AS r(cve_id text, advisory_url text, published date, modified date, exploited_since date)
         ORDER BY advisory_url, cve_id
        ON CONFLICT (provider, advisory_url, cve_id) DO UPDATE SET
          publisher_published_at=excluded.publisher_published_at,
          publisher_modified_at=excluded.publisher_modified_at,
          exploited_since=excluded.exploited_since
        WHERE excluded.publisher_modified_at >= existing.publisher_modified_at
          AND (existing.publisher_published_at, existing.publisher_modified_at, existing.exploited_since)
                IS DISTINCT FROM
              (excluded.publisher_published_at, excluded.publisher_modified_at, excluded.exploited_since)
      `;
      await transaction`
        UPDATE public.cve_vendor_signal_source SET successful_at=${received}::timestamptz
         WHERE provider=${euvdProvider}
      `;
    });
  } catch (error) {
    const checked = new Date().toISOString();
    await sql`
      INSERT INTO public.cve_vendor_signal_source AS existing (provider, checked_at, complete)
        VALUES (${euvdProvider}, ${checked}::timestamptz, FALSE)
      ON CONFLICT (provider) DO UPDATE SET checked_at=excluded.checked_at, complete=FALSE
      WHERE existing.checked_at <= ${began}::timestamptz
    `;
    throw error;
  }
}
