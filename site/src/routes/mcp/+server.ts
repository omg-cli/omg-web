import { createDocsMcpHttpHandler, type DocsMcpPage } from '@farming-labs/docs/mcp';
import { documentationEntries } from '../../lib/docs/documentation.server';
import { SITE_ORIGIN } from '../../../../shared/public-site';
import { release } from '../../lib/docs/source-review.json';
import { mcpMarkdown } from '../../lib/docs/headings';

export const prerender = false;
export const trailingSlash = 'never';

let pages: DocsMcpPage[] | undefined;
const handler = createDocsMcpHttpHandler({
  source: {
    siteTitle: 'OMG documentation',
    baseUrl: SITE_ORIGIN,
    async getPages() {
      const entries = await documentationEntries();
      return (pages ??= entries.map(entry => {
        const page: DocsMcpPage = {
          slug: entry.href.slice(1, -1),
          url: entry.href,
          title: entry.title,
          description: entry.description,
          content: mcpMarkdown(entry.markdown, entry.sections),
          lastModified: entry.updated,
        };
        if (entry.release) page.version = entry.release;
        return page;
      }));
    },
    async getNavigation() {
      const entries = await documentationEntries();
      return {
        name: 'OMG documentation',
        children: entries.map(entry => ({ type: 'page', name: entry.title, url: entry.href })),
      };
    },
  },
  feedback: false,
  contentChanges: false,
  mcp: {
    name: 'OMG documentation',
    version: release.version,
    route: '/mcp',
    prompts: false,
    security: { allowedOrigins: 'same-origin', maxBodyBytes: 32_768 },
    tools: {
      listDocs: false,
      listTasks: false,
      readTask: false,
      submitFeedback: false,
      getConfigSchema: false,
      listContentChanges: false,
      hydrateContentChanges: false,
      searchFacets: false,
    },
  },
});

export const { GET, POST, DELETE, OPTIONS } = handler;
