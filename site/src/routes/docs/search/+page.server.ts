import { searchDocumentation } from '../../../lib/docs/search.server';
import type { PageServerLoad } from './$types';

export const prerender = false;
export const load: PageServerLoad = async ({ url, setHeaders }) => {
  setHeaders({ 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' });
  const query = (url.searchParams.get('q') ?? '').trim();
  if (query.length > 160)
    return { query, total: 0, results: [], message: 'Use a query with 160 characters or fewer.' };
  return {
    ...(await searchDocumentation(query)),
    message: query.length < 2 ? 'Enter at least two characters to search.' : '',
  };
};
