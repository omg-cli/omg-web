# Website redesign

## Status and direction

The user reviewed and approved the replacement on 2026-11-11 and authorized merging it into main and deploying it with Wrangler. The user chose familiar modern CLI-tool craft, naming bun.com and ripgrep.dev, and rejected the earlier green-tinted palette and repetitive slogan/feature-row layout. The implemented design follows that reviewed direction.

The current public palette is neutral white/charcoal with an orange action accent. Runtime CSS is canonical and DESIGN.md mirrors it. The surface contract lives in `.impeccable/surfaces/site-src-routes-page-svelte.md`; this document records implementation and validation context.

## Implemented composition

A compact two-column introduction defines the package/runtime CLI and offers installation and documentation. One full-width command explorer follows, with command previews in a public-theme selection rail and an always-dark neutral Arch transcript. On mobile, choices form a horizontal row above output. A compact language guide band closes the introduction.

Below it, a package backend definition list sits beside a raised runtime panel. A spanning environment strip keeps capture and drift scope visible. Compact source information and a native performance disclosure precede installation. This replaces the repeated feature-row composition with structures fitted to their content.

## Architecture and product boundaries

The root layout retains shared header/footer ownership and the public/workspace theme boundary. HomeHero owns the introduction; HomeTerminal owns command selection and playback; terminal-examples holds source-reviewed fixtures. InstallationView owns clipboard outcomes and associated analytics. Auth, server loads, metadata, document data, privacy behavior, and backend contracts keep their existing owners.

Public pages follow system light/dark preference until the visitor selects a preference. The same-origin theme script applies the root attribute, persists omg-theme, updates browser theme color, and handles system/cross-tab changes. CSS supports the no-JavaScript system preference. Account and operator workspaces retain their scoped operational dark palette.

Keep supported x86_64 Linux and Apple Silicon macOS scope, including supported Linux inside WSL2; there is no native Windows build. Environment capture/drift checks remain scoped to Arch, Debian, and Ubuntu. Installation visibly downloads a script for review before execution and explains GitHub CLI provenance verification. Historical unequal-work benchmark timings remain qualified rather than promoted as speedup proof.

## Motion and access

The terminal types one real command, reveals source-matched Arch example output, then stops. Values are representative fixtures labeled Example output. Pause/replay stay operable; selecting another example cancels the prior timer, and background tabs pause. Reduced motion and server rendering show the complete transcript. Assistive technology receives a separate complete transcript rather than character announcements. The demo executes no commands and makes no network calls.

Preserve native details navigation/disclosure, visible focus, wrapping commands, 44px control targets, clipboard success/denial status, and narrow layouts. No decorative entrance sequence, imagery, badges, fabricated social proof, or affiliate/plugin advertising is part of the direction.

## Verification and remaining review

Validate Svelte/types, site unit tests, production build and bundle budget, and focused public browser coverage. Inspect desktop/mobile light/dark screenshots together; exercise command selection/playback, reduced motion, navigation, clipboard outcomes, and keyboard menu operation. Verification evidence belongs in the task report; this document does not claim that an unrun check passed.

The user reviewed the actual local preview and approved release. No participant research was performed. A later usability study could ask developers to explain package/runtime scope, find platform requirements, inspect a command, and reach the appropriate install/runtime guide; record only observations actually collected.
