import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  activeVersion,
  assertBindings,
  assertCi,
  assertHealth,
  repository,
  stagingDatabaseId,
  targets,
} from './validation.mjs';

const sha = 'a'.repeat(40);
const run = {
  repository: { full_name: repository },
  head_repository: { full_name: repository },
  path: '.github/workflows/ci.yml',
  head_sha: sha,
  status: 'completed',
  conclusion: 'success',
};
const jobs = ['check', 'e2e-anonymous'].map(name => ({
  name,
  conclusion: 'success',
  steps: [{ name: 'Verify tested source', conclusion: 'success' }],
}));

test('requires both successful jobs from the exact source and repository', () => {
  assert.doesNotThrow(() => assertCi(run, jobs, sha));
  assert.throws(() => assertCi(run, jobs, 'b'.repeat(40)), /source revision/);
  assert.throws(() => assertCi({ ...run, conclusion: 'failure' }, jobs, sha), /did not pass/);
  assert.throws(() => assertCi({ ...run, status: 'in_progress' }, jobs, sha), /not complete/);
  assert.throws(() => assertCi(run, jobs.slice(0, 1), sha), /Expected one e2e/);
  assert.throws(
    () => assertCi(run, [jobs[0], { name: 'e2e-anonymous', conclusion: 'skipped' }], sha),
    /did not pass/
  );
  assert.throws(
    () => assertCi({ ...run, path: '.github/workflows/other.yml' }, jobs, sha),
    /Wrong CI/
  );
  assert.throws(
    () => assertCi({ ...run, head_repository: { full_name: 'other/fork' } }, jobs, sha),
    /Fork CI/
  );
  assert.throws(
    () =>
      assertCi(
        run,
        jobs.map(job => ({ ...job, steps: [] })),
        sha
      ),
    /source verification/
  );
});

test('selects the newest deployment independently of CLI ordering', () => {
  const old = {
    id: 'old',
    created_on: '2026-10-08T00:00:00Z',
    versions: [{ version_id: 'v1', percentage: 100 }],
  };
  const latest = {
    id: 'new',
    created_on: '2026-10-09T00:00:00Z',
    versions: [{ version_id: 'v2', percentage: 100 }],
  };
  for (const deployments of [
    [old, latest],
    [latest, old],
  ]) {
    assert.deepEqual(activeVersion(deployments), { deploymentId: 'new', versionId: 'v2' });
  }
  assert.throws(() => activeVersion([]), /No deployment/);
  assert.throws(
    () => activeVersion([{ ...latest, versions: [{ version_id: 'v2', percentage: 50 }] }]),
    /100%/
  );
  assert.throws(
    () => activeVersion([{ ...latest, versions: [...latest.versions, ...old.versions] }]),
    /Split/
  );
  assert.throws(() => activeVersion([latest, latest]), /Ambiguous/);
});

function bindings(target) {
  return [
    { name: 'DB', type: 'd1', database_id: stagingDatabaseId },
    { name: 'DEPLOYMENT_STAGE', type: 'plain_text', text: 'staging' },
    { name: 'CF_VERSION_METADATA', type: 'version_metadata' },
    ...target.services.map(service => ({ ...service, type: 'service' })),
    ...Object.entries(target.rates).map(([name, namespace_id]) => ({
      name,
      namespace_id,
      type: 'ratelimit',
    })),
    ...target.secrets.map(name => ({ name, type: 'secret_text' })),
    ...(target.services.length
      ? [{ name: 'GITHUB_CLIENT_ID', type: 'plain_text', text: 'Ov23lim96hwzllDXL6Dm' }]
      : []),
  ];
}

test('requires the real staging credential names without accessing their values', () => {
  for (const target of targets) assert.doesNotThrow(() => assertBindings(bindings(target), target));
  const target = targets[0];
  assert.throws(
    () =>
      assertBindings(
        bindings(target).filter(b => b.name !== 'JWT_SECRET'),
        target
      ),
    /JWT_SECRET/
  );
  assert.throws(
    () =>
      assertBindings(
        [...bindings(target), { name: 'GITHUB_CLIENT_SECRET', type: 'secret_text' }],
        target
      ),
    /OAuth broker/
  );
});

test('current release requires disabled billing on the published API, without requiring Stripe secrets', () => {
  const target = targets[0];
  const disabled = [
    ...bindings(target),
    { name: 'BILLING_ENABLED', type: 'plain_text', text: 'false' },
  ];
  assert.ok(!target.secrets.some(name => name.startsWith('STRIPE_')));
  assert.doesNotThrow(() => assertBindings(disabled, target, true));
  assert.throws(() => assertBindings(bindings(target), target, true), /disable billing/);
  assert.throws(
    () =>
      assertBindings(
        disabled.map(b => (b.name === 'BILLING_ENABLED' ? { ...b, text: 'true' } : b)),
        target,
        true
      ),
    /disable billing/
  );
  const body = { version: { tag: sha, id: 'v2' }, features: { billing: 'disabled' } };
  assert.doesNotThrow(() => assertHealth(200, body, sha, 'v2', true));
  assert.throws(
    () => assertHealth(200, { ...body, features: { billing: 'enabled' } }, sha, 'v2', true),
    /remain disabled/
  );
  assert.throws(
    () => assertHealth(200, { version: body.version }, sha, 'v2', true),
    /remain disabled/
  );
});

test('rejects production data, production services, shared limits, and outbound email', () => {
  const target = targets[1];
  for (const [name, changes, message] of [
    ['DB', { database_id: 'fee8ddab-fb4a-4be4-b8d2-8abb7c2db188' }, /not isolated/],
    ['LICENSING_API', { service: 'omg-saas' }, /service binding/],
    ['AUTH_RATE_LIMITER', { namespace_id: '2001' }, /namespaces/],
    ['DEPLOYMENT_STAGE', { text: 'production' }, /environment guard/],
    ['GITHUB_CLIENT_ID', { text: 'a-different-app' }, /OAuth client/],
  ]) {
    assert.throws(
      () =>
        assertBindings(
          bindings(target).map(b => (b.name === name ? { ...b, ...changes } : b)),
          target
        ),
      message
    );
  }
  assert.throws(
    () => assertBindings([...bindings(target), { name: 'EMAIL', type: 'send_email' }], target),
    /customer email/
  );
});

test('requires a healthy response from the expected deployed revision and version', () => {
  const body = { version: { tag: sha, id: 'v2' } };
  assert.doesNotThrow(() => assertHealth(200, body, sha, 'v2'));
  assert.throws(() => assertHealth(503, {}, sha, 'v2'), /bootstrap 503/);
  assert.throws(() => assertHealth(200, {}, sha, 'v2'), /source tag/);
  assert.throws(() => assertHealth(200, body, 'b'.repeat(40), 'v2'), /source tag/);
  assert.throws(() => assertHealth(200, body, sha, 'wrong'), /Worker version/);
});
