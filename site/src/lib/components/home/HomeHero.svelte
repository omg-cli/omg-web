<script lang="ts">
  import Icon from '../Icon.svelte';

  import HomeTerminal from './HomeTerminal.svelte';
</script>

<section class="hero home-shell" aria-labelledby="hero-title">
  <div class="hero-copy">
    <h1 id="hero-title">Packages.<br />Runtimes.<br /><span>One command.</span></h1>
    <p class="hero-description">
      Your system packages and language versions, managed together. A free, open-source CLI built in
      Rust.
    </p>
    <nav class="hero-actions" aria-label="Homepage introduction">
      <a class="primary-link" href="#install">Install OMG <Icon name="down" size={17} /></a>
      <a class="docs-link" href="/docs/">Read the docs <Icon name="right" size={17} /></a>
    </nav>
    <p class="platforms">Linux x86_64 <span> / </span> macOS Apple Silicon <span> / </span> WSL2</p>
  </div>

  <HomeTerminal />

  <div class="runtime-strip">
    <p>Your languages. Your package manager.</p>
    <nav aria-label="Supported runtime guides">
      <a href="/runtimes/node/">Node.js</a><a href="/runtimes/python/">Python</a><a
        href="/runtimes/go/">Go</a
      ><a href="/runtimes/rust/">Rust</a><a href="/runtimes/bun/">Bun</a>
    </nav>
    <a class="all-runtimes" href="/runtimes/">Runtime guides <Icon name="right" size={16} /></a>
  </div>
</section>

<style>
  .hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.08fr);
    column-gap: clamp(2rem, 5vw, 5rem);
    padding-top: clamp(3.5rem, 7vw, 6rem);
  }
  .hero-copy {
    padding-block: 0.5rem 2.75rem;
  }
  h1 {
    margin: 0;
    font-size: clamp(3rem, 5.25vw, 4.75rem);
    font-weight: 630;
    letter-spacing: -0.04em;
    line-height: 1.04;
  }
  h1 > span {
    color: var(--signal);
  }
  .hero-description {
    max-width: 35ch;
    margin: 1.75rem 0;
    color: var(--ink-muted);
    font-size: 1.0625rem;
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
    gap: 1rem;
    font-size: 0.875rem;
    font-weight: 600;
    text-decoration: none;
  }
  .primary-link {
    padding: 0.75rem 1.25rem;
    border-radius: 6px;
    background: var(--signal);
    color: var(--signal-ink);
    transition: background 160ms ease-out;
  }
  .primary-link:hover {
    background: var(--signal-hover);
  }
  .docs-link:hover {
    color: var(--signal);
  }
  .platforms {
    margin: 1.25rem 0 0;
    color: var(--ink-muted);
    font-size: 0.6875rem;
    line-height: 1.8;
  }
  .platforms span {
    padding-inline: 0.35rem;
    color: #92988b;
  }
  .runtime-strip {
    grid-column: 1 / -1;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem 2rem;
    margin-top: 3.5rem;
    padding-block: 1.25rem;
    border-block: 1px solid var(--rule);
  }
  .runtime-strip p {
    margin: 0;
    font-size: 0.75rem;
    color: var(--ink-muted);
  }
  .runtime-strip nav {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem 1.75rem;
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
    .hero {
      grid-template-columns: 1fr;
    }
    .hero-copy {
      max-width: 36rem;
    }
    .hero-description {
      max-width: 45ch;
    }
    h1 {
      font-size: clamp(3rem, 8.5vw, 4.5rem);
    }
    .runtime-strip {
      margin-top: 2rem;
    }
  }
  @media (max-width: 30rem) {
    .runtime-strip {
      gap: 0.5rem;
    }
    .runtime-strip nav {
      width: 100%;
      gap: 1.25rem;
    }
    .runtime-strip .all-runtimes {
      margin-left: 0;
    }
  }
</style>
