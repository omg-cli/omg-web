<script lang="ts">
  import Icon from '../Icon.svelte';

  const backends = [
    { platform: 'Arch Linux', backend: 'pacman + AUR', legacy: 'pacman -S ripgrep' },
    { platform: 'Debian / Ubuntu', backend: 'APT / DEB', legacy: 'apt install ripgrep' },
    { platform: 'Fedora', backend: 'DNF / RPM', legacy: 'dnf install ripgrep' },
    { platform: 'macOS', backend: 'Homebrew', legacy: 'brew install ripgrep' },
  ] as const;
</script>

<section id="workflow" class="workflow home-shell" aria-labelledby="workflow-title">
  <div>
    <h2 id="workflow-title">Same command, native backend</h2>
    <div class="command-diff" aria-label="Platform package commands compared to OMG">
      <ul class="legacy-list">
        {#each backends as item (item.platform)}
          <li>
            <span class="platform">{item.platform}</span>
            <code class="legacy-cmd">{item.legacy}</code>
            <span class="backend-note">{item.backend}</span>
          </li>
        {/each}
      </ul>
      <div class="unified-cmd">
        <span class="unified-label">With OMG</span>
        <code><span class="prompt" aria-hidden="true">$</span> omg install ripgrep</code>
      </div>
    </div>
    <a href="/docs/packages/">Package installation guide <Icon name="right" size={16} /></a>
  </div>
  <div>
    <h2>Use your project’s version files</h2>
    <p>
      OMG reads <code>.nvmrc</code>, <code>.node-version</code>, <code>.python-version</code>, and
      <code>.tool-versions</code>. Keep using npm or pnpm for JavaScript dependencies.
    </p>
    <a href="/runtimes/">Browse runtime guides <Icon name="right" size={16} /></a>
    <p>
      On Arch, Debian, and Ubuntu, <code>omg.lock</code> records selected runtimes and explicitly installed
      packages. Use it to check another machine for drift.
    </p>
    <a href="/docs/environments/">Environment guide <Icon name="right" size={16} /></a>
  </div>
</section>

<style>
  .workflow {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2.5rem clamp(2rem, 6vw, 5rem);
    padding-block: clamp(3rem, 5vw, 4.5rem);
    align-items: start;
  }
  h2 {
    max-width: 24ch;
    margin: 0;
    font-family: var(--font-display);
    font-size: clamp(1.375rem, 2.2vw, 1.875rem);
    font-weight: 600;
    letter-spacing: -0.02em;
    line-height: 1.2;
    text-wrap: balance;
  }
  .workflow p {
    max-width: 51ch;
    margin: 1.25rem 0 0;
    color: var(--ink-body);
    font-size: 0.9375rem;
    line-height: 1.7;
  }
  .workflow p code {
    padding: 0.1em 0.35em;
    border: 1px solid var(--rule);
    border-radius: 4px;
    background: var(--paper-raised);
    color: var(--ink);
    font-family: var(--font-mono);
    font-size: 0.84em;
  }
  a {
    display: inline-flex;
    align-items: center;
    gap: 0.65rem;
    min-height: 2.75rem;
    margin-top: 0.75rem;
    font-size: 0.8125rem;
    font-weight: 600;
    text-decoration: none;
  }
  a:hover {
    color: var(--signal);
  }
  .command-diff {
    margin-top: 1.25rem;
    border: 1px solid var(--rule);
    border-radius: 6px;
    overflow: hidden;
    background: var(--paper-raised);
  }
  .legacy-list {
    margin: 0;
    padding: 0.35rem 0;
    list-style: none;
  }
  .legacy-list li {
    display: grid;
    grid-template-columns: minmax(0, 8.5rem) minmax(0, 1fr) auto;
    align-items: baseline;
    gap: 0.25rem 0.85rem;
    padding: 0.5rem 1rem;
    font-size: 0.8125rem;
  }
  .platform {
    color: var(--ink);
    font-weight: 600;
  }
  .legacy-cmd {
    color: var(--ink-muted);
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    text-decoration: line-through;
    text-decoration-color: var(--rule-strong);
  }
  .backend-note {
    color: var(--ink-muted);
    font-size: 0.75rem;
    text-align: right;
  }
  .unified-cmd {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.5rem 1rem;
    padding: 0.85rem 1rem;
    border-top: 1px solid var(--rule);
    background: var(--paper);
  }
  .unified-label {
    color: var(--ink-muted);
    font-size: 0.75rem;
    font-weight: 600;
  }
  .unified-cmd code {
    color: var(--ink);
    font-family: var(--font-mono);
    font-size: 0.875rem;
    font-weight: 500;
  }
  .prompt {
    color: var(--signal);
    margin-right: 0.25rem;
  }
  @media (max-width: 48rem) {
    .workflow {
      grid-template-columns: 1fr;
    }
  }
  @media (max-width: 34rem) {
    .legacy-list li {
      grid-template-columns: minmax(0, 1fr) auto;
    }
    .legacy-cmd {
      grid-column: 1 / -1;
    }
  }
</style>
