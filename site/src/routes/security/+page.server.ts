import { error } from '@sveltejs/kit';
import { Schema } from 'effect';
import { SecurityFeedSchema } from '../../lib/security-updates';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch, depends }) => {
  depends('omg:security-updates');
  const response = await fetch('/security/feed.json');
  if (!response.ok) {
    error(503, 'Security updates unavailable');
  }
  return { feed: Schema.decodeUnknownSync(SecurityFeedSchema)(await response.json()) };
};
