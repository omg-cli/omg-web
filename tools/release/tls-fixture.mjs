import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { request } from 'node:https';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

/** An ephemeral localhost identity; only this test client trusts its certificate. */
export function localTlsFixture() {
  const directory = mkdtempSync(join(tmpdir(), 'omg-release-tls-'));
  try {
    execFileSync(
      'openssl',
      [
        'req',
        '-x509',
        '-newkey',
        'rsa:2048',
        '-nodes',
        '-days',
        '1',
        '-keyout',
        join(directory, 'key.pem'),
        '-out',
        join(directory, 'cert.pem'),
        '-subj',
        '/CN=127.0.0.1',
        '-addext',
        'subjectAltName=IP:127.0.0.1',
      ],
      { stdio: 'ignore', timeout: 10_000 }
    );
    const key = readFileSync(join(directory, 'key.pem'));
    const cert = readFileSync(join(directory, 'cert.pem'));
    const fetchHealth = (url, { signal }) =>
      new Promise((resolve, reject) => {
        const connection = request(url, { ca: cert, signal }, response => {
          const chunks = [];
          response.on('data', chunk => chunks.push(chunk));
          response.on('error', reject);
          response.on('end', () => {
            resolve(new Response(Buffer.concat(chunks), { status: response.statusCode }));
          });
        });
        connection.on('error', reject);
        connection.end();
      });
    return { key, cert, fetchHealth };
  } finally {
    rmSync(directory, { recursive: true });
  }
}
