<script lang="ts">
  import { SITE_ORIGIN } from '../../../../shared/public-site';

  /**
   * The reviewed social card, with its real dimensions, so the declared
   * `og:image:width`/`height` can never drift from the file that is served.
   */
  const SOCIAL_CARD = { path: '/og/omg-og.png', width: 1200, height: 630 } as const;

  let {
    title,
    description,
    path,
    type = 'website',
    structuredData,
    publishedTime,
    modifiedTime,
  }: {
    title: string;
    description: string;
    path: string;
    type?: 'website' | 'article';
    /** Already serialized with serializeJsonLd, never raw user content. */
    structuredData?: string;
    /** ISO 8601 date for `article:published_time`, when the build can prove it. */
    publishedTime?: string | undefined;
    /** ISO 8601 date for `article:modified_time`, when the build can prove it. */
    modifiedTime?: string | undefined;
  } = $props();

  const canonical = $derived(`${SITE_ORIGIN}${path}`);
  const imageUrl = `${SITE_ORIGIN}${SOCIAL_CARD.path}`;
  const imageAlt =
    'OMG: one CLI for system packages, language runtimes, and development environments.';
</script>

<svelte:head>
  <title>{title}</title>
  <meta name="description" content={description} />
  <meta name="robots" content="index, follow, max-image-preview:large" />
  <link rel="canonical" href={canonical} />
  <meta property="og:type" content={type} />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={canonical} />
  <meta property="og:site_name" content="OMG Package Manager" />
  <meta property="og:locale" content="en_US" />
  <meta property="og:image" content={imageUrl} />
  <meta property="og:image:secure_url" content={imageUrl} />
  <meta property="og:image:width" content={String(SOCIAL_CARD.width)} />
  <meta property="og:image:height" content={String(SOCIAL_CARD.height)} />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:image:alt" content={imageAlt} />
  {#if type === 'article' && publishedTime}
    <meta property="article:published_time" content={publishedTime} />
  {/if}
  {#if type === 'article' && modifiedTime}
    <meta property="article:modified_time" content={modifiedTime} />
  {/if}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={title} />
  <meta name="twitter:description" content={description} />
  <meta name="twitter:image" content={imageUrl} />
  <meta name="twitter:image:alt" content={imageAlt} />
  {#if structuredData}
    <svelte:element this={"script"} type="application/ld+json">{structuredData}</svelte:element>
  {/if}
</svelte:head>
