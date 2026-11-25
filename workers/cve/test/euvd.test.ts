import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseEuvd } from '../src/euvd.ts';

const report = {
  id: 'EUVD-2026-129432',
  aliases: 'GHSA-pj2m-2r8v-h9cp\nCVE-2026-131914\nCVE-2026-131914\nCVE-2026-131915\n',
  datePublished: 'Nov 19, 2026, 1:29:12 AM',
  dateUpdated: 'Nov 25, 2026, 4:56:50 AM',
  exploitedSince: 'Nov 24, 2026, 12:00:00 AM',
};

test('keeps one exploitation report per EUVD and CVE pair with the source calendar dates', () => {
  const signals = parseEuvd({
    total: 3,
    items: [
      report,
      { ...report, dateUpdated: 'Nov 23, 2026, 4:56:50 AM' },
      { ...report, id: 'EUVD-2026-129433', aliases: 'GHSA-pj2m-2r8v-h9cp\n' },
    ],
  });
  assert.deepEqual(signals, [
    {
      cve_id: 'CVE-2026-131914',
      advisory_url: 'https://euvd.enisa.europa.eu/vulnerability/EUVD-2026-129432',
      published: '2026-11-19',
      modified: '2026-11-25',
      exploited_since: '2026-11-24',
    },
    {
      cve_id: 'CVE-2026-131915',
      advisory_url: 'https://euvd.enisa.europa.eu/vulnerability/EUVD-2026-129432',
      published: '2026-11-19',
      modified: '2026-11-25',
      exploited_since: '2026-11-24',
    },
  ]);
});

test('rejects a truncated page and invalid exploitation date', () => {
  assert.throws(() => parseEuvd({ total: 100, items: [report] }), /incomplete/u);
  assert.throws(
    () =>
      parseEuvd({ total: 1, items: [{ ...report, exploitedSince: 'Feb 30, 2026, 12:00:00 AM' }] }),
    /invalid EUVD date/u
  );
});
