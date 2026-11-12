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
  terminal-output-highlight: '#a9cfff'
typography:
  display:
    fontFamily: "'Archivo Variable', 'Archivo Fallback', system-ui, sans-serif"
    fontSize: clamp(2.5rem, 4.3vw, 3.75rem)
    fontWeight: 720
    lineHeight: 1.08
    letterSpacing: -0.035em
  headline:
    fontFamily: "'Archivo Variable', 'Archivo Fallback', system-ui, sans-serif"
    fontSize: clamp(1.75rem, 2.7vw, 2.4rem)
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
    rounded: '{rounded.panel}'
    padding: clamp(1.25rem, 3vw, 2rem)
  panel-command:
    backgroundColor: '{colors.terminal-bg}'
    textColor: '{colors.terminal-ink}'
    rounded: '{rounded.panel}'
  example-selector:
    backgroundColor: '{colors.paper}'
    textColor: '{colors.signal}'
    rounded: '{rounded.control}'
    padding: 1rem
---

# Design System: OMG

## Overview

**Creative North Star: "The command workbench"**

OMG uses familiar developer-tool craft: neutral white or charcoal surfaces, measured Archivo headings, and Plex command text. The user named bun.com and ripgrep.dev as references and rejected green-tinted public surfaces and repetitive slogan/feature rows. The user reviewed and approved this replacement on 2026-11-11 and authorized merging it into main and deploying it with Wrangler.

The command explorer is the homepage's signature component. Its selection rail and dark transcript give the product interaction room to be read. Orange marks actions, selection, and focus; documentation and technical details remain visually quiet. Authenticated dashboard and admin routes retain their independent dark operational theme.

**Key Characteristics:**

- Neutral public light/dark surfaces with restrained orange actions.
- Archivo hierarchy and IBM Plex Mono commands, with metric-matched font fallbacks.
- Full-width command exploration and compact, varied technical content.
- Flat tonal grouping, small control corners, and larger container corners.

Runtime sources are canonical: `site/src/app.css`, shared public navigation, home components, login fields, and documentation layouts. Frontmatter mirrors their reusable values; its names do not add CSS variables. The sidecar contains preview snippets and extensions. Synthesized tonal ramps are panel previews, not additional runtime palette choices.

## Colors

Public surfaces are strictly neutral. Orange is the action accent; terminal output uses a small blue highlight for result hierarchy.

### Primary

- **Signal orange** identifies install actions, active choices, focus, selection, and link hover. The dark-mode signal lightens for charcoal surfaces. Signal ink supplies contrasting action text.
- **Workspace orange** retains the existing brighter account/operator action treatment.

### Neutral

- **Paper and raised paper** separate the page from command selection, runtime, source, and installer containers. Dark variants preserve the same roles.
- **Ink and muted ink** distinguish headings and executable commands from explanations and metadata. **Rule and strong rule** divide technical content and outline controls.
- **Terminal charcoal, ink, muted text, rule, and output** form the consistently dark transcript. **Terminal selected** marks the prompt, caret, guide hover, and local keyboard focus. **Terminal output highlight** distinguishes output headings and successful result lines; it is not a public brand accent.
- **Workspace paper, raised paper, ink, muted ink, and translucent rules** preserve the account/operator palette independently.
- **Danger** and its dark/workspace variants remain reserved for error states.

**The Theme Boundary Rule.** Public pages follow the system scheme until a light or dark preference is saved under omg-theme. The same-origin theme script updates the root data-theme attribute, browser theme color, system changes, and cross-tab changes. CSS supplies the no-JavaScript system fallback. Dashboard and admin routes keep the scoped workspace override; the command transcript stays dark in either public mode.

## Typography

Archivo Variable supplies display and body text, with the existing Archivo Fallback metrics and system sans fallback. IBM Plex Mono supplies commands, transcripts, technical file names, and login input text, with the existing Plex Mono Fallback metrics. Preserve font preloading and metric overrides when changing loading behavior.

### Hierarchy

- **Display** is the compact homepage definition; its measure starts at 17ch, becomes 23ch below 55rem, and uses 2.5rem below 35rem.
- **Headline** records package/runtime headings. The installation title uses the shared larger scale, `clamp(2.25rem, 4vw, 3.25rem)`, weight 650, line height 1.1.
- **Title** records compact environment and source headings. First-command headings use 1.25rem with line height 1.35.
- **Body** records package/runtime explanation. The introduction uses 1rem and line height 1.75; small technical notes range from 0.75rem to 0.875rem.
- **Label** records compact technical step labels. Navigation uses 0.8125rem and weight 500; action labels use weight 600.
- **Code** records the responsive installer scale. The transcript command uses 0.875rem and output 0.8125rem with line height 1.85.

Headings use balanced wrapping and negative tracking. Explanatory widths vary by context: intro 47ch, package/runtime copy 49ch, and reading articles 48rem. Do not impose one measure on every surface.

## Layout

The public shell is centered at `min(100% - clamp(2.5rem, 8vw, 8rem), 75rem)`. Homepage sections use `clamp(3rem, 5vw, 4.5rem)` vertical padding and thin dividing rules. Content determines grouping and density.

The homepage introduction pairs a product definition with explanation/actions in two columns, then gives the command explorer the full shell width. The introduction stacks below 55rem. The explorer uses a 17rem selection rail, reduced to 14rem below 55rem; below 40rem its choices become a compact horizontal row above the transcript. The runtime guide band wraps naturally below it.

The package backend definition list and raised runtime panel sit side by side; an environment strip spans both. These stack below 40rem. The source/performance panel also stacks below 40rem. The installer keeps a download/review block and a separate first-command block, which stacks below 44rem.

The header is 4.5rem high. Below 50rem, the full navigation and account link give way to a native details menu, with the theme control inside it; the install action stays visible. The footer stacks below 40rem. Documentation uses a 16rem sidebar from 64rem; learning articles use a 15rem contents column at that breakpoint. Keep the 20rem body minimum and `min-width: 0` around code-bearing grid children.

Interactive links and controls generally reserve 2.75rem height. Commands wrap; transcript output may scroll vertically inside its fixed viewport. Keep persistent space for clipboard status and readable commands without JavaScript.

## Elevation & Depth

Public content is flat. Neutral tones, one-pixel rules, and spacing establish hierarchy. The command explorer has a border and no shadow. The open mobile menu alone uses the existing soft shadow (`0 12px 20px rgb(0 0 0 / 0.08)`).

**The Flat Content Rule.** Use neutral tonal grouping and thin rules for ordinary content. The command explorer is flat and bordered; reserve the existing soft shadow for the open mobile menu.

## Shapes

Controls use gently rounded corners (6px). The explorer, raised runtime/source panels, and installer use container corners (12px). Login fields and documentation panels retain their existing square corners. Mobile menu links and terminal playback controls use a local 4px radius. Use inline SVG icons and preserve the existing OMG brand mark.

## Components

### Buttons

Primary install actions use signal fill and contrasting ink, a three-rem minimum height, and medium-weight Archivo. Hover uses the signal-hover token. Header install actions begin transparent with a strong-rule border and fill on hover. Copy actions begin in ink on paper and change to signal on hover; pending state reduces opacity to 0.6 and uses a wait cursor.

The global keyboard treatment is a two-pixel signal outline with a four-pixel offset. Terminal focus uses the local light orange outline with a negative four-pixel offset. Controls do not lift or scale.

### Cards / Containers

Raised neutral panels group runtime instructions, source/performance details, and installation. They use container corners without shadows. Backend support uses a definition list with ruled rows; environment commands occupy a compact spanning strip. These are content-specific structures, not a repeated feature-card grid.

### Inputs / Fields

Login fields retain square corners, transparent backgrounds, a strong-rule border, mono text, and 0.8rem by 1rem padding. Focus changes the border to signal; the existing field-specific rule removes the outline. Preserve visible focus when extending the form. Errors use danger; disabled submission reduces opacity.

### Navigation

Header links use small, medium-weight Archivo in muted ink. Hover and current-page state use signal. The mobile menu uses native details and summary; its links inherit public theme colors. Essential project and legal footer links follow the same muted-to-signal treatment. No affiliate or plugin advertising belongs in the footer.

### Command explorer

A public-theme toolbar and command selection rail surround a separate charcoal transcript. Desktop choices show category and command preview; the selected choice has paper fill, a rule border, and signal text. Narrow choices hide previews and remain a readable three-choice row. The transcript body is 17rem tall on desktop and 18rem below 40rem. Its output uses neutral gray, with blue for headings and success lines.

HomeTerminal owns playback; terminal-examples holds source-matched Arch fixtures. A 300ms lead-in precedes typing at 42ms per character; output appears at 150ms per line, then stops. Selecting a command cancels the previous timer. Pause and replay controls stay inside the terminal. Hidden tabs pause. Reduced motion and server rendering show the complete transcript immediately. A separate complete transcript announces only example changes to assistive technology. Keep the visible Example output label and the destination guide link. The demo never executes commands.

### Installation block

Keep the download, review, then execute order visible in wrapped code. The copy control has a persistent status area; provenance and platform requirements stay alongside the command. The follow-up search is read-only and links to the quick start. InstallationView continues to own clipboard state and analytics.

Smooth anchor scrolling becomes automatic under reduced motion. The typing caret is the only looping visual state during command entry; there is no decorative entrance sequence.

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
