import { Schema } from 'effect';

export const advisoryOrigin = 'https://advisories.latham.cloud';
export const cveId = /^CVE-\d{4}-\d{4,19}$/u;
export const cursorPattern = /^[A-Za-z0-9+/]{1,256}={0,2}$/u;
const hour = 3_600_000;
const freshnessWindow = 30 * 60_000;

const timestamp = Schema.String.pipe(
  Schema.filter(value => {
    const time = Date.parse(value);
    return Number.isFinite(time) && new Date(time).toISOString() === value;
  })
);
const optionalTime = Schema.NullOr(timestamp);

const revision = Schema.Struct({
  id: Schema.String.pipe(Schema.pattern(cveId)),
  state: Schema.String,
  published_at: optionalTime,
  modified_at: timestamp,
  fetched_at: timestamp,
});
export const recordDetails = Schema.Struct({
  schema_version: Schema.Literal(1),
  provenance: Schema.Struct({
    ...revision.fields,
    payload_sha256: Schema.String.pipe(Schema.pattern(/^[0-9a-f]{64}$/u)),
  }),
  kev: Schema.NullOr(
    Schema.Struct({
      cveID: Schema.String.pipe(Schema.pattern(cveId)),
      dateAdded: Schema.String.pipe(Schema.pattern(/^\d{4}-\d{2}-\d{2}$/u)),
    })
  ),
  kev_checked_at: Schema.optional(optionalTime),
  kev_complete: Schema.Boolean,
});
export const recentPage = Schema.Struct({
  schema_version: Schema.Literal(1),
  as_of: timestamp,
  window_start: timestamp,
  checked_at: optionalTime,
  complete: Schema.Boolean,
  next_cursor: Schema.NullOr(Schema.String.pipe(Schema.pattern(cursorPattern))),
  records: Schema.Array(revision).pipe(Schema.maxItems(100)),
});
export const feedStatus = Schema.Struct({
  schema_version: Schema.Literal(1),
  baseline: Schema.Struct({
    imported: Schema.Number.pipe(Schema.int(), Schema.nonNegative()),
    caught_up: Schema.Boolean,
    archive_verified: Schema.Boolean,
  }),
  bootstrap_complete: Schema.Boolean,
  feeds: Schema.Array(
    Schema.Struct({
      source: Schema.String,
      checked_at: optionalTime,
      fetched_at: optionalTime,
      complete: Schema.Boolean,
      fresh: Schema.Boolean,
      error: Schema.NullOr(Schema.String),
    })
  ),
});

export type Revision = typeof revision.Type;
export type RecordDetails = typeof recordDetails.Type;
export type RecentPage = typeof recentPage.Type;
export type FeedStatus = typeof feedStatus.Type;

export function freshAt(checkedAt: string | null, now: number) {
  if (checkedAt === null) return false;
  const age = now - Date.parse(checkedAt);
  return age >= 0 && age < freshnessWindow;
}

export function lagMinutes(record: Revision) {
  const milliseconds = Date.parse(record.fetched_at) - Date.parse(record.modified_at);
  return milliseconds >= 0 ? milliseconds / 60_000 : null;
}

export function sampleMetrics(page: RecentPage) {
  const end = Date.parse(page.as_of);
  const dayStart = end - 24 * hour;
  const buckets = Array.from({ length: 12 }, () => ({ published: 0, revised: 0 }));
  const last = page.records.at(-1);
  const oldest = last ? Date.parse(last.modified_at) : end;
  const chartHours =
    page.next_cursor === null
      ? 24
      : ([1, 2, 4, 8, 12, 24].find(hours => end - oldest <= hours * hour) ?? 24);
  const chartStart = end - chartHours * hour;
  const bucketWidth = (chartHours * hour) / buckets.length;
  const lags: number[] = [];
  let newlyPublished = 0;

  for (const record of page.records) {
    const lag = lagMinutes(record);
    if (lag !== null && Date.parse(record.fetched_at) <= end) lags.push(lag);

    const published = record.published_at === null ? null : Date.parse(record.published_at);
    if (
      record.state === 'PUBLISHED' &&
      published !== null &&
      published >= dayStart &&
      published <= end
    ) {
      newlyPublished += 1;
    }

    const modified = Date.parse(record.modified_at);
    if (modified < chartStart || modified > end) continue;
    const index = Math.min(Math.floor((modified - chartStart) / bucketWidth), buckets.length - 1);
    const bucket = buckets[index];
    if (bucket) {
      if (record.state === 'PUBLISHED' && published === modified) bucket.published += 1;
      else bucket.revised += 1;
    }
  }

  const sorted = lags.toSorted((a, b) => a - b);
  const lowerBound = !page.complete || (page.next_cursor !== null && oldest >= dayStart);
  return {
    newlyPublished,
    lowerBound,
    median: sorted.length
      ? ((sorted[Math.floor((sorted.length - 1) / 2)] ?? 0) +
          (sorted[Math.floor(sorted.length / 2)] ?? 0)) /
        2
      : null,
    p95: sorted[Math.ceil(sorted.length * 0.95) - 1] ?? null,
    measured: sorted.length,
    oldest,
    chartHours,
    chartStart,
    bucketWidth,
    buckets,
  };
}

export function recentPath(cursor: string | null) {
  const query = new URLSearchParams({ limit: '100' });
  if (cursor !== null) query.set('cursor', cursor);
  return `/v1/cves/recent?${query}`;
}
