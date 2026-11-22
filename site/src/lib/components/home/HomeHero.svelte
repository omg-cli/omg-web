<script lang="ts">
  import Icon from '../Icon.svelte';
  import HomeTerminal from './HomeTerminal.svelte';
</script>

<section class="hero home-shell" aria-labelledby="hero-title">
  <div class="intro">
    <h1 id="hero-title">
      <span class="tools"
        ><code>pacman</code>, <code>apt</code>, <code>dnf</code>, <code>brew</code>,
        <code>nvm</code>, <code>pyenv</code>.</span
      >
      One command.
    </h1>
    <p class="lede">
      OMG installs system packages through your platform’s own package manager and switches language
      runtimes per project, from the same CLI.
    </p>
  </div>
  <HomeTerminal />
  <nav class="hero-actions" aria-label="Homepage introduction">
    <a href="#install">Install OMG <Icon name="down" size={17} /></a>
    <a href="/docs/">Read the docs <Icon name="right" size={17} /></a>
  </nav>
</section>

<style>
  .hero {
    padding-block: clamp(1.5rem, 3vw, 2.75rem);
  }
  .intro {
    margin: 0 0 clamp(1.25rem, 2.5vw, 2rem);
  }
  h1 {
    max-width: 30ch;
    margin: 0;
    font-size: var(--page-title);
    font-weight: 720;
    letter-spacing: -0.035em;
    line-height: 1.08;
    text-wrap: balance;
  }
  .tools {
    display: block;
    margin-bottom: 0.35em;
    color: var(--ink-muted);
    font-size: 0.5em;
    font-weight: 400;
    letter-spacing: 0;
    line-height: 1.5;
  }
  .tools code {
    font-family: var(--font-mono);
    font-weight: 500;
    text-decoration: line-through;
    text-decoration-color: var(--signal);
    text-decoration-thickness: 0.08em;
  }
  .lede {
    max-width: 36ch;
    margin: 1.25rem 0 0;
    color: var(--ink-body);
    font-size: 1.0625rem;
    line-height: 1.6;
  }
  @media (max-width: 40rem) {
    .hero {
      padding-block: 0.75rem 1.75rem;
    }
    .intro {
      margin-bottom: 0.85rem;
    }
    .lede {
      margin-top: 0.6rem;
      font-size: 0.875rem;
      line-height: 1.45;
    }
  }
  @media (max-width: 40rem) and (max-height: 40rem) {
    .lede {
      display: none;
    }
  }
  .hero-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem 1.5rem;
    margin-top: 1.25rem;
  }
  .hero-actions a {
    display: inline-flex;
    min-height: 2.75rem;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.875rem;
    font-weight: 600;
    text-decoration: none;
  }
  .hero-actions a:hover {
    color: var(--signal);
  }
  @media (min-width: 64rem) {
    .hero {
      display: grid;
      grid-template-columns: minmax(16rem, 0.77fr) minmax(0, 1.23fr);
      grid-template-rows: 1fr auto 1fr;
      column-gap: clamp(2rem, 4vw, 4rem);
      padding-block: clamp(3rem, 6vw, 6rem);
      align-items: start;
    }
    .intro {
      grid-column: 1;
      grid-row: 2;
      margin: 0;
    }
    .hero :global(.command-workbench) {
      grid-column: 2;
      grid-row: 1 / 4;
      align-self: center;
    }
    .hero-actions {
      grid-column: 1;
      grid-row: 3;
      align-self: start;
    }
  }
</style>
