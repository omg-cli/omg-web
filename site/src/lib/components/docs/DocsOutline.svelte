<script lang="ts">
  let { headings }: { headings: readonly { id: string; title: string }[] } = $props();
</script>

<details class="page-outline">
  <summary>On this page</summary>
  <ul>
    {#each headings as heading (heading.id)}
      <li><a href={`#${heading.id}`}>{heading.title}</a></li>
    {/each}
  </ul>
</details>

<style>
  .page-outline {
    margin-block: 1.5rem 2.5rem;
    padding-block: 0.75rem;
    border-block: 1px solid var(--rule);
    background: var(--paper);
  }
  summary,
  a {
    min-height: 2.75rem;
    font-size: 0.8125rem;
  }
  summary {
    padding-block: 0.65rem;
    cursor: pointer;
    font-weight: 600;
  }
  ul {
    columns: 2;
    margin: 0.5rem 0;
    padding-left: 1.25rem;
  }
  a {
    display: inline-flex;
    align-items: center;
    padding-block: 0.4rem;
    text-decoration: none;
  }
  a:hover {
    color: var(--signal);
  }
  @media (max-width: 47.99rem) {
    .page-outline {
      padding-block: 0;
    }
    ul {
      columns: 1;
    }
  }
  @media (max-width: 47.99rem) and (scripting: enabled) {
    .page-outline {
      position: sticky;
      top: 0;
      z-index: 2;
    }
    ul {
      max-height: 48dvh;
      overflow-y: auto;
    }
  }
</style>
