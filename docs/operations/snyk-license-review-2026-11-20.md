# Snyk license disposition proposal - 2026-11-20

Status: **owner decision pending**. No license ignore, source exclusion or organization policy change has been applied.

The development-inclusive scan after the Undici patch reports zero security advisories. It still reports 54 medium license-policy findings: 30 LGPL-3.0-category libvips findings and 24 MPL-2.0 Lightning CSS findings, repeated across application/tooling projects and platform packages. These represent 22 distinct package/license advisories, not 54 separate libraries.

| Family                               | Installed versions | Supplied through                                                              | Current upstream license              |
| ------------------------------------ | ------------------ | ----------------------------------------------------------------------------- | ------------------------------------- |
| `@img/sharp-libvips-*`               | 1.3.4              | Sharp 0.35.5 through Miniflare/Wrangler and the SveltePress image integration | LGPL-3.0-or-later binary distribution |
| `lightningcss` and platform packages | 1.33.0             | Vite 8 and Vitest                                                             | MPL-2.0                               |

The exact 54 project/package/version findings and their dependency paths are in [the proposed disposition inventory](./snyk-license-proposal-2026-11-20.json). Root and site classify these as tooling dependencies. In the API graph, Sentry's optional Wrangler peer also exposes part of the toolchain through an npm production traversal; therefore this review does not rely solely on development flags. The deployment bundles were checked separately: Wrangler production dry-run metafiles for both the site and API contain no Sharp, libvips, Lightning CSS, Miniflare or Wrangler input modules. Metafile hashes are in the disposition inventory. This observation does not approve a future redistribution of node_modules or toolchain containers.

## Concrete choices

1. **Retain the toolchain and approve the listed licenses.** Review the inventory and upstream notices. An approval would cover only the listed packages, versions and this repository. No security advisory would be ignored, and no source would be excluded. Accepted license findings must remain distinguishable from fixed vulnerabilities. No organization-wide lowering of license severity is proposed.
2. **Remove all LGPL/MPL dependencies.** The current supported packages still use these licenses. SvelteKit 3.1.1 and its Svelte plugin require Vite 8, which depends on Lightning CSS. Miniflare and the SveltePress image integration depend on Sharp and its libvips binaries. Removing them requires replacing or maintaining variants of these tools, with separate build, image and deployment validation. Changing package license metadata or removing packages while leaving imports unresolved is not a fix.

The project owner must choose whether these licenses are permitted. A security patch cannot change third-party licenses.

## Sources

- [Snyk license policy behavior](https://docs.snyk.io/scan-fix-and-prevent/prevent/policies/license-policies)
- [Sharp binary third-party notices](https://github.com/lovell/sharp-libvips/blob/main/THIRD-PARTY-NOTICES.md)
- [Lightning CSS license](https://github.com/parcel-bundler/lightningcss/blob/master/LICENSE)

The listed upstream notices identify the licenses. This document does not declare that a particular redistribution is approved.
