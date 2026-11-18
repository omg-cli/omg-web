import { describe, expect, it, vi } from 'vitest';
import { VFile } from 'vfile';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import documentationHeadings from '../../../tools/documentation-remark';
import { markdownTransform } from '../../../tools/sveltepress-scope';
import { markdownHeadings, markdownSections } from './headings';
import { decodeDocumentationMetadata, documentationMetadata } from './markdown-document';

describe('Markdown compilation contract', () => {
  it('shares heading IDs between the compiler, search and table of contents', () => {
    const markdown =
      '## Use `omg` with [Node](https://example.com)\n\n## Use omg with Node\n\n````sh\n## fake\n```\nstill code\n````\n\nThird section\n-------------';
    const expected = [
      { id: 'use-omg-with-node', title: 'Use omg with Node', depth: 2 },
      { id: 'use-omg-with-node-1', title: 'Use omg with Node', depth: 2 },
      { id: 'third-section', title: 'Third section', depth: 2 },
    ];
    expect(markdownHeadings(markdown)).toEqual(expected);
    const tree = unified().use(remarkParse).parse(markdown);
    const file = new VFile();
    documentationHeadings()(tree, file);
    expect(file.data['headings']).toEqual(expected);
    expect(markdownSections(markdown).map(section => section.title)).toEqual([
      null,
      'Use omg with Node',
      'Use omg with Node',
      'Third section',
    ]);
  });

  it('keeps Svelte interpolation and HTML syntax literal in inline code', () => {
    const tree = unified().use(remarkParse).parse('Use `${HOME}` and `<script>` literally.');
    documentationHeadings()(tree, new VFile());
    expect(JSON.stringify(tree)).toContain('&#123;HOME&#125;');
    expect(JSON.stringify(tree)).toContain('&lt;script&gt;');
  });

  it('leaves native application pages alone while invoking the Markdown compiler', async () => {
    const transform = vi.fn((code: string) => ({ code: `compiled:${code}` }));
    const scoped = markdownTransform(transform);
    const page = '<svelte:head\n><title>Admin</title></svelte:head><h1>Admin</h1>';
    expect(await scoped(page, '/src/routes/admin/+page.svelte')).toBeNull();
    expect(transform).not.toHaveBeenCalled();
    expect(await scoped('## Guide', '/src/routes/docs/guide/+page.md')).toEqual({
      code: 'compiled:## Guide',
    });
  });
});

const metadata = {
  title: 'Install OMG',
  description: 'Install and verify OMG.',
  navLabel: 'Install',
  section: 'Start here',
  order: 0,
  release: 'v0.1.224',
  source: {
    repo: 'omg-cli/omg',
    path: 'docs/installation.md',
    reviewedCommit: 'a'.repeat(40),
    reviewedAt: '2026-11-11',
  },
  implementation: ['src/cli/args.rs'],
};

it('rejects malformed provenance, paths, dates and release metadata at the authoring boundary', () => {
  expect(documentationMetadata(decodeDocumentationMetadata(metadata))).toEqual(metadata);
  for (const invalid of [
    { ...metadata, title: '' },
    { ...metadata, release: 'main' },
    { ...metadata, implementation: ['../secrets'] },
    { ...metadata, source: { ...metadata.source, reviewedCommit: 'short' } },
    { ...metadata, source: { ...metadata.source, reviewedAt: '2026-02-31' } },
  ])
    expect(() => documentationMetadata(decodeDocumentationMetadata(invalid))).toThrow();
});
