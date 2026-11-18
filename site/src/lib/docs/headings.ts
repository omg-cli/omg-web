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
    if (node.depth === 2 || node.depth === 3) {
      headings.push({ id, title, depth: node.depth });
      node.data = { ...node.data, hProperties: { id, ariaLabel: title } };
      node.children.push({
        type: 'link',
        url: `#${id}`,
        data: { hProperties: { className: 'heading-link', ariaLabel: `Link to ${title}` } },
        children: [{ type: 'text', value: '#' }],
      });
    }
  }
  return headings;
}

const parser = unified().use(remarkParse);

/** Publish the same section anchors in MCP search that the HTML reader uses. */
export function mcpMarkdown(markdown: string, sections: readonly { id: string; title: string }[]) {
  const parts: string[] = [];
  let cursor = 0;
  let sectionIndex = 0;
  for (const node of parser.parse(markdown).children) {
    if (node.type !== 'heading' || !node.position) continue;
    const start = node.position.start.offset;
    const end = node.position.end.offset;
    if (start === undefined || end === undefined) continue;
    const title = text(node);
    const section = sections[sectionIndex];
    parts.push(markdown.slice(cursor, start));
    if (node.depth === 2 && section?.title === title) {
      parts.push(`## ${title} [#${section.id}]`);
      sectionIndex++;
    } else {
      // Subheadings and export-only source notes have no catalog permalink.
      parts.push(`**${title}**`);
    }
    cursor = end;
  }
  return parts.join('') + markdown.slice(cursor);
}

export function markdownHeadings(markdown: string): DocumentationHeading[] {
  return assignHeadingIds(parser.parse(markdown));
}

/** Split only real H2s: headings inside code examples remain in their containing section. */
export function markdownSections(markdown: string) {
  const tree = parser.parse(markdown);
  const starts: { title: string | null; offset: number; leadCommand?: string }[] = [];
  let section: (typeof starts)[number] = { title: null, offset: 0 };
  starts.push(section);
  for (const node of tree.children) {
    if (node.type === 'heading' && node.depth === 2 && node.position?.start.offset !== undefined) {
      section = { title: text(node), offset: node.position.start.offset };
      starts.push(section);
    }
    if (
      node.type === 'code' &&
      !section.leadCommand &&
      ['sh', 'bash', 'shell'].includes(node.lang ?? '')
    ) {
      const first = node.value
        .split('\n')
        .find(line => line.trim() && !line.trimStart().startsWith('#'));
      if (first) section.leadCommand = first.trim().toLowerCase();
    }
  }
  return starts.map((item, index) => ({
    title: item.title,
    body: markdown.slice(item.offset, starts[index + 1]?.offset),
    leadCommand: item.leadCommand,
  }));
}
