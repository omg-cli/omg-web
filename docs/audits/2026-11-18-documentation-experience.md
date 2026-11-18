# Choosing a documentation stack for OMG

18 November 2026

Keep the SveltePress Markdown compiler inside the existing SvelteKit app. Keep Shiki for highlighting and MiniSearch for server-side search. The most valuable change for this CLI is letting someone who knows a command find its procedure, copy it and retrieve the same section in a script. All three can use one catalog, one set of heading IDs and one release record.

## What a reader encountered

The audit covered 43 published pages across the handbook, operational guides, runtime guides and comparisons. Before this change, the first result for `omg env check` was an entire guide. A section about sharing an inventory ranked second. The actual procedure, “Detect drift without repairing it,” ranked twelfth. The docs landing page put a release paragraph ahead of search, and long articles required phone readers to return to the top to change sections.

The search now puts the procedure first. Ranking uses the first example command in each section, so the same rule works for other commands. A result has a browser link to the heading and a Markdown link to the section. Article headings have permalinks, the mobile outline stays within reach, and examples on the landing page copy as shell input. The release link opens the notes for the version covered by the handbook.

## Frameworks and plugins we evaluated

| Option | Finding on the existing project | Decision |
| --- | --- | --- |
| SveltePress compiler 1.10.0 | Compiles the existing native Markdown guides with Svelte 5, SvelteKit 3 and Vite 8. A scoped transform preserves the existing Svelte routes. | Keep the compiler and OMG's reader layout. [Vite plugin](https://sveltepress.site/reference/vite-plugin/) |
| SveltePress default theme 8.11.1 and Pagefind | A strict-install probe hit a Kit 1/2 peer requirement through the PWA integration. The search integration expects a different build directory and a browser-side index. | Keep the ordinary GET search form and shared HTML/JSON search. [Theme search](https://sveltepress.site/guide/default-theme/search/) |
| Astro Starlight 0.43.1 | Provides a polished reader and Pagefind search. Its Svelte integration renders Svelte components inside Astro. Adopting it here would move routing, content exports and release verification into a second application. | A strong choice for a separate docs site. The migration brings little to OMG's command lookup or reader workflow. [Starlight search](https://starlight.astro.build/guides/site-search/) · [Astro Svelte integration](https://docs.astro.build/en/guides/integrations-guide/svelte/) |
| Expressive Code 0.44.4 | An SSR fixture rendered successfully. Its line markup caused the existing clipboard handler to join adjacent command lines. The fixture also added about 3.5 KB of compressed CSS. | Keep Shiki. Revisit when guides actually need annotations or line markers, with a multiline clipboard check. [Expressive Code](https://expressive-code.com/) |
| mdsvex 0.12.8 | Offers Markdown with Svelte components, which the installed compiler already provides. Switching would leave search ranking, mobile navigation and agent access to the application. | Keep one Markdown processor. [mdsvex](https://mdsvex.pngwn.io/) |

## Retrieval contract

A reader, search engine or agent can start with the same public URL. Browser navigation serves HTML. An explicit `Accept: text/markdown` retrieves Markdown. Appending `.md` works for tools with fixed headers. HTML and HTTP discovery links identify the alternate format and the index. The Worker selects the representation before the adapter's URL-keyed cache, so a cached HTML response cannot satisfy a Markdown lookup. [HTTP negotiation](https://www.rfc-editor.org/rfc/rfc9110#section-12.5.1) · [Markdown media type](https://www.rfc-editor.org/rfc/rfc7763) · [Cloudflare cache behavior](https://developers.cloudflare.com/cache/concepts/cache-control/#other)

The catalog supplies 263 section IDs. The JSON search endpoint gives the URL directly, so clients do not need to predict slugs or convert HTML anchors. Each section export carries its canonical heading, release scope, date and a source link. The full bundle remains available for an offline reference. The `llms.txt` convention is a discovery proposal. Clients can use plain HTTP independently of adopting it. [llms.txt proposal](https://llmstxt.org/index.md) · [Svelte's index](https://svelte.dev/llms.txt) · [Stripe's agent guide](https://docs.stripe.com/agents.md) · [Cloudflare's Markdown support](https://developers.cloudflare.com/fundamentals/reference/markdown-for-agents/)

| Retrieval | Uncompressed body |
| --- | ---: |
| Complete documentation bundle | 291,176 bytes |
| Environment guide | 7,869 bytes |
| Drift-check procedure, including source and review scope | 1,421 bytes |

These measurements use the same public content and count response bytes. The section saves 82% versus fetching its guide. Search rank and retrieval were tested with HTTP and browser clients. A model's accuracy on a specific task would require a separate evaluation.

## Verification on the release candidate

All 42 public Chromium tests passed against the locally built Cloudflare Worker. They covered the 43-page manifest, no-JavaScript navigation, copyable examples, section anchors, mobile layout, and alternating HTML and Markdown requests to the same URL. On a 390-pixel-wide phone, search began 176 CSS pixels below the top of the viewport, with all four common tasks visible below it. The source checker compared all 91 pinned source records with the actual v0.1.224 release commit.

The build with SvelteKit 3.1.1 passed its bundle budget. The site update also took compatible Hono and Node server patches, clearing twelve distinct advisories from its lockfile. On the audit date, `npm audit` still reported the transitive `picomatch@4.0.7` advisory, for which upstream listed no patched release. [Upstream advisory](https://github.com/advisories/GHSA-fc5q-39xc-vjpf)

## What still needs editorial work

The longest reference pages still take many screens to read. Use command-search misses and support questions to identify which procedures justify separate task guides. Keep release scope visible when copying or splitting a guide. The source inventory pins the handbook and operational/provider guides to v0.1.224. Learning and comparison pages carry individual dates. Cross-platform command execution remains a separate verification job. [Source-review procedure](../operations/documentation-maintenance.md)
