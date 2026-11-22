<script lang="ts">
  import Icon from '../Icon.svelte';
  let { code }: { code: string } = $props();
  const singleCommand = $derived(!code.includes('\n'));
</script>

<div class="docs-code" class:single-command={singleCommand} data-copy-container>
  <div class="code-actions">
    <span data-copy-status role="status"></span>
    <button type="button" data-copy-code title="Copy code" aria-label="Copy code">
      <Icon name="copy" size={16} /><span class="copy-label">Copy code</span>
    </button>
  </div>
  <!-- svelte-ignore a11y_no_noninteractive_tabindex (keyboard access to horizontally scrolling code) -->
  <pre tabindex="0"><code>{code}</code></pre>
</div>

<style>
  .single-command button {
    display: grid;
    place-content: center;
    min-width: 2.75rem;
  }
  .single-command .copy-label {
    display: none;
  }
  @media (max-width: 47.99rem) {
    .single-command .copy-label {
      display: inline;
    }
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
