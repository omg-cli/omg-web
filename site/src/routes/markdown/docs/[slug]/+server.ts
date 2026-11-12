import { error } from '@sveltejs/kit';
import { agentResponse, documentationEntries } from '../../../../lib/docs/documentation.server';
import type { RequestHandler } from './$types';

export const prerender = false;
export const GET: RequestHandler = async ({ params }) => {
  const entries = await documentationEntries();
  const entry = entries.find(item => item.href === `/docs/${params.slug}/`);
  if (entry === undefined) error(404, 'Documentation not found');
  return agentResponse(entry.markdown);
};
