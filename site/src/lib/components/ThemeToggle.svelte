<script lang="ts">
  import Icon from './Icon.svelte';
  let { showLabel = false }: { showLabel?: boolean } = $props();
</script>

<button class="theme-toggle" type="button" data-theme-toggle>
  <span class="light-choice"
    ><Icon name="moon" size={18} /><span class="sr-only">Switch to dark mode</span
    >{#if showLabel}<span aria-hidden="true">Dark mode</span>{/if}</span
  >
  <span class="dark-choice"
    ><Icon name="sun" size={18} /><span class="sr-only">Switch to light mode</span
    >{#if showLabel}<span aria-hidden="true">Light mode</span>{/if}</span
  >
</button>

<style>
  .theme-toggle {
    display: none;
    align-items: center;
    justify-content: center;
    min-width: 2.75rem;
    min-height: 2.75rem;
    padding: 0.6rem;
    border: 1px solid var(--rule);
    border-radius: 6px;
    background: transparent;
    color: var(--ink-muted);
    font-size: 0.8125rem;
    cursor: pointer;
  }
  :global(:root[data-theme]) .theme-toggle {
    display: inline-flex;
  }
  .light-choice,
  .dark-choice {
    align-items: center;
    gap: 0.75rem;
  }
  .light-choice {
    display: inline-flex;
  }
  .dark-choice {
    display: none;
  }
  :global(:root[data-theme='dark']) .dark-choice {
    display: inline-flex;
  }
  :global(:root[data-theme='dark']) .light-choice {
    display: none;
  }
  .theme-toggle:hover {
    color: var(--signal);
    border-color: var(--signal);
    background: var(--paper-raised);
  }
</style>
