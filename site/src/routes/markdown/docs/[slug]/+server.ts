import { error } from '@sveltejs/kit';
import { documentationEntries } from '../../../../lib/docs/documentation.server';
import { markdownExport } from '../../../../lib/docs/section-markdown.server';
import type { RequestHandler } from './$types';

export const prerender = false;
export const trailingSlash = 'always';
export const GET: RequestHandler = async ({ params, url }) => {
  const entries = await documentationEntries();
  const entry = entries.find(item => item.href === `/docs/${params.slug}/`);
  if (entry === undefined) error(404, 'Documentation not found');
  return markdownExport(entry, url.searchParams.get('section'));
};
