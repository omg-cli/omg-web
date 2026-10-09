import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { unstable_readConfig as readConfig } from 'wrangler';

function config(path) {
  return readConfig({ config: fileURLToPath(new URL(`../${path}`, import.meta.url)) });
}

const site = config('site/wrangler.staging.jsonc');
const api = config('workers/api/wrangler.staging.jsonc');
const productionSite = config('site/wrangler.production.jsonc');
const productionApi = config('workers/api/wrangler.toml');
const databaseId = '0f059202-7042-4588-a89f-ce0ae3f6deba';
const productionDatabaseIds = new Set(
  [...productionSite.d1_databases, ...productionApi.d1_databases].map(
    binding => binding.database_id
  )
);
const productionNamespaces = new Set(
  [...productionSite.ratelimits, ...productionApi.ratelimits].map(binding =>
    String(binding.namespace_id)
  )
);

for (const [staging, production, hostname] of [
  [site, productionSite, 'staging.getomg.xyz'],
  [api, productionApi, 'staging-api.getomg.xyz'],
]) {
  assert.notEqual(staging.name, production.name, 'staging must not overwrite a production Worker');
  assert.equal(staging.vars.DEPLOYMENT_STAGE, 'staging');
  assert.equal(staging.workers_dev, false);
  assert.equal(staging.preview_urls, false);
  assert.equal(staging.keep_vars, false, 'old production variables must not leak into staging');
  assert.deepEqual(staging.routes, [{ pattern: hostname, custom_domain: true }]);
  assert.equal(staging.d1_databases.length, 1);
  assert.equal(staging.d1_databases[0].binding, 'DB');
  assert.equal(staging.d1_databases[0].database_id, databaseId);
  assert.ok(!productionDatabaseIds.has(databaseId), 'staging must not bind production D1');
  assert.ok(
    staging.ratelimits.every(binding => !productionNamespaces.has(String(binding.namespace_id)))
  );
  assert.equal(
    staging.observability.redact_query_string,
    true,
    'OAuth query values must be redacted'
  );
  assert.deepEqual(staging.send_email, [], 'staging must not send customer emails');
}
assert.deepEqual(site.services, [{ binding: 'LICENSING_API', service: api.name }]);
assert.equal(site.vars.GITHUB_CLIENT_ID, 'Ov23lim96hwzllDXL6Dm', 'reuse the existing OAuth app');
assert.deepEqual(api.triggers.crons, [], 'enable staging schedules only after verification');
assert.equal(
  api.vars.STRIPE_PRO_PRICE_ID,
  undefined,
  'supply a verified test catalog at provisioning'
);
assert.equal(api.vars.STRIPE_TEAM_PRICE_ID, undefined);
process.stdout.write(
  '[staging] isolated Workers, database, service, rate limits, and routes verified\n'
);
