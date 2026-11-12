<script lang="ts">
  import SeoHead from '../SeoHead.svelte';
  import { serializeJsonLd } from '../../../../../shared/public-site';
  import { SITE_ORIGIN } from '../../../../../shared/public-site';
  import type { DocsTopic } from '../../docs/topic';
  import { DOCS_TOPICS, docsTopicHref, docsSourceHref } from '../../docs/topics';
  import DocsBlocks from './DocsBlocks.svelte';
  import DocsReader from './DocsReader.svelte';
  import DocActions from './DocActions.svelte';

  let { topic }: { topic: DocsTopic } = $props();

  const position = $derived(DOCS_TOPICS.findIndex(entry => entry.slug === topic.slug));
  const previous = $derived(position > 0 ? DOCS_TOPICS[position - 1] : undefined);
  const next = $derived(DOCS_TOPICS[position + 1]);

  const canonical = $derived(`${SITE_ORIGIN}/docs/${topic.slug}/`);
  const pageTitle = $derived(`${topic.title} - OMG Package Manager`);
  const sourceHref = $derived(docsSourceHref(topic.source));
  const shortCommit = $derived(topic.source.reviewedCommit.slice(0, 7));

  const structuredData = $derived(
    serializeJsonLd({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_ORIGIN}/` },
            { '@type': 'ListItem', position: 2, name: 'Docs', item: `${SITE_ORIGIN}/docs/` },
            { '@type': 'ListItem', position: 3, name: topic.navLabel, item: canonical },
          ],
        },
        {
          '@type': 'TechArticle',
          headline: topic.title,
          description: topic.summary,
          url: canonical,
          mainEntityOfPage: canonical,
          dateModified: topic.source.reviewedAt,
          image: `${SITE_ORIGIN}/og/omg-og.png`,
          author: {
            '@type': 'Organization',
            name: 'OMG maintainers',
            url: 'https://github.com/omg-cli/omg',
          },
          publisher: { '@id': `${SITE_ORIGIN}/#org` },
        },
      ],
    })
  );
</script>

<SeoHead
  title={pageTitle}
  description={topic.summary}
  path={`/docs/${topic.slug}/`}
  type="article"
  modifiedTime={topic.source.reviewedAt}
  {structuredData}
  markdownPath={`/markdown/docs/${topic.slug}/`}
/>

<DocsReader>
  <article class="topic-article" data-doc-content>
    <nav class="breadcrumbs" aria-label="Breadcrumb">
      <ol>
        <li><a href="/">Home</a></li>
        <li><a href="/docs/">Docs</a></li>
        <li><span aria-current="page">{topic.navLabel}</span></li>
      </ol>
    </nav>
    <header class="topic-header">
      <h1>{topic.title}</h1>
      <p class="topic-summary">{topic.summary}</p>
      <p class="applicability">
        Release v0.1.224 · Reviewed <time datetime={topic.source.reviewedAt}
          >{topic.source.reviewedAt}</time
        >
      </p>
      <DocActions markdownHref={`/markdown/docs/${topic.slug}/`} {sourceHref} />
    </header>
    <details class="page-outline">
      <summary>On this page</summary>
      <ul>
        {#each topic.sections as section (section.id)}<li>
            <a href={`#${section.id}`}>{section.heading}</a>
          </li>{/each}
      </ul>
    </details>
    {#each topic.sections as section (section.id)}
      <section id={section.id} class="topic-section">
        <h2>{section.heading}</h2>
        {#each section.blocks as block}<DocsBlocks {block} />{/each}
      </section>
    {/each}
    <footer class="topic-provenance">
      <p>
        Reviewed against <a href={sourceHref} target="_blank" rel="noopener noreferrer"
          >{topic.source.repo}/{topic.source.path}</a
        >
        at commit {shortCommit} on {topic.source.reviewedAt}. This page was checked against the CLI
        code and documentation at that commit. Source review is not a claim of execution on every
        supported host.
      </p>
    </footer>
    <nav class="continue-reading" aria-label="Continue reading">
      {#if previous}<a href={docsTopicHref(previous.slug)}>Previous: {previous.navLabel}</a
        >{/if}{#if next}<a href={docsTopicHref(next.slug)}>Next: {next.navLabel}</a>{/if}
    </nav>
  </article>
</DocsReader>

<style>
  .breadcrumbs ol {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin: 0;
    padding: 0;
    list-style: none;
    color: var(--ink-muted);
    font-size: 0.75rem;
  }
  .breadcrumbs li + li::before {
    content: '/';
    margin-right: 0.5rem;
  }
  .breadcrumbs a {
    text-decoration: none;
  }
  .topic-header {
    padding-top: 1.75rem;
  }
  h1 {
    margin: 0;
    font-size: clamp(2rem, 4.5vw, 3.25rem);
    font-weight: 680;
    letter-spacing: -0.035em;
    line-height: 1.1;
    text-wrap: balance;
  }
  .topic-summary {
    max-width: 65ch;
    margin: 1rem 0;
    color: var(--ink-muted);
    font-size: 1rem;
    line-height: 1.75;
    overflow-wrap: anywhere;
  }
  .applicability {
    color: var(--ink-muted);
    font-size: 0.75rem;
  }
  .page-outline {
    margin-block: 1.5rem 2.5rem;
    padding-block: 0.75rem;
    border-block: 1px solid var(--rule);
  }
  summary {
    min-height: 2.75rem;
    padding-block: 0.65rem;
    cursor: pointer;
    font-size: 0.8125rem;
    font-weight: 600;
  }
  .page-outline ul {
    columns: 2;
    margin: 0.5rem 0;
    padding-left: 1.25rem;
  }
  .page-outline a {
    display: inline-flex;
    align-items: center;
    min-height: 2.75rem;
    padding-block: 0.4rem;
    font-size: 0.8125rem;
    text-decoration: none;
  }
  .topic-section {
    margin-top: 3rem;
    padding-top: 1rem;
    scroll-margin-top: 2rem;
  }
  .topic-section h2 {
    margin: 0;
    font-size: clamp(1.5rem, 3vw, 2rem);
    font-weight: 650;
    letter-spacing: -0.025em;
    line-height: 1.2;
    text-wrap: balance;
  }
  .topic-provenance {
    margin-top: 3rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--rule);
    color: var(--ink-muted);
    font-size: 0.75rem;
    line-height: 1.8;
    overflow-wrap: anywhere;
  }
  .continue-reading {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 1rem;
    margin-top: 2rem;
  }
  .continue-reading a {
    display: inline-flex;
    align-items: center;
    min-height: 2.75rem;
    font-size: 0.8125rem;
  }
  a:hover {
    color: var(--signal);
  }
  @media (max-width: 35rem) {
    .page-outline ul {
      columns: 1;
    }
  }
</style>
