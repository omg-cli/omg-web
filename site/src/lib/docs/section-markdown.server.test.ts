import { describe, expect, it } from 'vitest';
import { documentationEntries, type DocumentationEntry } from './documentation.server';
import { markdownExport, markdownResultHref } from './section-markdown.server';

describe('section Markdown exports', () => {
  it('resolves every catalog section by its public ID and leaves whole-page text unchanged', async () => {
    const entries = await documentationEntries();
    for (const entry of entries) {
      expect(await markdownExport(entry, null).text()).toBe(entry.markdown);
      for (const section of entry.sections) {
        const href = `${entry.href}#${section.id}`;
        const markdownHref = markdownResultHref(entries, href);
        expect(markdownHref).toBe(`https://getomg.dev${entry.markdownHref}?section=${section.id}`);
        const response = markdownExport(entry, section.id);
        const body = await response.text();
        expect(response.status).toBe(200);
        expect(body).toContain(`Canonical: https://getomg.dev${href}`);
        expect(body).toContain(`## ${section.title}`);
        expect(body).toContain(`${entry.release ? 'Reviewed' : 'Updated'}: ${entry.updated}`);
        expect(body).toContain(entry.release ?? 'not pinned for this guide');
        expect(body).toContain(entry.sources[0]?.href);
      }
      expect(markdownExport(entry, 'does-not-exist').status).toBe(404);
      expect(markdownExport(entry, '').status).toBe(404);
      expect(markdownResultHref(entries, `${entry.href}#does-not-exist`)).toBeUndefined();
    }
  });

  it('retains nested headings and code fence contents, and selects duplicate titles by public ID', async () => {
    const first = '## Install\n\n### Preview\n\n````sh\n## Not a section\n```\n````';
    const second = '## Install\n\nSecond install section';
    const fixture: DocumentationEntry = {
      title: 'The manual',
      description: '',
      category: 'Guides',
      href: '/docs/manual/',
      markdownHref: '/markdown/docs/manual/',
      release: null,
      updated: '2026-11-11',
      sources: [{ title: 'Reference', href: '/docs/cli/' }],
      sections: [
        { id: 'preview', title: 'Install' },
        { id: 'confirm', title: 'Install' },
      ],
      markdown: `# The manual\n\n${first}\n\n${second}\n\n## Sources\n\nTrailing metadata`,
    };
    const preview = await markdownExport(fixture, 'preview').text();
    expect(preview).toContain(first);
    expect(preview).not.toContain('Second install section');
    const confirm = await markdownExport(fixture, 'confirm').text();
    expect(confirm).toContain(second);
    expect(confirm).toContain('](https://getomg.dev/docs/cli/)');
    expect(confirm).not.toContain('Preview');
    expect(confirm).not.toContain('Trailing metadata');
  });
});
