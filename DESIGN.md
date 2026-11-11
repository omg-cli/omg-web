---
name: OMG
description: A direct developer-tool website built around commands people can read and use.
colors:
  paper: '#fafbf8'
  paper-raised: '#f0f2ec'
  ink: '#22251f'
  ink-muted: '#62675d'
  rule: '#dfe3d9'
  rule-strong: '#b8bfb0'
  signal: '#bc3e1b'
  signal-hover: '#9c2e11'
  signal-ink: '#ffffff'
  danger: '#b32d40'
  terminal-bg: '#20251f'
  terminal-tabs: '#272d25'
  terminal-rule: '#3c4338'
  terminal-ink: '#eff2e9'
  terminal-muted: '#a5b09b'
  terminal-selected: '#f29768'
  terminal-command: '#efb185'
  terminal-prompt: '#a7bf8d'
  workspace-paper: '#090909'
  workspace-paper-raised: '#111111'
  workspace-ink: '#f2f0ea'
  workspace-ink-muted: '#9f9b95'
  workspace-rule: 'rgb(242 240 234 / 0.13)'
  workspace-rule-strong: 'rgb(242 240 234 / 0.28)'
  workspace-signal: '#ff5f38'
  workspace-signal-hover: '#ff7655'
  workspace-signal-ink: '#090909'
  workspace-danger: '#ed707a'
  dark-paper: '#141712'
  dark-paper-raised: '#20251d'
  dark-ink: '#eef1e9'
  dark-ink-muted: '#b0b9a7'
  dark-rule: '#343d2e'
  dark-rule-strong: '#606d56'
  dark-signal: '#f29873'
  dark-signal-hover: '#ffb291'
  dark-signal-ink: '#21170f'
  dark-danger: '#f08b95'
typography:
  display:
    fontFamily: "'Archivo Variable', 'Archivo Fallback', system-ui, sans-serif"
    fontSize: 'clamp(3rem, 5.25vw, 4.75rem)'
    fontWeight: 630
    lineHeight: 1.04
    letterSpacing: '-0.04em'
  headline:
    fontFamily: "'Archivo Variable', 'Archivo Fallback', system-ui, sans-serif"
    fontSize: 'clamp(2.25rem, 4vw, 3.25rem)'
    fontWeight: 650
    lineHeight: 1.1
    letterSpacing: '-0.035em'
  title:
    fontFamily: "'Archivo Variable', 'Archivo Fallback', system-ui, sans-serif"
    fontSize: '1.25rem'
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: '-0.025em'
  body:
    fontFamily: "'Archivo Variable', 'Archivo Fallback', system-ui, sans-serif"
    fontSize: '0.875rem'
    lineHeight: 1.75
  label:
    fontFamily: "'IBM Plex Mono', 'Plex Mono Fallback', ui-monospace, monospace"
    fontSize: '0.75rem'
    fontWeight: 500
    letterSpacing: '0.05em'
  code:
    fontFamily: "'IBM Plex Mono', 'Plex Mono Fallback', ui-monospace, monospace"
    fontSize: 'clamp(0.75rem, 1.3vw, 0.9375rem)'
rounded:
  square: '0'
  control: '6px'
  panel: '12px'
spacing:
  half: '0.5rem'
  three-quarter: '0.75rem'
  one: '1rem'
  one-quarter: '1.25rem'
  one-half: '1.5rem'
  two: '2rem'
  two-half: '2.5rem'
  three: '3rem'
components:
  button-primary:
    backgroundColor: '{colors.signal}'
    textColor: '{colors.signal-ink}'
    rounded: '{rounded.control}'
    padding: '0.75rem 1.25rem'
  button-primary-hover:
    backgroundColor: '{colors.signal-hover}'
  button-outline:
    textColor: '{colors.ink}'
    rounded: '{rounded.control}'
    padding: '0.65rem 1rem'
  button-outline-hover:
    backgroundColor: '{colors.signal}'
    textColor: '{colors.signal-ink}'
  button-copy:
    backgroundColor: '{colors.ink}'
    textColor: '{colors.paper}'
    rounded: '{rounded.control}'
    padding: '0.65rem 1rem'
  button-copy-hover:
    backgroundColor: '{colors.signal}'
    textColor: '{colors.signal-ink}'
  input-login:
    backgroundColor: 'transparent'
    textColor: '{colors.ink}'
    rounded: '{rounded.square}'
    padding: '0.8rem 1rem'
  panel-install:
    backgroundColor: '{colors.paper-raised}'
    rounded: '{rounded.panel}'
    padding: 'clamp(1.25rem, 3vw, 2rem)'
  panel-command:
    backgroundColor: '{colors.terminal-bg}'
    textColor: '{colors.terminal-ink}'
    rounded: '{rounded.panel}'
  example-selector:
    backgroundColor: 'transparent'
    padding: '0.6rem 0.85rem'
    height: '2.75rem'
---

# Design System: OMG

## Overview

**Creative North Star: "The command workbench"**

OMG's public pages put readable CLI examples beside direct explanations. The public site supports light green-tinted paper with burnt-orange actions and a dark green-black palette with peach actions. Both modes keep the same composition and type hierarchy. The existing OMG wordmark stays intact.

Use compact navigation, measured headings, ruled content rows, and generous section spacing. The dark command workbench is the signature component. It shows selectable examples and links to their guides. Authenticated dashboard and admin routes retain their existing dark operational theme through a scoped token override.

**Key Characteristics:**

- Readable commands with clear action and guide links.
- Archivo text paired with IBM Plex Mono for code and technical labels.
- System-aware light and dark public pages, an animated Arch command example, and scoped dark authenticated workspaces.
- Small control corners and larger command-container corners.

This document records the implementation in `site/src/app.css`, the shared header and footer, home components, login fields, and documentation layouts. Frontmatter values are normative. The color and spacing names describe extracted values; they do not introduce new runtime CSS variables. `.impeccable/design.json` adds preview snippets, motion, depth, and responsive metadata. Its synthesized tonal ramps are panel previews, not runtime palette additions.

## Colors

The public palette combines green-tinted neutrals with burnt orange. Colors named `terminal-*` belong to the command example; `workspace-*` records the existing authenticated override.

### Primary

- **Burnt-orange signal** is the primary action, selected text, focus outline, link hover, and occasional heading emphasis. Its hover counterpart deepens the same accent. Signal ink supplies the contrasting action text.
- **Workspace orange** is the brighter action accent scoped to dashboard and admin routes, with its own hover and contrasting ink values.

### Neutral

- **Paper and raised paper** distinguish the public page from installer and command-row containers.
- **Ink and muted ink** separate headings and commands from descriptions and metadata. Muted text still carries useful information.
- **Rule and strong rule** separate sections and define outlined controls. They replace most card borders and shadows.
- **Terminal background, tabs, and rule** form the dark command workbench. Terminal ink and muted text establish command and comment hierarchy. Selected peach marks the active example and its focus ring; command peach and prompt green distinguish executable text from the shell prompt.
- **Workspace paper, raised paper, ink, muted ink, and rules** retain the existing dark account and operator palette. The two translucent rules inherit their context.
- **Danger** is reserved for errors, with a lighter workspace variant.

**The Theme Boundary Rule.** Public pages follow the system color scheme until a light or dark choice is saved in localStorage under omg-theme. The header switch is available directly on desktop and inside Menu on mobile. A preloaded, deferred same-origin script owns the root data-theme attribute and delegated toggle clicks, including on prerendered pages without hydration. CSS honors the system preference without JavaScript. Dashboard and admin pages retain their scoped workspace override. The terminal keeps its separate dark palette in both modes.

## Typography

Archivo supplies display and body text. IBM Plex Mono supplies commands, technical labels, and form input text. Use the metric-matched fallback faces already defined in the global stylesheet. Keep the Archivo font preload and fallback metrics when changing font loading.

### Hierarchy

- **Display** is the homepage title. At the hero's narrow breakpoint, it changes to `clamp(3rem, 8.5vw, 4.5rem)`.
- **Headline** is the shared home section title. Workflow and benchmark headings use a smaller local scale, `clamp(2rem, 3.4vw, 2.75rem)`, with weight 600 and line height 1.15.
- **Title** is the recurring workflow title size. Its modest scale keeps commands and instructions prominent.
- **Body** records workflow descriptions. Hero and documentation summaries use a larger size, 1.0625rem. Body line height varies by context, including 1.7 for summaries and 1.8 for article reading.
- **Label** records the mono page kicker, which is uppercase. Navigation and button labels generally remain sentence case in Archivo.
- **Code** records the recurring workflow and installer scale. The installer uses line height 1.9. The hero's first command is larger, `clamp(0.875rem, 1.4vw, 1.125rem)`.

Headings use balanced wrapping and tight negative tracking. Keep explanatory copy within observed reading widths: the hero starts at 35ch, workflow descriptions at 52ch, and learning articles at 48rem. Do not turn these contextual values into a single forced text width.

## Layout

The shared public shell is `min(100% - clamp(2.5rem, 8vw, 8rem), 75rem)`, centered. The homepage sets its content-width variable to 75rem. Sections use horizontal rules and responsive block spacing, usually `clamp(4rem, 7vw, 6rem)`; the installation section uses its own shorter spacing.

The homepage hero has two columns, with a slightly wider command example. It becomes one column at 55rem. Workflow rows, benchmark content, and the first-command block become one column at 44rem. Commands wrap instead of forcing the page wider.

The header is five rem tall on wide screens. Below 50rem, it becomes four and a half rem tall, hides the full navigation and account link, and exposes a native details menu. The installer action remains visible. Below 30rem, the command toolbar and example controls tighten their padding. The footer becomes vertically arranged below 40rem.

Documentation uses a 16rem sidebar at 64rem and above. Learning articles use a 15rem contents column at the same breakpoint. At smaller sizes, reading content follows navigation in one column. Keep the body's 20rem minimum width and use `min-width: 0` on grid content that contains code.

Interactive links and controls generally reserve at least 2.75rem of height. Keep visible keyboard focus, native menu behavior, readable commands without JavaScript, and status space for clipboard feedback.

## Elevation & Depth

Most public content stays flat. Paper tones, thin rules, and spacing provide separation. The command workbench has a restrained shadow, and the open mobile menu has a lighter shadow to distinguish it from content below. There is no global card-shadow system.

### Shadow vocabulary

- **Command workbench:** `0 14px 32px rgb(30 40 20 / 0.12)`.
- **Mobile menu:** `0 12px 20px rgb(30 40 20 / 0.08)`.

**The Flat Content Rule.** Use rules and raised paper for ordinary content. Keep the existing shadows attached to the command workbench and mobile navigation.

## Shapes

Public action controls and workflow command rows use the control radius. The workbench and installer container use the panel radius. Fields and documentation panels keep square corners where the implementation does. Mobile navigation links use a local 4px radius.

Use simple rectangles, one-pixel rules, and inline SVG icons. Preserve the existing OMG brand mark. The visual direction uses no raster compositions or decorative background imagery.

## Components

### Buttons

The primary install link uses signal fill and contrasting ink. It has a three-rem minimum height, medium-weight Archivo, and the control radius. Hover changes its background with `160ms ease-out`.

The header install action starts transparent with a strong-rule border. Hover fills it with signal and changes the text to contrasting ink. The installer copy button starts in ink on paper and switches to signal on hover. Its pending state reduces opacity to 0.6 and uses a wait cursor.

The global keyboard focus treatment is a two-pixel signal outline with a four-pixel offset. Do not add lift or scale transforms to these controls.

### Cards / Containers

Workflow commands use raised paper, control corners, and 1.75rem padding, reduced to 1.25rem in the narrow layout. The installer uses raised paper and panel corners with responsive padding. Workflow descriptions and benchmark evidence use ruled rows rather than repeated detached cards.

### Inputs / Fields

Login fields are square, transparent, and bordered with the strong rule. They use mono text and comfortable inset padding. Focus changes the border to signal; the current field-specific rule removes the outline. Preserve visible focus when extending the form. Form errors use danger text, and disabled submission uses reduced opacity.

### Navigation

Header links use small, medium-weight Archivo and muted ink. Hover and the current page use signal. The menu uses native details and summary elements, and its links return to the root paper palette. The compact footer repeats essential project and legal links with the same muted-to-signal interaction.

### Command workbench

The workbench combines a toolbar, example-selector row, command body, and guide link. It uses a separate green-black palette, mono commands, readable comments, and peach/green command accents. Example buttons have a 2.75rem minimum height. The selected example has a peach bottom border and white text. Hover adds a subtle local fill; keyboard focus uses a peach inset outline.

HomeTerminal.svelte owns the terminal playback. terminal-examples.ts holds source-matched Arch demonstration fixtures. The first command types after a 300ms lead-in at 42ms per character; output appears at 150ms per line, then playback stops. Selecting another example cancels the previous timer. Pause and replay controls remain inside the terminal. Hidden tabs pause; reduced motion and server rendering show the complete transcript immediately. The visual animation is hidden from assistive technology and a separate complete transcript announces only example changes. Keep the visible Example output label and destination guide link. The demo never executes commands.

### Installation block

The installer stays readable as wrapped code. The copy action has a persistent status area beneath it, followed by platform and provenance requirements. The next-command block pairs a read-only search example with a quick-start link. These are instructions, so keep command order and qualification visible.

Smooth anchor scrolling becomes automatic scrolling when reduced motion is requested. Other effects are short state changes; the implementation has no decorative entrance sequence.

## Do's and Don'ts

### Do:

- **Do** use the paired public light/dark tokens and scoped workspace tokens.
- **Do** make commands readable, selectable, and paired with useful guide links.
- **Do** use ruled rows and raised paper for ordinary content grouping.
- **Do** preserve keyboard focus, generous control targets, wrapping code, and reduced-motion scrolling.
- **Do** preserve the existing wordmark, Archivo, and IBM Plex Mono.

### Don't:

- **Don't** replace the public palette with the authenticated workspace palette.
- **Don't** add generic AI-style decoration, raster mockups, or decorative hero imagery.
- **Don't** turn every content row into a rounded, shadowed card.
- **Don't** add oversized poster typography that obscures the commands and installation path.
- **Don't** present historical unequal-work benchmark timings as visual proof of a speedup.
