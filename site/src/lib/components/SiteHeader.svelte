<script lang="ts">
  import BrandMark from './BrandMark.svelte';
  import { page } from '$app/state';
  import Icon from './Icon.svelte';
  import ThemeToggle from './ThemeToggle.svelte';

  function closeMenu(event: MouseEvent): void {
    if (event.currentTarget instanceof HTMLAnchorElement) {
      event.currentTarget.closest('details')?.removeAttribute('open');
    }
  }
  const links = [
    { href: '/runtimes/', label: 'Runtimes' },
    { href: '/guides/', label: 'Guides' },
    { href: '/docs/', label: 'Docs' },
    { href: '/security/', label: 'Security' },
  ];
</script>

<header class="site-header">
  <nav class="header-shell" aria-label="Primary navigation">
    <a class="brand" href="/" aria-label="OMG Package Manager home">
      <BrandMark />
    </a>

    <div class="primary-nav">
      <ul class="primary-links">
        {#each links as link (link.href)}
          <li>
            <a
              href={link.href}
              aria-current={page.url.pathname.startsWith(link.href) ? 'page' : undefined}
              >{link.label}</a
            >
          </li>
        {/each}
        <li>
          <a href="https://github.com/omg-cli/omg/" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </li>
      </ul>
    </div>

    <details class="mobile-menu">
      <summary>Menu</summary>
      <ul>
        {#each links as link (link.href)}
          <li><a href={link.href} onclick={closeMenu}>{link.label}</a></li>
        {/each}
        <li><a href="/compare/" onclick={closeMenu}>Comparisons</a></li>
        <li><a href="/dashboard/" onclick={closeMenu}>Account</a></li>
        <li><a href="https://github.com/omg-cli/omg/">GitHub</a></li>
        <li class="mobile-theme"><ThemeToggle showLabel /></li>
      </ul>
    </details>

    <div class="account-actions">
      <div class="desktop-theme"><ThemeToggle /></div>
      <a class="account-link" href="/dashboard/">Account</a>
      <a class="primary-action" href="/#install">Install OMG <Icon name="down" size={15} /></a>
    </div>
  </nav>
</header>

<style>
  .site-header {
    position: relative;
    z-index: 20;
    border-bottom: 1px solid var(--rule);
    background: var(--paper);
  }
  .header-shell {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    width: min(100% - clamp(2.5rem, 8vw, 8rem), 75rem);
    min-height: 4.5rem;
    margin: 0 auto;
    gap: 2.5rem;
  }
  .brand,
  .primary-links a,
  .account-link,
  .primary-action {
    display: flex;
    min-height: 2.75rem;
    align-items: center;
    text-decoration: none;
  }
  .brand {
    align-self: center;
  }
  .primary-nav {
    min-width: 0;
    height: 100%;
  }
  .primary-links {
    display: flex;
    height: 100%;
    align-items: center;
    gap: 1.5rem;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .primary-links a,
  .account-link {
    color: var(--ink-muted);
    font-size: 0.8125rem;
    font-weight: 500;
  }
  .primary-links a:hover,
  .account-link:hover,
  .primary-links a[aria-current='page'] {
    color: var(--signal);
  }
  .account-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  .primary-action {
    gap: 0.75rem;
    justify-content: center;
    padding: 0.65rem 1rem;
    border: 1px solid var(--rule-strong);
    border-radius: 6px;
    color: var(--ink);
    font-size: 0.75rem;
    font-weight: 600;
  }
  .primary-action:hover {
    border-color: var(--signal);
    background: var(--signal);
    color: var(--signal-ink);
  }
  .mobile-menu {
    display: none;
    align-self: center;
    font-size: 0.8125rem;
  }
  .mobile-menu summary {
    white-space: nowrap;
    min-height: 2.75rem;
    padding: 0.75rem 0.25rem;
    cursor: pointer;
  }
  .mobile-menu summary:hover {
    color: var(--signal);
  }
  .mobile-menu ul {
    position: absolute;
    inset: 100% 0 auto;
    margin: 0;
    padding: 1rem;
    list-style: none;
    border-bottom: 1px solid var(--rule);
    background: var(--paper);
    box-shadow: 0 12px 20px rgb(0 0 0 / 0.08);
  }
  .mobile-menu a {
    display: block;
    padding: 0.875rem;
    color: var(--ink);
    border-radius: 4px;
    text-decoration: none;
  }
  .mobile-menu a:hover {
    background: var(--paper-raised);
    color: var(--signal);
  }
  .mobile-theme {
    padding: 0.5rem 0.875rem;
  }
  @media (max-width: 63.99rem) {
    .header-shell {
      gap: 1rem;
    }
    .primary-links {
      gap: 1rem;
    }
    .account-actions {
      gap: 1rem;
    }
  }
  @media (max-width: 49.99rem) {
    .header-shell {
      grid-template-columns: auto minmax(0, 1fr) auto;
      min-height: 4.5rem;
      gap: 0.75rem;
    }
    .account-link,
    .desktop-theme,
    .primary-nav {
      display: none;
    }
    .mobile-menu {
      display: block;
      justify-self: end;
    }
    .primary-action {
      padding-inline: 0.75rem;
      font-size: 0.6875rem;
      gap: 0.5rem;
    }
  }
  @media (max-width: 24rem) {
    .header-shell {
      gap: 0.5rem;
    }
    .brand :global(.brand-mark) {
      width: 5.25rem;
    }
  }
</style>
