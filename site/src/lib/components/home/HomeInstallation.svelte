<script lang="ts">
  import { InstallationView } from '../../installation.svelte';
  import { trackInstallCommandCopied } from '../../site-analytics.svelte';

  const installation = new InstallationView(trackInstallCommandCopied);
</script>

<section id="install" class="installation home-shell home-section" aria-labelledby="install-title">
  <header>
    <h2 id="install-title" class="home-section-title">Install once. Start simplifying.</h2>
    <p class="home-section-intro">
      Supported x86_64 Linux distributions or Apple Silicon macOS, including Linux inside WSL2.
      Download the installer, review it, then run it.
    </p>
  </header>
  <div class="install-command">
    <p class="step-label">01 / Install OMG</p>
    <pre><code>{installation.command}</code></pre>
    <div class="install-actions">
      <button type="button" disabled={installation.pending} onclick={() => installation.copy()}
        >Copy install command</button
      >
      <a href="https://github.com/omg-cli/omg/releases"
        >Download from GitHub <span aria-hidden="true">↗</span></a
      >
    </div>
    <p class="copy-status" role="status">{installation.message}</p>
    <p class="platform-note">
      The installer requires GitHub CLI (<code>gh</code>) to verify release provenance. On Windows,
      run these commands inside a supported Arch, Debian, Ubuntu, or Fedora WSL2 terminal. There is
      no native Windows build. <a href="/docs/installation/">Check supported platforms</a>.
    </p>
  </div>
  <div class="first-command">
    <div>
      <p class="step-label">02 / Try your first command</p>
      <h3>Find a package before changing your system.</h3>
      <p>Run a read-only search to see what OMG can find through your system package manager.</p>
    </div>
    <div class="first-command-action">
      <code><span aria-hidden="true">$ </span>omg search ripgrep</code>
      <a href="/docs/#quick-start"
        >Continue with the quick start <span aria-hidden="true">↗</span></a
      >
    </div>
  </div>
</section>

<style>
  .installation {
    display: grid;
    gap: 0;
    padding-block: clamp(3rem, 6vw, 5rem) clamp(4rem, 8vw, 7rem);
  }
  header {
    max-width: 42rem;
    margin-bottom: clamp(2rem, 5vw, 4rem);
  }
  .step-label {
    margin: 0 0 1rem;
    color: var(--signal);
    font-family: var(--font-mono);
    font-size: 0.75rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .install-command {
    min-width: 0;
    padding-block: 2rem;
    border-block: 1px solid var(--rule);
  }
  pre {
    margin: 0;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  code {
    color: var(--ink);
    font-family: var(--font-mono);
    font-size: clamp(0.85rem, 1.7vw, 1.15rem);
    line-height: 1.9;
  }
  .install-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 1.25rem 2rem;
    margin-top: 2rem;
  }
  button {
    min-height: 2.75rem;
    padding: 0.6rem 1rem;
    border: 1px solid var(--rule);
    background: transparent;
    color: var(--ink);
    font: inherit;
    cursor: pointer;
  }
  button:hover:not(:disabled) {
    border-color: var(--signal);
  }
  button:focus-visible,
  a:focus-visible {
    outline: 2px solid var(--signal);
    outline-offset: 4px;
  }
  button:disabled {
    opacity: 0.6;
    cursor: wait;
  }
  a {
    color: var(--ink);
    text-decoration-color: var(--signal);
    text-underline-offset: 0.3em;
  }
  .copy-status {
    min-height: 1.5em;
    margin: 0.75rem 0 0;
    color: var(--ink-muted);
    font-size: 0.875rem;
  }
  .platform-note {
    max-width: 52rem;
    margin: 1.5rem 0 0;
    color: var(--ink-muted);
    line-height: 1.7;
  }
  .first-command {
    display: grid;
    gap: 1.5rem 3rem;
    align-items: center;
    padding-block: clamp(2rem, 4vw, 3rem);
    border-bottom: 1px solid var(--rule);
  }
  .first-command h3 {
    max-width: 28ch;
    margin: 0;
    font-family: var(--font-display);
    font-size: clamp(1.5rem, 3vw, 2.25rem);
    font-weight: 550;
    letter-spacing: -0.04em;
    line-height: 1.15;
  }
  .first-command p:not(.step-label) {
    max-width: 44ch;
    margin: 1rem 0 0;
    color: var(--ink-muted);
    line-height: 1.7;
  }
  .first-command-action {
    display: grid;
    gap: 1.5rem;
    justify-items: start;
  }
  .first-command-action code {
    font-size: clamp(1rem, 2vw, 1.4rem);
  }
  .first-command-action code span {
    color: var(--signal);
  }
  @media (min-width: 60rem) {
    .first-command {
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    }
    .first-command-action {
      justify-self: end;
    }
  }
</style>
