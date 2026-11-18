<script lang="ts">
  import Icon from '../Icon.svelte';
</script>

<section id="workflow" class="workflow home-shell home-section" aria-labelledby="workflow-title">
  <div>
    <h2 id="workflow-title">Which package manager does OMG use?</h2>
    <dl class="backends">
      <div>
        <dt>Arch Linux</dt>
        <dd>pacman + AUR</dd>
      </div>
      <div>
        <dt>Debian / Ubuntu</dt>
        <dd>APT / DEB</dd>
      </div>
      <div>
        <dt>Fedora</dt>
        <dd>DNF / RPM</dd>
      </div>
      <div>
        <dt>macOS</dt>
        <dd>Homebrew</dd>
      </div>
    </dl>
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
      On Arch, Debian, and Ubuntu, <code>omg.lock</code> also records selected runtimes and explicitly
      installed packages so you can check another machine for drift.
    </p>
    <a href="/docs/environments/">Environment guide <Icon name="right" size={16} /></a>
  </div>
</section>

<style>
  .workflow {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem clamp(2rem, 6vw, 5rem);
  }
  h2 {
    max-width: 24ch;
    font-size: clamp(1.5rem, 2.6vw, 2.2rem);
    font-weight: 680;
    letter-spacing: -0.03em;
    line-height: 1.15;
  }
  .workflow p {
    max-width: 51ch;
    margin-top: 1.25rem;
    color: var(--ink-muted);
    font-size: 0.9375rem;
    line-height: 1.65;
  }
  code {
    font-family: var(--font-mono);
    font-size: 0.9em;
    color: var(--ink);
  }
  a {
    display: inline-flex;
    align-items: center;
    gap: 0.65rem;
    min-height: 2.75rem;
    margin-top: 0.5rem;
    font-size: 0.8125rem;
    font-weight: 600;
    text-decoration: none;
  }
  a:hover {
    color: var(--signal);
  }
  .backends {
    margin: 1.25rem 0 0;
  }
  .backends div {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding-block: 0.65rem;
    border-bottom: 1px solid var(--rule);
    font-size: 0.875rem;
  }
  dt {
    font-weight: 600;
  }
  dd {
    margin: 0;
    color: var(--ink-muted);
  }
  @media (max-width: 40rem) {
    .workflow {
      grid-template-columns: 1fr;
    }
  }
</style>
