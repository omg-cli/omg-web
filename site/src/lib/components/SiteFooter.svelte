<script lang="ts">
  import BrandMark from './BrandMark.svelte';
  import Icon from './Icon.svelte';
</script>

<footer class="site-footer">
  <section class="footer-callout" aria-labelledby="footer-callout-title">
    <div>
      <h2 id="footer-callout-title">Built in the open.</h2>
      <p>Free under the MIT license. No account needed to use the CLI.</p>
    </div>
    <a class="source-link" href="https://github.com/omg-cli/omg"
      >Explore the source<Icon name="external" size={18} /></a
    >
  </section>

  <div class="footer-bar">
    <a class="footer-brand" href="/" aria-label="OMG Package Manager home">
      <BrandMark />
    </a>

    <nav aria-label="Footer navigation">
      <ul class="footer-links">
        <li><a href="/runtimes/">Runtimes</a></li>
        <li><a href="/guides/">Guides</a></li>
        <li><a href="/compare/">Comparisons</a></li>
        <li><a href="/docs/">Docs</a></li>
        <li><a href="/updates/">Updates</a></li>
        <li><a href="/security/">Security</a></li>
        <li>
          <a href="https://github.com/omg-cli/omg" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </li>
        <li>
          <a href="https://latham.cloud/work/omg" target="_blank" rel="noopener">
            Built by Olen Latham
          </a>
        </li>
        <li><a href="/privacy/">Privacy</a></li>
        <li><a href="/terms/">Terms</a></li>
      </ul>
    </nav>
  </div>
</footer>

<style>
  .site-footer {
    width: min(100% - clamp(2.5rem, 8vw, 8rem), 75rem);
    margin: 0 auto;
    border-top: 1px solid var(--rule);
  }
  .footer-callout {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 1.5rem 3rem;
    padding-block: 2.5rem;
  }
  h2 {
    margin: 0;
    font-size: 1.375rem;
    font-weight: 600;
    letter-spacing: -0.025em;
  }
  .footer-callout p {
    margin: 0.5rem 0 0;
    color: var(--ink-muted);
    font-size: 0.8125rem;
  }
  .source-link {
    display: inline-flex;
    min-height: 2.75rem;
    align-items: center;
    gap: 0.75rem;
    font-size: 0.8125rem;
    font-weight: 500;
    text-decoration: none;
  }
  .source-link:hover {
    color: var(--signal);
  }
  .footer-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem 2rem;
    align-items: center;
    justify-content: space-between;
    padding-block: 1.25rem;
    border-top: 1px solid var(--rule);
  }
  .footer-brand {
    color: var(--ink);
    text-decoration: none;
  }
  .footer-links {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem 1.25rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .footer-links a {
    display: inline-flex;
    min-height: 2.75rem;
    align-items: center;
    color: var(--ink-muted);
    font-size: 0.6875rem;
    text-decoration: none;
  }
  .footer-links a:hover {
    color: var(--signal);
  }
  @media (max-width: 39.99rem) {
    .footer-bar {
      align-items: flex-start;
      flex-direction: column;
    }
    .footer-links {
      gap: 0.25rem 1.25rem;
    }
  }
</style>
