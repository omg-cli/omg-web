<script lang="ts">
  let {
    headings,
    variant = 'inline',
  }: {
    headings: readonly { id: string; title: string }[];
    variant?: 'inline' | 'rail';
  } = $props();
</script>

{#if headings.length > 0}
  {#if variant === 'inline'}
    <details class="page-outline">
      <summary>On this page</summary>
      <ul>
        {#each headings as heading (heading.id)}
          <li><a href={`#${heading.id}`}>{heading.title}</a></li>
        {/each}
      </ul>
    </details>
  {:else}
    <nav class="rail-outline" aria-label="On this page">
      <p class="rail-title">On this page</p>
      <ul>
        {#each headings as heading (heading.id)}
          <li><a href={`#${heading.id}`}>{heading.title}</a></li>
        {/each}
      </ul>
    </nav>
  {/if}
{/if}

<style>
  .page-outline {
    margin-block: 1.5rem 2.25rem;
    padding-block: 0.5rem;
    border-block: 1px solid var(--rule);
    background: var(--paper);
  }
  .page-outline summary,
  .page-outline a {
    min-height: 2.75rem;
    font-size: 0.8125rem;
  }
  .page-outline summary {
    padding-block: 0.65rem;
    cursor: pointer;
    font-weight: 600;
  }
  .page-outline ul {
    columns: 2;
    margin: 0.25rem 0 0.5rem;
    padding-left: 1.25rem;
    list-style: none;
  }
  .page-outline a {
    display: inline-flex;
    align-items: center;
    padding-block: 0.4rem;
    color: var(--ink-muted);
    text-decoration: none;
  }
  .page-outline a:hover {
    color: var(--signal);
  }

  .rail-outline {
    display: none;
  }

  @media (min-width: 72rem) {
    .page-outline {
      display: none;
    }
    .rail-outline {
      display: block;
      position: sticky;
      top: 2rem;
      max-height: calc(100dvh - 4rem);
      overflow-y: auto;
      padding-left: 1.25rem;
      border-left: 1px solid var(--rule);
    }
    .rail-title {
      margin: 0 0 0.75rem;
      color: var(--ink-muted);
      font-family: var(--font-mono);
      font-size: 0.75rem;
      font-weight: 500;
    }
    .rail-outline ul {
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .rail-outline a {
      display: block;
      padding: 0.35rem 0;
      color: var(--ink-muted);
      font-size: 0.8125rem;
      line-height: 1.45;
      text-decoration: none;
    }
    .rail-outline a:hover {
      color: var(--ink);
    }
    .rail-outline a:global([aria-current='location']) {
      color: var(--signal);
      font-weight: 600;
    }
  }

  @media (max-width: 47.99rem) {
    .page-outline {
      margin-inline: calc(clamp(1.25rem, 4vw, 4rem) * -1);
      padding-block: 0;
      padding-inline: clamp(1.25rem, 4vw, 4rem);
      border-top: 1px solid var(--rule);
      border-bottom: 1px solid var(--rule);
      background: var(--paper);
    }
    .page-outline ul {
      columns: 1;
      padding-left: 0.5rem;
    }
  }
  @media (max-width: 47.99rem) and (scripting: enabled) {
    .page-outline {
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .page-outline ul {
      max-height: 48dvh;
      overflow-y: auto;
      padding-bottom: 0.5rem;
    }
  }
</style>
