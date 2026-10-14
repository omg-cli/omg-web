import { json } from '@sveltejs/kit';
import { securityFeed } from '../../../lib/server/security-updates.server';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ fetch, platform, url }) => {
  const runtime =
    platform?.ctx && platform.caches
      ? {
          origin: url.origin,
          ctx: platform.ctx,
          cache: platform.caches.open('omg-security-feed-v1'),
        }
      : undefined;
  const feed = await securityFeed(fetch, runtime);
  return json(feed, {
    headers: {
      'Cache-Control': feed.stale
        ? 'public, max-age=0, must-revalidate'
        : 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
    },
  });
};
