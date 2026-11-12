<script lang="ts">
  import type { Snippet } from 'svelte';
  import { page } from '$app/state';
  import { DOCS_TOPICS, docsTopicHref } from '../../docs/topics';
  import DocsSearchForm from './DocsSearchForm.svelte';
  let { children }: { children: Snippet } = $props();
  const navigation = $derived(
    page.data.documentationNavigation ??
      DOCS_TOPICS.map(topic => ({
        href: docsTopicHref(topic.slug),
        label: topic.navLabel,
        title: topic.title,
        section: 'Reference',
      }))
  );
  const groups = $derived([...new Set(navigation.map(entry => entry.section))]);
</script>

<svelte:head><script src="/docs.js" defer></script></svelte:head>

{#snippet topicLinks()}
  <nav aria-label="Documentation topics">
    <a class="docs-home" href="/docs/">Documentation</a>
    {#each groups as group (group)}<div class="nav-group">
        <p>{group}</p>
        <ul>
          {#each navigation.filter(entry => entry.section === group) as entry (entry.href)}<li>
              <a
                href={entry.href}
                aria-current={page.url.pathname === entry.href ? 'page' : undefined}
                >{entry.label}</a
              >
            </li>{/each}
        </ul>
      </div>{/each}
  </nav>
{/snippet}

<main id="main-content" class="docs-reader">
  <aside class="docs-sidebar">
    <DocsSearchForm />
    <div class="desktop-topics">{@render topicLinks()}</div>
    <details class="mobile-topics">
      <summary>Browse documentation</summary>{@render topicLinks()}
    </details>
    <a class="agent-link" href="/llms.txt">Docs for agents</a>
  </aside>
  <div class="reader-content">{@render children()}</div>
</main>

<style>
  .docs-reader {
    display: grid;
    grid-template-columns: 16rem minmax(0, 1fr);
    width: min(100% - clamp(2.5rem, 8vw, 8rem), 75rem);
    margin-inline: auto;
    gap: 3rem;
  }
  .docs-sidebar {
    position: sticky;
    top: 0;
    align-self: start;
    max-height: 100dvh;
    overflow-y: auto;
    min-width: 0;
    padding: 2rem 1.5rem 2rem 0;
    border-right: 1px solid var(--rule);
  }
  nav {
    margin-top: 1.5rem;
  }
  .docs-home {
    display: inline-flex;
    align-items: center;
    min-height: 2.75rem;
    font-size: 0.875rem;
    font-weight: 650;
    text-decoration: none;
  }
  .nav-group {
    margin-top: 1.25rem;
  }
  .nav-group p {
    margin: 0 0 0.5rem;
    color: var(--ink-muted);
    font-size: 0.75rem;
    font-weight: 600;
  }
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  li a {
    display: flex;
    align-items: center;
    min-height: 2.75rem;
    padding: 0.65rem 0.75rem;
    border-radius: 6px;
    color: var(--ink-muted);
    font-size: 0.8125rem;
    text-decoration: none;
  }
  li a:hover {
    color: var(--ink);
    background: var(--paper-raised);
  }
  li a[aria-current='page'] {
    color: var(--signal);
    background: var(--paper-raised);
    font-weight: 600;
  }
  .agent-link {
    display: inline-flex;
    align-items: center;
    min-height: 2.75rem;
    margin-top: 1.5rem;
    color: var(--ink-muted);
    font-size: 0.75rem;
  }
  .agent-link:hover,
  .docs-home:hover {
    color: var(--signal);
  }
  .reader-content {
    min-width: 0;
    padding-block: 2.5rem 4rem;
  }
  .mobile-topics {
    display: none;
  }
  summary {
    min-height: 2.75rem;
    padding-block: 0.75rem;
    cursor: pointer;
    font-size: 0.8125rem;
    font-weight: 600;
  }
  @media (max-width: 63.99rem) {
    .docs-reader {
      grid-template-columns: 13rem minmax(0, 1fr);
      gap: 1.5rem;
    }
    .docs-sidebar {
      padding-right: 1rem;
    }
  }
  @media (max-width: 47.99rem) {
    .docs-reader {
      display: block;
    }
    .docs-sidebar {
      position: static;
      max-height: none;
      padding: 1.25rem 0;
      border-right: 0;
      border-bottom: 1px solid var(--rule);
    }
    .desktop-topics {
      display: none;
    }
    .mobile-topics {
      display: block;
      margin-top: 0.5rem;
    }
    .mobile-topics nav {
      margin-top: 0;
    }
    .agent-link {
      margin-top: 0;
    }
    .reader-content {
      padding-top: 2rem;
    }
  }
</style>
