import type { Nodes, Root } from 'mdast';
import type { Node } from 'unist';
import type { VFile } from 'vfile';
import { assignHeadingIds } from '../src/lib/docs/headings.ts';

function literalCode(node: Nodes): Nodes {
  if (node.type === 'inlineCode') {
    const value = node.value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('{', '&#123;')
      .replaceAll('}', '&#125;');
    return { type: 'html', value: `<code>${value}</code>` };
  }
  if ('children' in node) Object.assign(node, { children: node.children.map(literalCode) });
  return node;
}

export default function documentationHeadings() {
  return (tree: Node, file: VFile) => {
    if (tree.type !== 'root') throw new Error('Expected a Markdown root from the remark compiler');
    // SAFETY: SveltePress invokes this hook after remark-parse; the checked root
    // discriminator and that parser's AST contract establish its mdast children.
    const root = tree as Root;
    file.data['headings'] = assignHeadingIds(root);
    literalCode(root);
  };
}
