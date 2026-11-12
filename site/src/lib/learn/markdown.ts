import { SITE_ORIGIN } from '../../../../shared/public-site';
import { blockMarkdown } from '../docs/markdown';
import { learningHref, type LearningPageMeta } from './catalog';
import type { LearningContent } from './page';

export function learningMarkdown(meta: LearningPageMeta, content: LearningContent): string {
  return [
    `# ${meta.title}`,
    meta.description,
    `Canonical: ${SITE_ORIGIN}${learningHref(meta)}\nUpdated: ${meta.modified}\nAuthor: OMG maintainers`,
    ...content.sections.map(
      section => `## ${section.heading}\n\n${section.blocks.map(blockMarkdown).join('\n\n')}`
    ),
    '## Sources and verification',
    'Source-reviewed guidance; not a claim of execution on every supported platform.',
    ...content.sources.map(
      source =>
        `- [${source.title}](${source.href.startsWith('/') ? `${SITE_ORIGIN}${source.href}` : source.href})`
    ),
    '## Related pages',
    ...content.related.map(href => `- ${href.startsWith('/') ? `${SITE_ORIGIN}${href}` : href}`),
    '',
  ].join('\n\n');
}
