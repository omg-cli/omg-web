# Repository license exceptions - 2026-11-20

Status: **approved by the repository owner**: “Keep tooling; approve listed license exceptions.” The approval applies only to the listed packages and versions in this repository. No organization-wide policy was changed.

The three project policies (`.snyk`, `site/.snyk`, and `workers/api/.snyk`) accept 54 project-specific license findings: 30 LGPL-3.0-category libvips findings and 24 MPL-2.0 Lightning CSS findings. They represent 22 distinct package/license advisories repeated across projects. The version-specific policy paths do not accept later package versions automatically.

| Family                               | Approved version | Supplied through                                                       | Upstream license                      |
| ------------------------------------ | ---------------- | ---------------------------------------------------------------------- | ------------------------------------- |
| `@img/sharp-libvips-*`               | 1.3.4            | Sharp 0.35.5 through Miniflare/Wrangler and the docs image integration | LGPL-3.0-or-later binary distribution |
| `lightningcss` and platform packages | 1.33.0           | Vite and Vitest                                                        | MPL-2.0                               |

The [approval inventory](./snyk-license-approvals-2026-11-20.json) records each project, package, version, advisory and representative dependency path, plus approval and bundle-review evidence. These are accepted license findings, not removed code or fixed vulnerabilities. No security advisory is ignored and no source is excluded. The full development-inclusive Snyk scan must still pass for unapproved findings.

## Packaging and notices

Root and site classify these as tooling dependencies. In the API graph, Sentry's optional Wrangler peer also exposes part of the toolchain through an npm production traversal; the review therefore does not rely solely on development flags.

Wrangler production dry-run metafiles for both the site and API contain no Sharp, libvips, Lightning CSS, Miniflare or Wrangler input modules. Metafile hashes are in the inventory. This evidence concerns the reviewed Worker bundles, not a future redistribution of node_modules or toolchain containers. Retain upstream notices and review different packaging separately. See [third-party tooling notices](./third-party-tooling-notices.md).

## Enforcement

`npm run check:snyk-policy` validates every exception against the approved inventory and the lockfiles. It rejects security ignores, source exclusions, unapproved licenses, wildcard package versions and dependency-version changes. The root check runs this gate before audits. Snyk remains the independent check that policy paths match actual dependency findings.

`npm run audit:snyk` scans code with ignored findings included, then scans all dependency projects with development dependencies included. A normal dependency scan can report zero open findings while retaining accepted license findings. Run `snyk test --all-projects --dev --ignore-policy` when reviewing the raw underlying findings; those approved licenses remain visible in that view.

## Sources

- [Snyk version-qualified policy paths](https://docs.snyk.io/developer-tools/snyk-cli/commands/ignore)
- [Sharp binary third-party notices](https://github.com/lovell/sharp-libvips/blob/main/THIRD-PARTY-NOTICES.md)
- [Lightning CSS license](https://github.com/parcel-bundler/lightningcss/blob/master/LICENSE)

## Verification receipt

The [acceptance receipt](./snyk-license-acceptance-2026-11-20.json) verifies zero open findings, exactly the 54 approved license findings in Snyk’s accepted-results record, zero ignored security advisories, and the same raw license inventory when policies are disabled. Code analysis with ignored findings included reports zero issues.
