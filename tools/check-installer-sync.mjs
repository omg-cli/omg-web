import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';

// Updated only when copying the reviewed canonical OMG installer. An optional
// --stdin input checks exact cross-repository parity during synchronization.
const expected = '6943fd1930367af2045bcb4636f9b26da1c5840a038c34944e8df3d63c7d5649';
const installed = await readFile(new URL('../site/static/install.sh', import.meta.url));
if (createHash('sha256').update(installed).digest('hex') !== expected) {
  throw new Error(
    'Website installer differs from the reviewed canonical snapshot; synchronize it and update this digest together.'
  );
}
if (process.argv.length > 2) {
  if (process.argv.length !== 3 || process.argv[2] !== '--stdin')
    throw new Error('Usage: node tools/check-installer-sync.mjs [--stdin]');
  const chunks = [];
  let bytes = 0;
  for await (const chunk of process.stdin) {
    bytes += chunk.length;
    if (bytes > installed.length) throw new Error('Canonical installer exceeds snapshot size');
    chunks.push(chunk);
  }
  const canonical = Buffer.concat(chunks);
  if (!installed.equals(canonical))
    throw new Error('Website installer differs from the OMG canonical source');
}
console.log('Reviewed installer snapshot verified');
