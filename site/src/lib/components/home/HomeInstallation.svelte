<script lang="ts">
  import Icon from '../Icon.svelte';
  import { InstallationView } from '../../installation.svelte';
  import { trackInstallCommandCopied } from '../../site-analytics.svelte';

  const installation = new InstallationView(trackInstallCommandCopied);
</script>

<section id="install" class="installation home-shell home-section" aria-labelledby="install-title">
  <header>
    <h2 id="install-title" class="home-section-title">Install OMG. Try it on your setup.</h2>
    <p class="home-section-intro">
      Supported x86_64 Linux distributions or Apple Silicon macOS, including Linux inside WSL2.
    </p>
  </header>
  <div class="install-command">
    <h3 class="step-label">1. Install OMG</h3>
    <pre><code>{installation.command}</code></pre>
    <div class="install-actions">
      <button type="button" disabled={installation.pending} onclick={() => installation.copy()}
        >Copy install command <Icon name="copy" size={16} /></button
      >
      <a href="/install.sh">Read install.sh <Icon name="external" size={16} /></a>
      <a href="https://github.com/omg-cli/omg/releases"
        >Download from GitHub <Icon name="external" size={16} /></a
      >
    </div>
    <p class="copy-status" role="status">{installation.message}</p>
    <p class="platform-note">
      The installer requires GitHub CLI (<code>gh</code>) to verify release provenance. On Windows,
      run this command inside a supported Arch, Debian, Ubuntu, or Fedora WSL2 terminal. There is no
      native Windows build. <a href="/docs/installation/">Check supported platforms</a>.
    </p>
  </div>
  <div class="first-command">
    <div>
      <p class="step-label">2. Try your first command</p>
      <h3>Find a package before changing your system.</h3>
      <p>Run a read-only search to see what OMG can find through your system package manager.</p>
    </div>
    <div class="first-command-action">
      <code><span aria-hidden="true">$ </span>omg search ripgrep</code>
      <a href="/docs/#quick-start"
        >Continue with the quick start <Icon name="external" size={16} /></a
      >
    </div>
  </div>
</section>

<style>
  .installation {
    display: grid;
    gap: 0;
    padding-block: clamp(3rem, 6vw, 5rem);
    scroll-margin-top: 1.5rem;
  }
  header {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: start;
    gap: 1rem 3rem;
    margin-bottom: 2rem;
  }
  .installation .home-section-intro {
    max-width: 29rem;
    margin: 0;
    font-size: 0.875rem;
  }
  .install-command {
    min-width: 0;
    padding: clamp(1.25rem, 3vw, 2rem);
    border-radius: 12px;
    background: var(--paper-raised);
  }
  .step-label {
    margin: 0 0 1rem;
    color: var(--ink-muted);
    font-size: 0.8125rem;
    font-weight: 600;
  }
  pre {
    margin: 0;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  code {
    color: var(--ink);
    font-family: var(--font-mono);
    font-size: clamp(0.75rem, 1.3vw, 0.9375rem);
    line-height: 1.9;
  }
  .install-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1rem 1.75rem;
    margin-top: 1.5rem;
  }
  button {
    display: inline-flex;
    min-height: 2.75rem;
    align-items: center;
    gap: 0.75rem;
    padding: 0.65rem 1rem;
    border: 0;
    border-radius: 6px;
    background: var(--ink);
    color: var(--paper);
    font-size: 0.8125rem;
    font-weight: 500;
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
  a {
    display: inline-flex;
    min-height: 2.75rem;
    align-items: center;
    gap: 0.5rem;
    color: var(--ink);
    font-size: 0.8125rem;
    text-decoration-color: var(--rule-strong);
  }
  a:hover {
    color: var(--signal);
    text-decoration-color: var(--signal);
  }
  .copy-status {
    min-height: 1.5em;
    margin: 0.5rem 0 0;
    color: var(--ink-muted);
    font-size: 0.75rem;
  }
  .platform-note {
    max-width: 80ch;
    margin: 0.5rem 0 0;
    color: var(--ink-muted);
    font-size: 0.75rem;
    line-height: 1.8;
  }
  .platform-note a {
    display: inline;
    font-size: inherit;
  }
  .platform-note code {
    font-size: inherit;
  }
  .first-command {
    display: grid;
    grid-template-columns: 1fr 0.9fr;
    gap: 1.5rem 3rem;
    align-items: center;
    padding-top: 2.5rem;
  }
  .first-command h3 {
    max-width: 32ch;
    margin: 0;
    font-size: 1.25rem;
    font-weight: 600;
    letter-spacing: -0.025em;
    line-height: 1.35;
  }
  .first-command p:not(.step-label) {
    max-width: 44ch;
    margin: 0.75rem 0 0;
    color: var(--ink-muted);
    font-size: 0.8125rem;
    line-height: 1.75;
  }
  .first-command-action {
    display: grid;
    gap: 0.75rem;
    justify-items: start;
    justify-self: end;
  }
  .first-command-action code {
    font-size: clamp(0.875rem, 1.4vw, 1rem);
  }
  .first-command-action code span {
    color: var(--signal);
  }
  @media (max-width: 44rem) {
    .first-command {
      grid-template-columns: 1fr;
    }
    .first-command-action {
      justify-self: start;
    }
  }
</style>
