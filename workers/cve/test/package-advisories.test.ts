import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  mergePackageFeeds,
  parsePackagePage,
  type PackageFeed,
} from '../src/package-advisories.ts';

test('keeps a GitHub malware advisory without a CVE and preserves its withdrawal and package range', () => {
  const page = parsePackagePage(
    JSON.stringify([
      {
        ghsa_id: 'GHSA-2222-jjhh-3m4v',
        cve_id: null,
        type: 'malware',
        html_url: 'https://github.com/advisories/GHSA-2222-jjhh-3m4v',
        published_at: '2026-11-20T01:00:00Z',
        updated_at: '2026-11-21T01:00:00Z',
        withdrawn_at: '2026-11-21T01:00:00Z',
        description: 'This free-form field stays upstream.',
        vulnerabilities: [
          {
            package: { ecosystem: 'npm', name: '@example/fixture' },
            vulnerable_version_range: '>= 1.2.3, < 1.2.7',
            first_patched_version: null,
          },
        ],
      },
    ]),
    'malware'
  );

  assert.deepEqual(page, [
    {
      id: 'GHSA-2222-jjhh-3m4v',
      cveId: null,
      kind: 'malware',
      advisoryUrl: 'https://github.com/advisories/GHSA-2222-jjhh-3m4v',
      publishedAt: '2026-11-20T01:00:00Z',
      updatedAt: '2026-11-21T01:00:00Z',
      withdrawnAt: '2026-11-21T01:00:00Z',
      packages: [
        {
          ecosystem: 'npm',
          name: '@example/fixture',
          range: '>= 1.2.3, < 1.2.7',
          fixed: null,
        },
      ],
    },
  ]);
});

test('keeps native OSV malware and shows an advisory shared by both feeds once', () => {
  const github: PackageFeed = {
    sources: [],
    recent: [
      {
        id: 'GHSA-2222-jjhh-3m4v',
        cveId: 'CVE-2026-12345',
        kind: 'reviewed',
        advisoryUrl: 'https://github.com/advisories/GHSA-2222-jjhh-3m4v',
        publishedAt: '2026-11-20T01:00:00Z',
        observedAt: '2026-11-21T01:00:00Z',
        packages: [],
      },
    ],
  };
  const [shared] = github.recent;
  assert.ok(shared);
  const osv: PackageFeed = {
    sources: [],
    recent: [
      { ...shared, advisoryUrl: 'https://osv.dev/vulnerability/GHSA-2222-jjhh-3m4v' },
      {
        ...shared,
        id: 'MAL-2026-12345',
        cveId: null,
        kind: 'malware',
        advisoryUrl: 'https://osv.dev/vulnerability/MAL-2026-12345',
      },
    ],
  };
  const merged = mergePackageFeeds(github, osv);
  assert.deepEqual(
    merged.recent.map(({ id, cveId, advisoryUrl }) => [id, cveId, advisoryUrl]),
    [
      ['MAL-2026-12345', null, 'https://osv.dev/vulnerability/MAL-2026-12345'],
      [
        'GHSA-2222-jjhh-3m4v',
        'CVE-2026-12345',
        'https://github.com/advisories/GHSA-2222-jjhh-3m4v',
      ],
    ]
  );
});
