---
title: 'Manage Swift toolchains on Ubuntu with OMG'
description: 'Install signed Swift.org Ubuntu toolchains, pin project versions, and understand distribution, architecture, and PGP verification limits.'
navLabel: 'Swift'
section: Runtimes
order: 108
release: v0.1.224
source:
  repo: omg-cli/omg
  path: docs/runtimes.md
  reviewedCommit: f0d8cb5d8a95dbbc6cae50460178702ac0263ebb
  reviewedAt: '2026-11-11'
implementation:
  - src/runtimes/swift.rs
  - src/runtimes/common.rs
  - src/cli/runtimes.rs
  - src/hooks/mod.rs
  - src/core/security/pgp.rs
---

## Check the Ubuntu requirement first

OMG v0.1.224's Swift provider installs official Swift.org Linux toolchains only on hosts identifying as Ubuntu 22.04 or 24.04. It maps x86_64 and aarch64 archive variants. Other Ubuntu series, Debian, Arch, Fedora, and macOS are rejected by this manager.

The presence of an OMG macOS binary does not imply a native Swift download path on macOS. This page does not configure Xcode or Apple's system toolchain. WSL can use a supported Ubuntu guest; native Windows is unsupported.

OMG's published Linux CLI artifact is x86_64. The provider's aarch64 mapping does not establish a published Linux ARM64 OMG binary. The selected Swift release must also publish an archive for the mapped Ubuntu/architecture pair.

## Install and inspect a release

The provider discovers stable `swift-NUMERIC-RELEASE` versions through `swiftlang/swift` GitHub releases. Preview tags, development snapshots, and prerelease entries are excluded.

```sh
omg list swift --available
omg use swift latest
omg list swift
omg which swift
```

`latest` and partial numeric requests resolve against the bounded stable-release list. An exact version still needs a known release and matching Swift.org archive; being numerically plausible is not enough.

With the shell hook enabled, inspect the actual toolchain at a fresh prompt:

```sh
swift --version
swiftc --version
which -a swift
which -a swiftc
```

OMG keeps the vendor `usr` layout intact. The Swift hook path is the selected toolchain's `usr/bin`, rather than the ordinary `bin` directory used by many other managers.

## Pin a project toolchain

Within one directory, `.swift-version` precedes `.tool-versions`. The hook checks the current directory before parents, then supported mise layers after ordinary version files in each directory.

For a project intentionally using the example release:

```sh
printf '%s\n' '5.10' > .swift-version
omg use swift
omg which swift
```

Choose the release required by your project; the example is not a current support recommendation. The hook only selects installed versions and does not download or verify a new toolchain when you enter a directory.

The compiler pin does not replace Swift package manifests, dependency resolution, or the application's own test and build process.

## Run the project's build

After verifying the selected compiler, use the project's normal Swift commands:

```sh
swift build
swift test
```

These commands can fetch and execute project build logic. Do not assume the reviewed OMG task runner discovers Swift package tasks from `Package.swift` alone; use a supported task declaration if the project needs `omg run` integration.

## Verify the signed toolchain

This provider verifies a detached `.sig` for the Swift.org archive with Sequoia-OpenPGP. It refreshes the official Swift release-key cache and accepts only the signing fingerprints pinned in the released implementation. A cached keyring is a fallback when refresh fails, not permission to skip signature verification.

A source build of OMG must enable the `pgp` feature for Swift installation. Without a verifier, installation refuses the archive. Do not work around a signature error by copying unchecked files into the versions tree.

The extracted toolchain must expose `usr/bin/swift`, and a Swift version smoke check must succeed before normal activation. Host library requirements can still prevent the vendor binary from running; archive authenticity and host compatibility are separate questions.

Toolchains live under `versions/swift` in the OMG data root. Inspect that root and available disk space before downloading a large toolchain:

```sh
omg config get data_dir
```

## Change or remove a release

Install another known release with `omg use swift VERSION`. Resolving `latest` does not rewrite `.swift-version`. Check the project's build and tests before updating the pin; there is no separate `omg update swift` command.

Switch to another installed version before running `omg use swift VERSION --uninstall`. Supply the explicit installed version. The active managed version cannot be removed.

## Troubleshoot safely

| Symptom                      | Check                                                                                                   |
| ---------------------------- | ------------------------------------------------------------------------------------------------------- |
| Unsupported distribution     | Confirm `/etc/os-release` identifies Ubuntu 22.04 or 24.04; do not rename the host to bypass detection. |
| Known release has no archive | Check the exact release, Ubuntu series, and architecture combination.                                   |
| PGP feature is unavailable   | Use an appropriate verified release or build with the documented `pgp` feature.                         |
| Signature verification fails | Preserve the failure and inspect release/key provenance; do not disable the check.                      |
| Compiler cannot run          | Inspect the smoke-check error and Swift.org host-library requirements for that archive.                 |
| Another Swift wins on PATH   | Compare the project pin, `omg which swift`, and `which -a swift` at a fresh prompt.                     |

## Continue

See [installation and backend features](/docs/installation/), [runtime management](/docs/runtimes/), and [security boundaries](/docs/security/).

Reviewed release source: [Swift provider and signature verification](https://github.com/omg-cli/omg/blob/f0d8cb5d8a95dbbc6cae50460178702ac0263ebb/src/runtimes/swift.rs), [runtime CLI](https://github.com/omg-cli/omg/blob/f0d8cb5d8a95dbbc6cae50460178702ac0263ebb/src/cli/runtimes.rs), and [Swift hook paths](https://github.com/omg-cli/omg/blob/f0d8cb5d8a95dbbc6cae50460178702ac0263ebb/src/hooks/mod.rs). The documentation review did not download or execute a Swift toolchain.
