import { describe, expect, it } from 'vitest';
import { createDocumentationSearch, searchDocumentation } from './search.server';
import type { DocumentationEntry } from './documentation.server';

const fixture: DocumentationEntry = {
  href: '/docs/example/',
  markdownHref: '/markdown/docs/example/',
  title: 'Example',
  description: 'Example search fixture',
  category: 'Guides',
  updated: '2026-11-11',
  release: 'v0.1.224',
  sources: [],
  sections: [
    { id: 'install', title: 'Install' },
    { id: 'install-1', title: 'Install' },
  ],
  markdown:
    '# Example\n\n## Install\n\nUse ripgrep.\n\n````sh\n## counterfeit\n```\nneedleinsidecode\n````\n\n## Install\n\nSecondsectiontoken',
};

describe('documentation search', () => {
  it('keeps fenced headings inside their real section and disambiguates repeated headings', () => {
    const search = createDocumentationSearch([fixture]);
    expect(search('needleinsidecode').results[0]?.href).toBe('/docs/example/#install');
    expect(search('Secondsectiontoken').results[0]?.href).toBe('/docs/example/#install-1');
    expect(search('counterfeit').results[0]?.heading).toBe('Install');
  });

  it('finds release flags and actual task sections across the assembled catalog', async () => {
    const flags = await searchDocumentation('fail-on-findings');
    expect(flags.results.some(result => result.href.startsWith('/docs/security/#'))).toBe(true);
    const tasks = await searchDocumentation('watch parallel');
    expect(tasks.results.some(result => result.href.startsWith('/docs/tasks/#'))).toBe(true);
    const typo = await searchDocumentation('environmnt');
    expect(typo.total).toBeGreaterThan(0);
    expect(typo.results.every(result => result.excerpt.length <= 232)).toBe(true);
  });

  it('bounds queries and returns an honest empty result', async () => {
    expect(await searchDocumentation(' a ')).toEqual({ query: 'a', total: 0, results: [] });
    expect((await searchDocumentation('xyzzyunfindabletoken')).total).toBe(0);
    await expect(searchDocumentation('x'.repeat(161))).rejects.toThrow('160');
    expect((await searchDocumentation('install')).results.length).toBeLessThanOrEqual(20);
  });
});
