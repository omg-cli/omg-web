import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const script = fileURLToPath(new URL('../check-installer-sync.mjs', import.meta.url));
const installed = readFileSync(new URL('../../site/static/install.sh', import.meta.url));
const check = (input, args = ['--stdin']) =>
  spawnSync(process.execPath, [script, ...args], { input, encoding: 'utf8', timeout: 10_000 });

test('installer comparison accepts the exact canonical bytes on stdin', () => {
  assert.equal(check(installed).status, 0);
});

test('installer comparison rejects changed and empty canonical input', () => {
  const changed = Buffer.from(installed);
  changed[0] ^= 1;
  for (const input of [changed, Buffer.alloc(0)]) {
    const result = check(input);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /differs from the OMG canonical source/u);
  }
});

test('installer comparison bounds stdin and refuses path arguments', () => {
  const oversized = check(Buffer.alloc(installed.length + 1));
  assert.equal(oversized.status, 1);
  assert.match(oversized.stderr, /exceeds snapshot size/u);
  const pathArgument = check('', ['/arbitrary/file']);
  assert.equal(pathArgument.status, 1);
  assert.match(pathArgument.stderr, /Usage:/u);
});
