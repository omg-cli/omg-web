---
name: OMG
description: Neutral developer-tool surfaces, readable commands, and direct installation paths.
colors:
  paper: '#ffffff'
  paper-raised: '#f5f5f5'
  ink: '#171717'
  ink-muted: '#626262'
  rule: '#e3e3e3'
  rule-strong: '#b5b5b5'
  signal: '#c23b15'
  signal-hover: '#a52d0c'
  signal-ink: '#ffffff'
  danger: '#b32d40'
  dark-paper: '#101010'
  dark-paper-raised: '#1b1b1b'
  dark-ink: '#f4f4f4'
  dark-ink-muted: '#adadad'
  dark-rule: '#303030'
  dark-rule-strong: '#666666'
  dark-signal: '#ff936e'
  dark-signal-hover: '#ffb49a'
  dark-signal-ink: '#171717'
  dark-danger: '#f08b95'
  workspace-paper: '#090909'
  workspace-paper-raised: '#111111'
  workspace-ink: '#f2f0ea'
  workspace-ink-muted: '#9f9b95'
  workspace-rule: rgb(242 240 234 / 0.13)
  workspace-rule-strong: rgb(242 240 234 / 0.28)
  workspace-signal: '#ff5f38'
  workspace-signal-hover: '#ff7655'
  workspace-signal-ink: '#090909'
  workspace-danger: '#ed707a'
  terminal-bg: '#171717'
  terminal-ink: '#ededed'
  terminal-muted: '#ababab'
  terminal-rule: '#383838'
  terminal-output: '#d6d6d6'
  terminal-selected: '#ff936e'
typography:
  display:
    fontFamily: "'Archivo Variable', 'Archivo Fallback', system-ui, sans-serif"
    fontSize: clamp(2rem, 3.7vw, 3.4rem)
    fontWeight: 720
    lineHeight: 1.08
    letterSpacing: -0.035em
  headline:
    fontFamily: "'Archivo Variable', 'Archivo Fallback', system-ui, sans-serif"
    fontSize: clamp(1.5rem, 2.6vw, 2.2rem)
    fontWeight: 680
    lineHeight: 1.15
    letterSpacing: -0.03em
  title:
    fontFamily: "'Archivo Variable', 'Archivo Fallback', system-ui, sans-serif"
    fontSize: 1.375rem
    fontWeight: 650
    letterSpacing: -0.02em
  body:
    fontFamily: "'Archivo Variable', 'Archivo Fallback', system-ui, sans-serif"
    fontSize: 0.9375rem
    lineHeight: 1.75
  label:
    fontFamily: "'Archivo Variable', 'Archivo Fallback', system-ui, sans-serif"
    fontSize: 0.8125rem
    fontWeight: 600
  code:
    fontFamily: "'IBM Plex Mono', 'Plex Mono Fallback', ui-monospace, monospace"
    fontSize: clamp(0.75rem, 1.3vw, 0.9375rem)
rounded:
  square: '0'
  control: 6px
  panel: 12px
spacing:
  half: 0.5rem
  three-quarter: 0.75rem
  one: 1rem
  one-quarter: 1.25rem
  one-half: 1.5rem
  two: 2rem
  two-half: 2.5rem
  three: 3rem
components:
  button-primary:
    backgroundColor: '{colors.signal}'
    textColor: '{colors.signal-ink}'
    rounded: '{rounded.control}'
    padding: 0.75rem 1.1rem
  button-primary-hover:
    backgroundColor: '{colors.signal-hover}'
  button-outline:
    textColor: '{colors.ink}'
    rounded: '{rounded.control}'
    padding: 0.65rem 1rem
  button-outline-hover:
    backgroundColor: '{colors.signal}'
    textColor: '{colors.signal-ink}'
  button-copy:
    backgroundColor: '{colors.ink}'
    textColor: '{colors.paper}'
    rounded: '{rounded.control}'
    padding: 0.65rem 1rem
  button-copy-hover:
    backgroundColor: '{colors.signal}'
    textColor: '{colors.signal-ink}'
  input-login:
    backgroundColor: transparent
    textColor: '{colors.ink}'
    rounded: '{rounded.square}'
    padding: 0.8rem 1rem
  panel-install:
    backgroundColor: '{colors.paper-raised}'
    rounded: '{rounded.control}'
    padding: 0.75rem 0.75rem 0.75rem 1.25rem
  panel-command:
    backgroundColor: '{colors.terminal-bg}'
    textColor: '{colors.terminal-ink}'
    rounded: '{rounded.panel}'
---

# Design System: OMG

## Overview

**Creative North Star: "The command workbench"**

OMG uses familiar developer-tool craft: neutral white or charcoal surfaces, measured Archivo headings, and Plex command text. The user named bun.com and ripgrep.dev as references and rejected green-tinted public surfaces and repetitive slogan/feature rows. The user reviewed and approved this replacement on 2026-11-11 and authorized merging it into main and deploying it with Wrangler.

The command explorer is the homepage's signature component. The prompt and persistent transcript are the first interactive content in the page body. Orange marks actions, selection, and focus; documentation and technical details remain visually quiet. Authenticated dashboard and admin routes retain their independent dark operational theme.

**Key Characteristics:**

- Neutral public light/dark surfaces with restrained orange actions.
- Archivo hierarchy and IBM Plex Mono commands, with metric-matched font fallbacks.
- Full-width command exploration and compact, varied technical content.
- Flat tonal grouping, small control corners, and larger container corners.

Runtime sources are canonical: `site/src/app.css`, shared public navigation, home components, login fields, and documentation layouts. Frontmatter mirrors their reusable values; its names do not add CSS variables. The sidecar contains preview snippets and extensions. Synthesized tonal ramps are panel previews, not additional runtime palette choices.

## Colors

Public surfaces are strictly neutral. Orange marks actions and keyboard focus. The terminal distinguishes commands and output by type and contrast.

### Primary

- **Signal orange** identifies install actions, active choices, focus, selection, and link hover. The dark-mode signal lightens for charcoal surfaces. Signal ink supplies contrasting action text.
- **Workspace orange** retains the existing brighter account/operator action treatment.

### Neutral

- **Paper and raised paper** separate the page from command selection, runtime, source, and installer containers. Dark variants preserve the same roles.
- **Ink and muted ink** distinguish headings and executable commands from explanations and metadata. **Rule and strong rule** divide technical content and outline controls.
- **Terminal charcoal, ink, muted text, rule, and output** form the consistently dark transcript. **Terminal selected** marks the prompt, insertion caret and local keyboard focus.
- **Workspace paper, raised paper, ink, muted ink, and translucent rules** preserve the account/operator palette independently.
- **Danger** and its dark/workspace variants remain reserved for error states.

**The Theme Boundary Rule.** Public pages follow the system scheme until a light or dark preference is saved under omg-theme. The same-origin theme script updates the root data-theme attribute, browser theme color, system changes, and cross-tab changes. CSS supplies the no-JavaScript system fallback. Dashboard and admin routes keep the scoped workspace override; the command transcript stays dark in either public mode.

## Typography

Archivo Variable supplies display and body text, with the existing Archivo Fallback metrics and system sans fallback. IBM Plex Mono supplies commands, transcripts, technical file names, and login input text, with the existing Plex Mono Fallback metrics. Preserve font preloading and metric overrides when changing loading behavior.

### Hierarchy

- **Display** is the compact homepage definition; its maximum measure is 30ch and its size scales from 2rem to 3.4rem.
- **Headline** records package/runtime headings. The installation title uses `clamp(1.75rem, 3vw, 2.5rem)`, weight 650, and line height 1.15.
- **Title** records compact environment and source headings.
- **Body** records package/runtime explanation. The introduction uses 1rem and line height 1.75; small technical notes range from 0.75rem to 0.875rem.
- **Label** records compact technical step labels. Navigation uses 0.8125rem and weight 500; action labels use weight 600.
- **Code** records the responsive installer scale. The transcript scales from 0.8125rem to 0.9375rem at line height 1.6. The editable command is 1rem.

Headings use balanced wrapping and negative tracking. Explanatory widths vary by context: headline 30ch, package/runtime copy 51ch, and reading articles 48rem. Do not impose one measure on every surface.

## Layout

The public shell is centered at `min(100% - clamp(2.5rem, 8vw, 8rem), 75rem)`. Homepage sections use `clamp(3rem, 5vw, 4.5rem)` vertical padding. Spacing and headings separate the sections. The header, footer, and package list have no decorative dividing rules.

A short product definition precedes a full-width, editable Arch terminal. Keep the prompt in the opening phone viewport. Place the install and documentation links below the terminal.

The package backend list and runtime guidance sit side by side and stack below 40rem. The homepage has no benchmark section or repeated search example. Installation pairs a short platform description with one command row and its copy button. It stacks below 50rem. The footer keeps navigation, author credit, and source links in two compact rows.

The header is 4.5rem high. Below 50rem, the full navigation and account link give way to a native details menu, with the theme control inside it; the install action stays visible. The footer stacks below 40rem. Documentation uses a 16rem sidebar from 64rem; learning articles use a 15rem contents column at that breakpoint. Keep the 20rem body minimum and `min-width: 0` around code-bearing grid children.

Controls generally reserve 2.75rem of height. Commands wrap. Reserve space for clipboard status and keep commands readable without JavaScript.

Below 48rem, documentation code blocks place the copy button above the code. Use 14px monospace text with 1.65 line height and 14px horizontal padding. Preserve lines and indentation. Long lines scroll inside the block instead of wrapping or widening the page. Code can receive keyboard focus for scrolling. Keep copy feedback beside the button.

The terminal is 34rem tall, or 32rem at widths of 40rem or less. Its height stays the same when output is empty or commands run. Output scrolls above the prompt. The command menu opens over the output and scrolls without resizing the terminal.

## Elevation & Depth

Public content uses neutral tones and spacing. Keep borders around controls and the terminal, with no shadow. The open mobile menu uses the existing soft shadow (`0 12px 20px rgb(0 0 0 / 0.08)`).

Use spacing and neutral backgrounds to group content. Do not add horizontal rules between homepage sections.

## Shapes

Controls and the installer command row use 6px corners. Raised runtime/source panels use 12px corners. Login fields and documentation panels retain their existing square corners. Mobile menu links and the terminal Run control use a local 4px radius. Use inline SVG icons and preserve the existing OMG brand mark.

## Components

### Buttons

Primary install actions use signal fill and contrasting ink, a three-rem minimum height, and medium-weight Archivo. Hover uses the signal-hover token. Header install actions begin transparent with a strong-rule border and fill on hover. Copy actions begin in ink on paper and change to signal on hover; pending state reduces opacity to 0.6 and uses a wait cursor.

The global keyboard treatment is a two-pixel signal outline with a four-pixel offset. Terminal focus uses the local light orange outline with a negative four-pixel offset. Controls do not lift or scale.

### Cards / Containers

A neutral command row places the installer command beside its copy button. Prerequisites and source links sit below it. List supported package managers in a definition list without row borders. Runtime guide links lead to setup instructions for each language or runtime.

### Inputs / Fields

Login fields retain square corners, transparent backgrounds, a strong-rule border, mono text, and 0.8rem by 1rem padding. Focus changes the border to signal; the existing field-specific rule removes the outline. Preserve visible focus when extending the form. Errors use danger; disabled submission reduces opacity.

### Navigation

Header links use small, medium-weight Archivo in muted ink. Hover and current-page state use signal. The mobile menu uses native details and summary; its links inherit public theme colors. Essential project and legal footer links follow the same muted-to-signal treatment. No affiliate or plugin advertising belongs in the footer.

### Command explorer

The labeled Arch simulation opens with a completed package search and an editable command. A fixed-height scrollback records commands and their results. Run, Enter and touch suggestions use the same session. The simulated package set, active Node version and captured lockfile live only in the mounted component. Arrow keys recall recent commands. Show the initial output and command reference link when JavaScript is unavailable.

### Installation block

Show the one-line installer with a nearby source inspection link and the GitHub CLI prerequisite. Reserve a status line for clipboard feedback. Keep the terminal's search example out of the installation section. InstallationView owns clipboard state and analytics.

Smooth anchor scrolling becomes automatic under reduced motion. The editable input uses the native insertion caret.

## Do's and Don'ts

### Do:

- **Do** preserve neutral public light/dark tokens and the separate workspace override.
- **Do** keep commands readable, selectable, and paired with useful guide links.
- **Do** choose grouping from content: definition lists, code panels, compact bands, or native details.
- **Do** preserve visible keyboard focus, wrapping code, complete transcripts, and reduced-motion behavior.
- **Do** preserve the existing wordmark, Archivo, and IBM Plex Mono.

### Don't:

- **Don't** reintroduce green-tinted public surfaces or repetitive slogan/feature-row composition.
- **Don't** replace the public palette with the authenticated workspace palette.
- **Don't** add generic AI decoration, ornamental imagery, or repeated shadowed cards.
- **Don't** present historical unequal-work benchmark timings as visual proof of a speedup.
- **Don't** replace the approved neutral CLI-tool direction with green-tinted palettes or repetitive slogan sections.
