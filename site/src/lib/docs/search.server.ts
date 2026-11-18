import MiniSearch from 'minisearch';
import { markdownSections } from './headings';
import { documentationEntries, type DocumentationEntry } from './documentation.server';

interface SearchSection {
  readonly id: string;
  readonly title: string;
  readonly heading: string;
  readonly category: string;
  readonly href: string;
  readonly body: string;
  readonly leadCommand: string | undefined;
}

function plainText(markdown: string): string {
  return markdown
    .replace(/```[^\n]*\n/gu, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/gu, '$1')
    .replace(/[`#|>*_]/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim();
}

function sections(entry: DocumentationEntry): SearchSection[] {
  const occurrences = new Map<string, number>();
  return markdownSections(entry.markdown).flatMap((block, index) => {
    const heading = block.title ?? entry.title;
    const occurrence = occurrences.get(heading) ?? 0;
    const section =
      block.title === null
        ? undefined
        : entry.sections.filter(item => item.title === heading)[occurrence];
    if (block.title !== null) occurrences.set(heading, occurrence + 1);
    if (block.title !== null && !section) return [];
    return [
      {
        id: `${entry.href}:${index}`,
        title: entry.title,
        heading,
        category: entry.category,
        href: section ? `${entry.href}#${section.id}` : entry.href,
        body: section ? plainText(block.body) : entry.description,
        leadCommand: block.leadCommand,
      },
    ];
  });
}

interface DocumentationSearchResult {
  readonly title: string;
  readonly heading: string;
  readonly category: string;
  readonly href: string;
  readonly excerpt: string;
}

export function createDocumentationSearch(entries: readonly DocumentationEntry[]) {
  const documents = entries.flatMap(sections);
  const byId = new Map(documents.map(document => [document.id, document]));
  const index = new MiniSearch<SearchSection>({
    fields: ['title', 'heading', 'body'],
    searchOptions: {
      boost: { title: 3, heading: 2 },
      prefix: true,
      fuzzy: 0.15,
      combineWith: 'AND',
    },
  });
  index.addAll(documents);
  return (query: string) => {
    const phrase = query.trim().toLowerCase().replace(/\s+/gu, ' ');
    const firstWord = phrase.split(' ')[0] ?? '';
    const matches = index.search(phrase).flatMap(match => {
      const document = byId.get(String(match.id));
      if (document === undefined) return [];
      const body = document.body.toLowerCase();
      const exact = body.indexOf(phrase);
      const leads = document.leadCommand === phrase || document.leadCommand === `omg ${phrase}`;
      return [
        {
          document,
          position: exact >= 0 ? exact : body.indexOf(firstWord),
          leads,
          exact: exact >= 0,
        },
      ];
    });
    if (/\s|^--/u.test(phrase)) {
      matches.sort(
        (a, b) => Number(b.leads) - Number(a.leads) || Number(b.exact) - Number(a.exact)
      );
    }
    const results = matches.slice(0, 20).map(({ document, position }) => {
      const start = Math.max(0, position - 65);
      const excerpt = `${start > 0 ? '…' : ''}${document.body.slice(start, start + 230)}${document.body.length > start + 230 ? '…' : ''}`;
      return {
        title: document.title,
        heading: document.heading,
        category: document.category,
        href: document.href,
        excerpt,
      } satisfies DocumentationSearchResult;
    });
    return { total: matches.length, results };
  };
}

let pending: Promise<ReturnType<typeof createDocumentationSearch>> | undefined;

export async function searchDocumentation(query: string) {
  const normalized = query.trim();
  if (normalized.length < 2) return { query: normalized, total: 0, results: [] };
  if (normalized.length > 160) throw new Error('Search queries must be 160 characters or fewer');
  pending ??= documentationEntries()
    .then(createDocumentationSearch)
    .catch(error => {
      pending = undefined;
      throw error;
    });
  const search = await pending;
  return { query: normalized, ...search(normalized) };
}
