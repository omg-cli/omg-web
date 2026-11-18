import { error } from '@sveltejs/kit';
import { documentationEntries } from '../../../../lib/docs/documentation.server';
import { markdownExport } from '../../../../lib/docs/section-markdown.server';
import type { RequestHandler } from './$types';

// The adapter discards custom headers on prerendered text endpoints. Keep the
// handler so production preserves Markdown MIME type and noindex policy.
export const prerender = false;
export const trailingSlash = 'always';

export const GET: RequestHandler = async ({ params, url }) => {
  const entries = await documentationEntries();
  const entry = entries.find(item => item.href === `/${params.category}/${params.slug}/`);
  if (entry === undefined) error(404, 'Guide not found');
  return markdownExport(entry, url.searchParams.get('section'));
};
