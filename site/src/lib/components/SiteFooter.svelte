<script lang="ts">
  import BrandMark from './BrandMark.svelte';
  import Icon from './Icon.svelte';
</script>

<footer class="site-footer">
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
        <li><a href="/privacy/">Privacy</a></li>
        <li><a href="/terms/">Terms</a></li>
      </ul>
    </nav>
  </div>
  <div class="footer-meta">
    <p>Built by <a href="https://latham.cloud/work/omg">Olen Latham</a>. No account required.</p>
    <div class="source-links">
      <a href="https://github.com/omg-cli/omg">Source <Icon name="external" size={14} /></a>
      <a href="https://opensource.org/licenses/MIT"
        >MIT license <Icon name="external" size={14} /></a
      >
    </div>
  </div>
</footer>

<style>
  .site-footer {
    width: var(--site-width);
    margin: 0 auto;
  }
  .footer-meta {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 0 1.5rem;
    padding-bottom: 1.5rem;
    color: var(--ink-muted);
    font-size: 0.75rem;
  }
  .footer-meta p {
    margin: 0;
    line-height: 1.65;
  }
  .footer-meta a {
    color: inherit;
    text-underline-offset: 0.2em;
  }
  .footer-meta a:hover {
    color: var(--signal);
  }
  .source-links {
    display: flex;
    gap: 1.5rem;
  }
  .source-links a {
    display: inline-flex;
    min-height: 2.75rem;
    align-items: center;
    gap: 0.4rem;
  }
  .footer-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem 2rem;
    align-items: center;
    justify-content: space-between;
    padding-block: 1.25rem;
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
  }
</style>
