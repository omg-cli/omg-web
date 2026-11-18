<script lang="ts">
  let { code }: { code: string } = $props();
</script>

<div class="docs-code" data-copy-container>
  <div class="code-actions">
    <span data-copy-status role="status"></span>
    <button type="button" data-copy-code>Copy code</button>
  </div>
  <pre><code>{code}</code></pre>
</div>

<style>
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
