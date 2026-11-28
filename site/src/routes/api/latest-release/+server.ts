import { Effect } from 'effect';
import type { RequestHandler } from './$types';

const RELEASE_MARKER_URL = 'https://releases.omg.latham.cloud/latest-version';
const RELEASE_MARKER_TIMEOUT_MS = 5000;
const RELEASE_MARKER_MAX_BYTES = 1024;

export const prerender = false;

export const GET: RequestHandler = async ({ fetch }) => {
  return Effect.runPromise(
    Effect.tryPromise({
      try: async () => {
        const response = await fetch(RELEASE_MARKER_URL, {
          cache: 'no-store',
          signal: AbortSignal.timeout(RELEASE_MARKER_TIMEOUT_MS),
        });
        if (!response.ok) throw new Error('Release marker unavailable');
        const contentLength = response.headers.get('content-length');
        if (contentLength !== null && Number(contentLength) > RELEASE_MARKER_MAX_BYTES) {
          throw new Error('Release marker too large');
        }
        const text = await response.text();
        if (text.length > RELEASE_MARKER_MAX_BYTES) {
          throw new Error('Release marker too large');
        }
        return text;
      },
      catch: cause => cause,
    }).pipe(
      Effect.match({
        onFailure: () =>
          new Response('Release marker unavailable', {
            status: 503,
            headers: { 'cache-control': 'no-store' },
          }),
        onSuccess: marker => {
          const version = marker.trim();
          if (!/^\d+\.\d+\.\d+$/u.test(version)) {
            return new Response('Invalid release marker', {
              status: 502,
              headers: { 'cache-control': 'no-store' },
            });
          }
          return new Response(`v${version}`, {
            headers: {
              'content-type': 'text/plain; charset=utf-8',
              'cache-control': 'no-store',
            },
          });
        },
      })
    )
  );
};
