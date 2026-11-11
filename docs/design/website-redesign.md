# Website redesign

## Decision

Build a direct developer-tool website around executable command examples. Retain the product's orange accent and existing typeface; replace the black oversized-poster composition with compact light pages and dark code panels. The user confirmed a modern, direct CLI-project direction without AI-style decoration. Build directly in Svelte, without a raster mockup.

## Architecture

The root layout owns the shared header, footer, and public/workspace theme boundary. CSS tokens own color, spacing, and type. HomeHero owns only the selected command example. InstallationView continues to own the installer and clipboard outcomes. Server loads, auth, analytics, and document data retain their current owners.

Usage: visitor scans the purpose, selects a command example, opens installation, copies the reviewed installer, then continues to the quick start. Documentation and learning pages inherit the same public tokens and navigation.

Alternatives considered: keep the black poster identity and only polish its spacing; rebuild all account and operator screens. The first retains the repetition the user rejected. The second couples an aesthetic change to unrelated authenticated workflows. The chosen theme boundary allows consistent public pages while protecting those workspaces.

## Scope

Shared tokens and navigation, complete homepage, compact footer, documentation and guide readability. Semantic buttons and links, visible focus, 44px controls, reduced motion, narrow-screen layouts, and no-JavaScript readable commands.

## Verification

Run Svelte/type checks, public browser tests, site unit tests, production build and bundle budget. Inspect desktop and mobile screenshots together, including docs and guides. Exercise command selection, navigation, clipboard success and denial, and keyboard menu operation.

## Research follow-up

Decision to validate: can a new developer understand OMG and reach an appropriate install or runtime guide without guessing? Recruit five developers across Linux and macOS. Ask them to describe what OMG manages, locate platform requirements, install after reviewing the script, select a runtime, and find benchmark evidence. Record task completion, first-click choice, confusion, and verbatim anonymous notes with consent. Current design judgments come from source inspection and heuristic review, not claimed participant findings.

## Dark mode and terminal playback

Keep the approved composition and add a system-aware light/dark preference. A small preloaded, deferred same-origin script applies the saved preference at startup, preserving public caching and the existing CSP. It owns persistence, system/cross-tab updates, and delegated clicks on the header controls, including prerendered pages without hydration. CSS handles the initial system palette and the no-JavaScript fallback. Authenticated workspace tokens stay scoped.

The terminal is the single focal animation: type one real OMG command, reveal source-matched output line by line, then stop. Arch Linux is the example host. Versions and environment values are representative fixtures, labeled as example output. Pause and replay belong to the terminal. Selecting a workflow cancels the previous timer. Reduced motion and no JavaScript show the complete transcript; background tabs pause. No network calls or command execution occur.
