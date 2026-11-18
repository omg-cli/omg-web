import { LEARNING_CATEGORIES, LEARNING_PAGES, learningHref } from '../../lib/learn/catalog';
import { MARKDOWN_DOCUMENTS } from '../../lib/docs/markdown-documents.server';
import type { EntryGenerator, PageServerLoad } from './$types';

export const prerender = true;
export const entries: EntryGenerator = () =>
  Array.from(new Set(LEARNING_PAGES.map(page => page.category)), category => ({ category }));

export const load: PageServerLoad = ({ params }) => {
  const category = params.category;
  const metadata = LEARNING_CATEGORIES[category];
  return {
    category,
    ...metadata,
    pages: [
      ...LEARNING_PAGES.filter(page => page.category === category).map(page => ({
        ...page,
        href: learningHref(page),
      })),
      ...MARKDOWN_DOCUMENTS.filter(page => page.href.startsWith(`/${category}/`)).map(page => ({
        slug: page.href,
        title: page.metadata.title,
        description: page.metadata.description,
        modified: page.metadata.source.reviewedAt,
        href: page.href,
      })),
    ],
  };
};
