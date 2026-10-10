import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { test } from 'node:test';
import { waitForHealth } from './health.mjs';

const previous = { tag: 'a'.repeat(40), versionId: 'previous' };
const revision = 'b'.repeat(40);
const versionId = 'new';
const oldBody = { version: { tag: previous.tag, id: previous.versionId } };
const newBody = { version: { tag: revision, id: versionId }, features: { billing: 'disabled' } };

async function endpoint(t, responses) {
  let requests = 0;
  const server = createServer((req, res) => {
    assert.equal(req.url, '/health');
    const response = responses[Math.min(requests++, responses.length - 1)];
    res.writeHead(response.status, { 'content-type': 'application/json' });
    res.end(response.raw ?? JSON.stringify(response.body));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(
    () =>
      new Promise(resolve => {
        server.closeAllConnections();
        server.close(resolve);
      })
  );
  return { origin: `http://127.0.0.1:${server.address().port}`, requests: () => requests };
}

test('waits through the recorded previous version, retaining both health observations', async t => {
  const server = await endpoint(t, [
    { status: 200, body: oldBody },
    { status: 200, body: newBody },
  ]);
  const observations = [];
  const result = await waitForHealth({
    origin: server.origin,
    revision,
    versionId,
    previous,
    requireBillingDisabled: true,
    intervalMs: 1,
    timeoutMs: 1000,
    onObservation: observation => observations.push(observation),
  });
  assert.equal(result.version.id, versionId);
  assert.equal(server.requests(), 2);
  assert.deepEqual(
    observations.map(row => row.version.id),
    [previous.versionId, versionId]
  );
});

test('accepts the expected version immediately', async t => {
  const server = await endpoint(t, [{ status: 200, body: newBody }]);
  const result = await waitForHealth({ origin: server.origin, revision, versionId, previous });
  assert.equal(result.version.id, versionId);
  assert.equal(server.requests(), 1);
});

for (const [name, response, error] of [
  ['unhealthy previous version', { status: 503, body: oldBody }, /Health did not return 200/],
  ['unhealthy new version', { status: 503, body: newBody }, /Health did not return 200/],
  [
    'unexpected version',
    { status: 200, body: { version: { tag: revision, id: 'other' } } },
    /source tag differs/,
  ],
  [
    'previous version with unexpected source',
    { status: 200, body: { version: { tag: revision, id: previous.versionId } } },
    /source tag differs/,
  ],
  [
    'new version with unexpected source',
    { status: 200, body: { version: { tag: previous.tag, id: versionId } } },
    /source tag differs/,
  ],
  ['missing metadata', { status: 200, body: {} }, /source tag differs/],
  [
    'enabled billing on new version',
    { status: 200, body: { ...newBody, features: { billing: 'enabled' } } },
    /Billing must remain disabled/,
  ],
  ['malformed JSON', { status: 200, raw: '{invalid' }, SyntaxError],
]) {
  test(`rejects ${name} without retrying`, async t => {
    const server = await endpoint(t, [response, { status: 200, body: newBody }]);
    await assert.rejects(
      waitForHealth({
        origin: server.origin,
        revision,
        versionId,
        previous,
        requireBillingDisabled: true,
        intervalMs: 1,
        timeoutMs: 1000,
      }),
      error
    );
    assert.equal(server.requests(), 1);
  });
}

test('stops polling at the deadline when only the previous version remains', async t => {
  const server = await endpoint(t, [{ status: 200, body: oldBody }]);
  const observations = [];
  const started = performance.now();
  await assert.rejects(
    waitForHealth({
      origin: server.origin,
      revision,
      versionId,
      previous,
      timeoutMs: 100,
      intervalMs: 200,
      onObservation: observation => observations.push(observation),
    }),
    /deadline exceeded/
  );
  assert.equal(server.requests(), 1);
  assert.equal(observations.length, 1);
  assert.ok(performance.now() - started < 1000);
});

test('does not accept the expected version after receipt persistence exceeds the deadline', async t => {
  const server = await endpoint(t, [{ status: 200, body: newBody }]);
  await assert.rejects(
    waitForHealth({
      origin: server.origin,
      revision,
      versionId,
      previous,
      timeoutMs: 100,
      onObservation: () => new Promise(resolve => setTimeout(resolve, 150)),
    }),
    /deadline exceeded/
  );
  assert.equal(server.requests(), 1);
});

test('does not retry a previous version without a recorded source tag', async t => {
  const server = await endpoint(t, [{ status: 200, body: oldBody }]);
  await assert.rejects(
    waitForHealth({
      origin: server.origin,
      revision,
      versionId,
      previous: { ...previous, tag: null },
    }),
    /No recorded previous source/
  );
  assert.equal(server.requests(), 1);
});
