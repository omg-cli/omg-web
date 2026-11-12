# Documentation platform

Date: 2026-11-11. Status: implemented on the documentation-upgrade branch; not published.

OMG keeps SvelteKit and uses **SveltePress 1.10.0** for new Markdown pages. The existing handbook and learning content stay in their typed block format, preserving their URLs, diagrams and escaping guarantees. Each document has one editable source. A server catalog derives search, Markdown exports, the manifest and agent indexes from those sources.

## Why SveltePress

The user chose SveltePress after considering a separate Astro/Starlight docs app. [Starlight](https://starlight.astro.build/) is an Astro framework; Astro's Svelte integration renders Svelte components, but does not install Starlight into SvelteKit. [SveltePress](https://sveltepress.site/reference/vite-plugin/) integrates through Vite and supplies Markdown compilation with Svelte components. A second mdsvex processor would duplicate that responsibility.

The custom OMG layout retains the approved neutral light/dark theme, existing navigation and Cloudflare CSP. The default SveltePress theme is not installed. `sveltepress()` installs SvelteKit once and receives the existing adapter/CSP options through `svelteKitOptions`.

SveltePress 1.10.0 wraps native `+page.svelte` and `+layout.svelte` files as well as Markdown. Its wrapping mishandles existing multiline `<svelte:head>` tags. `site/tools/sveltepress-scope.ts` therefore scopes its layout transform to Markdown and omits its native-page HMR wrapper. Native Svelte pages retain their SvelteKit layout. An upgrade must verify this adapter, including native admin pages, Markdown compilation and development reloads. No dependency files are patched.

## Search and agent access

Search uses [MiniSearch](https://lucaong.github.io/minisearch/) on the server. Search results are normal HTML links to existing section anchors, with a GET form that works without JavaScript. Prefix and limited fuzzy matching cover command and option queries. The JSON endpoint exposes the same public results; queries are bounded to 160 characters and responses use `no-store`. There is no hosted search service or client-side index download.

SveltePress's Pagefind integration is disabled. Its default output-directory assumptions do not match the Cloudflare adapter, and the application already needs no-JavaScript search and JSON results. Built-in llms generation is also disabled: it discovers Markdown files, which would omit the existing typed documents. The shared catalog covers both formats instead:

- `/llms.txt`: concise index.
- `/llms-full.txt`: all published documentation as Markdown.
- `/docs/manifest.json`: canonical/Markdown URLs, sections, dates, release scope and source links.
- `/docs/search.json?q=...`: bounded search results.
- `/markdown/<category>/<slug>/`: each document, including the handbook.

These exports have explicit MIME types and crawler headers. They contain public documentation only. Markdown source is trusted repository content compiled during the build, not user-supplied runtime input. The compiler, table of contents and search use the same Markdown parser and heading-ID policy; fenced example headings do not become search sections.

## Source review and limits

Handbook and new operational/provider guides target release v0.1.224 at immutable commit `f0d8cb5d8a95dbbc6cae50460178702ac0263ebb`. Existing learning/comparison pages retain their individual review scope; a null release in the manifest avoids assigning a release guarantee to them. Development differences are explicit in the prose.

The source-review inventory records 91 distinct files with Git blob IDs and SHA-256 hashes. Normal CI checks its integrity and coverage offline. A deliberate clone/revision comparison reports which topics and guides need re-review; it never advances review dates automatically. See [documentation maintenance](../operations/documentation-maintenance.md).

This is a source review with website/browser verification. It does not certify every CLI command or provider download on every supported platform. The audit records remaining advanced coverage and execution gaps in [the CLI documentation audit](../audits/2026-11-11-cli-documentation.md).
