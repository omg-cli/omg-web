<script lang="ts">
  import Icon from '../Icon.svelte';
  import HomeTerminal from './HomeTerminal.svelte';
</script>

<section class="hero home-shell" aria-labelledby="hero-title">
  <h1 id="hero-title">One CLI for system packages and language runtimes.</h1>
  <HomeTerminal />
  <nav class="hero-actions" aria-label="Homepage introduction">
    <a class="primary-link" href="#install">Install OMG <Icon name="down" size={17} /></a>
    <a href="/docs/">Read the docs <Icon name="right" size={17} /></a>
  </nav>
</section>

<style>
  .hero {
    padding-block: clamp(1.5rem, 3vw, 2.75rem);
  }
  h1 {
    max-width: 30ch;
    margin: 0 0 clamp(1.25rem, 2.5vw, 2rem);
    font-size: clamp(2rem, 3.7vw, 3.4rem);
    font-weight: 720;
    letter-spacing: -0.035em;
    line-height: 1.08;
    text-wrap: balance;
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
  .hero-actions .primary-link {
    padding: 0.65rem 1rem;
    border-radius: 6px;
    background: var(--signal);
    color: var(--signal-ink);
  }
  .hero-actions .primary-link:hover {
    background: var(--signal-hover);
  }
</style>
