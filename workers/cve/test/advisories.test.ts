import assert from 'node:assert/strict';
import { test } from 'node:test';
import { freshAt, sampleMetrics, type RecentPage } from '../src/advisories.ts';

const end = '2026-11-25T03:00:00.000Z';
const start = '2026-11-24T03:00:00.000Z';

test('separates initial publication and revisions while measuring source-to-receipt lag', () => {
  const page: RecentPage = {
    schema_version: 1,
    as_of: end,
    window_start: '2026-10-26T03:00:00.000Z',
    checked_at: end,
    complete: true,
    next_cursor: 'bW9yZQ==',
    records: [
      {
        id: 'CVE-2026-1004',
        state: 'PUBLISHED',
        modified_at: end,
        published_at: end,
        fetched_at: end,
      },
      {
        id: 'CVE-2026-1003',
        state: 'REJECTED',
        modified_at: '2026-11-25T02:45:00.000Z',
        published_at: '2026-11-25T02:00:00.000Z',
        fetched_at: '2026-11-25T02:55:00.000Z',
      },
      {
        id: 'CVE-2026-1002',
        state: 'PUBLISHED',
        modified_at: '2026-11-25T02:30:00.000Z',
        published_at: '2026-11-25T01:30:00.000Z',
        fetched_at: '2026-11-25T02:34:00.000Z',
      },
      {
        id: 'CVE-2026-1001',
        state: 'PUBLISHED',
        modified_at: start,
        published_at: start,
        fetched_at: '2026-11-24T02:59:00.000Z',
      },
    ],
  };

  const metrics = sampleMetrics(page);
  assert.equal(metrics.newlyPublished, 3);
  assert.equal(metrics.lowerBound, true);
  assert.equal(metrics.measured, 3);
  assert.equal(metrics.median, 4);
  assert.equal(metrics.p95, 10);
  assert.deepEqual(metrics.buckets.at(0), { published: 1, revised: 0 });
  assert.deepEqual(metrics.buckets.at(-1), { published: 1, revised: 2 });
  assert.equal(sampleMetrics({ ...page, next_cursor: null }).lowerBound, false);
  assert.equal(sampleMetrics({ ...page, complete: false, next_cursor: null }).lowerBound, true);
  const shorter = sampleMetrics({ ...page, records: page.records.slice(0, 3) });
  assert.equal(shorter.chartHours, 1);
  assert.equal(shorter.bucketWidth, 300_000);
});

test('treats missing, future and expired feed checks as stale', () => {
  const now = Date.parse(end);
  assert.equal(freshAt(null, now), false);
  assert.equal(freshAt(end, now - 1), false);
  assert.equal(freshAt(end, now), true);
  assert.equal(freshAt(end, now + 1_799_999), true);
  assert.equal(freshAt(end, now + 1_800_000), false);
});
