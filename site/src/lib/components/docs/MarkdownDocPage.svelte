<script lang="ts">
  import type { Snippet } from 'svelte';
  import { page } from '$app/state';
  import type { MarkdownDocumentMetadata } from '../../docs/markdown-document';
  import SeoHead from '../SeoHead.svelte';
  import DocsReader from './DocsReader.svelte';
  import DocsOutline from './DocsOutline.svelte';
  import DocsPagination from './DocsPagination.svelte';
  import DocActions from './DocActions.svelte';
  let {
    metadata,
    headings,
    children,
  }: {
    metadata: MarkdownDocumentMetadata;
    headings: readonly { readonly id: string; readonly title: string; readonly depth: number }[];
    children: Snippet;
  } = $props();
  const path = $derived(page.url.pathname);
  const sourceHref = $derived(
    `https://github.com/${metadata.source.repo}/blob/${metadata.source.reviewedCommit}/${metadata.source.path}`
  );
</script>

<SeoHead
  title={`${metadata.title} - OMG`}
  description={metadata.description}
  {path}
  type="article"
  modifiedTime={metadata.source.reviewedAt}
  markdownPath={`/markdown${path}`}
/>
<DocsReader>
  <article class="markdown-document" data-doc-content>
    <nav class="breadcrumbs" aria-label="Breadcrumb">
      <a href="/docs/">Docs</a><span aria-hidden="true">/</span><span aria-current="page"
        >{metadata.navLabel}</span
      >
    </nav>
    <header>
      <h1>{metadata.title}</h1>
      <p class="description">{metadata.description}</p>
      <p class="applicability">
        Release {metadata.release} Â· Reviewed
        <time datetime={metadata.source.reviewedAt}>{metadata.source.reviewedAt}</time>
      </p>
      <DocActions markdownHref={`/markdown${path}`} {sourceHref} />
    </header>
    <DocsOutline headings={headings.filter(heading => heading.depth === 2)} />
    <div class="markdown-body">{@render children()}</div>
    <footer>
      <p>
        Reviewed against <a href={sourceHref}>{metadata.source.path}</a> at
        <code>{metadata.source.reviewedCommit.slice(0, 7)}</code>. Examples are source-reviewed;
        they are not a claim of execution on every supported host.
      </p>
      <a href="/docs/search/">Find another command or task</a>
    </footer>
    <DocsPagination />
  </article>
</DocsReader>

<style>
  .breadcrumbs {
    display: flex;
    flex-wrap: wrap;
    gap: 0.6rem;
    color: var(--ink-muted);
    font-size: 0.75rem;
  }
  .breadcrumbs a {
    text-decoration: none;
  }
  header {
    margin-top: 1.75rem;
  }
  h1 {
    margin: 0;
    font-size: clamp(2rem, 4.5vw, 3.25rem);
    line-height: 1.1;
    font-weight: 680;
    letter-spacing: -0.035em;
  }
  .description {
    max-width: 65ch;
    margin: 1rem 0;
    color: var(--ink-muted);
    font-size: 1rem;
    line-height: 1.75;
  }
  .applicability {
    color: var(--ink-muted);
    font-size: 0.75rem;
  }
  a:hover {
    color: var(--signal);
  }
  footer {
    margin-top: 3rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--rule);
    color: var(--ink-muted);
    font-size: 0.75rem;
    line-height: 1.8;
  }
  footer a {
    color: var(--ink);
  }
  .markdown-body :global(h2) {
    margin: 3rem 0 1rem;
    scroll-margin-top: 3.5rem;
    font-size: clamp(1.5rem, 3vw, 2rem);
    font-weight: 650;
    line-height: 1.2;
    letter-spacing: -0.025em;
  }
  .markdown-body :global(h3) {
    margin: 2rem 0 0.75rem;
    scroll-margin-top: 3.5rem;
    font-size: 1.125rem;
    font-weight: 650;
  }
  .markdown-body :global(p),
  .markdown-body :global(li) {
    max-width: 72ch;
    color: var(--ink-muted);
    font-size: 0.9375rem;
    line-height: 1.8;
    overflow-wrap: anywhere;
  }
  .markdown-body :global(a) {
    color: var(--ink);
    text-underline-offset: 0.2em;
  }
  .markdown-body :global(a:hover) {
    color: var(--signal);
  }
  .markdown-body :global(pre) {
    max-width: 100%;
    overflow-x: auto;
    padding: 1rem 1.25rem;
    border: 1px solid var(--rule);
    border-radius: 6px;
    background: var(--paper-raised) !important;
    font-size: 0.8125rem;
    line-height: 1.8;
  }
  .markdown-body :global(code) {
    font-family: var(--font-mono);
  }
  .markdown-body :global(p code),
  .markdown-body :global(li code),
  .markdown-body :global(td code) {
    color: var(--ink);
    font-size: 0.85em;
  }
  .markdown-body :global(table) {
    display: block;
    max-width: 100%;
    overflow-x: auto;
    border-collapse: collapse;
    font-size: 0.8125rem;
  }
  .markdown-body :global(th),
  .markdown-body :global(td) {
    min-width: 8rem;
    padding: 0.8rem;
    border-bottom: 1px solid var(--rule);
    text-align: left;
    vertical-align: top;
  }
  .markdown-body :global(blockquote) {
    margin: 1.5rem 0;
    padding: 0.25rem 1.25rem;
    border-left: 1px solid var(--rule-strong);
    background: var(--paper-raised);
  }
  :global(:root[data-theme='dark']) .markdown-body :global(.shiki span) {
    color: var(--shiki-dark) !important;
  }
  @media (prefers-color-scheme: dark) {
    :global(:root:not([data-theme])) .markdown-body :global(.shiki span) {
      color: var(--shiki-dark) !important;
    }
  }
</style>
