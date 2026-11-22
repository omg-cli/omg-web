<script lang="ts">
  import { onMount } from 'svelte';
  import { serializeJsonLd, SITE_ORIGIN } from '../../../../../shared/public-site';
  import {
    LEARNING_CATEGORIES,
    LEARNING_PAGES,
    learningHref,
    type LearningPageMeta,
  } from '../../learn/catalog';
  import type { LearningContent } from '../../learn/page';
  import { LatestReleaseView } from '../../latest-release.svelte';
  import DocsBlocks from '../docs/DocsBlocks.svelte';
  import SeoHead from '../SeoHead.svelte';
  import DocsReader from '../docs/DocsReader.svelte';
  import DocsOutline from '../docs/DocsOutline.svelte';
  import DocActions from '../docs/DocActions.svelte';

  let { meta, content }: { meta: LearningPageMeta; content: LearningContent } = $props();
  const latestRelease = new LatestReleaseView();

  onMount(() => {
    if (meta.slug !== 'omg-vs-mise') return;
    latestRelease.load();
  });
  const path = $derived(learningHref(meta));
  const section = $derived(LEARNING_CATEGORIES[meta.category]);
  const related = $derived(
    content.related.map(href => ({
      href,
      title:
        LEARNING_PAGES.find(page => learningHref(page) === href)?.title ??
        (href.startsWith('/docs/') ? 'OMG ' + href.split('/')[2] + ' reference' : href),
    }))
  );
  const structuredData = $derived(
    serializeJsonLd({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_ORIGIN}/` },
            {
              '@type': 'ListItem',
              position: 2,
              name: section.title,
              item: `${SITE_ORIGIN}/${meta.category}/`,
            },
            { '@type': 'ListItem', position: 3, name: meta.title, item: `${SITE_ORIGIN}${path}` },
          ],
        },
        {
          '@type': 'TechArticle',
          headline: meta.title,
          description: meta.description,
          url: `${SITE_ORIGIN}${path}`,
          dateModified: meta.modified,
          author: {
            '@type': 'Organization',
            name: 'OMG maintainers',
            url: 'https://github.com/omg-cli/omg',
          },
          mainEntityOfPage: `${SITE_ORIGIN}${path}`,
        },
      ],
    })
  );
</script>

<SeoHead
  title={`${meta.title} - OMG`}
  description={meta.description}
  {path}
  type="article"
  modifiedTime={meta.modified}
  {structuredData}
  markdownPath={`/markdown/${meta.category}/${meta.slug}/`}
/>
<DocsReader>
  <div class="learning-article" data-doc-content>
    <div class="doc-main">
      <nav class="breadcrumbs" aria-label="Breadcrumb">
        <a href="/">Home</a><span aria-hidden="true">/</span><a href={`/${meta.category}/`}
          >{section.title}</a
        >
      </nav>
      <header>
        <h1>{meta.title}</h1>
        <p class="summary">{meta.description}</p>
        <p class="byline">
          <span>OMG maintainers</span>
          <span aria-hidden="true">&middot;</span>
          <span>updated <time datetime={meta.modified}>{meta.modified}</time></span>
        </p>
        <DocActions markdownHref={`/markdown/${meta.category}/${meta.slug}/`} />
        {#if meta.slug === 'omg-vs-mise' && latestRelease.version}
          <p class="byline">
            Current download: {latestRelease.version} ·
            <a href="https://releases.omg.latham.cloud/latest-version">Cloudflare release marker</a>
          </p>
        {/if}
      </header>
      <div class="inline-outline">
        <DocsOutline
          variant="inline"
          headings={content.sections.map(entry => ({ id: entry.id, title: entry.heading }))}
        />
      </div>
      <article>
        {#each content.sections as entry (entry.id)}
          <section id={entry.id}>
            <h2>{entry.heading}</h2>
            {#each entry.blocks as block (block)}<DocsBlocks {block} />{/each}
          </section>
        {/each}
        <section id="sources">
          <h2>Sources and verification</h2>
          <p>
            Commands and behavior are based on the references below; examples are source-reviewed
            rather than executed on every host.
          </p>
          <ul>
            {#each content.sources as source (source.href)}<li>
                <a href={source.href}>{source.title}</a>
              </li>{/each}
          </ul>
          <a class="install-cta" href="/docs/installation/">Install OMG &rarr;</a>
        </section>
        <nav class="related" aria-label="Related guides">
          <h2>Continue learning</h2>
          <ul>
            {#each related as entry (entry.href)}<li>
                <a href={entry.href}>{entry.title}</a>
              </li>{/each}
          </ul>
        </nav>
      </article>
    </div>
    <div class="desktop-outline">
      <DocsOutline
        variant="rail"
        headings={content.sections.map(entry => ({ id: entry.id, title: entry.heading }))}
      />
    </div>
  </div>
</DocsReader>

<style>
  .learning-article {
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
    .learning-article {
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
  .breadcrumbs {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
    color: var(--ink-muted);
    font-size: 0.75rem;
  }
  .breadcrumbs a {
    text-decoration: none;
  }
  .breadcrumbs a:hover,
  a:hover {
    color: var(--signal);
  }
  header {
    padding-block: 1.5rem 1.75rem;
  }
  h1 {
    max-width: 24ch;
    margin: 0;
    font-size: var(--page-title);
    font-weight: 700;
    line-height: 1.1;
    letter-spacing: -0.035em;
    overflow-wrap: break-word;
  }
  .summary {
    max-width: 62ch;
    margin: 1rem 0 0.85rem;
    color: var(--ink-body);
    font-size: 1.0625rem;
    line-height: 1.65;
  }
  .byline {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
    margin: 0 0 0.75rem;
    color: var(--ink-muted);
    font-family: var(--font-mono);
    font-size: 0.75rem;
    line-height: 1.6;
  }
  article {
    min-width: 0;
    line-height: 1.75;
  }
  section {
    margin-bottom: 2.75rem;
    scroll-margin-top: 3.5rem;
  }
  h2 {
    margin: 0 0 0.85rem;
    color: var(--ink);
    font-size: 1.5rem;
    font-weight: 600;
    line-height: 1.25;
    letter-spacing: -0.015em;
  }
  #sources {
    padding-top: 1.5rem;
    border-top: 1px solid var(--rule);
  }
  #sources p {
    color: var(--ink-body);
    font-size: 0.9375rem;
  }
  .install-cta {
    display: inline-flex;
    align-items: center;
    min-height: 2.75rem;
    margin-top: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    text-decoration: none;
  }
  li {
    margin-block: 0.5rem;
  }
  .related {
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--rule);
  }
  .related h2 {
    margin-top: 0;
    font-size: 1.125rem;
  }
</style>
