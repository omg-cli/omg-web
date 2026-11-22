<script lang="ts">
  import { page } from '$app/state';
  import Icon from '../lib/components/Icon.svelte';
</script>

<svelte:head>
  <title>{page.status === 404 ? 'Page not found' : 'Request failed'} - OMG Package Manager</title>
  <meta name="description" content="The requested OMG page could not be loaded." />
  <meta name="robots" content="noindex, follow" />
</svelte:head>

<main id="main-content" class="error-shell">
  <p class="error-status">HTTP {page.status}</p>
  <h1 class="error-title">
    {page.status === 404 ? 'This page does not exist.' : 'This request did not complete.'}
  </h1>
  <p class="error-copy">
    {page.status === 404
      ? 'The address may be mistyped or the page moved.'
      : 'Try again in a moment.'}
  </p>
  <nav class="error-links" aria-label="Recovery links">
    <a href="/"><Icon name="left" size={15} /> Back to home</a>
    <a href="/docs/">Read the docs <Icon name="right" size={15} /></a>
  </nav>
</main>

<style>
  .error-shell {
    display: grid;
    width: var(--site-width);
    min-height: calc(100dvh - 10rem);
    margin-inline: auto;
    align-content: center;
    padding-block: clamp(3rem, 7vw, 6rem);
  }

  .error-status {
    margin: 0 0 0.75rem;
    color: var(--signal);
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    font-weight: 500;
  }

  .error-title {
    max-width: 18ch;
    margin: 0;
    font-family: var(--font-display);
    font-size: var(--page-title);
    font-weight: 700;
    letter-spacing: -0.035em;
    line-height: 1.08;
  }

  .error-copy {
    max-width: 42ch;
    margin: 1rem 0 0;
    color: var(--ink-body);
    font-size: 1.0625rem;
    line-height: 1.65;
  }

  .error-links {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem 1.75rem;
    margin-top: 1.75rem;
  }

  .error-links a {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    min-height: 2.75rem;
    font-size: 0.875rem;
    font-weight: 600;
    text-decoration: none;
  }

  .error-links a:hover {
    color: var(--signal);
  }
</style>
