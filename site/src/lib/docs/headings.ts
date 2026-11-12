import { unified } from 'unified';
import remarkParse from 'remark-parse';
import type { Nodes, Root } from 'mdast';

interface DocumentationHeading {
  readonly id: string;
  readonly title: string;
  readonly depth: number;
}

function headingId(title: string): string {
  return title
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/[\s-]+/gu, '-');
}

function text(node: Nodes): string {
  if ('value' in node) return node.value;
  return 'children' in node ? node.children.map(text).join('') : '';
}

/** The compiler, table of contents, and search share one heading/duplicate policy. */
export function assignHeadingIds(tree: Root): DocumentationHeading[] {
  const headings: DocumentationHeading[] = [];
  const used = new Map<string, number>();
  for (const node of tree.children) {
    if (node.type !== 'heading') continue;
    const title = text(node);
    const base = headingId(title);
    const count = used.get(base) ?? 0;
    used.set(base, count + 1);
    const id = count === 0 ? base : `${base}-${count}`;
    node.data = { ...node.data, hProperties: { id } };
    if (node.depth === 2 || node.depth === 3) headings.push({ id, title, depth: node.depth });
  }
  return headings;
}

const parser = unified().use(remarkParse);

export function markdownHeadings(markdown: string): DocumentationHeading[] {
  return assignHeadingIds(parser.parse(markdown));
}

/** Split only real H2s: headings inside code examples remain in their containing section. */
export function markdownSections(markdown: string) {
  const tree = parser.parse(markdown);
  const starts = tree.children.flatMap(node =>
    node.type === 'heading' && node.depth === 2 && node.position !== undefined
      ? [{ title: text(node), offset: node.position.start.offset }]
      : []
  );
  return [
    { title: null, body: markdown.slice(0, starts[0]?.offset) },
    ...starts.map((section, index) => ({
      title: section.title,
      body: markdown.slice(section.offset, starts[index + 1]?.offset),
    })),
  ];
}
