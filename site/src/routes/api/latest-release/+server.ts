import { Effect } from 'effect';
import type { RequestHandler } from './$types';

const RELEASE_MARKER_URL = 'https://releases.omg.latham.cloud/latest-version';

export const prerender = false;

export const GET: RequestHandler = async ({ fetch }) => {
  return Effect.runPromise(
    Effect.tryPromise({
      try: async () => {
        const response = await fetch(RELEASE_MARKER_URL, { cache: 'no-store' });
        if (!response.ok) throw new Error('Release marker unavailable');
        return response.text();
      },
      catch: cause => cause,
    }).pipe(
      Effect.match({
        onFailure: () => new Response('Release marker unavailable', { status: 503 }),
        onSuccess: marker => {
          const version = marker.trim();
          if (!/^\d+\.\d+\.\d+$/u.test(version)) {
            return new Response('Invalid release marker', { status: 502 });
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
