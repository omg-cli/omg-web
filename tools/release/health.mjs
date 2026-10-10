import assert from 'node:assert/strict';
import { setTimeout as delay } from 'node:timers/promises';
import { assertHealth } from './validation.mjs';

export async function waitForHealth({
  origin,
  revision,
  versionId,
  previous,
  requireBillingDisabled = false,
  timeoutMs = 60_000,
  intervalMs = 5_000,
  onObservation = () => {},
}) {
  assert.ok(Number.isSafeInteger(timeoutMs) && timeoutMs > 0 && timeoutMs <= 60_000);
  assert.ok(Number.isSafeInteger(intervalMs) && intervalMs > 0);
  const deadline = performance.now() + timeoutMs;
  while (performance.now() < deadline) {
    const response = await fetch(`${origin}/health`, {
      redirect: 'error',
      signal: AbortSignal.timeout(
        Math.max(1, Math.ceil(Math.min(10_000, deadline - performance.now())))
      ),
    });
    const body = await response.json();
    const observation = {
      observedAt: new Date().toISOString(),
      status: response.status,
      version: body.version,
      features: body.features,
    };
    await onObservation(observation);
    assert.ok(performance.now() < deadline, 'Health propagation deadline exceeded');
    if (body.version?.id === versionId) {
      assertHealth(response.status, body, revision, versionId, requireBillingDisabled);
      return observation;
    }
    assert.match(previous?.tag ?? '', /^[a-f0-9]{40}$/, 'No recorded previous source to retry');
    assertHealth(response.status, body, previous.tag, previous.versionId);
    const remaining = deadline - performance.now();
    await delay(Math.ceil(Math.min(intervalMs, Math.max(0, remaining))));
    if (remaining <= intervalMs) break;
  }
  throw new Error(
    'Health propagation deadline exceeded; recorded previous version is still visible'
  );
}
