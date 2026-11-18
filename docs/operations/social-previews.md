# Social sharing preview

Open Graph, Twitter cards and handbook JSON-LD share the image URL and dimensions in `shared/public-site.ts`. The current PNG is `/og/omg-social-20261113.png`, 1200 × 630 pixels. Its new filename lets sharing services fetch a new image instead of reusing their cached copy of the old slogan card. Previously created unfurls can retain their own cache until the service refreshes them.

## Capture a replacement

Run the existing site locally, then capture the actual homepage:

```sh
npm run dev:e2e --prefix site
```

In another terminal, use a new filename for each published replacement:

```sh
npm run social:capture --prefix site -- --url http://127.0.0.1:4173 --output static/og/omg-social-YYYYMMDD.png
```

The tool captures the homepage in its dark theme after the self-hosted fonts load and the terminal prompt is visible. The opening transcript shows an Arch package search. Playwright Chromium captures a 1600 × 840 CSS viewport at 0.75 device scale to produce the 1200 × 630 image.

Compatibility URLs `/og/omg-og.png` and `/og/omg-og.svg` receive the same snapshot; the SVG embeds the PNG so it also works without external image requests. The dated PNG is the canonical sharing image. Update `SOCIAL_CARD.path`, the metadata expectations in the existing tests, and the alt description if the content changes. Run the site checks and production build, inspect the image at full and thumbnail sizes, then deploy with Wrangler.

After deployment, check the normal homepage URL's `og:image` and `twitter:image`, fetch the image anonymously and verify PNG content type, dimensions and bytes. Check a docs page's JSON-LD too. If cached HTML still advertises the previous filename, purge only the affected public page URLs and recheck them. A new Worker health version alone does not establish fresh page metadata.

## Current image provenance

Captured on 2026-11-13 from `https://getomg.dev/`, the approved neutral OMG site at code commit `db72841` / production version `70519cc5-85b3-4415-ae28-8191279ecfc1`. Source elements are the existing header, headline, introduction and real source-shaped Arch example. Logo and fonts are the project's existing self-hosted assets. This is a browser screenshot, with no generated illustration or new product claims.
