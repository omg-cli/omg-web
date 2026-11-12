<script lang="ts">
  import Icon from '../Icon.svelte';
</script>

<section id="workflow" class="workflow home-shell home-section" aria-labelledby="workflow-title">
  <div class="packages">
    <h2 id="workflow-title">Your system packages.<br />A consistent interface.</h2>
    <p>
      Search, inspect, and install with the same commands. OMG works with your native package
      backend.
    </p>
    <div class="package-example"><code><span>$</span> omg install ripgrep</code></div>
    <dl class="backends">
      <div>
        <dt>Arch Linux</dt>
        <dd>pacman + AUR</dd>
      </div>
      <div>
        <dt>Debian / Ubuntu</dt>
        <dd>apt</dd>
      </div>
      <div>
        <dt>Fedora</dt>
        <dd>dnf</dd>
      </div>
      <div>
        <dt>macOS</dt>
        <dd>Homebrew</dd>
      </div>
    </dl>
    <a href="/docs/cli/">Package commands <Icon name="right" size={16} /></a>
  </div>
  <div class="runtimes">
    <h2>Right project.<br />Right runtime.</h2>
    <p>
      Manage the language versions your projects need. For JavaScript, choose Node.js, Bun, or Deno.
      OMG also manages .NET SDK versions. Keep npm and pnpm for your JavaScript dependencies.
    </p>
    <pre><code
        ><span># Switch the active runtime</span>
$ omg use node 22

<span># Or choose a Python version</span>
$ omg use python 3.12</code
      ></pre>
    <p class="version-files">
      Already have a version file? OMG detects <code>.nvmrc</code>, <code>.node-version</code>,
      <code>.python-version</code>, and <code>.tool-versions</code>.
    </p>
    <a href="/docs/runtimes/">Runtime guide <Icon name="right" size={16} /></a>
  </div>
  <div class="environment">
    <div>
      <h3>Keep a record of your environment.</h3>
      <p>
        Capture a working setup in <code>omg.lock</code> and check another machine for drift. Available
        on Arch, Debian, and Ubuntu.
      </p>
      <a href="/docs/cli/">Environment commands <Icon name="right" size={16} /></a>
    </div>
    <pre><code
        ><span>$</span> omg env capture
<span>$</span> omg env check</code
      ></pre>
  </div>
</section>

<style>
  .workflow {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2rem 5rem;
  }
  h2 {
    font-size: clamp(1.75rem, 2.7vw, 2.4rem);
    font-weight: 680;
    letter-spacing: -0.03em;
    line-height: 1.15;
  }
  .workflow p {
    max-width: 49ch;
    margin-top: 1.25rem;
    color: var(--ink-muted);
    font-size: 0.9375rem;
    line-height: 1.75;
  }
  a {
    display: inline-flex;
    align-items: center;
    gap: 0.75rem;
    min-height: 2.75rem;
    margin-top: 1rem;
    font-size: 0.8125rem;
    font-weight: 600;
    text-decoration: none;
  }
  a:hover {
    color: var(--signal);
  }
  code {
    font-family: var(--font-mono);
  }
  .package-example {
    margin-top: 1.75rem;
    padding-block: 1rem;
    font-size: 0.9375rem;
  }
  .package-example span,
  .environment pre span {
    color: var(--signal);
  }
  .backends {
    margin: 0;
  }
  .backends > div {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    padding-block: 0.75rem;
    border-bottom: 1px solid var(--rule);
    font-size: 0.8125rem;
  }
  dt {
    font-weight: 600;
  }
  dd {
    margin: 0;
    color: var(--ink-muted);
  }
  .runtimes {
    padding: 2rem;
    border-radius: 12px;
    background: var(--paper-raised);
  }
  .runtimes pre {
    margin: 1.75rem 0;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    font-size: 0.8125rem;
    line-height: 1.8;
  }
  .runtimes pre span {
    color: var(--ink-muted);
  }
  .workflow .version-files {
    margin: 0;
    font-size: 0.8125rem;
  }
  .version-files code {
    font-size: 0.75rem;
    color: var(--ink);
  }
  .environment {
    grid-column: 1 / -1;
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    gap: 2rem 4rem;
    padding-top: 2.5rem;
  }
  h3 {
    font-size: 1.375rem;
    font-weight: 650;
    letter-spacing: -0.02em;
  }
  .environment p {
    max-width: 67ch;
    margin-top: 0.75rem;
    font-size: 0.875rem;
  }
  .environment pre {
    margin: 0;
    font-size: 0.9375rem;
    line-height: 2.2;
  }
  @media (max-width: 50rem) {
    .workflow {
      gap: 2rem;
    }
    .runtimes {
      padding: 1.5rem;
    }
  }
  @media (max-width: 40rem) {
    .workflow {
      grid-template-columns: 1fr;
    }
    .environment {
      grid-template-columns: 1fr;
      gap: 1rem;
      padding-top: 1rem;
    }
  }
</style>
