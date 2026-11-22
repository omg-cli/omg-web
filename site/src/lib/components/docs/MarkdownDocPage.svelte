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
  const shortCommit = $derived(metadata.source.reviewedCommit.slice(0, 7));
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
    <div class="doc-main">
      <nav class="breadcrumbs" aria-label="Breadcrumb">
        <a href="/docs/">Docs</a><span aria-hidden="true">/</span><span aria-current="page"
          >{metadata.navLabel}</span
        >
      </nav>
      <header>
        <h1>{metadata.title}</h1>
        <p class="description">{metadata.description}</p>
        <p class="applicability">
          <span>{metadata.release}</span>
          <span aria-hidden="true">&middot;</span>
          <span
            >reviewed <time datetime={metadata.source.reviewedAt}>{metadata.source.reviewedAt}</time
            ></span
          >
          <span aria-hidden="true">&middot;</span>
          <a href={sourceHref}>{shortCommit} &#8599;</a>
        </p>
        <DocActions markdownHref={`/markdown${path}`} {sourceHref} />
      </header>
      <div class="inline-outline">
        <DocsOutline variant="inline" headings={headings.filter(heading => heading.depth === 2)} />
      </div>
      <div class="markdown-body">{@render children()}</div>
      <footer>
        <p>
          Source-reviewed against <a href={sourceHref}>{metadata.source.path}</a>
          (<code>{shortCommit}</code>); examples are not executed on every host.
        </p>
        <a href="/docs/search/">Find another command or task</a>
      </footer>
      <DocsPagination />
    </div>
    <div class="desktop-outline">
      <DocsOutline variant="rail" headings={headings.filter(heading => heading.depth === 2)} />
    </div>
  </article>
</DocsReader>

<style>
  .markdown-document {
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
    .markdown-document {
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
    gap: 0.6rem;
    color: var(--ink-muted);
    font-size: 0.75rem;
  }
  .breadcrumbs a {
    text-decoration: none;
  }
  header {
    margin-top: 1.5rem;
  }
  h1 {
    margin: 0;
    font-size: var(--page-title);
    line-height: 1.1;
    font-weight: 700;
    letter-spacing: -0.035em;
  }
  .description {
    max-width: 62ch;
    margin: 1rem 0 0.85rem;
    color: var(--ink-body);
    font-size: 1.0625rem;
    line-height: 1.65;
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
  a:hover {
    color: var(--signal);
  }
  footer {
    margin-top: 3rem;
    padding-top: 1.25rem;
    border-top: 1px solid var(--rule);
    color: var(--ink-muted);
    font-size: 0.75rem;
    line-height: 1.7;
  }
  footer p {
    margin: 0 0 0.5rem;
  }
  footer a {
    color: var(--ink);
  }
  .markdown-body :global(h2) {
    margin: 2.75rem 0 0.85rem;
    scroll-margin-top: 3.5rem;
    color: var(--ink);
    font-size: 1.5rem;
    font-weight: 600;
    line-height: 1.25;
    letter-spacing: -0.015em;
  }
  .markdown-body :global(h3) {
    margin: 2rem 0 0.65rem;
    scroll-margin-top: 3.5rem;
    color: var(--ink);
    font-size: 1.0625rem;
    font-weight: 600;
    letter-spacing: -0.01em;
  }
  .markdown-body :global(p),
  .markdown-body :global(li) {
    max-width: 72ch;
    color: var(--ink-body);
    font-size: 0.9375rem;
    line-height: 1.75;
    overflow-wrap: break-word;
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
    padding: 0.875rem 1.125rem;
    border: 1px solid var(--rule);
    border-radius: 6px;
    background: var(--paper-raised) !important;
    font-size: 0.8125rem;
    line-height: 1.7;
  }
  .markdown-body :global(code) {
    font-family: var(--font-mono);
  }
  .markdown-body :global(p code),
  .markdown-body :global(li code),
  .markdown-body :global(td code) {
    padding: 0.1em 0.35em;
    border: 1px solid var(--rule);
    border-radius: 4px;
    background: var(--paper-raised);
    color: var(--ink);
    font-size: 0.84em;
    overflow-wrap: anywhere;
  }
  @media (min-width: 34rem) {
    .markdown-body :global(p code),
    .markdown-body :global(li code),
    .markdown-body :global(td code) {
      white-space: nowrap;
      overflow-wrap: normal;
    }
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
    padding: 0.75rem 0.8rem 0.75rem 0;
    border-bottom: 1px solid var(--rule);
    text-align: left;
    vertical-align: top;
    color: var(--ink-body);
  }
  .markdown-body :global(th) {
    color: var(--ink);
    font-weight: 600;
    border-bottom-color: var(--rule-strong);
  }
  .markdown-body :global(blockquote) {
    margin: 1.5rem 0;
    padding: 0.75rem 1.25rem;
    border-left: 2px solid var(--signal);
    border-radius: 0 6px 6px 0;
    background: var(--paper-raised);
  }
  .markdown-body :global(blockquote p) {
    margin: 0;
    color: var(--ink-body);
    font-size: 0.875rem;
  }
</style>
