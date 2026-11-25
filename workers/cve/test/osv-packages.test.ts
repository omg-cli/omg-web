import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseOsvManifest, parseOsvPackage } from '../src/osv-packages.ts';

test('ignores a split CSV row and keeps distinct OSV revisions within a millisecond', () => {
  const feed = [
    '2026-11-25T14:30:04.206480095Z,MAL-2026-19152',
    '2026-11-25T14:30:04.206480081Z,MAL-2026-19115',
    '2026-11-25T14:30',
  ].join('\n');
  assert.deepEqual(parseOsvManifest(feed, true), [
    { modified: '2026-11-25T14:30:04.206480095Z', id: 'MAL-2026-19152' },
    { modified: '2026-11-25T14:30:04.206480081Z', id: 'MAL-2026-19115' },
  ]);
});

test('keeps OSV malware without a CVE and preserves exact versions over unbounded ranges', () => {
  const record = parseOsvPackage(
    JSON.stringify({
      id: 'MAL-2026-19152',
      aliases: ['GHSA-6mp5-qw4v-9pg2'],
      modified: '2026-11-25T14:30:04.206480095Z',
      published: '2026-11-25T14:05:10Z',
      affected: [
        {
          package: { name: '@example/fixture', ecosystem: 'npm' },
          ranges: [{ type: 'SEMVER', events: [{ introduced: '0' }] }],
          versions: ['1.0.1', '2.0.3'],
        },
      ],
      details: 'Only structured metadata is retained.',
    }),
    'MAL-2026-19152'
  );
  assert.deepEqual(record, {
    id: 'MAL-2026-19152',
    cveId: null,
    kind: 'malware',
    advisoryUrl: 'https://osv.dev/vulnerability/MAL-2026-19152',
    published: '2026-11-25T14:05:10.000000000Z',
    modified: '2026-11-25T14:30:04.206480095Z',
    withdrawn: null,
    packages: [
      {
        ecosystem: 'npm',
        name: '@example/fixture',
        range: '1.0.1, 2.0.3',
        fixed: null,
      },
    ],
  });
});
