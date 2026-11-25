import assert from 'node:assert/strict';
import { test } from 'node:test';
import { isIntakeEvent } from '../src/stream.ts';
import { readTracker } from '../src/zero-days.ts';

test('uses only documented tracker rows with a valid CVE identity', () => {
  const data = [
    '"CVE","Vendor","Product","Date Patched"',
    '"CVE-2026-12017","Example, Inc.","Client ""Pro""","2026-11-08"',
    '"CVE-2026-12345","Example","Suite","2026-02-30"',
    '"???","Example","Client","2026-02-14"',
  ].join('\r\n');
  const entries = readTracker(data);
  assert.equal(entries.length, 2);
  assert.equal(entries[0]?.product, 'Example, Inc. Client "Pro"');
  assert.equal(entries[0]?.patched, '2026-11-08');
  assert.equal(entries[1]?.patched, null);
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
});
