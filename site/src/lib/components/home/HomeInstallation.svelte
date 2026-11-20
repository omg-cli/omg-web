<script lang="ts">
  import Icon from '../Icon.svelte';
  import { InstallationView } from '../../installation.svelte';
  import { trackInstallCommandCopied } from '../../site-analytics.svelte';

  const installation = new InstallationView(trackInstallCommandCopied);
</script>

<section id="install" class="installation home-shell" aria-labelledby="install-title">
  <div class="install-intro">
    <h2 id="install-title">Install OMG</h2>
    <p>x86_64 Linux and Apple Silicon macOS. On Windows, use a supported WSL2 distribution.</p>
  </div>
  <div class="install-details">
    <div class="command-row">
      <code>{installation.command}</code>
      <button
        type="button"
        aria-label="Copy install command"
        disabled={installation.pending}
        onclick={() => installation.copy()}><Icon name="copy" size={16} /> Copy</button
      >
    </div>
    <p class="prerequisite">
      Requires GitHub CLI (<code>gh</code>) for release verification.
      <a href="/docs/installation/">Installation guide <Icon name="right" size={14} /></a>
    </p>
    <div class="install-links">
      <a href="/install.sh">Read install.sh <Icon name="external" size={14} /></a>
      <a href="https://github.com/omg-cli/omg/releases"
        >GitHub releases <Icon name="external" size={14} /></a
      >
    </div>
    <p class="copy-status" role="status">{installation.message}</p>
  </div>
</section>

<style>
  .installation {
    display: grid;
    grid-template-columns: minmax(0, 0.7fr) minmax(0, 1.3fr);
    gap: 1.5rem 3rem;
    padding-block: clamp(2rem, 4vw, 3rem);
    scroll-margin-top: 1.5rem;
  }
  h2 {
    margin: 0;
    font-size: clamp(1.75rem, 3vw, 2.5rem);
    font-weight: 650;
    letter-spacing: -0.03em;
    line-height: 1.15;
  }
  .install-intro p {
    max-width: 36ch;
    margin: 0.75rem 0 0;
    color: var(--ink-muted);
    font-size: 0.875rem;
    line-height: 1.65;
  }
  .install-details {
    min-width: 0;
  }
  .command-row {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 0.75rem 0.75rem 0.75rem 1.25rem;
    border-radius: 6px;
    background: var(--paper-raised);
  }
  code {
    font-family: var(--font-mono);
    color: var(--ink);
  }
  .command-row > code {
    flex: 1;
    min-width: 0;
    font-size: clamp(0.8125rem, 1.2vw, 0.9375rem);
    line-height: 1.7;
    overflow-wrap: anywhere;
  }
  button {
    display: inline-flex;
    flex-shrink: 0;
    min-height: 2.75rem;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    border: 0;
    border-radius: 4px;
    background: var(--ink);
    color: var(--paper);
    font: inherit;
    font-size: 0.8125rem;
    cursor: pointer;
  }
  button:hover:not(:disabled) {
    background: var(--signal);
    color: var(--signal-ink);
  }
  button:disabled {
    opacity: 0.6;
    cursor: wait;
  }
  .prerequisite {
    margin: 0.75rem 0 0;
    color: var(--ink-muted);
    font-size: 0.8125rem;
    line-height: 1.65;
  }
  .prerequisite code {
    font-size: 0.9em;
  }
  a {
    display: inline-flex;
    min-height: 2.75rem;
    align-items: center;
    gap: 0.4rem;
    color: var(--ink-muted);
    font-size: 0.8125rem;
    text-underline-offset: 0.2em;
  }
  a:hover {
    color: var(--signal);
  }
  .install-links {
    display: flex;
    flex-wrap: wrap;
    gap: 0 1.5rem;
  }
  .copy-status {
    min-height: 1.5em;
    margin: 0;
    color: var(--ink-muted);
    font-size: 0.75rem;
  }
  @media (max-width: 50rem) {
    .installation {
      grid-template-columns: 1fr;
    }
  }
  @media (max-width: 25rem) {
    .command-row {
      gap: 0.5rem;
      padding-left: 0.75rem;
    }
  }
</style>
