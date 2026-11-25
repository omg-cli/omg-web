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

export async function readLimitedText(response: Response, limitBytes: number) {
  if (!response.body) throw new Error('Source response is empty');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let result = '';
  let bytes = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) return result + decoder.decode();
      bytes += value.byteLength;
      if (bytes > limitBytes) throw new Error('Source response exceeds size limit');
      result += decoder.decode(value, { stream: true });
    }
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}
