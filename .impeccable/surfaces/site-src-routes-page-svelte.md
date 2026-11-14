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

Compact header. Two-column introduction: a direct two-line product definition and short explanation/actions. Below it one full-width command explorer, with a light command-selection rail and a neutral charcoal Arch terminal. This replaces the rejected tall split hero. A compact language guide band closes the introduction. Narrow screens read title, explanation/actions, command choices, transcript.

## SIGNATURE INTERACTION

The command explorer types a real source-reviewed Arch example and reveals its normal output. Command choices carry readable command previews; pause/replay remain operable, reduced motion and no-JS show the complete transcript. No looping or entrance animation.

## PATH AND CONSTRAINTS

Explore a command → inspect supported backends/runtime behavior → run the one-line installer → quickstart. Dense technical content replaces repeated feature slogans. Both themes have strictly neutral surfaces. Preserve platform limits, the one-line installer with optional source inspection and existing provenance checks, documented output, metadata, privacy, navigation and existing logo. The user reviewed the local result on 2026-11-11 and authorized merging into main and deployment with Wrangler.

## Direction contract

THESIS: Show OMG working through one full-width command explorer.

OWN-WORLD: Neutral white and charcoal surfaces, restrained orange controls, Archivo type and Plex command text.

STORY: Understand the package/runtime scope, inspect commands, check platform support, then install and open the quickstart.

FIRST VIEWPORT: Compact header; product definition left and explanation/actions right; full-width command rail and Arch transcript below; language guides close the introduction.

FORM: Familiar CLI-tool website, explicitly pinned by user references Bun and ripgrep.dev; canon overrides seed 06f61a97 assigned index 7. Code-led.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Installer command preference · 2026-11-13

The user explicitly requested `curl -fsSL https://getomg.dev/install.sh | bash` as the primary installer command, with a nearby `install.sh` link for optional inspection. Keep the visible command and clipboard value identical. Do not restore a mandatory download/less/run sequence or use quitting a pager as an execution gate.
