---
title: 'Manage the Deno runtime with OMG'
description: 'Install verified Deno releases, pin JavaScript and TypeScript runtime versions, and keep Deno tasks and dependencies separate.'
navLabel: 'Deno'
section: Runtimes
order: 102
release: v0.1.224
source:
  repo: omg-cli/omg
  path: docs/runtimes.md
  reviewedCommit: f0d8cb5d8a95dbbc6cae50460178702ac0263ebb
  reviewedAt: '2026-11-11'
implementation:
  - src/runtimes/deno.rs
  - src/runtimes/common.rs
  - src/cli/runtimes.rs
  - src/hooks/mod.rs
---

## Choose a Deno release

Deno is a JavaScript and TypeScript runtime. OMG v0.1.224 manages its executable; Deno itself remains responsible for project permissions, dependency resolution, lockfiles, and application execution.

The provider downloads official `denoland/deno` GitHub release ZIPs. Its target map covers Linux GNU and macOS on x86_64 and aarch64. It does not select a musl-specific Linux archive or a Windows executable.

OMG's own published CLI binaries target Linux x86_64 and Apple Silicon macOS. Provider target mappings do not establish released OMG binaries on other architectures. WSL uses the Linux guest target, not a native Windows target.

## Install and inspect

```sh
omg list deno --available
omg use deno latest
omg list deno
omg which deno
```

`latest` selects the newest stable release in the provider's bounded release list. Partial numeric requests also resolve against stable releases; an exact prerelease request is a different, explicit choice. The list is not an unbounded history of every Deno release.

Use an exact version for a project that needs a repeatable runtime selection. `omg which deno` reports the selected version. With the shell hook enabled, check the executable at a fresh prompt:

```sh
deno --version
which -a deno
```

The activation directory exposes the installed version's `bin` directory without command shims. A Deno installed elsewhere can still win if another shell configuration puts it earlier on PATH.

## Pin a project

Within a directory, Deno detection reads `.deno-version`, then `.dvmrc`, then `.tool-versions`. The current directory is checked before parent directories; supported mise layers follow those files within each directory.

For an installed version intended by your project, an example pin is:

```sh
printf '%s\n' '2.9.0' > .deno-version
omg use deno
omg which deno
```

Replace the example with the project's chosen release. The hook selects installed versions; it does not install a missing Deno when you enter the directory. A `deno.json` task definition is not a substitute for a Deno runtime version pin.

## Run the project's own Deno workflow

Use Deno's normal project commands after confirming the runtime:

```sh
deno task
```

OMG's task runner can discover tasks in `deno.json`. If an equal-priority task also exists in another ecosystem, select the intended ecosystem explicitly rather than relying on an interactive prompt in CI. See the [task runner guide](/guides/task-runner/) for argument forwarding and selection modes.

OMG does not turn a runtime checksum into a security review of remote modules or task scripts. Keep the project's Deno lockfile and permission choices under review.

## Update or remove a version

Use `omg list deno --available`, then `omg use deno VERSION` to install the chosen release. `omg use deno latest` asks the provider to resolve the current stable alias; it does not rewrite the project's version file.

Switch to another installed version before running `omg use deno VERSION --uninstall`. The version is required and removal refuses the active managed version. There is no separate `omg update deno` command.

## Verify downloads and diagnose failures

OMG requires either the GitHub asset's SHA-256 digest or the official archive's `.sha256sum` sidecar. The sidecar must identify the intended archive. A missing checksum or mismatch stops installation.

The archive is extracted into staging and the expected Deno launcher is checked before publishing the version. This checks downloaded bytes and layout against provider information; it does not establish a SLSA build level or verify every dependency Deno may fetch later.

| Symptom                                    | Check                                                                                                                   |
| ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------- |
| Release or target ZIP is missing           | Inspect the exact release and GNU Linux/macOS architecture mapping.                                                     |
| Checksum data is absent                    | Use a release with supported integrity metadata; do not bypass verification.                                            |
| Deno remains unchanged after selection     | Check the nearest pin, restart the hook, and compare `which -a deno`.                                                   |
| Old version is absent from the remote list | Discovery uses a bounded recent-release window; an exact release lookup and a partial request are different operations. |

## Continue

Read [runtime storage and hooks](/docs/runtimes/), [security boundaries](/docs/security/), and the [Node.js guide](/runtimes/node/) when choosing between runtimes.

Reviewed release source: [Deno provider](https://github.com/omg-cli/omg/blob/f0d8cb5d8a95dbbc6cae50460178702ac0263ebb/src/runtimes/deno.rs), [runtime CLI](https://github.com/omg-cli/omg/blob/f0d8cb5d8a95dbbc6cae50460178702ac0263ebb/src/cli/runtimes.rs), and [version-file hooks](https://github.com/omg-cli/omg/blob/f0d8cb5d8a95dbbc6cae50460178702ac0263ebb/src/hooks/mod.rs). The commands document source-supported behavior; no Deno release archive was executed for this review.
