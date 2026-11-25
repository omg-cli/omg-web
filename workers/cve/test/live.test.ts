import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isIntakeEvent } from '../src/stream.ts';
import { readTracker } from '../src/zero-days.ts';
import { parseChrome } from '../src/vendor-signals.ts';
import { renderLive } from '../src/views.ts';

test('uses only documented tracker rows with a valid CVE identity', () => {
  const data = [
    '"CVE","Vendor","Product","Date Discovered","Date Patched","Advisory"',
    '"CVE-2026-12017","Example, Inc.","Client ""Pro""","2026-11-07","2026-11-08","https://support.apple.com/guide"',
    '"CVE-2026-12345","Example","Suite","???","2026-02-30","http://outside.example/"',
    '"???","Example","Client","???","2026-02-14",""',
  ].join('\r\n');
  const entries = readTracker(data);
  assert.equal(entries.length, 2);
  assert.equal(entries[0]?.product, 'Example, Inc. Client "Pro"');
  assert.equal(entries[0]?.patched, '2026-11-08');
  assert.equal(entries[0]?.discovered, '2026-11-07');
  assert.equal(entries[0]?.vendorAdvisory, 'https://support.apple.com/guide');
  assert.equal(entries[1]?.patched, null);
  assert.equal(entries[1]?.vendorAdvisory, null);
  assert.throws(() => readTracker('<html>Upstream unavailable</html>'), /export changed/);
});

test('reacts to producer intake completion and ignores public reads and refused writes', () => {
  const producer = { scriptName: 'omg-advisories', outcome: 'ok' };
  const request = { method: 'POST', url: 'https://advisories.latham.cloud/internal/ingest' };
  assert.equal(isIntakeEvent({ ...producer, event: { cron: '*/5 * * * *' } }), true);
  assert.equal(isIntakeEvent({ ...producer, event: { request, response: { status: 200 } } }), true);
  assert.equal(
    isIntakeEvent({ ...producer, event: { request, response: { status: 401 } } }),
    false
  );
  assert.equal(
    isIntakeEvent({
      ...producer,
      event: { request: { ...request, method: 'GET' }, response: { status: 200 } },
    }),
    false
  );
  assert.equal(isIntakeEvent({ ...producer, scriptName: 'omg-cve', event: null }), false);
  assert.equal(
    isIntakeEvent({
      ...producer,
      scriptName: 'omg-cve-enrichment',
      event: null,
      logs: [{ message: ['vendor_intake_changed', 1] }],
    }),
    true
  );
  assert.equal(
    isIntakeEvent({ ...producer, scriptName: 'omg-cve-enrichment', event: null }),
    false
  );
});

test('separates published Chrome CVEs from explicit reports of exploitation', () => {
  const out = parseChrome({
    feed: {
      entry: [
        {
          title: { $t: 'Stable Channel Update for Desktop' },
          published: { $t: '2026-11-09T12:52:57.820-08:00' },
          updated: { $t: '2026-11-11T12:10:24.691-08:00' },
          link: [
            {
              rel: 'alternate',
              href: 'https://chromereleases.googleblog.com/2026/11/stable-channel-update.html',
            },
          ],
          content: {
            $t: '<p>CVE-2026-12345 and CVE-2026-23456 are fixed.</p><p>Google is aware that an exploit for <strong>CVE-2026-12345</strong> exists in the wild.</p>',
          },
        },
      ],
    },
  });
  assert.deepEqual(
    out.map(({ cve_id, exploited }) => [cve_id, exploited]),
    [
      ['CVE-2026-12345', true],
      ['CVE-2026-23456', false],
    ]
  );
  assert.equal(out[0]?.published, '2026-11-09T20:52:57.820Z');
});

test('links a publisher exploitation report before the canonical CVE is available', () => {
  const now = '2026-11-09T20:52:57.820Z';
  const advisoryUrl = 'https://chromereleases.googleblog.com/2026/11/stable-channel-update.html';
  const html = renderLive(
    {
      version: 'test',
      status: null,
      recent: null,
      zeroDays: {
        entries: [],
        checkedAt: now,
        current: true,
        publisher: {
          checkedAt: now,
          complete: true,
          lastNewSignal: now,
          signals: 1,
          knownExploited: 1,
          recentExploitation: [
            { id: 'CVE-2026-12345', published: now, advisoryUrl, archived: false },
          ],
        },
      },
    },
    Date.parse(now)
  );
  assert.ok(html.includes('Exploitation reported by Chrome'));
  assert.ok(
    html.includes(`<a href="${advisoryUrl}">CVE-2026-12345</a><span>CVE record pending</span>`)
  );
  assert.ok(!html.includes('href="/cves/CVE-2026-12345"'));
});
