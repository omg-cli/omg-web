import { Data, Effect } from 'effect';
import { SITE_ORIGIN } from '../../../../shared/public-site';
import { DOCS_TOPICS, docsSourceHref, docsTopicHref } from './topics';
import sourceReview from './source-review.json';
import type { DocsTopic } from './topic';
import { topicMarkdown } from './markdown';
import { MARKDOWN_DOCUMENTS } from './markdown-documents.server';
import { LEARNING_PAGES, learningHref } from '../learn/catalog';
import { loadLearningPage } from '../learn/content.server';
import { learningMarkdown } from '../learn/markdown';

const topicLoaders = {
  installation: () => import('./content/installation').then(module => module.installationTopic),
  cli: () => import('./content/cli').then(module => module.cliTopic),
  configuration: () => import('./content/configuration').then(module => module.configurationTopic),
  runtimes: () => import('./content/runtimes').then(module => module.runtimesTopic),
  workflows: () => import('./content/workflows').then(module => module.workflowsTopic),
  security: () => import('./content/security').then(module => module.securityTopic),
  troubleshooting: () =>
    import('./content/troubleshooting').then(module => module.troubleshootingTopic),
  architecture: () => import('./content/architecture').then(module => module.architectureTopic),
};

export interface DocumentationEntry {
  readonly href: string;
  readonly markdownHref: string;
  readonly title: string;
  readonly description: string;
  readonly category: string;
  readonly updated: string;
  readonly release: string | null;
  readonly sources: readonly { readonly title: string; readonly href: string }[];
  readonly sections: readonly { readonly id: string; readonly title: string }[];
  readonly markdown: string;
}

function fromTopic(topic: DocsTopic): DocumentationEntry {
  return {
    href: docsTopicHref(topic.slug),
    markdownHref: `/markdown/docs/${topic.slug}/`,
    title: topic.title,
    description: topic.summary,
    category: 'Handbook',
    updated: topic.source.reviewedAt,
    release: 'v0.1.224',
    sources: [
      { title: `${topic.source.repo}/${topic.source.path}`, href: docsSourceHref(topic.source) },
      ...(
        sourceReview.topics.find(item => item.slug === topic.slug)?.implementationPaths ?? []
      ).map(path => ({
        title: `${topic.source.repo}/${path}`,
        href: `https://github.com/${topic.source.repo}/blob/${topic.source.reviewedCommit}/${path}`,
      })),
    ],
    sections: topic.sections.map(section => ({ id: section.id, title: section.heading })),
    markdown: topicMarkdown(topic),
  };
}

class DocumentationLoadError extends Data.TaggedError('DocumentationLoadError')<{
  readonly cause: unknown;
}> {}

let pending: Promise<readonly DocumentationEntry[]> | undefined;

export function documentationEntries(): Promise<readonly DocumentationEntry[]> {
  pending ??= Effect.runPromise(
    Effect.tryPromise({ try: loadEntries, catch: cause => new DocumentationLoadError({ cause }) })
  ).catch(error => {
    pending = undefined;
    throw error;
  });
  return pending;
}

async function loadEntries(): Promise<readonly DocumentationEntry[]> {
  const topics = await Promise.all(DOCS_TOPICS.map(topic => topicLoaders[topic.slug]()));
  const guides = await Promise.all(
    LEARNING_PAGES.map(async meta => {
      const page = await loadLearningPage(meta.category, meta.slug);
      if (page === undefined) throw new Error(`Missing documentation: ${meta.slug}`);
      return {
        href: learningHref(meta),
        markdownHref: `/markdown/${meta.category}/${meta.slug}/`,
        title: meta.title,
        description: meta.description,
        category:
          meta.category === 'compare'
            ? 'Comparisons'
            : meta.category === 'runtimes'
              ? 'Runtime guides'
              : 'Guides',
        updated: meta.modified,
        release: null,
        sources: page.content.sources,
        sections: page.content.sections.map(section => ({
          id: section.id,
          title: section.heading,
        })),
        markdown: learningMarkdown(meta, page.content),
      } satisfies DocumentationEntry;
    })
  );
  const authored = MARKDOWN_DOCUMENTS.map(document => {
    const metadata = document.metadata;
    const sources = [metadata.source.path, ...metadata.implementation].map(path => ({
      title: `${metadata.source.repo}/${path}`,
      href: `https://github.com/${metadata.source.repo}/blob/${metadata.source.reviewedCommit}/${path}`,
    }));
    return {
      href: document.href,
      markdownHref: `/markdown${document.href}`,
      title: metadata.title,
      description: metadata.description,
      category: metadata.section === 'Runtimes' ? 'Runtime guides' : 'Guides',
      updated: metadata.source.reviewedAt,
      release: metadata.release,
      sources,
      sections: document.headings
        .filter(heading => heading.depth === 2)
        .map(heading => ({ id: heading.id, title: heading.title })),
      markdown: [
        `# ${metadata.title}`,
        metadata.description,
        `Canonical: ${SITE_ORIGIN}${document.href}\nRelease baseline: ${metadata.release}\nReviewed: ${metadata.source.reviewedAt}`,
        document.body,
        '## Sources and verification',
        'Reviewed against immutable release source. Examples are not a claim of execution on every host.',
        ...sources.map(source => `- [${source.title}](${source.href})`),
        '',
      ].join('\n\n'),
    } satisfies DocumentationEntry;
  });
  const entries = [...topics.map(fromTopic), ...authored, ...guides];
  if (new Set(entries.map(entry => entry.href)).size !== entries.length)
    throw new Error('Duplicate documentation URL');
  return entries;
}

export function documentationNavigation() {
  return [
    ...MARKDOWN_DOCUMENTS.filter(document => document.href.startsWith('/docs/')).map(document => ({
      href: document.href,
      label: document.metadata.navLabel,
      title: document.metadata.title,
      section: document.metadata.section,
    })),
    ...DOCS_TOPICS.map(topic => ({
      href: docsTopicHref(topic.slug),
      label: topic.navLabel,
      title: topic.title,
      section: 'Reference',
    })),
    ...LEARNING_PAGES.filter(page => page.category === 'runtimes').map(page => ({
      href: learningHref(page),
      label: page.title.replace(/^Manage /u, '').replace(/ versions with OMG$/u, ''),
      title: page.title,
      section: 'Runtimes',
    })),
    ...MARKDOWN_DOCUMENTS.filter(document => document.metadata.section === 'Runtimes').map(
      document => ({
        href: document.href,
        label: document.metadata.navLabel,
        title: document.metadata.title,
        section: 'Runtimes',
      })
    ),
  ];
}

export function agentResponse(
  body: string,
  contentType = 'text/markdown; charset=utf-8'
): Response {
  return new Response(body, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=0, must-revalidate',
      'X-Robots-Tag': 'noindex',
      'Content-Signal': 'search=yes, ai-train=no',
    },
  });
}
