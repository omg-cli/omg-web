<script lang="ts">
  let { markdownHref, sourceHref }: { markdownHref: string; sourceHref?: string } = $props();
</script>

<div class="page-actions" data-copy-container>
  <button type="button" data-copy-page data-markdown-url={markdownHref}>Copy page</button>
  <a href={markdownHref}>Read as Markdown</a>
  {#if sourceHref}<a href={sourceHref}>View reviewed source</a>{/if}
  <span data-copy-status role="status"></span>
</div>

<style>
  .page-actions {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.25rem 1.25rem;
  }
  a,
  button {
    align-items: center;
    min-height: 2.75rem;
    font-size: 0.75rem;
    font-weight: 600;
  }
  a {
    display: inline-flex;
  }
  a:hover {
    color: var(--signal);
  }
  button {
    padding: 0.6rem 0.8rem;
    border: 1px solid var(--rule-strong);
    border-radius: 6px;
    background: var(--paper);
    color: var(--ink);
    cursor: pointer;
  }
  button:hover {
    background: var(--paper-raised);
    border-color: var(--signal);
  }
  button:disabled {
    opacity: 0.6;
    cursor: wait;
  }
  span {
    min-height: 1.5em;
    color: var(--ink-muted);
    font-size: 0.75rem;
  }
</style>
