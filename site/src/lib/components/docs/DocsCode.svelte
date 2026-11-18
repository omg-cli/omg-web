<script lang="ts">
  import Icon from '../Icon.svelte';
  let { code }: { code: string } = $props();
  const singleCommand = $derived(!code.includes('\n'));
</script>

<div class="docs-code" class:single-command={singleCommand} data-copy-container>
  <div class="code-actions">
    <span data-copy-status role="status"></span>
    <button type="button" data-copy-code title="Copy code" aria-label="Copy code">
      {#if singleCommand}<Icon name="copy" size={16} />{:else}Copy code{/if}
    </button>
  </div>
  <pre><code>{code}</code></pre>
</div>

<style>
  .single-command button {
    display: grid;
    place-content: center;
    min-width: 2.75rem;
  }
  pre {
    padding: 1rem 1.25rem;
    overflow-x: auto;
    color: var(--ink);
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    line-height: 1.8;
  }
  code {
    font-family: inherit;
  }
</style>
