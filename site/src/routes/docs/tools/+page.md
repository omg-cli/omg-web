---
title: Install development tools
description: Find registered CLI tools, install through their selected package manager, inspect trust controls, and update or remove managed tools.
navLabel: Development tools
section: Guides
order: 90
release: v0.1.224
source:
  repo: omg-cli/omg
  path: docs/cli.md
  reviewedCommit: f0d8cb5d8a95dbbc6cae50460178702ac0263ebb
  reviewedAt: '2026-11-11'
implementation:
  - src/cli/tool.rs
  - src/cli/args.rs
  - src/core/paths.rs
---

## Find a tool and its installation source

`omg tool` installs command-line tools through a built-in name-to-source registry. It is separate from `omg use`, which selects native runtimes and tools supported by the runtime registry.

Start by inspecting the selected source:

```bash
omg tool search prettier
omg tool registry
```

Search and registry list known names, package managers, and descriptions. They do not query every package registry or certify a package's safety.

Registry entries can select system packages, npm, Cargo, pip, or Go. Source labels such as `pacman:ripgrep` delegate to the system-package install path, which uses the build's selected backend and that backend's package names. A package mapping is not guaranteed on every distribution.

For example, `prettier` selects npm, while `cargo-watch` selects Cargo. Check the registry entry rather than assuming a familiar tool always uses its language package manager.

## Prepare the selected manager

Install OMG on a supported Linux or Apple Silicon macOS host. Install the needed npm, Cargo, Python, or Go manager before using its tool source.

You can select a supported runtime through [runtime management](/docs/runtimes/). Check the actual manager executable and version before installation, especially if several managers are on PATH.

Run OMG as your regular user. Language-manager installs use managed user storage; system-package entries can request elevation through their native backend.

## Install and inspect a tool

For the registered npm tool:

```bash
omg tool install prettier
omg tool list
command -v prettier
prettier --version
```

The install command names its source and package. A successful managed install stages the tool, validates its executable containment, records an installation security receipt, and publishes managed executable links.

Managed payloads live under `tools/MANAGER/NAME` in OMG's data directory. Executable links live under that data directory's `bin`. Use [configuration](/docs/configuration/) for the platform-specific data path and supported overrides.

`omg tool list` prints links in the managed bin directory. It is not a complete inventory of native system packages or every binary shipped by a package.

If the command is not found after installation, inspect the printed link and your PATH. Add the resolved managed bin directory through your deliberate shell setup. Do not replace unrelated commands to resolve a collision.

## Understand installation protections

The managed language-tool path uses a staged home and a reduced environment by default. It avoids inheriting ambient registry, Git, SSH, cloud, and CI credentials. It rejects a project-local manager executable when the current directory is identified as a project.

Installer stdin is closed. On Linux, manager processes also use `no_new_privs`. These controls restrict the installation process but do not make package code a complete filesystem or network sandbox.

The defaults differ by manager:

| Manager        | Released default                                                                                          |
| -------------- | --------------------------------------------------------------------------------------------------------- |
| npm            | Public npm registry, initial install with scripts disabled, then `npm audit signatures` before activation |
| Cargo          | Isolated Cargo configuration and `cargo install --locked`                                                 |
| pip            | A dedicated virtual environment, public PyPI, and wheels only                                             |
| Go             | Public proxy and checksum database, CGO disabled, and local toolchain only                                |
| System package | Delegates to the selected package backend and its policy path                                             |

Cargo builds can execute crate build scripts. A pip wheel still contains code that runs when invoked. Go and npm verification does not establish that the resulting tool is harmless.

These controls belong to `omg tool` language-manager installation. Native `omg use` providers have their own download and verification contracts. Do not generalize npm signature verification or Cargo locking to every runtime provider.

## Handle a package that needs an exception

Read the manager's error before weakening a default. Prefer a package or published artifact that works with the normal protection. Released exception variables accept comma-separated exact package matches, not arbitrary prefix matches.

| Variable                                     | Exact match format    | Effect                                                              |
| -------------------------------------------- | --------------------- | ------------------------------------------------------------------- |
| `OMG_TOOL_DANGEROUSLY_ALLOW_ALL_NPM_SCRIPTS` | npm package name      | Allows a rebuild script phase after the initial verification step   |
| `OMG_TOOL_ALLOW_PIP_SDISTS`                  | pip package name      | Allows source distributions and their build steps                   |
| `OMG_TOOL_ALLOW_CARGO_UNLOCKED`              | Cargo package name    | Omits `--locked`                                                    |
| `OMG_TOOL_ALLOW_GO_CGO`                      | Go package identifier | Allows CGO                                                          |
| `OMG_TOOL_ALLOW_GO_TOOLCHAIN_DOWNLOAD`       | Go package identifier | Allows Go toolchain downloads                                       |
| `OMG_TOOL_ALLOW_HOST_ENV`                    | `manager:package`     | Inherits host environment and manager configuration                 |
| `OMG_TOOL_ALLOW_UNVERIFIED`                  | `manager:package`     | Skips the npm signature/provenance check for a matching npm install |

The long npm variable name does not mean that setting any truthy value enables scripts globally. It still requires a matching package identifier. The approved rebuild can run dependency lifecycle scripts as part of that installation.

Host-environment exceptions can expose credentials and change registry trust. An unverified exception removes an independent check; it does not repair a rejected signature. Scope any reviewed exception to one invocation and one exact package rather than exporting it permanently.

OMG reports active overrides and records effective protections and executable hashes in `.omg-security-receipt.json` inside a managed install. This local receipt records the operation's policy; it is not an external signature or a guarantee of benign behavior.

## Install an unregistered name

An unregistered name opens a source picker in an attended terminal. Choices are system packages, Cargo, npm, pip, and Go.

Without a terminal, an unknown name fails instead of guessing a source. The released install command has no `--source`, version, dry-run, or `--yes` option. Use the registry and the native manager when you need source controls outside this command.

Choosing a source does not import arbitrary repository URLs or local paths. The managed package grammar validates the package identifier for that manager.

## Update a known tool

```bash
omg tool update prettier
omg tool update all
```

Updates reinstall through the registry's source and can use the network or rebuild packages. They do not preserve an exact old tool version by request.

A failed staged managed install keeps the previously working payload before activation. Inspect the error and the version that still resolves before retrying.

`update all` discovers managed installs, attempts updates, and reports failed names. It returns a failure if any attempted tool update fails. An unregistered tool cannot be updated automatically because the registry cannot determine its source.

System packages delegated by the registry are normally updated through [package management](/docs/packages/). They are not all enumerated by `omg tool list` or the managed-store `update all` scan.

## Remove a tool and check command resolution

```bash
omg tool remove prettier
command -v prettier
```

Removal deletes the managed payload and cleans broken links in the managed bin directory. A system-package registry entry delegates removal to the package backend. A missing managed tool is an error.

Another installation can still satisfy `command -v` after removal. Identify that executable's owner before deleting it.

Install, update, and remove failures return nonzero. Registry and list success confirm their own read operation, not that a future install will work. The global `--json` flag does not turn these human-readable handlers into a stable JSON protocol.

If signatures fail, retain the exact package and error. If a wheel or locked Cargo build is unavailable, review the package's published artifacts before choosing an exception. For manager-path or link conflicts, preserve existing files and inspect ownership. Continue with [shell integration](/docs/shell/), [security](/docs/security/), and [troubleshooting](/docs/troubleshooting/).
