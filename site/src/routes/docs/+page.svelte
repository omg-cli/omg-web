<script lang="ts">
  import { building } from '$app/env';
  import { page } from '$app/state';
  import SeoHead from '../../lib/components/SeoHead.svelte';
  import { serializeJsonLd, SITE_ORIGIN } from '../../../../shared/public-site';
  import DocsReader from '../../lib/components/docs/DocsReader.svelte';
  import DocsOutline from '../../lib/components/docs/DocsOutline.svelte';
  import DocsCode from '../../lib/components/docs/DocsCode.svelte';
  import type { PageData } from './$types';
  let { data }: { data: PageData } = $props();
  import { DOCS_TOPICS, docsTopicHref } from '../../lib/docs/topics';
  import { release, repository } from '../../lib/docs/source-review.json';

  const canonicalUrl = `${SITE_ORIGIN}/docs/`;
  const docsOrigin = $derived(building ? SITE_ORIGIN : page.url.origin);
  const sourceDocsUrl = `https://github.com/omg-cli/omg/tree/${DOCS_TOPICS[0].source.reviewedCommit}/docs`;
  const installCommand = `curl -fsSL ${SITE_ORIGIN}/install.sh | bash`;
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
  markdownPath="/docs/index.md"
  {structuredData}
/>

<DocsReader>
  <header class="docs-hero">
    <h1>OMG documentation</h1>
    <nav class="task-links" aria-label="Common documentation tasks">
      <a href="/docs/packages/#find-a-package-and-its-source">Find a package</a>
      <a href="/docs/getting-started/#select-a-runtime">Switch Node.js versions</a>
      <a href="/docs/environments/#detect-drift-without-repairing-it">Check environment drift</a>
      <a href="#agents">Use docs with an agent</a>
    </nav>
  </header>

  <article>
    <DocsOutline
      headings={[
        { id: 'install', title: 'Install' },
        { id: 'quick-start', title: 'Quick start' },
        { id: 'platforms', title: 'Platforms' },
        { id: 'agents', title: 'Use docs with an agent' },
        { id: 'guides', title: 'Guides by task' },
        { id: 'reference', title: 'Handbook' },
      ]}
    />
    <section id="install" class="docs-section">
      <h2>Install OMG</h2>
      <p class="section-copy">
        The universal installer detects Linux or macOS and downloads the matching release. On
        Windows, run it inside WSL2. The GitHub CLI (gh) is required to verify the release
        attestation.
      </p>
      <DocsCode code={installCommand} />
      <p class="install-note">
        <a href="/install.sh">Read install.sh</a> before running it, or download a release directly:
        <a href="https://github.com/omg-cli/omg/releases">Download release binaries on GitHub</a>.
      </p>
      <p class="install-note">
        The handbook and operational guides describe <a
          href={`https://github.com/${repository}/releases/tag/${release.version}`}
          >release {release.version}</a
        >. Newer development-only behavior is labeled separately. Check the source and review date
        on each page. <a href="/updates/">Browse project updates.</a>
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
            <DocsCode code={group.commands.join('\n')} />
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
            Arch (pacman/AUR), Debian 12/13 and Ubuntu 24.04/26.04 (APT/DEB), and Fedora (DNF/RPM).
            RHEL and CentOS-family hosts receive a Fedora-artifact fallback; that is not a
            compatibility guarantee.
          </dd>
        </div>
        <div>
          <dt>macOS</dt>
          <dd>Apple Silicon through the universal installer; system packages use Homebrew.</dd>
        </div>
        <div>
          <dt>Windows</dt>
          <dd>Use OMG inside WSL with a supported Linux guest. Native Windows is not supported.</dd>
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

    <section id="agents" class="docs-section">
      <h2>Use docs with an agent</h2>
      <p class="section-copy">
        Add this URL to your client's MCP settings and choose Streamable HTTP. Ask it to find the
        environment drift procedure or read a specific section. Public documentation is available
        without an API key.
      </p>
      <DocsCode code={`${docsOrigin}/mcp`} />
      <p class="section-copy">
        Give your agent the <a href="/llms.txt">documentation index</a> to find a page, or request its
        Markdown directly.
      </p>
      <DocsCode code={`curl -H 'Accept: text/markdown' ${docsOrigin}/docs/environments/`} />
      <p class="section-copy">
        <a href="/docs/manifest.json">Get versioned sources and sections</a>,
        <a href="/docs/search.json?q=env+check">search for env check as JSON</a>, or
        <a href="/llms-full.txt">read the entire documentation set as text</a>.
      </p>
      <p class="section-copy">
        Each search result includes a <code>markdownHref</code> for the matching part of the guide.
        <a href="/markdown/docs/environments/?section=detect-drift-without-repairing-it"
          >Read the drift-check procedure as Markdown</a
        >.
      </p>
    </section>
    <section id="guides" class="docs-section reference-section">
      <h2>Guides by task</h2>
      <p class="section-copy">
        Browse <a href="/runtimes/">runtime setup guides</a> or learn to
        <a href="/guides/node-npm-pnpm/">use Node.js, npm, and pnpm together</a>.
      </p>
      <ul class="reference-list">
        {#each data.documentationNavigation.filter(entry => entry.section === 'Start here' || entry.section === 'Guides') as entry (entry.href)}
          <li>
            <a href={entry.href}
              ><span class="reference-label">{entry.label}</span
              >{#if entry.label !== entry.title}<span class="reference-summary">{entry.title}</span
                >{/if}</a
            >
          </li>
        {/each}
      </ul>
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
</DocsReader>

<style>
  .docs-hero {
    display: grid;
    align-items: end;
    gap: 1.25rem 2.5rem;
    padding-block: 0.25rem 0;
  }

  .docs-hero h1 {
    margin: 0;
    font-family: var(--font-display);
    font-size: var(--page-title);
    font-weight: 650;
    letter-spacing: -0.035em;
    line-height: 1.1;
    text-wrap: balance;
  }

  .task-links {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0 1rem;
  }

  .task-links a {
    display: flex;
    align-items: center;
    min-height: 2.75rem;
    font-size: 0.875rem;
    text-decoration-color: var(--rule-strong);
    text-underline-offset: 0.25em;
  }

  .task-links a:hover {
    color: var(--signal);
    text-decoration-color: currentColor;
  }

  .reference-list {
    padding: 0;
    list-style: none;
  }

  article {
    min-width: 0;
  }

  .docs-section {
    padding-block: clamp(1.5rem, 3vw, 2.5rem);
    border-bottom: 1px solid var(--rule);
    scroll-margin-top: 2rem;
  }

  .docs-section h2 {
    margin: 0;
    font-family: var(--font-display);
    font-size: clamp(1.5rem, 3vw, 2rem);
    font-weight: 650;
    letter-spacing: -0.035em;
    line-height: 1.2;
    text-wrap: balance;
  }

  .section-copy {
    max-width: 42rem;
    margin: 1rem 0 0;
    color: var(--ink-muted);
    line-height: 1.7;
  }

  .docs-section :global(.docs-code pre) {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
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
    .task-links {
      display: flex;
      flex-wrap: wrap;
      grid-column: 1 / -1;
      gap: 0 2.25rem;
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

  article :global(.page-outline) {
    margin-bottom: 0;
  }
</style>
