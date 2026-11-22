<script lang="ts">
  import SeoHead from '../SeoHead.svelte';
  import { serializeJsonLd } from '../../../../../shared/public-site';
  import { SITE_ORIGIN, SOCIAL_CARD } from '../../../../../shared/public-site';
  import type { DocsTopic } from '../../docs/topic';
  import { DOCS_TOPICS, docsTopicHref, docsSourceHref } from '../../docs/topics';
  import DocsBlocks from './DocsBlocks.svelte';
  import DocsReader from './DocsReader.svelte';
  import DocsOutline from './DocsOutline.svelte';
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
          image: `${SITE_ORIGIN}${SOCIAL_CARD.path}`,
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
    <div class="doc-main">
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
          <span>v0.1.224</span>
          <span aria-hidden="true">&middot;</span>
          <span
            >reviewed <time datetime={topic.source.reviewedAt}>{topic.source.reviewedAt}</time
            ></span
          >
          <span aria-hidden="true">&middot;</span>
          <a href={sourceHref} target="_blank" rel="noopener noreferrer">{shortCommit} &#8599;</a>
        </p>
        <DocActions markdownHref={`/markdown/docs/${topic.slug}/`} {sourceHref} />
      </header>
      <div class="inline-outline">
        <DocsOutline
          variant="inline"
          headings={topic.sections.map(section => ({ id: section.id, title: section.heading }))}
        />
      </div>
      {#each topic.sections as section (section.id)}
        <section id={section.id} class="topic-section">
          <h2 aria-label={section.heading}>
            {section.heading}<a
              class="heading-link"
              href={`#${section.id}`}
              aria-label={`Link to ${section.heading}`}>#</a
            >
          </h2>
          {#each section.blocks as block (block)}<DocsBlocks {block} />{/each}
        </section>
      {/each}
      <footer class="topic-provenance">
        <p>
          Source-reviewed against <a href={sourceHref} target="_blank" rel="noopener noreferrer"
            >{topic.source.repo}/{topic.source.path}</a
          >
          (<code>{shortCommit}</code>); examples are not executed on every host.
        </p>
      </footer>
      <nav class="continue-reading" aria-label="Continue reading">
        {#if previous}<a href={docsTopicHref(previous.slug)}
            ><span class="dir">&larr; Previous</span>{previous.navLabel}</a
          >{/if}{#if next}<a class="next" href={docsTopicHref(next.slug)}
            ><span class="dir">Next &rarr;</span>{next.navLabel}</a
          >{/if}
      </nav>
    </div>
    <div class="desktop-outline">
      <DocsOutline
        variant="rail"
        headings={topic.sections.map(section => ({ id: section.id, title: section.heading }))}
      />
    </div>
  </article>
</DocsReader>

<style>
  .topic-article {
    min-width: 0;
  }
  .doc-main {
    min-width: 0;
    max-width: 44rem;
  }
  .inline-outline {
    display: contents;
  }
  .desktop-outline {
    display: none;
  }
  @media (min-width: 72rem) {
    .topic-article {
      display: grid;
      grid-template-columns: minmax(0, 44rem) minmax(11rem, 13.5rem);
      column-gap: 3rem;
      align-items: start;
    }
    .inline-outline {
      display: none;
    }
    .desktop-outline {
      display: block;
      position: sticky;
      top: 2rem;
    }
  }
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
    padding-top: 1.5rem;
  }
  h1 {
    margin: 0;
    font-size: var(--page-title);
    font-weight: 700;
    letter-spacing: -0.035em;
    line-height: 1.1;
    text-wrap: balance;
  }
  .topic-summary {
    max-width: 62ch;
    margin: 1rem 0 0.85rem;
    color: var(--ink-body);
    font-size: 1.0625rem;
    line-height: 1.65;
    overflow-wrap: break-word;
  }
  .applicability {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.45rem;
    margin: 0 0 0.75rem;
    color: var(--ink-muted);
    font-family: var(--font-mono);
    font-size: 0.75rem;
  }
  .applicability a {
    color: var(--ink-muted);
    text-decoration: none;
  }
  .topic-section {
    margin-top: 2.75rem;
    padding-top: 0.5rem;
    scroll-margin-top: 3.5rem;
  }
  .topic-section h2 {
    margin: 0;
    color: var(--ink);
    font-size: 1.5rem;
    font-weight: 600;
    letter-spacing: -0.015em;
    line-height: 1.25;
    text-wrap: balance;
  }
  .topic-provenance {
    margin-top: 3rem;
    padding-top: 1.25rem;
    border-top: 1px solid var(--rule);
    color: var(--ink-muted);
    font-size: 0.75rem;
    line-height: 1.7;
    overflow-wrap: break-word;
  }
  .continue-reading {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 1rem;
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--rule);
  }
  .continue-reading a {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    min-height: 2.75rem;
    font-size: 0.875rem;
    font-weight: 600;
    text-decoration: none;
  }
  .continue-reading .dir {
    color: var(--ink-muted);
    font-family: var(--font-mono);
    font-size: 0.75rem;
    font-weight: 400;
  }
  .continue-reading .next {
    margin-left: auto;
    text-align: right;
  }
  a:hover {
    color: var(--signal);
  }
</style>
