---
version: 1
slug: "site-src-routes-docs-page-svelte"
primary_target: "site/src/routes/docs/+page.svelte"
related_targets: ["site/src/lib/components/docs/DocsReader.svelte","site/src/lib/components/docs/DocsSearchForm.svelte","site/src/lib/components/docs/MarkdownDocPage.svelte","site/src/lib/components/docs/DocsTopicPage.svelte","site/src/lib/components/docs/DocActions.svelte","site/src/lib/components/docs/DocsPagination.svelte","site/src/lib/components/docs/DocsBlocks.svelte","site/src/routes/docs/search/+page.svelte"]
---

# Documentation reader

## SCOPE AND MODE

Documentation index, typed handbook, SveltePress Markdown guides, and documentation search. Read mode extends the approved public site. The custom OMG reader supplies the presentation; SveltePress compiles Markdown without installing its default theme.

## AUDIENCE AND JOB

Developers completing first setup or finding exact command behavior. Browse or search a command, option, or task; read commands and platform limits; inspect the immutable reviewed source or Markdown; continue to the next guide. Keep release scope and source-review limits visible. Source review does not certify execution on every supported host.

## READING AND INTERACTION

Desktop has a sticky, independently scrollable topic sidebar with search and grouped navigation. It uses a 16rem column from 64rem and a 13rem column from 48rem; below 48rem, search precedes a native Browse documentation disclosure. Article outlines use native details with two columns, becoming one below 35rem. Outline links reserve 2.75rem touch targets.

The article starts with breadcrumbs, title, description, release/review metadata, and copy/Markdown/source actions. Commands use quiet raised neutral panels; tables scroll within their containers. Search is a GET form with HTML section links, result counts, an explicit empty state, and JSON/manifest links for tools. Reading, search, anchors, source links, and Markdown remain usable without JavaScript. Copy controls appear when clipboard enhancement is ready and retain a status area.

## Direction contract

THESIS: Make source-reviewed CLI documentation direct to use for first setup and exact behavior, with command evidence and limits carrying the reading experience.

OWN-WORLD: Retain the approved neutral white/charcoal OMG system, Archivo text, IBM Plex Mono commands, restrained orange action/selection, flat rules, and compact controls. No new visual world or decorative imagery.

STORY: Browse or search → read commands and limits → inspect reviewed source or Markdown → continue to the next guide.

FIRST VIEWPORT: Shared compact header; desktop search/topic navigation beside the article title and description; release and review metadata plus copy, Markdown, and source actions below. Mobile search and native topic disclosure precede that article header.

FORM: Read-mode docs reader with sticky desktop navigation, native mobile details, article outline, code, and tables. The user chose SveltePress within the existing approved site. Ordinary additive extension; no form draw, seed, or comp was generated.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## FINISH RECORD

The finish reviewer scored its one material fix, article-outline touch targets, resolved and returned ship at fix-list scope. The final documentation comparison preserves root DESIGN.md and .impeccable/design.json: palette, fonts, control language, flat depth, theme boundaries, and focus remain incumbent. Evidence includes docs, search, and expanded-outline captures in light/dark at 1440px and 320px under .impeccable/review/docs/. No shipping raster assets were added.

## UNRESOLVED DECISIONS

None for this surface. Publication remains outside this documentation implementation's authorization. Global documentation-layout prose predating this extension remains untouched; the responsive reader specification above is local to these docs surfaces.
