import { agentResponse, documentationEntries } from '../../../lib/docs/documentation.server';
import { SITE_ORIGIN } from '../../../../../shared/public-site';
import type { RequestHandler } from './$types';

export const prerender = false;
export const GET: RequestHandler = async () => {
  const entries = await documentationEntries();
  return agentResponse(
    JSON.stringify(
      {
        schemaVersion: 1,
        origin: SITE_ORIGIN,
        releaseBaseline: 'v0.1.224',
        verification:
          'Source-reviewed. Published release behavior is distinguished from development changes. Examples were not executed on every supported host.',
        search: `${SITE_ORIGIN}/docs/search.json?q={query}`,
        fullText: `${SITE_ORIGIN}/llms-full.txt`,
        pages: entries.map(({ markdown: _markdown, ...entry }) => ({
          ...entry,
          href: `${SITE_ORIGIN}${entry.href}`,
          markdownHref: `${SITE_ORIGIN}${entry.markdownHref}`,
        })),
      },
      null,
      2
    ),
    'application/json; charset=utf-8'
  );
};
