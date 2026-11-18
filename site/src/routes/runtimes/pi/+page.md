---
title: 'Manage Pi coding-agent versions with OMG'
description: 'Install exact Pi coding-agent releases with npm scripts disabled, pin projects, and understand Node, npm, and package-trust requirements.'
navLabel: 'Pi'
section: Runtimes
order: 103
release: v0.1.224
source:
  repo: omg-cli/omg
  path: docs/runtimes.md
  reviewedCommit: f0d8cb5d8a95dbbc6cae50460178702ac0263ebb
  reviewedAt: '2026-11-11'
implementation:
  - src/runtimes/pi.rs
  - src/runtimes/common.rs
  - src/cli/runtimes.rs
  - src/hooks/mod.rs
---

## What this manager installs

Pi is a coding-agent tool, not a programming language. OMG v0.1.224 manages versions of the npm package `@earendil-works/pi-coding-agent` in its own version tree.

A working, compatible Node.js and npm must already be available on PATH. This manager invokes npm; it does not download a standalone Pi archive or automatically install Node.js for you. OMG's published CLI targets are Linux x86_64 and Apple Silicon macOS, with supported Linux guests used for WSL. There is no native Windows installation path here.

Before installing Pi, check the toolchain that npm will use:

```sh
node --version
npm --version
which -a node
which -a npm
```

If you manage Node with OMG, select it first and verify it at a fresh prompt with the hook enabled. An existing system or third-party npm earlier on PATH is still the npm this provider can invoke.

## Install an exact release

Select an exact published npm version. The version below illustrates the supported syntax; use the version required by your project or team.

```sh
omg use pi 0.83.0
omg list pi
omg which pi
```

`omg list pi --available` is explicitly unsupported in v0.1.224. The provider does not resolve `latest`, version ranges, or npm distribution tags into exact OMG version directories. Obtain the desired exact release from the package publisher before installing it.

After successful installation and shell activation, inspect the executable at a fresh prompt:

```sh
which -a pi
```

`omg which pi` is the selected version, while `which -a pi` shows command resolution. Pi's own usage and provider credentials remain part of Pi's configuration, not OMG's runtime configuration.

## Pin Pi alongside Node

Pi has no dedicated `.pi-version` file in the reviewed hook. Use `.tool-versions` with an exact Pi version:

```text
pi 0.83.0
```

Add the entry to the project's existing `.tool-versions`; do not overwrite other runtime entries. A Node pin can coexist in the same file or in `.node-version`.

```sh
omg use pi
omg which pi
```

The nearest project pin wins. Within a directory, `.tool-versions` is considered before supported mise layers. The hook selects an installed Pi; it does not run npm merely because you entered a repository.

## Understand npm's role and the trust boundary

OMG installs the exact package into a private staging prefix with npm's `--global --ignore-scripts --audit=false --fund=false` options and the public npm registry URL. Selected npm configuration overrides and `NODE_OPTIONS` are removed from the child environment.

Lifecycle scripts are disabled during this installation. That does not make the installed package inert: running Pi executes package code with your user account's access. This is not the checksum-and-vendor-archive path used by most other OMG runtime providers.

Before publication, OMG reads the installed package manifest, requires its version to match the exact request, and checks that `bin/pi` resolves to a file inside the installation prefix. A failed npm process or mismatched manifest stops activation.

The resulting installation lives under `versions/pi` in the OMG data directory. Inspect the resolved data root with:

```sh
omg config get data_dir
```

## Change or remove a version

Install another exact release with `omg use pi VERSION`. This updates the managed selection but does not edit a project pin. Keep the project's accepted Node.js and Pi versions aligned and run the project's usual acceptance checks.

To remove an old version, select a different installed version first, then run `omg use pi VERSION --uninstall`. Removal requires an explicit exact version and refuses the active managed one. There is no dedicated `omg update pi` command.

## Troubleshoot installation and selection

| Symptom                                    | Check                                                                                                            |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| npm cannot be executed                     | Verify `npm --version` and PATH in the same shell that runs OMG.                                                 |
| Remote listing is unsupported              | Use an exact published npm version; the release does not provide Pi discovery.                                   |
| Installed version differs from the request | OMG refuses that manifest rather than silently activating it.                                                    |
| Another Pi executable runs                 | Compare the project pin, `omg which pi`, and `which -a pi`; inspect competing npm global directories.            |
| Pi cannot use its configured service       | Inspect Pi's own configuration and credentials; successful OMG activation does not configure external providers. |

## Continue

See [Node.js setup](/runtimes/node/), [runtime management](/docs/runtimes/), and [configuration](/docs/configuration/).

Reviewed release source: [Pi npm installer and validation](https://github.com/omg-cli/omg/blob/f0d8cb5d8a95dbbc6cae50460178702ac0263ebb/src/runtimes/pi.rs), [runtime CLI](https://github.com/omg-cli/omg/blob/f0d8cb5d8a95dbbc6cae50460178702ac0263ebb/src/cli/runtimes.rs), and [project hooks](https://github.com/omg-cli/omg/blob/f0d8cb5d8a95dbbc6cae50460178702ac0263ebb/src/hooks/mod.rs). No npm package was installed or executed as part of this documentation review.
