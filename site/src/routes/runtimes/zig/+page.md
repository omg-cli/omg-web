---
title: 'Manage Zig toolchains with OMG'
description: 'Install Zig from the official release index, verify SHA-256 downloads, pin projects, and distinguish release binaries from provider targets.'
navLabel: 'Zig'
section: Runtimes
order: 104
release: v0.1.224
source:
  repo: omg-cli/omg
  path: docs/runtimes.md
  reviewedCommit: f0d8cb5d8a95dbbc6cae50460178702ac0263ebb
  reviewedAt: '2026-11-11'
implementation:
  - src/runtimes/zig.rs
  - src/runtimes/common.rs
  - src/cli/runtimes.rs
  - src/hooks/mod.rs
---

## Choose a Zig toolchain

OMG v0.1.224 downloads Zig toolchains from the official `ziglang.org/download/index.json` release index. The index supplies each target's archive URL and SHA-256 digest.

The provider maps Linux and macOS on x86_64 and aarch64. Each requested version must still contain the matching target entry. OMG's published CLI binaries support Linux x86_64 and Apple Silicon macOS; the provider map does not create additional OMG release targets. Native Windows is unsupported, while WSL uses a supported Linux guest.

## Install and inspect

```sh
omg list zig --available
omg use zig latest
omg list zig
omg which zig
```

The release list excludes the index's `master` entry. `latest` chooses the newest listed release, and partial numeric requests resolve against the release index. Do not assume this command manages development snapshots or every historical Zig build.

With the shell hook enabled, verify the actual compiler at a fresh prompt:

```sh
zig version
which -a zig
```

`omg which zig` reports the selected version rather than a binary path. OMG normalizes the vendor archive into a version directory exposing `bin/zig`; the compiler's accompanying libraries remain inside that toolchain.

## Pin the project compiler

Within a directory, `.zig-version` precedes `.tool-versions`. The hook searches the current directory before parents and then considers supported mise layers within each directory.

For a project deliberately using the example release:

```sh
printf '%s\n' '0.13.0' > .zig-version
omg use zig
omg which zig
```

Preserve a repository's existing compiler requirement. A partial pin can select different matching versions as installed inventory changes; use an exact release when that would be undesirable. The hook only selects installed toolchains and does not fetch one on directory entry.

The runtime pin selects a compiler. It does not replace `build.zig`, `build.zig.zon`, dependency hashes, or the project's build instructions.

## Run a build

After confirming the intended Zig version, use the project's normal build command:

```sh
zig build
```

Do not assume `omg run build` discovers a task merely because `build.zig` exists. The reviewed polyglot task runner has a defined manifest set; a project's Makefile or supported task declaration can invoke Zig explicitly.

## Install a newer release or remove one

List remote versions and run `omg use zig VERSION` for the chosen release. `omg use zig latest` resolves the newest listed release from the index; it does not update a committed pin.

There is no separate `omg update zig` command. Test the project's build with the selected compiler before changing its version file.

Switch away from an old version before running `omg use zig VERSION --uninstall`. Use an explicit installed version. The command refuses to remove the active managed version; an omitted version is not inferred for uninstall.

## Verification and storage

OMG validates the release-index artifact fields, checks the SHA-256 digest, and extracts the `.tar.xz` archive in staging. The normalized launcher and toolchain layout are checked before the version is activated.

Integrity is anchored to the official index retrieved over HTTPS. It does not prove the safety of project build scripts, third-party dependencies, or code compiled by Zig.

Toolchains live under `versions/zig` in the OMG data directory. The default data root is `~/.local/share/omg` on Linux and `~/Library/Application Support/omg` on macOS.

```sh
omg config get data_dir
```

## Diagnose failures

| Symptom                                   | Check                                                                                                                  |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Version or target missing                 | Check the release-index version and host target rather than trying a different architecture's archive.                 |
| Checksum or extraction fails              | Preserve the exact error; do not disable integrity or archive checks.                                                  |
| Compiler version differs from the project | Compare the nearest pin, `omg which zig`, and `which -a zig` at a fresh prompt.                                        |
| Build breaks after switching              | Check the project's accepted Zig release and dependency manifest; toolchain installation does not migrate source code. |

## Continue

Read [runtime management](/docs/runtimes/), [configuration](/docs/configuration/), and [task discovery](/guides/task-runner/).

Reviewed release source: [Zig provider](https://github.com/omg-cli/omg/blob/f0d8cb5d8a95dbbc6cae50460178702ac0263ebb/src/runtimes/zig.rs), [runtime CLI](https://github.com/omg-cli/omg/blob/f0d8cb5d8a95dbbc6cae50460178702ac0263ebb/src/cli/runtimes.rs), and [pin detection](https://github.com/omg-cli/omg/blob/f0d8cb5d8a95dbbc6cae50460178702ac0263ebb/src/hooks/mod.rs). Target mappings and checks were reviewed in source; no compiler archive was executed for this guide.
