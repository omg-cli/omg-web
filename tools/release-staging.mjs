import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { unstable_readConfig as readConfig } from 'wrangler';
import {
  accountId,
  repository,
  targets,
  assertCi,
  activeVersion,
  assertBindings,
  assertHealth,
} from './release/validation.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const wrangler = join(root, 'node_modules/wrangler/bin/wrangler.js');
const { values } = parseArgs({
  options: {
    'ci-run': { type: 'string' },
    output: { type: 'string' },
    deploy: { type: 'boolean' },
    help: { type: 'boolean' },
  },
});
if (values.help) {
  process.stdout.write(
    'Usage: npm run release:staging -- --ci-run <run-id> --output <new-external-directory> [--deploy]\nWithout --deploy this only checks readiness. It never publishes production or applies migrations.\n'
  );
  process.exit(0);
}
assert.match(values['ci-run'] ?? '', /^\d+$/, '--ci-run is required');
assert.ok(values.output, '--output is required');
const output = resolve(values.output);
const outside = relative(root, output);
assert.ok(
  isAbsolute(outside) || outside.startsWith(`..${sep}`),
  'Receipts must be outside the checkout'
);
await mkdir(output);
const receipt = {
  startedAt: new Date().toISOString(),
  nodeVersion: process.version,
  deployRequested: values.deploy === true,
  status: 'preflight',
  workers: [],
};

function command(executable, args, timeout = 120_000) {
  const result = spawnSync(executable, args, {
    cwd: root,
    encoding: 'utf8',
    timeout,
    maxBuffer: 32 * 1024 * 1024,
    env: { ...process.env, CLOUDFLARE_ACCOUNT_ID: accountId, WRANGLER_SEND_METRICS: 'false' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0, `${executable} ${args[0]} failed:\n${result.stderr}`);
  return result.stdout;
}
function gh(path) {
  return JSON.parse(command('gh', ['api', `repos/${repository}/${path}`]));
}
function wranglerJson(target, args) {
  const name = args[0] === 'd1' ? [] : ['--name', target.name];
  return JSON.parse(
    command(process.execPath, [
      wrangler,
      ...args,
      ...name,
      '--config',
      join(root, target.config),
      '--json',
    ])
  );
}
function source() {
  assert.equal(
    command('git', ['status', '--porcelain']).trim(),
    '',
    'Release requires a clean checkout'
  );
  return command('git', ['rev-parse', 'HEAD']).trim();
}
function snapshot(target) {
  const active = activeVersion(wranglerJson(target, ['deployments', 'list']));
  const version = wranglerJson(target, ['versions', 'view', active.versionId]);
  assert.equal(version.id, active.versionId);
  assertBindings(version.resources.bindings, target);
  return { ...active, tag: version.annotations?.['workers/tag'] ?? null };
}

try {
  const revision = source();
  receipt.revision = revision;
  for (const target of targets) {
    const config = readConfig({ config: join(root, target.config) });
    assert.equal(config.name, target.name, 'Unexpected Worker deployment target');
    assert.equal(config.account_id, accountId, 'Unexpected Cloudflare account');
  }
  const run = gh(`actions/runs/${values['ci-run']}`);
  const jobs = gh(`actions/runs/${values['ci-run']}/jobs?per_page=100`);
  assertCi(run, jobs.jobs, revision);
  receipt.ci = { id: run.id, url: run.html_url, source: run.head_sha };
  const workflow = await readFile(join(root, '.github/workflows/ci.yml'), 'utf8');
  assert.equal(
    workflow.split('ref: ${{ github.event.pull_request.head.sha || github.sha }}').length - 1,
    2,
    'CI must check out the release source in both jobs'
  );
  const main = gh('commits/main').sha;
  const comparison = gh(`compare/${main}...${revision}`);
  assert.equal(comparison.behind_by, 0, 'Merge current main and rerun CI before releasing');
  receipt.main = main;
  command(process.execPath, [join(root, 'tools/check-staging.mjs')]);
  for (const target of targets) {
    process.stdout.write(`[release] checking ${target.name}\n`);
    receipt.workers.push({ name: target.name, before: snapshot(target) });
  }
  const ledger = wranglerJson(targets[0], [
    'd1',
    'execute',
    'DB',
    '--remote',
    '--command',
    'SELECT name FROM d1_migrations ORDER BY name',
  ]);
  assert.equal(ledger[0].success, true);
  const migrations = (await readdir(join(root, 'workers/api/migrations')))
    .filter(n => n.endsWith('.sql'))
    .toSorted();
  assert.deepEqual(
    ledger[0].results.map(row => row.name),
    migrations,
    'Staging migrations differ; review and apply them separately'
  );
  receipt.migrations = migrations;
  receipt.status = 'preflight-passed';
  if (values.deploy) {
    const npmCli = process.env.npm_execpath;
    assert.ok(npmCli, 'Use npm run release:staging so the pinned npm CLI is available');
    const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
    assert.equal(
      `npm@${command(process.execPath, [npmCli, '--version']).trim()}`,
      manifest.packageManager,
      'Use the pinned npm version'
    );
    for (const prefix of ['.', 'site', 'workers/api']) {
      await writeFile(
        join(output, `install-${prefix.replaceAll('/', '-').replace('.', 'root')}.log`),
        command(process.execPath, [npmCli, 'ci', '--audit=false', '--prefix', prefix], 300_000)
      );
    }
    await writeFile(
      join(output, 'build.log'),
      command(process.execPath, [npmCli, 'run', 'check:deploy'], 300_000)
    );
    assert.equal(source(), revision, 'Source changed during preparation');
    assert.equal(gh('commits/main').sha, main, 'Main advanced during preparation');
    for (const [index, target] of targets.entries()) {
      assert.deepEqual(
        snapshot(target),
        receipt.workers[index].before,
        'Remote deployment changed during preparation'
      );
    }
    receipt.status = 'publishing';
    await writeFile(join(output, 'receipt.json'), JSON.stringify(receipt, null, 2));
    for (const [index, target] of targets.entries()) {
      assert.equal(source(), revision, 'Source changed before upload');
      assert.deepEqual(
        snapshot(target),
        receipt.workers[index].before,
        'Remote deployment changed before upload'
      );
      await writeFile(
        join(output, `${target.name}-deploy.log`),
        command(
          process.execPath,
          [
            wrangler,
            'deploy',
            '--name',
            target.name,
            '--config',
            join(root, target.config),
            '--tag',
            revision,
            '--message',
            `CI ${run.id}; verified staging release`,
          ],
          300_000
        )
      );
      const after = snapshot(target);
      receipt.workers[index].after = after;
      await writeFile(join(output, 'receipt.json'), JSON.stringify(receipt, null, 2));
      assert.equal(after.tag, revision, 'Uploaded source tag differs');
      const response = await fetch(`${target.origin}/health`, {
        redirect: 'error',
        signal: AbortSignal.timeout(30_000),
      });
      const body = await response.json();
      receipt.workers[index].health = { status: response.status, version: body.version };
      assertHealth(response.status, body, revision, after.versionId);
    }
    receipt.status = 'deployed';
  }
  process.stdout.write(
    `[release] ${receipt.status}; authenticated purchase and CLI acceptance remain separate\n`
  );
} catch (error) {
  receipt.failedDuring = receipt.status;
  receipt.status = 'failed';
  receipt.error = String(error);
  process.exitCode = 1;
  process.stderr.write(`[release] ${String(error)}\n`);
} finally {
  receipt.finishedAt = new Date().toISOString();
  await writeFile(join(output, 'receipt.json'), JSON.stringify(receipt, null, 2));
  process.stdout.write(`[release] receipt: ${join(output, 'receipt.json')}\n`);
}
