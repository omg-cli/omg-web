<script lang="ts">
  import { page } from '$app/state';
  const navigation = $derived(page.data.documentationNavigation ?? []);
  const index = $derived(navigation.findIndex(entry => entry.href === page.url.pathname));
  const previous = $derived(index > 0 ? navigation[index - 1] : undefined);
  const next = $derived(index >= 0 ? navigation[index + 1] : undefined);

  function slugLabel(href: string): string {
    return href.replace(/^\/|\/$/gu, '').replaceAll('/', ' ');
  }
</script>

{#if previous || next}
  <nav class="page-sequence" aria-label="Next documentation pages">
    {#if previous}
      <a href={previous.href}>
        <span class="meta">&larr; Previous</span>
        <span class="title">{previous.label}</span>
        <span class="cmd">{slugLabel(previous.href)}</span>
      </a>
    {/if}
    {#if next}
      <a class="next" href={next.href}>
        <span class="meta">Next &rarr;</span>
        <span class="title">{next.label}</span>
        <span class="cmd">{slugLabel(next.href)}</span>
      </a>
    {/if}
  </nav>
{/if}

<style>
  .page-sequence {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 1rem;
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--rule);
  }
  a {
    display: flex;
    min-height: 2.75rem;
    flex-direction: column;
    gap: 0.25rem;
    text-decoration: none;
  }
  .meta {
    color: var(--ink-muted);
    font-family: var(--font-mono);
    font-size: 0.75rem;
  }
  .title {
    font-size: 0.9375rem;
    font-weight: 600;
  }
  .cmd {
    color: var(--ink-muted);
    font-family: var(--font-mono);
    font-size: 0.75rem;
  }
  .next {
    margin-left: auto;
    text-align: right;
  }
  a:hover .title,
  a:hover .meta {
    color: var(--signal);
  }
</style>
