import sourceReview from './source-review.json';
import { SITE_ORIGIN } from '../../../../shared/public-site';
import type { DocsDiagram } from './diagram';
import type { DocsBlock, DocsTopic } from './topic';
import { docsSourceHref, docsTopicHref } from './topics';

function codeBlock(lines: readonly string[], language = 'sh'): string {
  return `\`\`\`${language}\n${lines.join('\n')}\n\`\`\``;
}

function row(cells: readonly string[]): string {
  return `| ${cells.map(cell => cell.replaceAll('|', '\\|').replaceAll('\n', ' ')).join(' | ')} |`;
}

/** Text rendering of one figure: the box list, then every connection in words. */
function diagramMarkdown(diagram: DocsDiagram): string {
  const labels = new Map(diagram.nodes.map(node => [node.id, node.label]));
  const rows = [
    row(['Step', 'Detail']),
    row(['---', '---']),
    ...diagram.nodes.map(node => row([node.label, node.detail ?? ''])),
  ].join('\n');
  const connections = diagram.edges
    .map(edge => {
      const from = labels.get(edge.from) ?? edge.from;
      const to = labels.get(edge.to) ?? edge.to;
      return edge.label === undefined ? `${from} to ${to}` : `${from} to ${to} (${edge.label})`;
    })
    .join('; ');
  const caption = diagram.caption === undefined ? '' : `\n\n${diagram.caption}`;
  return `### ${diagram.title}${caption}\n\n${rows}\n\nConnections: ${connections}.`;
}

export function blockMarkdown(block: DocsBlock): string {
  switch (block.kind) {
    case 'paragraphs':
      return block.paragraphs.join('\n\n');
    case 'commands':
      return `### ${block.title}\n\n${codeBlock(block.commands, block.language)}`;
    case 'bullets':
      return block.items.map(item => `- ${item}`).join('\n');
    case 'note':
      return `> ${block.text}`;
    case 'diagram':
      return diagramMarkdown(block.diagram);
    case 'steps':
      return block.steps
        .map(
          (step, index) =>
            `${index + 1}. ${step.text}${
              step.command
                ? `\n\n${codeBlock([step.command])
                    .split('\n')
                    .map(line => `   ${line}`)
                    .join('\n')}`
                : ''
            }`
        )
        .join('\n\n');
    case 'table': {
      return `### ${block.title}\n\n${[row(block.columns), row(block.columns.map(() => '---')), ...block.rows.map(row)].join('\n')}`;
    }
  }
}

export function topicMarkdown(topic: DocsTopic): string {
  return [
    `# ${topic.title}`,
    topic.summary,
    `Canonical: ${SITE_ORIGIN}${docsTopicHref(topic.slug)}\nRelease baseline: v0.1.224\nReviewed: ${topic.source.reviewedAt}`,
    ...topic.sections.map(
      section => `## ${section.heading}\n\n${section.blocks.map(blockMarkdown).join('\n\n')}`
    ),
    '## Source and applicability',
    'Source-reviewed documentation, not a claim that every command was executed on every supported platform. Development-only behavior is explicitly identified in the text.',
    `- [${topic.source.repo}/${topic.source.path}](${docsSourceHref(topic.source)})`,
    ...(sourceReview.topics.find(item => item.slug === topic.slug)?.implementationPaths ?? []).map(
      path =>
        `- [${topic.source.repo}/${path}](https://github.com/${topic.source.repo}/blob/${topic.source.reviewedCommit}/${path})`
    ),
    `- Reviewed source commit: ${topic.source.reviewedCommit}`,
    '',
  ].join('\n\n');
}
