import { searchDocumentation } from '../../../lib/docs/search.server';
import { agentResponse, documentationEntries } from '../../../lib/docs/documentation.server';
import { markdownResultHref } from '../../../lib/docs/section-markdown.server';
import type { RequestHandler } from './$types';

export const prerender = false;
export const GET: RequestHandler = async ({ url }) => {
  const query = (url.searchParams.get('q') ?? '').trim();
  if (query.length > 160)
    return Response.json(
      { error: 'Search queries must be 160 characters or fewer' },
      { status: 400, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } }
    );
  const matches = await searchDocumentation(query);
  const entries = matches.results.length ? await documentationEntries() : [];
  const response = agentResponse(
    JSON.stringify({
      ...matches,
      results: matches.results.map(result => ({
        ...result,
        markdownHref: markdownResultHref(entries, result.href),
      })),
    }),
    'application/json; charset=utf-8'
  );
  response.headers.set('Cache-Control', 'no-store');
  return response;
};
