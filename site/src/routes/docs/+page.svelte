<script lang="ts">
  import { building } from '$app/env';
  import { page } from '$app/state';
  import SeoHead from '../../lib/components/SeoHead.svelte';
  import { serializeJsonLd, SITE_ORIGIN } from '../../../../shared/public-site';
  import DocsReader from '../../lib/components/docs/DocsReader.svelte';
  import DocsSearchForm from '../../lib/components/docs/DocsSearchForm.svelte';
  import Icon from '../../lib/components/Icon.svelte';
  import DocsCode from '../../lib/components/docs/DocsCode.svelte';
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

  const tasks = [
    [
      'Find a package and its source',
      'omg search ripgrep',
      '/docs/packages/#find-a-package-and-its-source',
    ],
    ['Switch Node.js versions', 'omg use node 22', '/docs/getting-started/#select-a-runtime'],
    [
      'Check environment drift',
      'omg env check',
      '/docs/environments/#detect-drift-without-repairing-it',
    ],
    ['Diagnose a setup problem', 'omg doctor', '/docs/troubleshooting/'],
  ];
</script>

<SeoHead
  title="OMG Documentation - Install, Commands, and Platforms"
  description="Install OMG, find a command, troubleshoot your setup, or connect your agent to the versioned documentation."
  path="/docs/"
  markdownPath="/docs/index.md"
  {structuredData}
/>

<DocsReader searchInContent>
  <header class="masthead">
    <h1>OMG documentation</h1>
    <DocsSearchForm />
    <nav aria-label="Common documentation tasks" class="task-links">
      <a href="#install">Install OMG <Icon name="down" size={14} /></a>
      <a href="/docs/cli/">Command reference <Icon name="right" size={14} /></a>
      <a href="#agents">Use docs with an agent <Icon name="down" size={14} /></a>
    </nav>
  </header>

  <div class="first-run">
    <section id="install">
      <h2>Install OMG</h2>
      <p>
        Run from Bash with <code>curl</code> and the GitHub CLI (<code>gh</code>) installed. On
        Windows, open your WSL2 terminal.
      </p>
      <DocsCode code={installCommand} />
      <div class="link-line">
        <a href="/install.sh">Read install.sh</a>
        <a href="#platforms">Supported platforms</a>
      </div>
    </section>
    <section id="quick-start">
      <h2>Try a command</h2>
      <p>Search the package index for ripgrep. Use your own shell or the browser terminal.</p>
      <DocsCode code="omg search ripgrep" />
      <div class="link-line">
        <a href="/">Try in the browser <Icon name="right" size={14} /></a>
        <a href="/docs/getting-started/">Getting started guide</a>
      </div>
    </section>
  </div>

  <section id="guides">
    <h2>Common tasks</h2>
    <ul class="task-list">
      {#each tasks as [label, command, href] (href)}
        <li>
          <a {href}><span>{label}</span><code>{command}</code><Icon name="right" size={16} /></a>
        </li>
      {/each}
    </ul>
    <div class="link-line">
      <a href="/guides/">All guides</a><a href="/runtimes/">Runtime guides</a><a href="/compare/"
        >Comparisons</a
      >
    </div>
  </section>

  <section id="reference">
    <h2>Handbook</h2>
    <div class="edition">
      <a href={`https://github.com/${repository}/releases/tag/${release.version}`}
        >release {release.version}</a
      >
      <a href="/updates/">Browse project updates</a>
    </div>
    <ul class="handbook">
      {#each DOCS_TOPICS as topic (topic.slug)}
        <li>
          <a href={docsTopicHref(topic.slug)}>{topic.navLabel}<Icon name="right" size={14} /></a>
        </li>
      {/each}
    </ul>
    <a class="source-link" href={sourceDocsUrl}
      >Upstream documentation <Icon name="external" size={14} /></a
    >
  </section>

  <section id="agents">
    <h2>Use docs with an agent</h2>
    <p>
      Add this URL as a <strong>Streamable HTTP</strong> MCP server in your client. No API key is required.
    </p>
    <DocsCode code={`${docsOrigin}/mcp`} />
    <p class="example">Try asking “How do I check an environment for drift?”</p>
    <details>
      <summary>Markdown and JSON access</summary>
      <p>
        Start with the <a href="/llms.txt">documentation index</a> or
        <a href="/llms-full.txt">download all pages as text</a>. For section-level access, use the
        <a href="/docs/manifest.json">versioned manifest</a>
        or <a href="/docs/search.json?q=env+check">search as JSON</a>.
      </p>
      <DocsCode code={`curl -H 'Accept: text/markdown' ${docsOrigin}/docs/environments/`} />
    </details>
  </section>

  <section id="platforms">
    <h2>Supported platforms</h2>
    <dl>
      <div>
        <dt>Linux</dt>
        <dd>x86_64 on Arch, Debian 12/13, Ubuntu 24.04/26.04, and Fedora.</dd>
      </div>
      <div>
        <dt>macOS</dt>
        <dd>Apple Silicon. System packages use Homebrew.</dd>
      </div>
      <div>
        <dt>Windows</dt>
        <dd>WSL2 with a supported x86_64 Linux distribution.</dd>
      </div>
    </dl>
    <a class="source-link" href="/docs/installation/"
      >Installation requirements and platform details <Icon name="right" size={14} /></a
    >
    <div class="link-line">
      <a href="https://github.com/omg-cli/omg/releases">Download release binaries on GitHub</a>
    </div>
  </section>
</DocsReader>

<style>
  h1,
  h2 {
    margin: 0;
    font-family: var(--font-display);
    font-weight: 650;
    letter-spacing: -0.035em;
    line-height: 1.12;
  }
  h1 {
    font-size: clamp(2rem, 4.5vw, 3.5rem);
  }
  h2 {
    font-size: clamp(1.5rem, 3vw, 2rem);
  }
  .masthead {
    padding-bottom: 1rem;
  }
  .masthead :global(form) {
    margin-top: 1.3rem;
  }
  .masthead :global(input) {
    font-size: 1rem;
  }
  .masthead :global(button) {
    padding-inline: 1.25rem;
    font-size: 0.875rem;
  }
  .task-links,
  .link-line,
  .edition {
    display: flex;
    flex-wrap: wrap;
    gap: 0 1.4rem;
  }
  .task-links {
    margin-top: 0.4rem;
  }
  .task-links a,
  .link-line a,
  .source-link,
  .edition a {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    min-height: 2.75rem;
    font-size: 0.875rem;
    text-decoration-color: var(--rule-strong);
    text-underline-offset: 0.23em;
  }
  .task-links a {
    font-weight: 600;
    text-decoration: none;
  }
  a:hover,
  summary:hover {
    color: var(--signal);
  }
  section {
    padding-block: clamp(1.5rem, 3.5vw, 2.5rem);
    border-top: 1px solid var(--rule);
  }
  section,
  #quick-start {
    scroll-margin-top: 1.5rem;
  }
  section p {
    margin: 0.65rem 0 0;
    max-width: 65ch;
    color: var(--ink-muted);
    line-height: 1.6;
  }
  section :global(.docs-code) {
    margin-block: 0.875rem 0;
  }
  section :global(.docs-code pre) {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }
  @media (min-width: 72rem) {
    .first-run {
      display: grid;
      grid-template-columns: 1.3fr 1fr;
      gap: 1.75rem;
      border-top: 1px solid var(--rule);
    }
    .first-run section {
      display: grid;
      grid-template-rows: subgrid;
      grid-row: span 4;
      align-content: start;
      gap: 0;
      min-width: 0;
      border: 0;
    }
    .first-run h2 {
      font-size: 1.6rem;
    }
    .first-run .link-line {
      align-self: start;
    }
  }
  .task-list,
  .handbook,
  dl {
    list-style: none;
    padding: 0;
    margin: 1rem 0 0;
  }
  .task-list li,
  .handbook li,
  dl div {
    border-top: 1px solid var(--rule);
  }
  .task-list a,
  .handbook a {
    display: grid;
    align-items: center;
    gap: 0.4rem 1rem;
    padding-block: 0.9rem;
    min-height: 2.75rem;
    text-decoration: none;
    font-weight: 550;
  }
  .task-list a {
    grid-template-columns: 1fr auto auto;
  }
  .task-list code,
  .edition a {
    color: var(--ink-muted);
    font-size: 0.8125rem;
  }
  .handbook {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    column-gap: 2rem;
  }
  .handbook a {
    grid-template-columns: 1fr auto;
  }
  .task-list :global(svg),
  .handbook :global(svg) {
    color: var(--ink-muted);
  }
  .task-list a:hover span,
  .handbook a:hover {
    text-decoration: underline;
    text-underline-offset: 0.2em;
  }
  .edition {
    margin-top: 0.25rem;
  }
  .handbook {
    margin-top: 0.25rem;
  }
  .example {
    font-size: 0.875rem;
  }
  details {
    margin-top: 1rem;
    border-top: 1px solid var(--rule);
  }
  summary {
    padding-block: 0.8rem;
    min-height: 2.75rem;
    cursor: pointer;
    font-weight: 600;
  }
  dl div {
    display: grid;
    grid-template-columns: 6rem 1fr;
    gap: 0.75rem;
    padding-block: 0.85rem;
  }
  dt {
    font-weight: 600;
  }
  dd {
    margin: 0;
    color: var(--ink-muted);
    line-height: 1.5;
  }
  @media (max-width: 40rem) {
    .task-links,
    .link-line {
      gap: 0 1rem;
    }
    .task-list a {
      grid-template-columns: 1fr auto;
    }
    .task-list code {
      grid-row: 2;
    }
    .task-list :global(svg) {
      grid-column: 2;
      grid-row: 1 / 3;
    }
    .handbook {
      column-gap: 1rem;
    }
    dl div {
      grid-template-columns: 4.5rem 1fr;
    }
  }
</style>
