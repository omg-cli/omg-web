<script lang="ts">
  import SeoHead from '../../lib/components/SeoHead.svelte';
  import { serializeJsonLd, SITE_ORIGIN } from '../../../../shared/public-site';
  import DocsSearchForm from '../../lib/components/docs/DocsSearchForm.svelte';
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();
  import { DOCS_TOPICS, docsTopicHref } from '../../lib/docs/topics';

  const canonicalUrl = `${SITE_ORIGIN}/docs/`;
  const sourceDocsUrl = `https://github.com/omg-cli/omg/tree/${DOCS_TOPICS[0].source.reviewedCommit}/docs`;
  const installCommand = `curl -fsSL ${SITE_ORIGIN}/install.sh -o omg-install.sh\nless omg-install.sh && bash omg-install.sh`;
  const structuredData = serializeJsonLd({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_ORIGIN}/` },
          { '@type': 'ListItem', position: 2, name: 'Docs', item: canonicalUrl },
        ],
      },
      {
        '@type': 'CollectionPage',
        name: 'OMG Documentation',
        description:
          'Install OMG, learn its package and runtime commands, capture supported system state, check drift, and browse the curated handbook.',
        url: canonicalUrl,
        isPartOf: { '@id': `${SITE_ORIGIN}/#website` },
        hasPart: DOCS_TOPICS.map(topic => ({
          '@type': 'TechArticle',
          name: topic.title,
          url: `${SITE_ORIGIN}${docsTopicHref(topic.slug)}`,
        })),
      },
    ],
  });

  const commandGroups = [
    {
      title: 'Install and manage system packages',
      description:
        'Search, inspect, install, update, and remove packages through the native backend.',
      commands: ['omg search ripgrep', 'omg info ripgrep', 'omg install ripgrep', 'omg update'],
    },
    {
      title: 'Manage Node.js, Python, Go, and Rust versions',
      description: 'Install and select language versions without learning another version manager.',
      commands: ['omg use node 22', 'omg use python 3.12', 'omg use rust stable'],
    },
    {
      title: 'Capture and compare project environments',
      description:
        'On Arch, Debian, and Ubuntu, capture supported package and runtime state, check drift, and fetch a shared lockfile for comparison.',
      commands: ['omg env capture', 'omg env check', 'omg env sync <share-url>'],
    },
  ] as const;
</script>

<SeoHead
  title="OMG Documentation - Install, Commands, and Platforms"
  description="Install OMG, learn its package and runtime commands, capture supported system state, check drift, and browse the curated handbook."
  path="/docs/"
  {structuredData}
/>

<main id="main-content" class="docs-shell">
  <header class="docs-hero">
    <div>
      <h1>Learn the parts you need.</h1>
    </div>
    <p class="hero-copy">
      Start with a task, search for a command, or open the reference when you need exact behavior.
      Browse <a href="/runtimes/">runtime setup guides</a>
      or learn to
      <a href="/guides/node-npm-pnpm/">use Node.js, npm, and pnpm together</a>.
      <a href="/updates/">Read release notes and updates.</a>
    </p>
  </header>

  <div class="docs-layout">
    <aside class="docs-aside">
      <nav class="section-nav" aria-label="Documentation sections">
        <DocsSearchForm />
        <ul>
          <li><a href="#install">Install</a></li>
          <li><a href="#quick-start">Quick start</a></li>
          <li><a href="#platforms">Platforms</a></li>
          <li><a href="#guides">Guides by task</a></li>
          <li><a href="#reference">Handbook</a></li>
        </ul>
      </nav>
    </aside>

    <article>
      <section id="install" class="docs-section">
        <h2>Install OMG</h2>
        <p class="section-copy">
          The universal installer detects Linux or macOS and downloads the matching release. On
          Windows, run it inside WSL2. The GitHub CLI (gh) is required to verify the release
          attestation. Download the script, review it, then run it.
        </p>
        <pre class="install-command"><code><span>$ </span>{installCommand}</code></pre>
        <p class="install-note">
          Prefer a direct download? <a href="https://github.com/omg-cli/omg/releases"
            >Download release binaries on GitHub</a
          >.
        </p>
        <p class="install-note">
          The handbook and operational guides describe release v0.1.224. Newer development-only
          behavior is labeled separately. Check the source and review date on each page.
        </p>
      </section>

      <section id="quick-start" class="docs-section">
        <h2>Quick start</h2>
        <p class="section-copy">
          Package operations, runtime selection, and environment state use the same command surface.
        </p>
        <div class="command-groups">
          {#each commandGroups as group (group.title)}
            <section class="command-group">
              <div>
                <h3>{group.title}</h3>
                <p>{group.description}</p>
              </div>
              <pre><code>{group.commands.map(command => `$ ${command}`).join('\n')}</code></pre>
            </section>
          {/each}
        </div>
      </section>

      <section id="platforms" class="docs-section">
        <h2>Platforms: Arch, Debian, Ubuntu, Fedora, and macOS</h2>
        <dl class="platform-list">
          <div>
            <dt>Linux</dt>
            <dd>
              Arch, Debian 12, Ubuntu 24.04, and Fedora releases. RHEL and CentOS-family hosts
              receive a Fedora-artifact fallback; that is not a compatibility guarantee.
            </dd>
          </div>
          <div>
            <dt>macOS</dt>
            <dd>Apple Silicon through the universal installer.</dd>
          </div>
          <div>
            <dt>Windows</dt>
            <dd>
              Use OMG inside WSL with a supported Linux guest. Native Windows is not supported.
            </dd>
          </div>
          <div>
            <dt>Architecture</dt>
            <dd>
              x86_64 Linux and WSL guests; Apple Silicon on macOS. Linux ARM64 and Intel macOS
              releases are not published.
            </dd>
          </div>
        </dl>
      </section>

      <section id="guides" class="docs-section reference-section">
        <h2>Guides by task</h2>
        <p class="section-copy">
          Start with an outcome. Each guide states the release, prerequisites, supported backends,
          and recovery steps.
        </p>
        <ul class="reference-list">
          {#each data.documentationNavigation.filter(entry => entry.section !== 'Reference') as entry (entry.href)}
            <li>
              <a href={entry.href}
                ><span class="reference-label">{entry.label}</span><span class="reference-summary"
                  >{entry.title}</span
                ></a
              >
            </li>
          {/each}
        </ul>
        <p class="section-copy">
          For tools and agents: <a href="/llms.txt">Documentation index</a>,
          <a href="/llms-full.txt">complete text</a>,
          <a href="/docs/manifest.json">structured manifest</a>, and
          <a href="/docs/search.json?q=env%20capture">JSON search</a>. Every handbook and guide has
          a Markdown representation.
        </p>
      </section>
      <section id="reference" class="docs-section reference-section">
        <h2>Handbook</h2>
        <p class="section-copy">
          Eight concise topics answer common tasks on this site. Each topic links to its pinned
          upstream reference. The pages were checked against the CLI code and documentation at that
          commit. For the complete set of guides, including AUR builds, task detection, migration,
          containers, and release operations, browse the <a
            href={sourceDocsUrl}
            target="_blank"
            rel="noopener noreferrer">OMG source documentation</a
          >.
        </p>
        <ul class="reference-list">
          {#each DOCS_TOPICS as topic (topic.slug)}
            <li>
              <a href={docsTopicHref(topic.slug)}>
                <span class="reference-label">{topic.navLabel}</span>
                <span class="reference-summary">{topic.summary}</span>
              </a>
            </li>
          {/each}
        </ul>
      </section>
    </article>
  </div>
</main>

<style>
  .docs-shell {
    width: min(100% - clamp(2.5rem, 8vw, 8rem), 75rem);
    margin-inline: auto;
  }

  .docs-hero {
    display: grid;
    gap: 2.5rem;
    padding: clamp(3rem, 6vw, 5rem) 0;
    border-bottom: 1px solid var(--rule-strong);
  }

  .docs-hero h1 {
    max-width: 17ch;
    margin: 0;
    font-family: var(--font-display);
    font-size: clamp(2.5rem, 5vw, 3.75rem);
    font-weight: 650;
    letter-spacing: -0.035em;
    line-height: 1.1;
    text-wrap: balance;
  }

  .hero-copy {
    max-width: 28rem;
    margin: 0;
    align-self: end;
    color: var(--ink-muted);
    font-size: 1rem;
    line-height: 1.7;
  }

  .docs-layout {
    display: grid;
    min-width: 0;
  }

  .docs-aside {
    padding: 1.25rem 0;
    border-bottom: 1px solid var(--rule);
  }

  .section-nav a {
    font-family: var(--font-body);
  }

  .section-nav ul,
  .reference-list {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .section-nav ul {
    display: grid;
    gap: 0.0625rem;
    margin-top: 1rem;
  }

  .section-nav a {
    display: block;
    padding-block: 0.7rem;
    color: var(--ink-muted);
    font-size: 0.8125rem;
    text-decoration: none;
  }

  .section-nav a:hover {
    color: var(--signal);
  }

  article {
    min-width: 0;
  }

  .docs-section {
    padding: clamp(2rem, 5vw, 3rem) clamp(1.25rem, 4vw, 3rem);
    border-bottom: 1px solid var(--rule);
    scroll-margin-top: 2rem;
  }

  .docs-section h2 {
    margin: 0;
    font-family: var(--font-display);
    font-size: clamp(2.25rem, 5vw, 2.5rem);
    font-weight: 650;
    letter-spacing: -0.035em;
    line-height: 1;
    text-wrap: balance;
  }

  .section-copy {
    max-width: 42rem;
    margin: 1rem 0 0;
    color: var(--ink-muted);
    line-height: 1.7;
  }

  pre {
    margin: 0;
    overflow-x: auto;
    background: var(--paper-raised);
    color: var(--ink);
    font-family: var(--font-mono);
  }

  code {
    font-family: var(--font-mono);
  }

  .install-command {
    margin-top: 2rem;
    padding: 1.25rem;
    border: 1px solid var(--rule-strong);
    font-size: clamp(0.75rem, 2vw, 0.875rem);
    line-height: 1.7;
    overflow-wrap: anywhere;
    white-space: pre-wrap;
  }

  .install-command span {
    color: var(--signal);
  }

  .install-note {
    margin: 1.25rem 0 0;
    color: var(--ink-muted);
    font-size: 0.875rem;
  }

  .install-note a {
    color: var(--ink);
    overflow-wrap: anywhere;
  }

  .command-groups {
    margin-top: 2.5rem;
  }

  .command-group {
    display: grid;
    gap: 1.25rem;
    padding-block: 2rem;
    border-top: 1px solid var(--rule);
  }

  .command-group h3 {
    margin: 0.75rem 0 0;
    font-family: var(--font-display);
    font-size: 1.5rem;
    font-weight: 650;
    letter-spacing: -0.035em;
  }

  .command-group p {
    max-width: 24rem;
    margin: 0.75rem 0 0;
    color: var(--ink-muted);
    font-size: 0.875rem;
    line-height: 1.7;
  }

  .command-group pre {
    padding: 1.25rem;
    font-size: 0.875rem;
    line-height: 2;
  }

  .platform-list {
    display: grid;
    margin: 0;
  }

  .platform-list > div {
    padding-block: 1.5rem;
    border-top: 1px solid var(--rule);
  }

  .platform-list dt {
    font-weight: 650;
  }

  .platform-list dd {
    margin: 0.5rem 0 0;
    color: var(--ink-muted);
    font-size: 0.875rem;
    line-height: 1.7;
  }

  .reference-section {
    border-bottom: 0;
  }

  .reference-list {
    display: grid;
    margin-top: 2.5rem;
  }

  .reference-list li {
    border-top: 1px solid var(--rule);
  }

  .reference-list a {
    display: grid;
    gap: 0.375rem;
    padding-block: 1.25rem;
    text-decoration: none;
  }

  .reference-label {
    font-size: 0.875rem;
    font-weight: 600;
  }

  .reference-summary {
    color: var(--ink-muted);
    font-size: 0.8125rem;
    line-height: 1.6;
  }

  .reference-list a:hover,
  .reference-list a:hover .reference-label {
    color: var(--signal);
  }

  @media (min-width: 40rem) {
    .docs-aside {
      padding: 2rem;
    }

    .command-group {
      grid-template-columns: 0.7fr 1.3fr;
    }

    .platform-list,
    .reference-list {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .platform-list > div:nth-child(odd),
    .reference-list li:nth-child(odd) {
      padding-right: 2rem;
    }

    .platform-list > div:nth-child(even),
    .reference-list li:nth-child(even) {
      padding-left: 2rem;
    }
  }

  @media (min-width: 64rem) {
    .docs-hero {
      grid-template-columns: 1.25fr 0.75fr;
    }

    .docs-layout {
      grid-template-columns: 16rem minmax(0, 1fr);
    }

    .docs-aside {
      padding: 2rem;
      border-right: 1px solid var(--rule);
      border-bottom: 0;
    }

    .section-nav {
      position: sticky;
      top: 2rem;
    }
  }
</style>
