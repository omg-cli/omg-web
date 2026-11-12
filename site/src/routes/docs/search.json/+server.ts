import { searchDocumentation } from '../../../lib/docs/search.server';
import { agentResponse } from '../../../lib/docs/documentation.server';
import type { RequestHandler } from './$types';

export const prerender = false;
export const GET: RequestHandler = async ({ url }) => {
  const query = (url.searchParams.get('q') ?? '').trim();
  if (query.length > 160)
    return Response.json(
      { error: 'Search queries must be 160 characters or fewer' },
      { status: 400, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } }
    );
  const response = agentResponse(
    JSON.stringify(await searchDocumentation(query)),
    'application/json; charset=utf-8'
  );
  response.headers.set('Cache-Control', 'no-store');
  return response;
};
