<script lang="ts">
  import Icon from '../../lib/components/Icon.svelte';
  import SeoHead from '../../lib/components/SeoHead.svelte';
  import { onMount } from 'svelte';
  import { invalidate } from '$app/navigation';
  import { SECURITY_CATEGORIES, commitHref } from '../../lib/security-updates';
  import { SITE_ORIGIN, serializeJsonLd } from '../../../../shared/public-site';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  /**
   * The security page is assembled from the live feed at request time, so the
   * markup describes the page and its freshness rather than a fixed article list.
   */
  const structuredData = $derived(
    serializeJsonLd({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'CollectionPage',
          '@id': `${SITE_ORIGIN}/security/#page`,
          url: `${SITE_ORIGIN}/security/`,
          name: 'Security updates for OMG',
          description:
            'Reviewed OMG security improvements, the installation protections behind them, and the exact sources they come from.',
          isPartOf: { '@id': `${SITE_ORIGIN}/#website` },
          publisher: { '@id': `${SITE_ORIGIN}/#org` },
          dateModified: data.feed.syncedAt,
          about: {
            '@type': 'SoftwareApplication',
            name: 'OMG Package Manager',
            applicationCategory: 'DeveloperApplication',
            operatingSystem: 'Linux, macOS, Windows Subsystem for Linux',
            url: `${SITE_ORIGIN}/`,
          },
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_ORIGIN}/` },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Security',
              item: `${SITE_ORIGIN}/security/`,
            },
          ],
        },
      ],
    })
  );
  let category = $state('All updates');
  let repository = $state('all');
  let refreshFailed = $state(false);
  let visible = $derived(
    data.feed.updates.filter(
      update =>
        (category === 'All updates' || update.category === category) &&
        (repository === 'all' || update.repository === repository)
    )
  );
  let referenceTime = $derived(Date.parse(data.feed.syncedAt));
  let recentCount = $derived(
    data.feed.updates.filter(update => {
      const timestamp = Date.parse(update.date);
      return timestamp <= referenceTime && timestamp > referenceTime - 28 * 86_400_000;
    }).length
  );
  function displayDate(date: string): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(date));
  }
  onMount(() => {
    const refresh = () => {
      if (document.visibilityState !== 'visible') return;
      void invalidate('omg:security-updates')
        .then(() => {
          refreshFailed = false;
        })
        .catch(() => {
          refreshFailed = true;
        });
    };
    const timer = window.setInterval(refresh, 300_000);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
    };
  });
</script>

<SeoHead
  title="Security updates — OMG"
  description="Follow OMG security improvements as they land. Repository commit history, installation protections and verifiable changes across OMG and OMG-Web."
  path="/security/"
  {structuredData}
/>

<svelte:head>
  <link
    rel="alternate"
    type="application/json"
    href="/security/feed.json"
    title="OMG security updates feed"
  />
</svelte:head>

<main id="main-content" class="security-shell">
  <header class="hero">
    <h1>Security updates</h1>
    <p class="intro">
      See how OMG verifies packages, limits what runs during installation, and records changes.
    </p>
    <p class="hero-meta">
      <a href="#updates">View recent commits <Icon name="down" size={14} /></a>
      <span class="status-line">{recentCount} commits · last 28 days · 2 repositories</span>
    </p>
  </header>

  <section class="protections" aria-labelledby="protections-heading">
    <h2 id="protections-heading">Protections</h2>
    <dl>
      <div>
        <dt>Before installation</dt>
        <dd>
          <h3>Package verification</h3>
          <p>
            Managed npm tool installs check signatures before activation. Python tool installs
            require wheels by default, keeping source-build execution an explicit exception.
          </p>
        </dd>
      </div>
      <div>
        <dt>During installation</dt>
        <dd>
          <h3>Build isolation</h3>
          <p>
            Managed installers use controlled configuration and Linux privilege restrictions. AUR
            builds use a separate Bubblewrap policy with a private home and no build network by
            default.
          </p>
        </dd>
      </div>
      <div>
        <dt>After installation</dt>
        <dd>
          <h3>Installation receipts</h3>
          <p>
            Managed-tool receipts record policy and executable hashes. Staged replacements and
            activation rollback help preserve a working tool when an update fails.
          </p>
        </dd>
      </div>
    </dl>
    <p class="note">
      These protections were merged in
      <a href="https://github.com/omg-cli/omg/pull/399">PR #399</a> and apply to OMG-managed
      operations, including <code>omg tool install</code>. Selecting Node with OMG does not change
      direct npm commands.
      <a href="https://github.com/omg-cli/omg/blob/main/docs/omarchy.md#compare-the-actual-defaults"
        >Compare the defaults and evidence</a
      >.
    </p>
  </section>

  <section id="updates" class="updates" aria-labelledby="updates-heading">
    <div class="section-heading">
      <h2 id="updates-heading">Recent commits</h2>
      <a href="https://github.com/omg-cli/omg/pull/399"
        >Release hardening PR <Icon name="external" size={14} /></a
      >
    </div>
    <div class="sync-status" role="status">
      <span class="signal-dot" class:muted={data.feed.stale || refreshFailed} aria-hidden="true"
      ></span>
      {#if data.feed.stale || refreshFailed}Showing saved updates · live refresh temporarily
        unavailable{:else}Synced with GitHub · refreshes every 5 minutes{/if}
      <time datetime={data.feed.syncedAt}
        >Last sync {displayDate(data.feed.syncedAt)} · {new Date(data.feed.syncedAt)
          .toISOString()
          .slice(11, 16)} UTC</time
      >
    </div>
    <div class="filters">
      <div class="category-filters" aria-label="Filter security updates">
        {#each SECURITY_CATEGORIES as item (item)}<button
            type="button"
            aria-pressed={category === item}
            onclick={() => {
              category = item;
            }}>{item}</button
          >{/each}
      </div>
      <label
        >Repository <select bind:value={repository}
          ><option value="all">Both projects</option><option value="omg">OMG</option><option
            value="omg-web">OMG-Web</option
          ></select
        ></label
      >
    </div>
    <p class="result-count" aria-live="polite">{visible.length} updates</p>
    <div class="timeline">
      {#each visible as update (update.repository + update.sha)}
        <details>
          <summary
            ><time datetime={update.date}>{displayDate(update.date)}</time>
            <div class="entry-heading">
              <h3>{update.title}</h3>
              <span class="entry-meta"
                >{update.repository === 'omg' ? 'OMG' : 'OMG-Web'} · {update.category} ·
                <span class="branch">{update.branch === 'main' ? 'On main' : 'In review'}</span
                ></span
              >
            </div>
            <svg class="chevron" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"
              ><path
                d="M4 6l4 4 4-4"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              /></svg
            ></summary
          >
          <div class="entry-body">
            <p>
              {update.detail ||
                'This update is recorded in the project’s public commit history. Open the commit for the complete change and discussion.'}
            </p>
            <a class="commit-link" href={commitHref(update)}
              >View commit <code>{update.sha.slice(0, 8)}</code>
              <Icon name="external" size={14} /></a
            >
          </div>
        </details>
      {:else}<div class="empty">
          <h3>No updates in this view.</h3>
          <p>Choose another category or repository to explore the history.</p>
          <button
            type="button"
            class="reset"
            onclick={() => {
              category = 'All updates';
              repository = 'all';
            }}>Show all updates</button
          >
        </div>{/each}
    </div>
    <p class="note">
      Automatically selected from recent public commits with security and hardening titles. Counts
      describe this feed, not vulnerabilities or completed audits. This feed follows main in both
      repositories; review and merge status are labeled on each entry. A commit on main is merged
      but may not be in your installed release —
      <a href="/updates/">check the release notes</a> for the tagged build you use.
    </p>
  </section>

  <section class="reporting" aria-labelledby="reporting-heading">
    <h2 id="reporting-heading">Private security reports</h2>
    <div>
      <p>
        Send a description, the affected version and steps to reproduce. We’ll investigate and work
        toward a fix.
      </p>
      <a href="mailto:olen@latham.cloud"
        >Report a vulnerability <Icon name="external" size={14} /></a
      ><a class="secondary-link" href="/docs/security/">Read the security documentation</a>
    </div>
  </section>
</main>

<style>
  .security-shell {
    width: var(--site-width);
    margin-inline: auto;
    padding-bottom: clamp(3rem, 5vw, 4.5rem);
  }
  a {
    color: var(--ink);
    text-decoration-color: var(--rule-strong);
    text-underline-offset: 0.25em;
  }
  a:hover {
    color: var(--signal);
    text-decoration-color: currentColor;
  }
  a:focus-visible,
  button:focus-visible,
  select:focus-visible,
  summary:focus-visible {
    outline: 2px solid var(--signal);
    outline-offset: 2px;
  }

  /* Hero */
  .hero {
    padding-block: clamp(2.5rem, 5vw, 4rem) clamp(2rem, 4vw, 3rem);
  }
  h1 {
    margin: 0;
    font-family: var(--font-display);
    font-size: var(--page-title);
    font-weight: 680;
    line-height: 1.1;
    letter-spacing: -0.035em;
    text-wrap: balance;
  }
  .intro {
    max-width: 51ch;
    margin: 1rem 0 1.5rem;
    color: var(--ink-body);
    font-size: 1.0625rem;
    line-height: 1.65;
  }
  .hero-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.5rem 1.5rem;
    margin: 0;
  }
  .hero-meta a {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.9375rem;
    font-weight: 600;
  }
  .status-line {
    color: var(--ink-muted);
    font-family: var(--font-mono);
    font-size: 0.75rem;
  }

  /* Shared headings */
  h2 {
    margin: 0;
    font-family: var(--font-display);
    font-size: clamp(1.375rem, 2.2vw, 1.75rem);
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: -0.015em;
  }
  .note {
    max-width: 48rem;
    margin: 2rem 0 0;
    color: var(--ink-muted);
    font-size: 0.875rem;
    line-height: 1.75;
  }
  .note a {
    color: inherit;
  }
  .note a:hover {
    color: var(--signal);
  }
  code {
    font-family: var(--font-mono);
    font-size: 0.875em;
  }

  /* Protections */
  .protections {
    padding-block: clamp(2rem, 4vw, 3rem);
  }
  dl {
    display: grid;
    gap: 2rem;
    margin: 2rem 0 0;
  }
  dl > div {
    display: grid;
    grid-template-columns: 12rem minmax(0, 1fr);
    gap: 0.5rem 2rem;
  }
  dt {
    padding-top: 0.15rem;
    color: var(--ink-muted);
    font-size: 0.9375rem;
    font-weight: 500;
  }
  dd {
    margin: 0;
    max-width: 60ch;
  }
  dd h3 {
    margin: 0 0 0.35rem;
    font-family: var(--font-display);
    font-size: 1.125rem;
    font-weight: 650;
    letter-spacing: -0.02em;
  }
  dd p {
    margin: 0;
    color: var(--ink-body);
    font-size: 0.9375rem;
    line-height: 1.75;
  }

  /* Recent commits */
  .updates {
    padding-block: clamp(3rem, 5vw, 4.5rem);
    scroll-margin-top: 5rem;
  }
  .section-heading {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.5rem 2rem;
    margin-bottom: 1rem;
  }
  .section-heading > a {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.875rem;
    white-space: nowrap;
  }
  .sync-status {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.4rem 0.6rem;
    color: var(--ink-muted);
    font-family: var(--font-mono);
    font-size: 0.75rem;
    line-height: 1.6;
  }
  .sync-status time::before {
    content: '·';
    margin-right: 0.6rem;
  }
  .signal-dot {
    display: inline-block;
    width: 0.4rem;
    height: 0.4rem;
    flex: 0 0 auto;
    background: var(--signal);
    border-radius: 50%;
  }
  .signal-dot.muted {
    background: var(--ink-muted);
  }
  .filters {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 0.5rem 1.5rem;
    margin-top: 1.75rem;
    border-bottom: 1px solid var(--rule);
  }
  .category-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 0 1.25rem;
  }
  .category-filters button {
    min-height: 2.75rem;
    margin-bottom: -1px;
    padding: 0;
    border: 0;
    border-bottom: 2px solid transparent;
    background: none;
    color: var(--ink-muted);
    font: inherit;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
  }
  .category-filters button:hover {
    color: var(--ink);
  }
  .category-filters button[aria-pressed='true'] {
    color: var(--ink);
    border-bottom-color: var(--signal);
  }
  label {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    color: var(--ink-muted);
    font-size: 0.875rem;
  }
  select {
    min-height: 2.25rem;
    padding: 0.35rem 0.6rem;
    border: 1px solid var(--rule);
    border-radius: 6px;
    background: var(--paper);
    color: var(--ink);
    font: inherit;
    font-size: 0.875rem;
    cursor: pointer;
  }
  select:hover {
    border-color: var(--rule-strong);
  }
  .result-count {
    margin: 1rem 0 0.25rem;
    color: var(--ink-muted);
    font-family: var(--font-mono);
    font-size: 0.75rem;
  }
  details {
    border-bottom: 1px solid var(--rule);
  }
  summary {
    display: grid;
    grid-template-columns: 7.5rem minmax(0, 1fr) auto;
    align-items: baseline;
    gap: 1.5rem;
    padding: 1rem 0;
    cursor: pointer;
    list-style: none;
  }
  summary::-webkit-details-marker {
    display: none;
  }
  summary > time {
    color: var(--ink-muted);
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    white-space: nowrap;
  }
  .entry-heading h3 {
    margin: 0;
    font-size: 0.9375rem;
    font-weight: 550;
    line-height: 1.5;
    overflow-wrap: anywhere;
  }
  summary:hover h3 {
    color: var(--signal);
  }
  .entry-meta {
    display: block;
    margin-top: 0.15rem;
    color: var(--ink-muted);
    font-size: 0.8125rem;
  }
  .chevron {
    align-self: center;
    color: var(--ink-muted);
    transition: transform 150ms ease;
  }
  details[open] .chevron {
    transform: rotate(180deg);
  }
  .entry-body {
    padding: 0 2rem 1.25rem 9rem;
    max-width: 65rem;
  }
  .entry-body p {
    margin: 0 0 0.5rem;
    color: var(--ink-body);
    font-size: 0.9375rem;
    line-height: 1.75;
    white-space: pre-line;
    overflow-wrap: break-word;
  }
  .commit-link {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    min-height: 2.75rem;
    font-size: 0.875rem;
  }
  .empty {
    padding: 2.5rem 0;
  }
  .empty h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
  }
  .empty p {
    color: var(--ink-muted);
  }
  .reset {
    min-height: 2.75rem;
    padding: 0;
    border: 0;
    background: none;
    color: var(--ink);
    font: inherit;
    font-size: 0.9375rem;
    font-weight: 600;
    text-decoration: underline;
    text-decoration-color: var(--rule-strong);
    text-underline-offset: 0.25em;
    cursor: pointer;
  }
  .reset:hover {
    color: var(--signal);
  }

  /* Reporting */
  .reporting {
    display: grid;
    grid-template-columns: 14rem minmax(0, 1fr);
    gap: 1rem 2rem;
    padding-top: clamp(2rem, 4vw, 3rem);
  }
  .reporting h2 {
    font-size: 1.375rem;
    font-weight: 650;
    letter-spacing: -0.02em;
  }
  .reporting p {
    max-width: 51ch;
    margin: 0 0 0.5rem;
    color: var(--ink-body);
    line-height: 1.75;
  }
  .reporting a {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    min-height: 2.75rem;
    margin-right: 1.5rem;
    font-size: 0.9375rem;
    font-weight: 600;
  }
  .reporting .secondary-link {
    color: var(--ink-muted);
    font-weight: 500;
  }
  .reporting .secondary-link:hover {
    color: var(--signal);
  }

  @media (max-width: 48rem) {
    dl > div,
    .reporting {
      grid-template-columns: 1fr;
    }
    dl {
      gap: 1.75rem;
    }
    summary {
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 0.25rem 1rem;
    }
    summary > time {
      grid-column: 1;
    }
    .entry-heading {
      grid-column: 1;
      grid-row: 2;
    }
    .chevron {
      grid-column: 2;
      grid-row: 1 / span 2;
    }
    .entry-body {
      padding: 0 0 1.25rem;
    }
    .filters {
      align-items: stretch;
      border-bottom: 0;
    }
    .category-filters {
      width: 100%;
      border-bottom: 1px solid var(--rule);
    }
    label {
      padding-block: 0.5rem;
    }
  }
</style>
