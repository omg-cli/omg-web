---
version: 1
slug: 'site-src-routes-page-svelte'
primary_target: 'site/src/routes/+page.svelte'
related_targets:
  [
    'site/src/lib/components/home/HomeHero.svelte',
    'site/src/lib/components/home/HomeTerminal.svelte',
  ]
---

# Public website replacement

## SCOPE AND MODE

Homepage and shared public theme/navigation. Persuade; docs remain Read. Keep account/operator workspaces and backend behavior.

## AUDIENCE AND JOB

Developers evaluating OMG: understand package/runtime scope, inspect actual commands, install safely, find docs. User chose familiar CLI-tool craft, naming bun.com and ripgrep.dev. User rejected green-tinted surfaces and repetitive slogan/row composition.

## DIRECTION

Category-standard developer-tool site played straight, code-led. Neutral white/charcoal, existing orange brand in action/selection only. Product interaction carries the page; no decorative images, badges, invented benchmarks or social proof. Seed 06f61a97 assigned index 7; user-pinned competitor-like direction overrides it under the standing-exit rule.

## FIRST VIEWPORT

Compact header, one product definition, then the editable terminal. The prompt is visible on a compact phone. Install and docs links follow it.

## SIGNATURE INTERACTION

A visitor runs commands against a simulated Arch session. Installed packages and the active Node version can diverge from a captured lockfile. Enter, Run, touch suggestions and keyboard history operate on the same session. A complete initial search and a command reference link remain readable without JavaScript.

## PATH AND CONSTRAINTS

Explore a command → inspect supported backends/runtime behavior → run the one-line installer → quickstart. Dense technical content replaces repeated feature slogans. Both themes have strictly neutral surfaces. Preserve platform limits, the one-line installer with optional source inspection and existing provenance checks, documented output, metadata, privacy, navigation and existing logo. The user reviewed the local result on 2026-11-11 and authorized merging into main and deployment with Wrangler.

## Direction contract

THESIS: Show OMG working through one full-width command explorer.

OWN-WORLD: Neutral white and charcoal surfaces, restrained orange controls, Archivo type and Plex command text.

STORY: Understand the package/runtime scope, inspect commands, check platform support, then install and open the quickstart.

FIRST VIEWPORT: Product definition, simulated Arch output and an editable prompt. Installation and docs follow the terminal.

FORM: Familiar CLI-tool website, explicitly pinned by user references Bun and ripgrep.dev; canon overrides seed 06f61a97 assigned index 7. Code-led.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Installer command preference · 2026-11-13

The user explicitly requested `curl -fsSL https://getomg.dev/install.sh | bash` as the primary installer command, with a nearby `install.sh` link for optional inspection. Keep the visible command and clipboard value identical. Do not restore a mandatory download/less/run sequence or use quitting a pager as an execution gate.
