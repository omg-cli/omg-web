<script lang="ts">
  import Icon from '../Icon.svelte';
  import HomeTerminal from './HomeTerminal.svelte';
</script>

<section class="hero home-shell" aria-labelledby="hero-title">
  <div class="introduction">
    <h1 id="hero-title">A simpler way to manage packages and runtimes.</h1>
    <div class="hero-copy">
      <p>
        Meet OMG. Search and install system packages, switch language versions, and check your
        environment from one open-source CLI.
      </p>
      <nav class="hero-actions" aria-label="Homepage introduction">
        <a class="primary-link" href="#install">Install OMG <Icon name="down" size={17} /></a>
        <a class="docs-link" href="/docs/">Read the docs <Icon name="right" size={17} /></a>
      </nav>
      <p class="platforms">Linux x86_64 · macOS Apple Silicon · WSL2</p>
    </div>
  </div>
  <HomeTerminal />
  <div class="runtime-strip">
    <p>Language versions, managed together.</p>
    <nav aria-label="Supported language guides">
      <a href="/runtimes/node/">JavaScript</a>
      <a href="/runtimes/python/">Python</a>
      <a href="/runtimes/go/">Go</a>
      <a href="/runtimes/rust/">Rust</a>
      <a href="/docs/runtimes/#supported">Ruby</a>
      <a href="/docs/runtimes/#supported">Java</a>
      <a href="/docs/runtimes/#supported">Zig</a>
      <a href="/docs/runtimes/#supported">Erlang</a>
      <a href="/docs/runtimes/#supported">PHP</a>
      <a href="/docs/runtimes/#supported">Swift</a>
    </nav>
    <a class="all-runtimes" href="/runtimes/"
      >Browse runtime guides <Icon name="right" size={16} /></a
    >
  </div>
</section>

<style>
  .hero {
    padding-top: clamp(2.5rem, 5vw, 4.5rem);
  }
  .introduction {
    display: grid;
    grid-template-columns: 1.22fr 1fr;
    align-items: center;
    gap: 2rem 5rem;
    margin-bottom: 2.75rem;
  }
  h1 {
    max-width: 17ch;
    margin: 0;
    font-size: clamp(2.5rem, 4.3vw, 3.75rem);
    font-weight: 720;
    letter-spacing: -0.035em;
    line-height: 1.08;
    text-wrap: balance;
  }
  .hero-copy > p:first-child {
    max-width: 47ch;
    margin: 0 0 1.5rem;
    color: var(--ink-muted);
    font-size: 1rem;
    line-height: 1.75;
  }
  .hero-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem 1.5rem;
  }
  .primary-link,
  .docs-link {
    display: inline-flex;
    min-height: 3rem;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    font-size: 0.875rem;
    font-weight: 600;
    text-decoration: none;
  }
  .primary-link {
    padding: 0.75rem 1.1rem;
    border-radius: 6px;
    background: var(--signal);
    color: var(--signal-ink);
  }
  .primary-link:hover {
    background: var(--signal-hover);
  }
  .docs-link:hover {
    color: var(--signal);
  }
  .platforms {
    margin: 1rem 0 0;
    color: var(--ink-muted);
    font-size: 0.75rem;
  }
  .runtime-strip {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem 2rem;
    padding-block: 1.25rem;
  }
  .runtime-strip p {
    margin: 0;
    font-size: 0.8125rem;
    color: var(--ink-muted);
  }
  .runtime-strip nav {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem 1.75rem;
  }
  .runtime-strip a {
    display: inline-flex;
    align-items: center;
    min-height: 2.75rem;
    text-decoration: none;
    font-size: 0.875rem;
    font-weight: 600;
  }
  .runtime-strip a:hover {
    color: var(--signal);
  }
  .runtime-strip .all-runtimes {
    gap: 0.6rem;
    margin-left: auto;
    color: var(--ink-muted);
    font-size: 0.75rem;
    font-weight: 400;
  }
  @media (max-width: 55rem) {
    .introduction {
      grid-template-columns: 1fr;
      gap: 1.25rem;
      margin-bottom: 2rem;
    }
    h1 {
      max-width: 23ch;
    }
    .hero-copy > p:first-child {
      max-width: 60ch;
    }
  }
  @media (max-width: 35rem) {
    h1 {
      font-size: 2.5rem;
    }
    .runtime-strip {
      gap: 0.25rem;
    }
    .runtime-strip nav {
      width: 100%;
      gap: 0.5rem 1.5rem;
    }
    .runtime-strip .all-runtimes {
      margin-left: 0;
    }
  }
</style>
