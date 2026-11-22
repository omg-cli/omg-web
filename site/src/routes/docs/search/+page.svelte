<script lang="ts">
  import SeoHead from '../../../lib/components/SeoHead.svelte';
  import DocsReader from '../../../lib/components/docs/DocsReader.svelte';
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();
</script>

<SeoHead
  title="Search documentation - OMG"
  description="Search OMG commands, language guides, configuration, and troubleshooting."
  path="/docs/search/"
  robots="noindex, follow"
/>
<DocsReader query={data.query}>
  <section class="search-page">
    <h1>Search documentation</h1>
    <p class="intro">Find a command, option, or task across the handbook and guides.</p>
    <p class="search-status" role="status">
      {data.message ||
        `${data.total} matching sections${data.total > 20 ? ' · Showing the first 20' : ''}`}
    </p>
    {#if data.query.length >= 2 && !data.message && data.total === 0}
      <p>
        No matches for “{data.query}”. Try a command name such as <code>env capture</code>, a
        language, or an option such as <code>fail-on-findings</code>.
      </p>
      <a href="/docs/">Browse all documentation</a>
    {/if}
    <ol class="search-results">
      {#each data.results as result (result.href + result.heading)}
        <li>
          <a href={result.href}
            ><span class="result-page">{result.category} · {result.title}</span>
            <h2>{result.heading}</h2>
            <p>{result.excerpt}</p></a
          >
        </li>
      {/each}
    </ol>
    <p class="machine-link">
      For tools and agents: <a href={`/docs/search.json?q=${encodeURIComponent(data.query)}`}
        >JSON results</a
      >
      · <a href="/docs/manifest.json">Documentation manifest</a>
    </p>
  </section>
</DocsReader>

<style>
  .search-page {
    max-width: 44rem;
  }
  h1 {
    margin: 0;
    font-size: var(--page-title);
    font-weight: 700;
    letter-spacing: -0.035em;
    line-height: 1.1;
  }
  .intro {
    max-width: 60ch;
    margin: 1rem 0 1.75rem;
    color: var(--ink-body);
    font-size: 1rem;
    line-height: 1.65;
  }
  .search-status {
    margin-block: 1.25rem;
    color: var(--ink-muted);
    font-family: var(--font-mono);
    font-size: 0.75rem;
  }
  .search-results {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  li {
    border-top: 1px solid var(--rule);
  }
  li a {
    display: block;
    padding-block: 1.35rem;
    text-decoration: none;
  }
  .result-page {
    color: var(--ink-muted);
    font-family: var(--font-mono);
    font-size: 0.75rem;
  }
  h2 {
    margin: 0.4rem 0;
    color: var(--ink);
    font-size: 1.125rem;
    font-weight: 600;
    letter-spacing: -0.015em;
  }
  li p {
    margin: 0;
    color: var(--ink-body);
    font-size: 0.875rem;
    line-height: 1.65;
    overflow-wrap: break-word;
  }
  li a:hover h2,
  a:hover {
    color: var(--signal);
  }
  .machine-link {
    margin-top: 2rem;
    color: var(--ink-muted);
    font-family: var(--font-mono);
    font-size: 0.75rem;
    line-height: 1.8;
  }
  code {
    padding: 0.1em 0.35em;
    border: 1px solid var(--rule);
    border-radius: 4px;
    background: var(--paper-raised);
    color: var(--ink);
    font-family: var(--font-mono);
    font-size: 0.84em;
  }
</style>
