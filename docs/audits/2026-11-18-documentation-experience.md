# Choosing a documentation stack for OMG

18 November 2026

Use Farming Labs Docs for the public MCP server. Keep OMG's reader in SvelteKit, where the homepage and the handbook can share their navigation, typography, code examples and themes. Mintlify is the managed choice I would make if an editorial team wanted a hosted web editor and Git sync. Its free tier includes MCP. [Farming Labs Docs](https://github.com/farming-labs/docs) · [Mintlify plans](https://www.mintlify.com/pricing)

## What we tried on the leading candidates

**Farming Labs Docs** publishes an MIT-licensed SvelteKit adapter, a Svelte theme and a standalone MCP server. In a scratch project, the adapter loaded the 43 pages from OMG's public manifest and rendered the package guide from the existing Markdown. The production candidate uses the independent MCP module at `/mcp`. Both the reader and the server take their content from the same catalog. A new page or changed release record reaches both in one deployment. OMG owns the integration and its dependency updates. The implementation pins version 0.2.147. [Project and license](https://github.com/farming-labs/docs) · [Framework documentation](https://docs.farming-labs.dev/)

**Mintlify** can match OMG's type, colors, wordmark and code styling. A Cloudflare proxy can keep its reader at `getomg.dev/docs` while the homepage stays in SvelteKit. Its advantages for this project are the editor, the finished reader and the hosted search service. The integration work would be keeping shared navigation, section permalinks, the source-review workflow and URL redirects in sync across the two renderers. Free includes five editors, a custom domain and a hosted MCP server. Pro adds preview deployments and the assistant at $450/month billed annually or $540 billed monthly. MCP alone gives OMG no reason to buy Pro. [Styling](https://mintlify.com/blog/launch-week-day-3) · [Custom domains and subpaths](https://www.mintlify.com/docs/customize/custom-domain) · [Plan details](https://www.mintlify.com/pricing)

Mintlify could also serve the reader later while OMG keeps its own MCP URL. Mintlify documents how to advertise an external MCP server alongside its own. This gives us the option to change the editorial experience without making installed clients change their endpoint. [External MCP discovery](https://www.mintlify.com/docs/help-center/register-external-mcp-server-in-discovery)

I rendered three OMG guides with Mintlify CLI 4.3.56 using the site's Archivo font, wordmark and orange accent. The package guide kept its code examples and platform table. Mintlify's desktop outline made a long procedure easy to navigate. Its local preview asked for a Mintlify login to activate search. For the reading comparison, both readers displayed the same package guide. [Mintlify local preview](https://www.mintlify.com/docs/quickstart)

I connected a Streamable HTTP client to Mintlify's own documentation. It advertised search, filesystem-style queries and feedback. A search for “host docs at a custom subpath” returned the relevant passage with its source. The same client connected to Docus and discovered its page listing and reading tools. Those public servers held their respective projects' docs. The retrieval trial on all 43 OMG pages used Farming Labs and OMG's reader. A hosted Mintlify deployment of OMG content and a timed reader study remain outside this comparison.

| Other options | Where they excel | Consequence for OMG |
| --- | --- | --- |
| Docus | Open-source Nuxt reader with Markdown components and a working remote MCP endpoint. | My first alternative for a standalone Vue/Nuxt docs application. Hosting it under the same domain would still leave two applications to maintain. [Docus](https://github.com/nuxt-content/docus) |
| Astro Starlight | Accessibility, Pagefind, localizable navigation and a large plugin ecosystem. Astro supports embedded Svelte components. | A good choice for a static publication with occasional interactive examples. The homepage and handbook would deploy through different framework roots. [Component support](https://starlight.astro.build/components/using-components/) · [Plugins](https://starlight.astro.build/resources/plugins/) |
| Fumadocs and Fumapress | Fumadocs separates the content layer from its React UI. Fumapress packages an agent-ready documentation site with MCP and text exports. | Worth choosing for a React/Waku reader. The documented framework paths would introduce another rendering stack here. [Fumadocs](https://www.fumadocs.dev/docs) · [Fumapress](https://press.fumadocs.dev/) |
| Svelte Docs Starter | SvelteKit, mdsvex, shadcn-svelte, Pagefind, and generated text indexes. | A credible starting point for a new Svelte site. OMG already supplies search, themes and export URLs. A remote MCP server would still be a separate integration. [Starter repository](https://github.com/code-gio/svelte-docs-starter) |
| docmd | A static reader and an MCP server a contributor starts with `docmd mcp`. | The documented transport is local stdio. Website visitors need a shared HTTP address that works without checking out OMG. [MCP transport](https://docs.docmd.io/09/reference/mcp-server/) |
| Fern | Structured API references, SDK documentation and interactive examples for OpenAPI, AsyncAPI and gRPC. | A stronger fit for an API-led product. OMG's core task is finding a command for the right OS and release. [Fern capabilities](https://buildwithfern.com/learn/docs/getting-started/capabilities) |

## Can an agent find the same answer as a reader?

In the same 43-page trial, I searched for `omg env check`, `omg search ripgrep` and `--fail-on-findings`. Farming Labs' default search led with the reproducibility guide, the mise comparison and the CLI automation reference respectively. All discuss the query. OMG's human search now puts the concrete drift procedure, package search procedure and security scan guidance first. The two rankings serve different paths through the same material. These three probes measure specific outcomes, not overall relevance.

One issue mattered more than search-result counts. Several handbook headings have hand-authored anchors. For example, “Capturing state and verifying drift” lives at `#capture-and-check`. Deriving an ID from the English heading sent an agent to a different fragment. The integration preserves the reader's published IDs, including when an author renames a heading without changing the link. An MCP client listed all 43 pages' sections and read all 263 by their public IDs on the local Cloudflare build. Each section can also be retrieved over ordinary HTTP.

Eight read-only MCP tools cover search, navigation, page listing, section indexes, single and batch reads, code examples and retrieval of context. No account is required. To reproduce a focused lookup, connect a Streamable HTTP client to the preview's `/mcp` address and call `read_page` with `{"path":"/guides/reproducible-dev-environments/","section":"capture-and-check"}`. A reader can follow the matching [guide section](https://getomg.dev/guides/reproducible-dev-environments/#capture-and-check).

## What a reader encountered

The audit covered 43 published pages across the handbook, operational guides, runtime guides and comparisons. Before this change, the first result for `omg env check` was an entire guide. A section about sharing an inventory ranked second. The actual procedure, “Detect drift without repairing it,” ranked twelfth. The docs landing page put a release paragraph ahead of search, and long articles required phone readers to return to the top to change sections.

The search now puts the procedure first. Ranking uses the first example command in each section, so the same rule works for other commands. A result has a browser link to the heading and a Markdown link to the section. Article headings have permalinks, the mobile outline stays within reach, and examples on the landing page copy as shell input. The release link opens the notes for the version covered by the handbook.

## Compiler, theme and search experiments

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

## Verification

The integrated reader and MCP server passed the Cloudflare production build, bundle budget and deployment dry-run. On a locally bound Worker, 47 public Chromium tests passed. A separate MCP client read all 263 sections and the corresponding HTTP section indexes returned exactly the same public IDs. The full dependency release gate still rejects the existing picomatch advisory below.

The earlier reader baseline passed 42 public Chromium tests against the locally built Cloudflare Worker. They covered the 43-page manifest, no-JavaScript navigation, copyable examples, section anchors, mobile layout, and alternating HTML and Markdown requests to the same URL. On a 390-pixel-wide phone, search began 176 CSS pixels below the top of the viewport. The source checker compared all 91 pinned source records with the actual v0.1.224 release commit.

The build with SvelteKit 3.1.1 passed its bundle budget. The site update also took compatible Hono and Node server patches, clearing twelve distinct advisories from its lockfile. On the audit date, `npm audit` still reported the transitive `picomatch@4.0.7` advisory, for which upstream listed no patched release. [Upstream advisory](https://github.com/advisories/GHSA-fc5q-39xc-vjpf)

## What still needs editorial work

The longest reference pages still take many screens to read. Use command-search misses and support questions to identify which procedures justify separate task guides. Keep release scope visible when copying or splitting a guide. The source inventory pins the handbook and operational/provider guides to v0.1.224. Learning and comparison pages carry individual dates. Cross-platform command execution remains a separate verification job. [Source-review procedure](../operations/documentation-maintenance.md)
