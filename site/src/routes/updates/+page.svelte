<script lang="ts">
  import Icon from '../../lib/components/Icon.svelte';
  import SeoHead from '../../lib/components/SeoHead.svelte';
  import { RELEASE_NOTES, releaseDate } from '../../lib/release-notes';
  import { SITE_ORIGIN, serializeJsonLd } from '../../../../shared/public-site';

  const canonical = `${SITE_ORIGIN}/updates/`;
  /** The newest release date the page can prove; releases come from reviewed in-repo data. */
  const latestRelease = RELEASE_NOTES.at(0);
  if (latestRelease === undefined) {
    throw new Error('updates page requires at least one release note');
  }

  /**
   * Release index markup: the page itself, its breadcrumb position, and one list
   * item per published release so each version has a stable, citable anchor.
   */
  const structuredData = serializeJsonLd({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${canonical}#page`,
        url: canonical,
        name: 'OMG release notes and updates',
        description:
          'Reviewed highlights from published OMG releases, with the date each version shipped.',
        isPartOf: { '@id': `${SITE_ORIGIN}/#website` },
        publisher: { '@id': `${SITE_ORIGIN}/#org` },
        about: {
          '@type': 'SoftwareApplication',
          name: 'OMG Package Manager',
          applicationCategory: 'DeveloperApplication',
          operatingSystem: 'Linux, macOS, Windows Subsystem for Linux',
          url: `${SITE_ORIGIN}/`,
        },
        dateModified: latestRelease.date,
        mainEntity: {
          '@type': 'ItemList',
          numberOfItems: RELEASE_NOTES.length,
          itemListElement: RELEASE_NOTES.map((release, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: `${release.version}: ${release.title}`,
            url: `${canonical}#${release.version}`,
          })),
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_ORIGIN}/` },
          { '@type': 'ListItem', position: 2, name: 'Release notes', item: canonical },
        ],
      },
    ],
  });
</script>

<SeoHead
  title="Release notes and updates - OMG"
  description="Reviewed highlights from published OMG releases. See what changed, when it shipped, and where to read the complete notes."
  path="/updates/"
  {structuredData}
  modifiedTime={latestRelease.date}
/>

<main id="main-content" class="updates-shell">
  <header>
    <h1>Release notes</h1>
    <p class="introduction">
      Highlights from published OMG releases. Open a version for changes and the full release notes.
    </p>
    <nav aria-label="Release resources">
      <a href="/docs/">Documentation</a><a href="/docs/installation/">Installation guide</a>
    </nav>
  </header>
  <aside aria-label="Release compatibility">
    The latest published release predates beta. Commands, flags, and on-disk formats can change.
    Check the full notes before updating an environment you rely on.
  </aside>
  <section aria-label="Published releases">
    {#each RELEASE_NOTES as release, index (release.version)}
      <details id={release.version} open={index === 0}>
        <summary>
          <span class="release-summary">
            <span class="version">{release.version}</span>
            <span class="release-title">{release.title}</span>
          </span>
          <time datetime={release.date}>{releaseDate(release.date)}</time>
        </summary>
        <div class="release-body">
          <h2 class="release-heading">{release.version}: {release.title}</h2>
          <ul>
            {#each release.changes as change (change)}<li>{change}</li>{/each}
          </ul>
          <a
            class="notes-link"
            href={`https://github.com/omg-cli/omg/releases/tag/${release.version}`}
            >Full {release.version} release notes <Icon name="external" size={14} /></a
          >
        </div>
      </details>
    {/each}
  </section>
</main>

<style>
  .updates-shell {
    width: var(--site-width);
    margin-inline: auto;
    padding-block: clamp(3rem, 6vw, 5rem);
  }
  h1 {
    margin: 0 0 1rem;
    font-family: var(--font-display);
    font-size: var(--page-title);
    line-height: 1.1;
    letter-spacing: -0.035em;
    font-weight: 700;
  }
  .introduction {
    max-width: 50ch;
    color: var(--ink-body);
    line-height: 1.7;
  }
  nav {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem 2rem;
    margin-block: 1.5rem 2.5rem;
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
  aside {
    max-width: 65ch;
    padding: 0.875rem 1.25rem;
    border-left: 2px solid var(--signal);
    border-radius: 0 6px 6px 0;
    background: var(--paper-raised);
    color: var(--ink-body);
    font-size: 0.875rem;
    line-height: 1.7;
    margin-bottom: 2.5rem;
  }
  .release-heading {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    white-space: nowrap;
    clip-path: inset(50%);
    border: 0;
  }

  details {
    border-top: 1px solid var(--rule);
  }
  details:last-child {
    border-bottom: 1px solid var(--rule);
  }
  summary {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.4rem 1.5rem;
    padding-block: 1.25rem;
    cursor: pointer;
    line-height: 1.6;
    list-style: none;
  }
  summary::-webkit-details-marker {
    display: none;
  }
  summary::before {
    content: '';
    display: inline-block;
    width: 0.42rem;
    height: 0.42rem;
    margin-right: 0.35rem;
    flex-shrink: 0;
    border-right: 1.5px solid var(--ink-muted);
    border-bottom: 1.5px solid var(--ink-muted);
    transform: rotate(-45deg);
    transition: transform 140ms ease;
    align-self: center;
  }
  details[open] > summary::before {
    transform: rotate(45deg);
  }
  @media (prefers-reduced-motion: reduce) {
    summary::before {
      transition: none;
    }
  }
  summary:focus-visible {
    outline: 2px solid var(--signal);
    outline-offset: 4px;
  }
  .release-summary {
    display: flex;
    flex: 1 1 16rem;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 0.25rem 1rem;
  }
  .version {
    color: var(--signal);
    font-family: var(--font-mono);
    font-size: 0.875rem;
    font-weight: 500;
  }
  .release-title {
    font-weight: 550;
  }
  time {
    color: var(--ink-muted);
    font-family: var(--font-mono);
    font-size: 0.75rem;
  }
  .release-body {
    padding: 0 0 1.75rem 1.4rem;
    max-width: 65ch;
  }
  ul {
    padding-left: 1.1rem;
    margin: 0 0 1.25rem;
  }
  li {
    margin-bottom: 0.65rem;
    color: var(--ink-body);
    line-height: 1.7;
  }
  .notes-link {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    min-height: 2.75rem;
    font-size: 0.875rem;
    font-weight: 600;
  }
</style>
