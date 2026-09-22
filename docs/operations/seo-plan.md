# OMG SEO plan

The report table records the retired production implementation audited on 2026-08-25. The implementation sections track the SvelteKit website. `https://getomg.xyz` is the new canonical origin. Recheck production after launch and after `omg.latham.cloud` becomes a permanent redirect.

## Verification verdicts on the 10 research reports

| Report                    | Verdict                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Technical/crawlability | **Confirmed by live fetch.** Canonical defect, soft-404, sitemap non-slash URLs, 307s, conflicting cache-control all reproduce.                                                                                                                                                                                                                                                                                                             |
| 2. Structured data        | **Confirmed by live fetch + repo.** The retired implementation emitted a stale global JSON-LD block (OS "Linux", "22x faster than pacman", and a non-canonical URL) on every page including `/docs/`.                                                                                                                                                                                                                                       |
| 3. On-page keywords       | **Accepted.** Query clusters are intent-reasoned, not volume-invented; report says so explicitly. Copy recommendations are truthful.                                                                                                                                                                                                                                                                                                        |
| 4. Core Web Vitals        | **Mostly confirmed.** No font preload (verified: 0 `rel=preload`), 17 `modulepreload` (verified), `.webmcp/bridge.js` in head (verified), conflicting asset cache-control (verified: `max-age=0, must-revalidate, public, immutable, max-age=31536000`). CWV thresholds (LCP ≤2.5s, INP ≤200ms, CLS ≤0.1 @ p75) are the standard documented values — developers.google.com/search/docs/appearance/core-web-vitals, web.dev/articles/vitals. |
| 5. Social previews        | **Confirmed.** OG set complete on `/` (verified); sub-pages lack OG tags; og:image is a valid 1200×630 PNG.                                                                                                                                                                                                                                                                                                                                 |
| 6. Competitor gap         | **Accepted with caution.** Competitor strategies match their public docs (mise comparison pages, Homebrew formulae). No invented volumes; recommends validating in a keyword tool before heavy investment.                                                                                                                                                                                                                                  |
| 7. Off-page/links         | **Partially rejected.** The channel playbook is sound, but its "current state" section is wrong: it claims the site lacks canonical/OG/sitemap/robots — all verified present. Ignore that section; keep the playbook.                                                                                                                                                                                                                       |
| 8. Search Console         | **Confirmed.** Domain property + DNS TXT verification and Bing CNAME (grey-cloud) match Google/Bing official guidance. Human steps correctly flagged.                                                                                                                                                                                                                                                                                       |
| 9. Docs SEO               | **Accepted.** Findings match live `/docs/` (single page, external GitHub links, brand-only H1s).                                                                                                                                                                                                                                                                                                                                            |
| 10. Long-tail             | **Accepted.** Explicitly marks volumes as estimates; proposals are truthfulness-filtered.                                                                                                                                                                                                                                                                                                                                                   |

Key external sources:

- [Google Search Central, Site moves and migrations](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes)
- [Google Search Central, Canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Google Search Central, HowTo and FAQ changes](https://developers.google.com/search/blog/2023/08/howto-faq-changes)
- [Google Search Central, Core Web Vitals](https://developers.google.com/search/docs/appearance/core-web-vitals)
- [Cloudflare Workers, Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)

## Implementation plan

### Svelte status on 2026-09-04

The website owns canonical metadata, crawl directives, and structured data for every public route. One shared origin contract sets `https://getomg.xyz` across pages, JSON-LD, the sitemap, robots, installers, billing returns, invitations, CORS, and analytics. The sitemap contains only canonical URLs. It omits `<priority>` and `<changefreq>` because Google ignores both fields. It also omits `<lastmod>` until the build can supply accurate content dates.

### Slice 0. Launch the canonical domain

1. [x] Model `getomg.xyz` in `shared/public-site.ts`. Keep deployment hostnames in `site/alchemy.run.ts`, and make source policy enforce their exact values.
2. [x] Configure the production Alchemy Website with `getomg.xyz` as the Custom Domain.
3. [x] Configure `www.getomg.xyz` as an Alchemy-managed HTTP 301 that keeps the path and query string.
4. [x] Replace old-origin URLs in metadata, JSON-LD, sitemap, robots, install commands, Stripe returns, CORS, invitation validation, and analytics.
5. [x] Wait for the `getomg.xyz` Cloudflare zone to become active.
6. [ ] Give the deployment credential `Dynamic URL Redirects Write`.
7. [ ] Launch and observe `getomg.xyz` before changing the old hostname.
8. [ ] Redirect each `omg.latham.cloud` URL to the same path on `getomg.xyz`.
9. [ ] Keep the old-host redirect for at least one year.
10. [ ] Verify both Search Console properties, submit Change of Address, and submit the new sitemap.

The homepage and documentation page include complete Open Graph and Twitter metadata. The privacy and terms pages now include the same sharing fields. The application icons now match the 192×192 and 512×512 dimensions declared by `manifest.json`.

### Slice 1. Structured data correctness

1. [x] Remove the stale global JSON-LD with the retired runtime.
2. [x] Keep one truthful `SoftwareApplication` node on the homepage and use the canonical slash URL.
3. [x] Add an `Organization` node and reference it as the publisher.
4. [x] Add `BreadcrumbList` on `/docs/`. Do not add FAQPage or HowTo rich-result markup.

### Slice 2. Crawlability fixes

5. [x] Point `/privacy/` and `/terms/` canonicals at their final slash URLs.
6. [x] List only final 200 URLs in the sitemap. Omit advisory fields unless the build can prove them.
7. [x] Return a real 404 page and status for unknown routes.
8. [x] Use permanent redirects for canonical trailing-slash routes.
9. [x] Disallow the API and protected workspace prefixes. Keep route-level `noindex` metadata.

### Slice 3. Performance

10. [x] Keep font loading under the generated stylesheet rather than adding manual preloads without measured savings.
11. [x] Keep the current fallback stack; the deployed shadow recorded zero layout shift.
12. [x] Keep SvelteKit's generated module preloads. The deployed shadow transferred 74,188 bytes across 15 scripts and reached a 1,000 ms unthrottled LCP, so overriding framework dependency discovery is not justified.
13. [x] Confirm no `.webmcp/bridge.js` request or reference exists in the Svelte artifact.
14. [x] Confirm hashed scripts and fonts return `public, immutable, max-age=31536000` as one cache policy.

The 2026-09-01 shadow sample used managed Chrome without throttling. It recorded a 549 ms TTFB, 1,000 ms FCP and LCP, zero CLS, 198,205 transferred bytes, and no critical image request. These are deployment diagnostics rather than field Core Web Vitals.

### Slice 4. On-page copy

15. [x] Name Node.js, Python, Go, Rust, Linux, macOS, and the replaced tools in the homepage description.
16. [x] Use specific package, runtime, and machine setup headings on the homepage.
17. [x] Use specific package, runtime, and reproducible environment headings in the documentation page.
18. [x] Do not publish a `keywords` meta tag.

### Slice 5. Social previews

19. [x] Add complete Open Graph and Twitter metadata to `/docs/` and both legal pages.
20. [x] Publish a 1200×630 PNG with its type, dimensions, and alternative text.

### Slice 6. Documentation architecture

21. [x] Publish eight native `/docs/<topic>/` pages with internal links, per-page metadata,
        a sidebar, and breadcrumbs. The Svelte site ships a curated, typed handbook under
        `src/lib/docs` instead of mirroring upstream Markdown. Each topic pins an upstream reference
        file and reviewed commit (`PyRo1121/omg` at `2bb9103`, reviewed 2026-09-03). Pages are static
        route directories prerendered through `src/routes/docs/+layout.ts`. Svelte escapes all
        authored content. There is no raw HTML, Markdown parser, or runtime GitHub request.
        `tools/check-docs-freshness.mjs` keeps registry slugs, content modules, and static route
        directories aligned. With `--clone`, it requires the selected upstream revision to equal the
        reviewed commit. Any CLI code or documentation commit
        therefore requires human review before the provenance pin advances.
22. Comparison page: "Version managers compared: nvm, pyenv, asdf, mise, omg" — factual table only.

### Slice 7. Distribution work

23. GitHub repo: topics, sharper description, Releases with checksums, community health files.
24. crates.io metadata completeness; AUR `omg`/`omg-bin`; own Homebrew tap first.
25. Coordinated Show HN + Reddit launch window; 2–3 targeted awesome-list PRs after traction.
    (Report 7's wrong "current state" section is excluded.)

### Slice 8. Search measurement

26. Add Google Search Console Domain properties for `getomg.xyz` and `omg.latham.cloud`. Keep the DNS verification records.
27. Submit the Search Console Change of Address after the old-host redirects pass.
28. Submit `https://getomg.xyz/sitemap.xml` in Google Search Console and Bing Webmaster Tools.
29. Review Google Search Console each week and Bing each month. Reconsider IndexNow only after the basic reports are stable.

## Explicitly rejected / deferred

- Do not add `FAQPage` schema without visible FAQ content. Google limits FAQ rich results to authoritative government and health sites.
- Do not use `HowTo` as a rich-results strategy. Google removed HowTo rich results.
- Do not chase the generic query `package manager` as the primary target.
- Do not publish comparison or speed claims without a reproducible benchmark.
- Validate keyword-volume claims in a reputable keyword tool before funding a large content program.

## Applied 2026-09-21 (follow-up live audit)

A read-only audit of the deployed site (headers, redirects, rendered HTML, structured
data, and a 17-user-agent crawl matrix) produced these changes, all verified on the live
origin with a cache-busting query string.

Crawl and preview

- `SeoHead` now serves the 1200x630 card (`/og/omg-og.png`, 76 KB) from one constant that
  also carries its real dimensions, so `og:image:width`/`height` cannot drift from the
  served file, and `og:image:secure_url` was added. The unused 1,734x909 variant and its
  1.03 MB asset were removed; the tech-article `image` in the docs markup points at the
  same card.
- `/sitemap.xml` no longer sends `X-Robots-Tag: noindex`. The header was an untested
  variable in the unresolved Search Console "Sitemap could not be read" report.
- `robots.txt` carries `Content-Signal: search=yes, ai-train=no`, matching `llms.txt`.
- `/health` sends `X-Robots-Tag: noindex` so a JSON probe never enters an index.
- `/security/` advertises `/security/feed.json` with `rel="alternate"`.

Rendering and caching

- `prerender = true` for `/`, `/privacy/`, `/terms/`, and `/updates/`. A build now emits
  23 prerendered pages instead of 19.
- `withDocsRouteCache` became `withPublicHtmlCache`: any successful public HTML response
  keeps client revalidation and gains `s-maxage=600, stale-while-revalidate=86400`.
  Admin, dashboard, auth-entry, API, markdown, and health paths are excluded by pattern,
  so authenticated or non-HTML responses are never given a shared cache policy.
- **Prerendering the marketing pages was reverted.** Rendering `/`, `/privacy/`, `/terms/`,
  and `/updates/` at build time looked like a free TTFB win, and it shipped a real regression:
  a prerendered SvelteKit page carries an inline hydration bootstrap script, and the static
  `Content-Security-Policy` header from `shared/security-headers.ts` allows only
  `script-src 'self' https://static.cloudflareinsights.com` with no hash or nonce. The browser
  blocks the inline script, so hydration never runs and every interactive element on the page
  stops responding — the anonymous e2e suite caught it ("Install command copied." never
  appeared). Reproduced locally with a headless Chromium probe: `console.error: Executing
inline script violates the following Content-Security-Policy directive`. To reintroduce
  prerendering, the header policy and the framework-generated policy have to agree on a hash
  or nonce for that script first; until then these routes stay server-rendered per request.

Structured data and freshness

- Learning indexes: `CollectionPage` + `BreadcrumbList` + `ItemList`.
- Legal pages: `WebPage` with the publisher reference.
- Security page: `CollectionPage` with `dateModified` from the feed's `syncedAt`.
- Release index: `CollectionPage` + `BreadcrumbList` + `ItemList`, a stable anchor per
  version, and a heading per release entry.
- `article:modified_time` now comes from the dates the site already trusts: docs
  provenance (`reviewedAt`) and learn page `modified`.
- `/updates/` carries a `lastmod` in the sitemap taken from the newest release date.

Two items need an operator action, both verified as origin-ready:

1. **Edge cache refresh.** `robots.txt` (up to 7 days of `s-maxage`) and `sitemap.xml`
   (24 hours) still serve the previous copies from the Cloudflare edge. The deployed
   credential is an OAuth grant without `Cache Purge`, so `POST /zones/{id}/purge_cache`
   returns `10000 Authentication error` (zone `fb74005c3f17bc04cff822a8117643ea`). Purge
   the changed URLs from the dashboard, or grant the credential `Cache Purge` and re-run
   the purge for the 26 sitemap URLs plus `/robots.txt`.
2. **Prerendered asset headers.** `withPublicHtmlCache` applies to dynamic HTML (verified
   on `/security/`, which now returns the new policy). Prerendered pages are served from
   the Workers assets store and keep Cloudflare's default
   `public, max-age=0, must-revalidate`, so the longer shared-cache policy does not reach
   them. To extend it, add a `_headers` rule for the prerendered HTML paths and confirm it
   survives the adapter's generated `_headers` merge before relying on it.

Open items from the earlier plan that this audit did not close: the Search Console
sitemap fetch warning (now testable without the `noindex` header), Change of Address,
Bing processing, the unshipped "Version managers compared" page, IndexNow key
provisioning, and `Dynamic URL Redirects Write` for per-URL legacy redirects.

## Performance audit 2026-09-21 (Lighthouse, deployed build)

Measured with Lighthouse 13.5.0 driving Chromium 153 against `https://getomg.xyz/`,
mobile profile and desktop preset, reports kept as JSON for comparison.

| Run     | Performance | Accessibility | Best practices | SEO |
| ------- | ----------- | ------------- | -------------- | --- |
| Mobile  | 86          | 100           | 100            | 100 |
| Desktop | 92          | 100           | 100            | 100 |

Mobile metrics: FCP 1.8 s, LCP 1.8 s, TBT 0 ms, **CLS 0.246**, speed index 1.8 s,
total transfer 336 KiB, server response 280 ms (40 ms desktop).

What the failing audits were

- **CLS 0.246 mobile / 0.179 desktop.** The only layout shift is
  `div > main#main-content > section.hero > div.hero-introduction`, caused by
  "Web font loaded": the Archivo variable font replaces the fallback after first paint
  and the paragraph reflows.
- **Legacy JavaScript, 10,840 wasted bytes** and **cache TTL, 4,135 wasted bytes both
  point at `static.cloudflareinsights.com/beacon.min.js`**, the analytics beacon Cloudflare
  injects for this zone. It is not served from this repository, so neither finding is
  actionable here; they will keep appearing in every audit until the zone stops injecting it.
- **Render-blocking**: the two page stylesheets (2.2 KB and 3.8 KB), which is expected for
  first-party CSS and carries no reported wasted time.

What was changed in response

- Metric-matched fallback faces for Archivo and IBM Plex Mono in `app.css`, generated from
  the shipped font binaries (Archivo ascent 0.878 / descent 0.210 / average advance
  0.5631 per em; Plex 1.025 / 0.275 / 0.6000) and sized against the metric-compatible local
  fallbacks (95.93% and 100.02%). The fallback now occupies the same box as the web font,
  so the swap cannot move text.
- The root layout preloads the Latin display font at preload priority.
- `favicon.svg` and `logo.svg` carried a 784x1168 and 1168x784 JPEG for marks displayed at
  16-32 px and 110x33 px. Re-encoded at display-appropriate resolution with identical
  geometry: 106,798 -> 5,982 bytes and 114,979 -> 14,503 bytes (~200 KB less on a first
  visit, and the logo drops from 73 KB to about 6 KB of Brotli transfer).

Deployment state

The change set is committed and pushed on `docs/themed-diagrams`, but the deploy failed
with `Invalid access token [code: 9109]` / `Authentication error [code: 10000]`: the stored
Cloudflare OAuth credential expired on both the Windows profile and the WSL copy. The
deployed build is therefore still the previous one; re-run `wrangler login` and then run
the prepared script that deploys and prints the before/after Lighthouse comparison.
