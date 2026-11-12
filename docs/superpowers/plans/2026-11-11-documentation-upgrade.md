# Documentation upgrade implementation plan

> For agentic workers: use the executing-plans workflow for the parent integration and the assigned, disjoint content/code tasks. Update this plan as verified integration constraints resolve.

**Goal:** Correct the published CLI guidance, adopt the user's selected SveltePress tooling, and make the documentation complete to navigate and consume as Markdown.

**Architecture:** Keep the SvelteKit app, existing canonical URLs, auth boundaries, and neutral OMG theme. SveltePress owns Markdown compilation and documentation tooling. One authored content source must feed HTML, search, Markdown exports, and agent indexes. Released guidance uses immutable v0.1.224 source references; development behavior is explicitly distinguished.

**Tech stack:** SvelteKit 3, Svelte 5, SveltePress Vite 1.10.0, existing Cloudflare adapter, npm. Evaluate the plugin's built-in Pagefind and llms generators against the existing CSP and response-header requirements before choosing their integration.

**Evidence:** docs/audits/2026-11-11-cli-documentation.md and 2026-11-11-web-code.md.

## Constraints

- Preserve the dirty sibling CLI checkout and its user changes.
- Keep the approved site styling, canonical URLs, platform limits and safe installer/provenance flow.
- Never treat local unreleased AUR changes as published behavior.
- Markdown/agent endpoints must have explicit content types, version/source evidence, and escaped safe HTML counterparts.
- No hosted search, chat service, advertising, or new account requirement.
- Package migration must preserve account/operator routes, CSP, no-JavaScript reading and Cloudflare bindings.
- Implementation is authorized. This task does not yet authorize publishing a separate documentation overhaul.

## Review focus

- A new release must not silently turn historical claims into current instructions.
- Commands with findings/drift or validation errors need accurate exit semantics for CI/agents.
- All authored docs must appear in navigation, search and machine-readable exports.
- Built static responses must follow staging robots policy, including HEAD and cache hits.
- Concurrent upstream-feed requests must share a refresh within one isolate and recover after failure.
- Mobile/no-JavaScript readers must reach search results, section anchors, source references and Markdown.

## Work

- [x] Audit website/code and all existing handbook/learning modules; record evidence and limits.
- [x] Research current Astro/Starlight, SveltePress, mdsvex, Pagefind and search options from official docs/package metadata. User selected SveltePress.
- [x] Refresh source-reviewed release content, pin evidence, and expose unresolved coverage gaps honestly.
- [x] Integrate SveltePress into the existing Vite plugin, forwarding adapter/CSP options exactly once; retain custom OMG layouts.
- [x] Migrate authored documentation into its Markdown pipeline without maintaining competing editable copies; preserve diagrams and anchors.
- [x] Add structured doc metadata, complete Markdown/agent exports and useful scoped full-text search.
- [x] Improve the docs reader with topic/section navigation, source/version disclosure, copy controls and next/previous links.
- [x] Fill major missing end-user domains using verified release sources and maintain a coverage inventory.
- [x] Fix the reproduced staging response and feed refresh defects with focused regressions.
- [x] Add repeatable upstream review, inventory/link/Markdown parity checks and maintenance instructions.
- [x] Run type/lint/unit/build/budget and public browser checks; verify the built adapter boundary. Inspect desktop/mobile light/dark in a bounded batch.
- [x] Commit reviewable changes and report implementation, verification, remaining limitations and framework tradeoffs.

## Final implementation decisions and validation

SveltePress compiles eighteen new native Markdown guides in the existing OMG layouts. The eight typed handbook modules and seventeen typed learning pages remain their single editable sources, preserving diagrams/URLs. One catalog supplies all 43 documents to server-side MiniSearch, Markdown exports, the full-text export and machine-readable manifest. Pagefind and built-in llms generation stay disabled because this mixed catalog and adapter need their own output/header handling. No Astro, mdsvex or default-theme dependency is added. See the [platform decision](../../decisions/2026-11-11-documentation-platform.md).

Verification on 2026-11-11:

- Full root `npm run check` passed: installer/security gates, policy/inventory/lockfile checks,19 release tests, strict site/Worker/tools type checks, lint/format, all 3 npm audits with 0 vulnerabilities, build/bundle budgets and 4 deployment dry runs; 425 site and 423 API tests passed, plus 13 source-check fixtures.
- After final search cache/touch-target adjustments, strict site check, build/budget, lint/format and public browser suite passed. 39 browser tests passed; 3 deployed-auth-only tests skipped intentionally.
- Browser checks cover all 43 HTML/Markdown/manifest/full-text/sitemap entries and section anchors, internal documentation links, bounded search JSON, no-JavaScript reading/navigation/search, clipboard success/failure, 44px outline links and 1440/320px light/dark overflow.
- Built local Wrangler staging Worker: 14 GET/HEAD requests across prerendered/dynamic/agent routes passed status, MIME, stage robots, CSP, no-store and empty HEAD-body assertions. XML sitemap robots exception passed. This is local built-artifact evidence, not a deployed binding/auth test.
- Immutable v0.1.224 clone check passed for 91 recorded source blobs. Comparing recorded origin/main reports drift intentionally; it does not advance dates.
- Impeccable detector returned no findings. Fresh full finish review found one 44px TOC target fix; reviewer scored it resolved with `ship` at fix-list scope. Independent final correctness review found no further material defects.
- Full-page desktop/mobile light/dark captures are local review artifacts under `.impeccable/review/docs/`; detailed command logs are in `/tmp/omg-docs/`.

No CLI execution certification, production deployment or live authenticated acceptance is claimed. Audit reports preserve the original findings and record implementation status and deeper coverage gaps. The sibling CLI working changes were preserved.
