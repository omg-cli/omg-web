import { parse } from 'yaml';
import { decodeDocumentationMetadata, documentationMetadata } from './markdown-document';
import { markdownHeadings } from './headings';

const sources = import.meta.glob<string>(
  ['/src/routes/docs/**/+page.md', '/src/routes/runtimes/**/+page.md'],
  { query: '?raw', import: 'default', eager: true }
);

function readDocument(path: string, raw: string) {
  const header = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/u.exec(raw);
  if (header?.[1] === undefined) throw new Error(`Missing documentation frontmatter: ${path}`);
  const metadata = documentationMetadata(decodeDocumentationMetadata(parse(header[1])));
  const href = path.replace(/^\/src\/routes/u, '').replace(/\+page\.md$/u, '');
  const body = raw.slice(header[0].length).trim();
  return { metadata, href, body, headings: markdownHeadings(body) };
}

export const MARKDOWN_DOCUMENTS = Object.entries(sources)
  .map(([path, raw]) => readDocument(path, raw))
  .toSorted((a, b) => a.metadata.order - b.metadata.order);
