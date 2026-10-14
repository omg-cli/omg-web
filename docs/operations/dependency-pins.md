# Dependency pins and removal conditions

All dependency versions and overrides are exact. Renovate must not automerge changes to this file, an `overrides` block, or `allowScripts`.

## Root `package.json`

- `effect` `3.22.2` owns schema and runtime imports used by top-level `shared/` contracts. Remove it only after every retained shared module stops importing Effect.
- `oxlint` and the checked-in anti-slop plugin enforce the repository TypeScript policy across shared, website, Worker, test, and tool sources.

## `site/package.json`

- `better-auth` `1.7.7` supplies purpose-separated OAuth proxy keys and fixes state/profile confusion. Its [release notes](https://github.com/better-auth/better-auth/releases/tag/v1.7.7) require coordinated upgrades and restarting pending OAuth flows, with no database migration. Production and staging must use the same tested version during the broker cutover. Re-run `oauth-proxy.server.test.ts` and the complete site suite before upgrades; production must never register proxy profile completion endpoints.
- `effect` `4.0.2` is the application boundary and expected-failure runtime. Changes require strict Svelte diagnostics, TypeScript checks, focused boundary tests, browser verification, and a successful shadow deployment.
- `@sveltejs/kit` under `better-auth` is a package-scoped peer override for the exact-tested SvelteKit 3 prerelease. Remove it when Better Auth declares compatibility with the installed SvelteKit release.
- `@hono/node-server`, `hono`, `lodash`, and `valibot` are security floors for Alchemy's non-optional Prisma development dependency chain. Remove them when Alchemy makes that chain optional or resolves audited versions itself.

## `workers/api/package.json`

Worker dependency changes require the exact generated binding declarations, strict source and test typechecks, the Worker integration suite, a Wrangler dry run, and a clean audit.

## Audit availability

`npm audit` is the primary vulnerability gate. Only exhausted registry or network failures switch the gate to OSV, which checks every exact npm package version in all three lockfiles. Vulnerability results, malformed lockfiles, incomplete responses, and unavailable OSV requests fail immediately.

## Install-script trust

Every package with an allowed lifecycle script is version-qualified in each workspace's `allowScripts` block. Version upgrades must update both the lockfile and the corresponding trust entry in the same reviewed change.

`tools/check-lockfile-integrity.mjs` rejects registry packages without a locked tarball URL and integrity digest. Dependencies bundled inside an integrity-pinned parent tarball are the only exception.

## Cloudflare staging validation, 2026-10-09

Wrangler is pinned to `4.149.0` in the root and API workspaces, with the API test
plugin at `1.4.0`. This moves their shared Miniflare dependency to the vendor's
`5.20261006.1-alpha` build and resolves `sharp` to `0.35.5`. The trusted lifecycle
script versions move with it to `workerd@1.20261006.1` and `esbuild@0.28.2`.
The lockfiles also resolve patched `devalue@5.9.4` and `source-map-js@1.2.2` where
present. Root and API npm audits report zero vulnerabilities after these updates.

The earlier site audit failed on `braces@3.0.3` through Alchemy's build dependency
path. Main's PR #131 updates Alchemy and its frontend package to `2.0.0-beta.78`,
removing that vulnerable path while retaining Alchemy 2. This branch incorporates
that update and its Effect `4.0.2` dependencies. All three npm audits now report
zero vulnerabilities. The audit gate remains enforced.
