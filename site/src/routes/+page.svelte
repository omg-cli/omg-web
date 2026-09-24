<script lang="ts">
  import SeoHead from '../lib/components/SeoHead.svelte';
  import { serializeJsonLd, SITE_ORIGIN } from '../../../shared/public-site';
  import HomeBenchmarks from '../lib/components/home/HomeBenchmarks.svelte';
  import HomeFeatureGrid from '../lib/components/home/HomeFeatureGrid.svelte';
  import HomeHero from '../lib/components/home/HomeHero.svelte';
  import HomeInstallation from '../lib/components/home/HomeInstallation.svelte';

  const canonicalUrl = `${SITE_ORIGIN}/`;
  const structuredData = serializeJsonLd({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_ORIGIN}/#org`,
        name: 'OMG Package Manager',
        url: canonicalUrl,
        logo: `${SITE_ORIGIN}/icons/icon-512.png`,
        description:
          'OMG is a free open-source CLI for system packages and language runtimes on supported x86_64 Linux distributions and Apple Silicon macOS, including Linux inside WSL2.',
        sameAs: ['https://github.com/omg-cli/omg'],
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_ORIGIN}/#website`,
        url: canonicalUrl,
        name: 'OMG Package Manager',
        publisher: { '@id': `${SITE_ORIGIN}/#org` },
      },
      {
        '@type': 'SoftwareApplication',
        name: 'OMG Package Manager',
        applicationCategory: 'DeveloperApplication',
        applicationSubCategory: 'DeveloperTools',
        operatingSystem:
          'Linux (x86_64), macOS (Apple Silicon), Windows Subsystem for Linux (x86_64)',
        description:
          'A package and runtime manager for supported Linux distributions and Apple Silicon macOS.',
        url: canonicalUrl,
        downloadUrl: `${SITE_ORIGIN}/install.sh`,
        softwareHelp: `${SITE_ORIGIN}/docs/`,
        codeRepository: 'https://github.com/omg-cli/omg',
        license: 'https://opensource.org/licenses/MIT',
        publisher: { '@id': `${SITE_ORIGIN}/#org` },
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        featureList: [
          'Unified system package manager for Linux and macOS',
          'Multi-language runtime manager for Node.js, Python, Go, Rust, and Bun',
          'Zero-shim execution with direct PATH shell integration',
          'Automatic version-file detection (.nvmrc, .node-version, .python-version, .tool-versions)',
          'Environment capture and drift checks on Arch, Debian, and Ubuntu',
        ],
        isAccessibleForFree: true,
      },
    ],
  });
</script>

<SeoHead
  title="OMG — Package & Runtime Manager for Linux and macOS"
  description="Manage system packages and Node.js, Bun, Python, Go, and Rust versions with one free CLI for x86_64 Linux and Apple Silicon macOS, including WSL2."
  path="/"
  {structuredData}
/>

<main id="main-content" class="home">
  <HomeHero />
  <HomeFeatureGrid />
  <HomeBenchmarks />
  <HomeInstallation />
</main>

<style>
  :global(html) {
    scroll-behavior: smooth;
  }

  .home {
    --content-width: 88rem;
    overflow: hidden;
    background:
      linear-gradient(var(--rule), var(--rule)) top / 100% 1px no-repeat,
      var(--paper);
  }

  @media (prefers-reduced-motion: reduce) {
    :global(html) {
      scroll-behavior: auto;
    }
  }
</style>
