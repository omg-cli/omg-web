---
title: Activate runtimes in your shell
description: Add Bash, Zsh, or Fish hooks, inspect project pin precedence, install completions, and remove integration safely.
navLabel: Shell integration
section: Guides
order: 30
release: v0.1.224
source:
  repo: omg-cli/omg
  path: docs/shell-integration.md
  reviewedCommit: f0d8cb5d8a95dbbc6cae50460178702ac0263ebb
  reviewedAt: '2026-11-11'
implementation:
  - src/hooks/mod.rs
  - src/hooks/completions.rs
  - src/cli/args.rs
---

## Add the hook for your shell

Install OMG and confirm that `omg --version` works before editing shell startup files. Inspect the file for an existing OMG hook and keep one copy.

| Shell | Startup file                 | Line to add               |
| ----- | ---------------------------- | ------------------------- |
| Bash  | `~/.bashrc`                  | `eval "$(omg hook bash)"` |
| Zsh   | `~/.zshrc`                   | `eval "$(omg hook zsh)"`  |
| Fish  | `~/.config/fish/config.fish` | `omg hook fish \| source` |

`omg hook SHELL` prints integration code. The normal command does not edit the startup file. `omg init` offers an interactive setup path if you want OMG to help make that edit.

Open a new terminal after adding the line. Automatic runtime activation supports Bash, Zsh, and Fish. PowerShell and Elvish completion generation does not imply a runtime hook for those shells.

## Install the version before entering a project

The hook selects installed runtimes. It does not install a missing version or application dependencies.

For a project that requests Node.js 22:

```bash
omg use node 22
omg list node
```

Enter the project containing its reviewed version file, then inspect selection and execution:

```bash
omg which node
node --version
command -v node
```

`omg which node` reports a version. `command -v node` reports which command the shell resolves. Check both when several runtime managers are installed.

A major request such as `22` can select a matching installed patch release. Commit an exact version when the project needs an exact patch pin.

## Resolve competing project pins

The hook checks the current directory before its ancestors. A nearer directory's pin wins. Within a directory, OMG processes its version-file list before supported mise layers.

For Node.js, the same-directory order is:

1. `.node-version`
2. `.nvmrc`
3. `.tool-versions`
4. `package.json`
5. Supported mise `[tools]` layers

Within `package.json`, `engines.node` overrides `volta.node`. These fields can contain a version request rather than an exact patch. The hook's precedence is specific to shell detection; individual runtime commands can have their own resolver.

Other supported inputs include:

| Runtime | Dedicated inputs before `.tool-versions`     |
| ------- | -------------------------------------------- |
| Python  | `.python-version`, then `pyproject.toml`     |
| Go      | `.go-version`, then `go.mod`                 |
| Rust    | `rust-toolchain`, then `rust-toolchain.toml` |
| Deno    | `.deno-version`, then `.dvmrc`               |
| Bun     | `.bun-version`                               |
| Java    | `.java-version`                              |
| Ruby    | `.ruby-version`                              |
| PHP     | `.php-version`                               |
| Swift   | `.swift-version`                             |
| Zig     | `.zig-version`                               |
| .NET    | `global.json`                                |

The hook accepts supported native pins from layered mise files. Backend-qualified tools, plugins, and version arrays are outside the native compatibility contract. Read [runtime management](/docs/runtimes/) and [project tasks](/docs/tasks/) before migrating a more complex setup.

Malformed current-directory pins produce a warning and leave the base PATH in use. Malformed ancestor pins are skipped with a warning. A valid file with a missing installed version still does not trigger a download.

## Keep task environments separate

Shell hooks read runtime pins. They do not load mise `[env]`, read dotenv files, or execute mise source scripts. An explicit `omg run` task can resolve that project environment and execute repository-controlled code.

The released hook restores the base PATH it recorded before applying directory pins. A later PATH change, including a Python virtual environment activation, can be replaced on a subsequent prompt or directory change.

For a Python command that must use the project's virtual environment, invoke its executable explicitly:

```bash
.venv/bin/python --version
```

Do not infer that the selected global Python version proves a project's `.venv` uses the same interpreter. Recreate a virtual environment deliberately when changing its base Python.

## Install command completions

Completions and runtime activation are separate. To install a generated completion file for your user:

```bash
omg completions bash
```

Replace `bash` with `zsh`, `fish`, `powershell`, or `elvish`. Read the printed destination and restart or reload the shell as needed.

To inspect the generated script without installing it:

```bash
omg completions zsh --stdout
```

Dynamic suggestions depend on backend metadata. A suggestion does not validate a package or perform an installation.

## Use counters as status hints

Bash and Zsh hooks define `omg-ec`, `omg-tc`, `omg-oc`, and `omg-uc`. They report explicit, total, orphan, and available-update counts from a validated status snapshot.

The snapshot has a five-minute freshness limit. Zsh also caches helper values for up to 60 seconds. Bash reads the snapshot for each helper call. Fish does not define these helpers; use `omg ec`, `omg tc`, `omg oc`, and `omg uc` instead.

Rejected or missing snapshots can produce fallback values. Use [daemon status](/docs/daemon/) and package commands when you need current evidence.

## Remove integration or diagnose a failure

Use the matching shell when removing recognized OMG-owned hook lines:

```bash
omg hook zsh --uninstall
```

This writes an `.omg-backup` beside the startup file. It refuses to rewrite a symlink-managed file; edit the managed source instead. Start a new shell to discard functions and PATH state from the old hook.

If selection is wrong, inspect the nearest pin, installed versions, and `command -v` before removing another manager. If completion installation fails, inspect the printed destination and permissions. Invalid shell names and unsupported hooks fail rather than enabling a partial integration.

Read [configuration](/docs/configuration/) for storage overrides and [troubleshooting](/docs/troubleshooting/) for diagnosis. A successful hook evaluation alone does not prove that the intended runtime is installed or wins PATH resolution.
