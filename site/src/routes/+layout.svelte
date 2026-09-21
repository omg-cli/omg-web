<script lang="ts">
  import { afterNavigate } from '$app/navigation';
  import { page } from '$app/state';
  import type { Snippet } from 'svelte';
  import archivoLatin from '@fontsource-variable/archivo/files/archivo-latin-wght-normal.woff2?url';
  import SiteFooter from '../lib/components/SiteFooter.svelte';
  import SiteHeader from '../lib/components/SiteHeader.svelte';
  import { initAnalytics, trackAnalyticsNavigation } from '../lib/site-analytics.svelte';
  import '../app.css';

  let { children }: { children: Snippet } = $props();
  let isAdminRoute = $derived(page.url.pathname.startsWith('/admin'));

  afterNavigate(() => trackAnalyticsNavigation());
  $effect(() => {
    initAnalytics();
  });
</script>

<svelte:head>
  <!--
    The display font paints the hero headline on every public page. Fetching it at
    preload priority means it is already available at first paint, which keeps the
    swap from reflowing text (with the metric-matched fallback as the safety net).
  -->
  <link rel="preload" href={archivoLatin} as="font" type="font/woff2" crossorigin="anonymous" />
</svelte:head>

<a class="skip-link" href="#main-content">Skip to content</a>
{#if !isAdminRoute}
  <SiteHeader />
{/if}
{@render children()}
{#if !isAdminRoute}
  <SiteFooter />
{/if}
