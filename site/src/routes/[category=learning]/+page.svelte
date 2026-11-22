<script lang="ts">
  import Icon from '../../lib/components/Icon.svelte';
  import SeoHead from '../../lib/components/SeoHead.svelte';
  import { SITE_ORIGIN, serializeJsonLd } from '../../../../shared/public-site';
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();

  const canonical = $derived(`${SITE_ORIGIN}/${data.category}/`);

  /**
   * The newest authored date in this category. Categories are generated from the
   * pages themselves, so a category always has at least one page; the epoch seed
   * only guarantees the reduction has a comparable starting value.
   */
  const latestModified = $derived(
    data.pages.reduce(
      (latest, page) => (page.modified > latest ? page.modified : latest),
      '1970-01-01'
    )
  );

  const structuredData = $derived(
    serializeJsonLd({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'CollectionPage',
          '@id': `${canonical}#page`,
          url: canonical,
          name: data.title,
          description: data.description,
          isPartOf: { '@id': `${SITE_ORIGIN}/#website` },
          publisher: { '@id': `${SITE_ORIGIN}/#org` },
          dateModified: latestModified,
          mainEntity: {
            '@type': 'ItemList',
            numberOfItems: data.pages.length,
            itemListElement: data.pages.map((page, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: page.title,
              description: page.description,
              url: `${SITE_ORIGIN}${page.href}`,
            })),
          },
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_ORIGIN}/` },
            { '@type': 'ListItem', position: 2, name: data.title, item: canonical },
          ],
        },
      ],
    })
  );
</script>

<SeoHead
  title={`${data.title} - OMG`}
  description={data.description}
  path={`/${data.category}/`}
  {structuredData}
  modifiedTime={latestModified}
/>
<main id="main-content" class="learning-index">
  <h1>{data.title}</h1>
  <p class="introduction">{data.description}</p>
  <nav aria-label="Learning sections">
    <a href="/runtimes/" aria-current={data.category === 'runtimes' ? 'page' : undefined}
      >Runtimes</a
    ><a href="/guides/" aria-current={data.category === 'guides' ? 'page' : undefined}>Guides</a><a
      href="/compare/"
      aria-current={data.category === 'compare' ? 'page' : undefined}>Comparisons</a
    ><a href="/docs/">Reference</a>
  </nav>
  <ul>
    {#each data.pages as entry (entry.slug)}
      <li>
        <a href={entry.href}
          ><h2>{entry.title}</h2>
          <p>{entry.description}</p>
          <span class="row-arrow" aria-hidden="true"><Icon name="right" size={16} /></span></a
        >
      </li>
    {/each}
  </ul>
</main>

<style>
  .learning-index {
    width: var(--site-width);
    margin-inline: auto;
    padding-block: clamp(3rem, 7vw, 6rem);
  }
  h1 {
    max-width: 18ch;
    font-size: var(--page-title);
    line-height: 1.08;
    letter-spacing: -0.035em;
  }
  .introduction {
    max-width: 45rem;
    color: var(--ink-body);
    font-size: 1.0625rem;
    line-height: 1.65;
  }
  nav {
    display: flex;
    flex-wrap: wrap;
    gap: 1.5rem;
    margin-block: 2rem 3rem;
  }
  nav a {
    display: inline-flex;
    align-items: center;
    min-height: 2.75rem;
    color: var(--ink-muted);
    text-decoration: none;
    border-bottom: 2px solid transparent;
    font-size: 0.875rem;
  }
  nav a:hover,
  nav a[aria-current='page'] {
    color: var(--signal);
    border-bottom-color: var(--signal);
  }
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  li {
    border-top: 1px solid var(--rule);
  }
  li:last-child {
    border-bottom: 1px solid var(--rule);
  }
  li a {
    display: grid;
    grid-template-columns: 1fr 1.25fr auto;
    gap: 1.5rem;
    align-items: baseline;
    padding: 1.5rem 0;
    text-decoration: none;
  }
  li a:hover h2,
  li a:hover .row-arrow {
    color: var(--signal);
  }
  h2 {
    margin: 0;
    color: var(--ink);
    font-size: 1.0625rem;
    font-weight: 600;
    letter-spacing: -0.015em;
  }
  li p {
    margin: 0;
    color: var(--ink-body);
    font-size: 0.875rem;
    line-height: 1.65;
  }
  .row-arrow {
    display: inline-flex;
    align-items: center;
    color: var(--ink-muted);
  }
  @media (max-width: 55rem) {
    li a {
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 0.4rem 1rem;
    }
    li p {
      grid-column: 1;
    }
    .row-arrow {
      grid-column: 2;
      grid-row: 1 / span 2;
      align-self: center;
    }
  }
</style>
