<script lang="ts">
  import { page } from '$app/state';
  const navigation = $derived(page.data.documentationNavigation ?? []);
  const index = $derived(navigation.findIndex(entry => entry.href === page.url.pathname));
  const previous = $derived(index > 0 ? navigation[index - 1] : undefined);
  const next = $derived(index >= 0 ? navigation[index + 1] : undefined);
</script>

{#if previous || next}
  <nav class="page-sequence" aria-label="Next documentation pages">
    {#if previous}<a href={previous.href}><span>Previous</span>{previous.label}</a>{/if}
    {#if next}<a class="next" href={next.href}><span>Next</span>{next.label}</a>{/if}
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
    gap: 0.5rem;
    font-size: 0.875rem;
    font-weight: 600;
    text-decoration: none;
  }
  span {
    color: var(--ink-muted);
    font-size: 0.75rem;
    font-weight: 400;
  }
  .next {
    margin-left: auto;
    text-align: right;
  }
  a:hover {
    color: var(--signal);
  }
</style>
