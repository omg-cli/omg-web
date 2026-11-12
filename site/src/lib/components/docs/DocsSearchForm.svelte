<script lang="ts">
  let { query = '' }: { query?: string } = $props();
  const id = $props.id();
</script>

<form action="/docs/search/" method="get" role="search">
  <label for={id}>Search documentation</label>
  <div class="search-controls">
    <input
      {id}
      name="q"
      type="search"
      value={query}
      maxlength="160"
      placeholder="e.g. install"
    />
    <button type="submit">Search</button>
  </div>
</form>

<style>
  form {
    min-width: 0;
  }
  label {
    display: block;
    margin-bottom: 0.5rem;
    color: var(--ink-muted);
    font-size: 0.75rem;
  }
  .search-controls {
    display: flex;
    gap: 0.4rem;
  }
  input {
    min-width: 0;
    width: 100%;
    min-height: 2.75rem;
    padding: 0.65rem 0.75rem;
    border: 1px solid var(--rule-strong);
    border-radius: 6px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    font-size: 0.8125rem;
  }
  input::placeholder {
    color: var(--ink-muted);
  }
  button {
    min-height: 2.75rem;
    padding: 0.6rem 0.8rem;
    border: 0;
    border-radius: 6px;
    background: var(--ink);
    color: var(--paper);
    font: inherit;
    font-size: 0.75rem;
    font-weight: 600;
    cursor: pointer;
  }
  button:hover {
    background: var(--signal);
    color: var(--signal-ink);
  }
</style>
