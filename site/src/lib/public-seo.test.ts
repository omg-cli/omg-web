import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import Updates from '../routes/updates/+page.svelte';
import DocsTopicPage from './components/docs/DocsTopicPage.svelte';
import { cliTopic } from './docs/content/cli';
import { sitemapResponse } from './server/public-files';

describe('public discovery contracts', () => {
  it('gives release links a complete social preview on the canonical origin', () => {
    const { head } = render(Updates);
    expect(head).toContain('property="og:image" content="https://getomg.xyz/og/omg-og.png"');
    expect(head).toContain('property="og:image:width" content="1200"');
    expect(head).toContain('property="og:image:height" content="630"');
    expect(head).toContain('name="twitter:card" content="summary_large_image"');
    expect(head.match(/rel="canonical"/gu)).toHaveLength(1);
    expect(head).toContain('href="https://getomg.xyz/updates/"');
  });

  it('publishes release index markup with one citable anchor per version', () => {
    const { head } = render(Updates);
    expect(head).toContain('"@type":"CollectionPage"');
    expect(head).toContain('"@type":"BreadcrumbList"');
    expect(head).toContain('"@type":"ItemList"');
    expect(head).toContain('https://getomg.xyz/updates/#v0.1.223');
    expect(head).toContain('"dateModified"');
  });

  it('advertises the 1200x630 card as the default social image', () => {
    const { head } = render(DocsTopicPage, { props: { topic: cliTopic } });
    expect(head).toContain('property="og:image" content="https://getomg.xyz/og/omg-og.png"');
    expect(head).toContain('property="article:modified_time"');
  });

  it('makes authored runtime and workflow pages discoverable with truthful dates', async () => {
    const xml = await sitemapResponse().text();
    expect(xml).toContain('<loc>https://getomg.xyz/runtimes/node/</loc>');
    expect(xml).toContain('<loc>https://getomg.xyz/guides/node-npm-pnpm/</loc>');
    expect(xml).toContain('<loc>https://getomg.xyz/compare/omg-vs-mise/</loc>');
    expect(xml).toContain('<lastmod>2026-09-14</lastmod>');
    expect(xml).not.toContain('/dashboard/');
    expect(xml).not.toContain('/api/');
  });
});
