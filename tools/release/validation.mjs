import assert from 'node:assert/strict';

export const accountId = 'f1e95b3e1b502cf366dfc81a863695fa';
export const repository = 'omg-cli/omg-web';
export const stagingDatabaseId = '0f059202-7042-4588-a89f-ce0ae3f6deba';
export const targets = [
  {
    name: 'omg-saas-staging',
    config: 'workers/api/wrangler.staging.jsonc',
    origin: 'https://staging-api.getomg.xyz',
    secrets: [
      'JWT_SECRET',
      'JWT_PRIVATE_KEY',
      'ADMIN_API_SECRET',
      'SVELTE_BFF_SECRET',
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'STRIPE_PRO_PRICE_ID',
      'STRIPE_TEAM_PRICE_ID',
    ],
    rates: {
      ADMIN_RATE_LIMITER: '3001',
      AUTH_RATE_LIMITER: '3002',
      API_RATE_LIMITER: '3003',
      OFFER_RATE_LIMITER: '3004',
    },
    services: [],
  },
  {
    name: 'omgsveltesite-website-shadow-bfrqe2m2mfps2gu6',
    config: 'site/wrangler.staging.jsonc',
    origin: 'https://staging.getomg.xyz',
    secrets: ['BETTER_AUTH_SECRET', 'SVELTE_BFF_SECRET', 'OAUTH_PROXY_SECRET'],
    rates: { AUTH_RATE_LIMITER: '4001', ADMIN_LIVE_RATE_LIMITER: '4002' },
    services: [{ name: 'LICENSING_API', service: 'omg-saas-staging' }],
  },
];

export function assertCi(run, jobs, revision) {
  assert.equal(run.repository.full_name, repository, 'CI repository differs');
  assert.equal(run.head_repository.full_name, repository, 'Fork CI cannot authorize a release');
  assert.equal(run.path, '.github/workflows/ci.yml', 'Wrong CI workflow');
  assert.equal(run.head_sha, revision, 'CI source revision differs');
  assert.equal(run.status, 'completed', 'CI is not complete');
  assert.equal(run.conclusion, 'success', 'CI did not pass');
  for (const name of ['check', 'e2e-anonymous']) {
    const matches = jobs.filter(job => job.name === name);
    assert.equal(matches.length, 1, `Expected one ${name} job`);
    assert.equal(matches[0].conclusion, 'success', `${name} did not pass`);
    assert.ok(
      matches[0].steps?.some(
        step => step.name === 'Verify tested source' && step.conclusion === 'success'
      ),
      `${name} lacks source verification`
    );
  }
}

export function activeVersion(deployments) {
  assert.ok(Array.isArray(deployments) && deployments.length > 0, 'No deployment receipt');
  for (const deployment of deployments) {
    assert.ok(Number.isFinite(Date.parse(deployment.created_on)), 'Invalid deployment timestamp');
  }
  const ordered = deployments.toSorted(
    (a, b) => Date.parse(b.created_on) - Date.parse(a.created_on)
  );
  assert.ok(
    ordered.length === 1 || ordered[0].created_on !== ordered[1].created_on,
    'Ambiguous latest deployment'
  );
  assert.equal(ordered[0].versions.length, 1, 'Split deployments require separate review');
  assert.equal(ordered[0].versions[0].percentage, 100, 'Expected 100% deployment');
  return { deploymentId: ordered[0].id, versionId: ordered[0].versions[0].version_id };
}

export function assertBindings(bindings, target) {
  const db = bindings.filter(b => b.type === 'd1');
  assert.equal(db.length, 1, 'Expected one staging D1 binding');
  assert.equal(db[0].name, 'DB');
  assert.equal(db[0].database_id, stagingDatabaseId, 'Remote D1 is not isolated staging');
  assert.deepEqual(
    bindings.filter(b => b.type === 'service').map(b => ({ name: b.name, service: b.service })),
    target.services,
    'Remote service binding differs'
  );
  assert.deepEqual(
    Object.fromEntries(
      bindings.filter(b => b.type === 'ratelimit').map(b => [b.name, String(b.namespace_id)])
    ),
    target.rates,
    'Remote rate-limit namespaces differ'
  );
  assert.ok(!bindings.some(b => b.type === 'send_email'), 'Staging must not send customer email');
  assert.ok(
    !bindings.some(b => b.name === 'GITHUB_CLIENT_SECRET'),
    'Staging must use the production OAuth broker'
  );
  assert.ok(
    bindings.some(
      b => b.name === 'DEPLOYMENT_STAGE' && b.type === 'plain_text' && b.text === 'staging'
    ),
    'Staging environment guard missing'
  );
  assert.ok(
    bindings.some(b => b.name === 'CF_VERSION_METADATA' && b.type === 'version_metadata'),
    'Version binding missing'
  );
  if (target.services.length > 0) {
    assert.ok(
      bindings.some(
        b =>
          b.name === 'GITHUB_CLIENT_ID' &&
          b.type === 'plain_text' &&
          b.text === 'Ov23lim96hwzllDXL6Dm'
      ),
      'Production GitHub OAuth client differs'
    );
  }
  const secretNames = new Set(bindings.filter(b => b.type === 'secret_text').map(b => b.name));
  const missing = target.secrets.filter(name => !secretNames.has(name));
  assert.equal(missing.length, 0, `Missing ${target.name} secrets: ${missing.join(', ')}`);
}

export function assertHealth(status, body, revision, versionId) {
  assert.equal(status, 200, 'Health did not return 200; bootstrap 503 is not release readiness');
  assert.equal(body.version?.tag, revision, 'Health source tag differs');
  assert.equal(body.version?.id, versionId, 'Health Worker version differs');
}
