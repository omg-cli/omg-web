import { SITE_ORIGIN } from '../../../../shared/public-site';
import { agentResponse, type DocumentationEntry } from './documentation.server';
import { markdownSections } from './headings';

// The rendered H2 order and public IDs come from the catalog. Parsing the export
// preserves the original Markdown, including code fences, tables and subheadings.
const sectionBodies = new WeakMap<DocumentationEntry, ReadonlyMap<string, string>>();

function sectionsFor(entry: DocumentationEntry): ReadonlyMap<string, string> {
  const cached = sectionBodies.get(entry);
  if (cached) return cached;
  const blocks = markdownSections(entry.markdown);
  const sections = new Map<string, string>();
  for (const [index, section] of entry.sections.entries()) {
    const block = blocks[index + 1];
    if (block?.title !== section.title)
      throw new Error(`Markdown heading mismatch at ${entry.href}#${section.id}`);
    sections.set(section.id, block.body.trimEnd());
  }
  sectionBodies.set(entry, sections);
  return sections;
}

export function markdownExport(entry: DocumentationEntry, sectionId: string | null): Response {
  if (sectionId === null) return agentResponse(entry.markdown);
  const body = sectionsFor(entry).get(sectionId);
  if (body === undefined)
    return agentResponse('Documentation section not found.\n', 'text/markdown; charset=utf-8', 404);
  const source = entry.sources[0];
  return agentResponse(
    [
      `# ${entry.title}`,
      [
        `Canonical: ${SITE_ORIGIN}${entry.href}#${encodeURIComponent(sectionId)}`,
        entry.release
          ? `Release baseline: ${entry.release}`
          : 'Release baseline: not pinned for this guide',
        `${entry.release ? 'Reviewed' : 'Updated'}: ${entry.updated}`,
      ].join('\n'),
      body,
      'Source-reviewed guidance. Examples were not executed on every supported platform.',
      ...(source
        ? [`Page source: [${source.title}](${new URL(source.href, SITE_ORIGIN).href})`]
        : []),
      '',
    ].join('\n\n')
  );
}

export function markdownResultHref(
  entries: readonly DocumentationEntry[],
  href: string
): string | undefined {
  const [path, id] = href.split('#');
  const entry = entries.find(item => item.href === path);
  if (!entry) return undefined;
  const url = new URL(entry.markdownHref, SITE_ORIGIN);
  if (id !== undefined) {
    if (!entry.sections.some(section => section.id === id)) return undefined;
    url.searchParams.set('section', id);
  }
  return url.href;
}
