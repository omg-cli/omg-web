import { Schema } from 'effect';
import { advisoryOrigin } from './advisories.ts';

export class UpstreamError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`Advisory API returned ${status}`);
    this.status = status;
  }
}

export async function advisoryJson<A, I>(path: string, schema: Schema.Schema<A, I>, fresh = false) {
  const headers = new Headers({ Accept: 'application/json' });
  if (fresh) headers.set('Cache-Control', 'no-store');
  const response = await fetch(new URL(path, advisoryOrigin), {
    headers,
    redirect: 'manual',
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) throw new UpstreamError(response.status);
  return Schema.decodeUnknownSync(schema)(await response.json());
}
