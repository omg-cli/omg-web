import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { unstable_readConfig as readConfig } from 'wrangler';

const root = fileURLToPath(new URL('../', import.meta.url));
const wrangler = join(root, 'node_modules/wrangler/bin/wrangler.js');
const accountId = 'f1e95b3e1b502cf366dfc81a863695fa';
const { values } = parseArgs({
  options: { remote: { type: 'boolean' }, output: { type: 'string' }, help: { type: 'boolean' } },
});
if (values.help) {
  process.stdout.write(
    'Usage: node tools/drill-d1-recovery.mjs --remote --output <new-directory-outside-repo>\n' +
      'Creates, restores, verifies, and deletes a NEW disposable D1 database. No existing database argument is accepted.\n'
  );
  process.exit(0);
}
assert.equal(values.remote, true, 'Explicit --remote is required for the disposable live drill');
assert.ok(values.output, '--output is required');
const output = resolve(values.output);
const relativeOutput = relative(root, output);
assert.ok(
  isAbsolute(relativeOutput) || relativeOutput.startsWith(`..${sep}`),
  'Receipts must be outside the source checkout'
);
await mkdir(output);
const configPath = join(output, 'wrangler.json');
const name = `omg-recovery-drill-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${randomUUID().slice(0, 8)}`;
await writeFile(configPath, JSON.stringify({ name, account_id: accountId }, null, 2));

function command(executable, args, cwd = root) {
  const result = spawnSync(executable, args, {
    cwd,
    encoding: 'utf8',
    input: 'y\n',
    timeout: 120_000,
    maxBuffer: 16 * 1024 * 1024,
    env: { ...process.env, CLOUDFLARE_ACCOUNT_ID: accountId, WRANGLER_SEND_METRICS: 'false' },
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0, `${args.join(' ')} failed:\n${result.stderr}\n${result.stdout}`);
  return result.stdout;
}

async function run(label, args, json = false) {
  const text = command(process.execPath, [wrangler, ...args, '--config', configPath], output);
  await writeFile(join(output, `${label}.${json ? 'json' : 'log'}`), text);
  return json ? JSON.parse(text) : text;
}

async function sql(label, text) {
  const path = join(output, `${label}.sql`);
  await writeFile(path, text);
  const results = await run(
    label,
    ['d1', 'execute', 'DB', '--remote', '--file', path, '--json'],
    true
  );
  assert.ok(Array.isArray(results) && results.length > 0, `${label}: no SQL results`);
  for (const result of results) assert.equal(result.success, true, `${label}: SQL failed`);
  return results.map(result => result.results);
}

const migrationDirectory = join(root, 'workers/api/migrations');
const migrations = (await readdir(migrationDirectory)).filter(n => n.endsWith('.sql')).toSorted();
const receipt = {
  startedAt: new Date().toISOString(),
  sourceCommit: command('git', ['rev-parse', 'HEAD']).trim(),
  sourceStatus: command('git', ['status', '--short']),
  accountId,
  name,
  migrationHashes: {},
  success: false,
  cleanup: 'not-created',
};
for (const migration of migrations) {
  receipt.migrationHashes[migration] = createHash('sha256')
    .update(await readFile(join(migrationDirectory, migration)))
    .digest('hex');
}
const protectedIds = new Set(
  ['site/wrangler.production.jsonc', 'workers/api/wrangler.toml', 'site/wrangler.staging.jsonc']
    .flatMap(path => readConfig({ config: join(root, path) }).d1_databases)
    .map(binding => binding.database_id)
);
protectedIds.add('9a95e454-92d9-41fa-b98c-9e41b8d992b4');
let databaseId;

async function verifyTarget() {
  assert.ok(databaseId && !protectedIds.has(databaseId), 'Refusing a protected database');
  const info = await run('target-info', ['d1', 'info', 'DB', '--json'], true);
  assert.equal(info.uuid, databaseId, 'Remote database ID changed');
  assert.equal(info.name, name, 'Remote database name changed');
  return info;
}

try {
  process.stdout.write(`[recovery] creating ${name}\n`);
  receipt.cleanup = 'creation-outcome-unknown';
  await run('create', ['d1', 'create', name, '--update-config', '--binding', 'DB']);
  const created = readConfig({ config: configPath }).d1_databases;
  assert.equal(created.length, 1, 'Expected exactly one newly created binding');
  assert.equal(created[0].database_name, name);
  assert.match(created[0].database_id, /^[0-9a-f-]{36}$/);
  databaseId = created[0].database_id;
  receipt.databaseId = databaseId;
  receipt.cleanup = 'pending';
  await verifyTarget();
  await writeFile(
    configPath,
    JSON.stringify(
      {
        name,
        account_id: accountId,
        d1_databases: [
          {
            binding: 'DB',
            database_name: name,
            database_id: databaseId,
            migrations_dir: migrationDirectory,
          },
        ],
      },
      null,
      2
    )
  );
  await run('migrations', ['d1', 'migrations', 'apply', 'DB', '--remote']);
  await sql('seed', await readFile(new URL('./recovery/seed.sql', import.meta.url), 'utf8'));
  const inspect = await readFile(new URL('./recovery/inspect.sql', import.meta.url), 'utf8');
  const before = await sql('before', inspect);
  assert.deepEqual(
    before[0].map(row => row.name),
    migrations
  );
  assert.equal(before[1][0].quick_check, 'ok');
  assert.deepEqual(before[2], []);
  for (const check of before.slice(3)) assert.equal(check[0].valid, 1);
  const bookmark = await run('bookmark', ['d1', 'time-travel', 'info', 'DB', '--json'], true);
  assert.match(bookmark.bookmark, /^[0-9a-f-]+$/);
  receipt.bookmark = bookmark.bookmark;
  await sql('mutate', await readFile(new URL('./recovery/mutate.sql', import.meta.url), 'utf8'));
  const damaged = await sql('damaged', inspect);
  for (const check of damaged.slice(3))
    assert.equal(check[0].valid, 0, 'Mutation must be observable');
  await verifyTarget();
  process.stdout.write(`[recovery] restoring verified disposable database ${databaseId}\n`);
  const restoreStarted = performance.now();
  const restored = await run(
    'restore',
    ['d1', 'time-travel', 'restore', 'DB', '--bookmark', bookmark.bookmark, '--json'],
    true
  );
  receipt.restoreSeconds = (performance.now() - restoreStarted) / 1000;
  receipt.previousBookmark = restored.previous_bookmark;
  assert.equal(restored.bookmark, bookmark.bookmark);
  const after = await sql('after', inspect);
  assert.deepEqual(
    after,
    before,
    'Recovered application records or schema differ from the bookmark'
  );
  receipt.success = true;
  receipt.migrationCount = migrations.length;
  receipt.checks = [
    'migration-ledger',
    'sqlite-integrity',
    'foreign-keys',
    'auth-session',
    'entitlement-and-machine',
    'webhook-lease',
    'reconciliation-fence',
    'post-bookmark-row-removed',
  ];
  process.stdout.write(
    `[recovery] ${migrations.length} migrations and ${receipt.checks.length} recovery checks passed\n`
  );
} catch (error) {
  receipt.error = String(error);
  process.exitCode = 1;
  process.stderr.write(`[recovery] ${String(error)}\n`);
} finally {
  if (databaseId) {
    try {
      await verifyTarget();
      await run('delete', ['d1', 'delete', 'DB', '--skip-confirmation']);
      receipt.cleanup = 'deleted';
    } catch (error) {
      receipt.cleanup = 'failed';
      receipt.cleanupError = String(error);
      process.exitCode = 1;
      process.stderr.write(
        `[recovery] Cleanup requires attention for ${name} (${databaseId}): ${String(error)}\n`
      );
    }
  }
  receipt.finishedAt = new Date().toISOString();
  await writeFile(join(output, 'receipt.json'), JSON.stringify(receipt, null, 2));
  process.stdout.write(`[recovery] receipts: ${output}\n`);
}
