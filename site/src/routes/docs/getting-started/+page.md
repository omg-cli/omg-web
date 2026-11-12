---
title: Start using OMG
description: Install a verified OMG release, inspect your system, and select a project runtime without changing system packages.
navLabel: Getting started
section: Start here
order: 10
release: v0.1.224
source:
  repo: omg-cli/omg
  path: docs/getting-started.md
  reviewedCommit: f0d8cb5d8a95dbbc6cae50460178702ac0263ebb
  reviewedAt: '2026-11-11'
implementation:
  - install.sh
  - src/cli/args.rs
  - src/cli/doctor.rs
  - src/hooks/mod.rs
---

## Choose your installation

This walkthrough installs OMG in your account, checks its setup, and selects a Node.js version. System package installation is a separate, optional step.

Use a terminal on one of the released platforms. Linux archives target x86_64 and use the distribution's package backend. The macOS archive targets Apple Silicon.

| System                  | Package backend                           |
| ----------------------- | ----------------------------------------- |
| Arch Linux x86_64       | ALPM and AUR                              |
| Debian or Ubuntu x86_64 | Native APT                                |
| Fedora x86_64           | DNF and RPM                               |
| Apple Silicon macOS     | Homebrew                                  |
| Windows                 | Use a supported Linux distribution in WSL |

Debian 13 and Ubuntu 26.04 need the APT 7 archive included in v0.1.224. Intel macOS, native Windows, and Linux ARM do not have matching published archives. Read [installation](/docs/installation/) before choosing a download for another system.

Keep your native package manager available. OMG is still approaching beta, and package transactions can affect the whole system.

## Download and inspect the installer

You need HTTPS access, `curl`, Bash, and the GitHub CLI, `gh`. The installer uses `gh` to verify build provenance in addition to checking the archive's SHA-256 digest.

```bash
curl --proto '=https' --tlsv1.2 -fsSL https://getomg.xyz/install.sh -o omg-install.sh
less omg-install.sh
```

The first command saves the script. The second opens it for inspection. Press `q` to leave `less`.

The public script URL can change independently of this guide's release. For a fixed installer source, use the reviewed release's script as described in [installation](/docs/installation/).

Install the pinned release without editing shell startup files:

```bash
OMG_VERSION=v0.1.224 OMG_NO_TELEMETRY=1 OMG_SKIP_SHELL=1 bash omg-install.sh
export PATH="$HOME/.local/bin:$PATH"
omg --version
omgd --version
```

Both version commands should identify 0.1.224. The prebuilt installer puts the matching programs in `~/.local/bin` by default. The source-build path has separate compiler prerequisites and can offer to install build dependencies.

If the installer cannot verify a checksum or attestation, keep the error and retry only after checking the cause. Install `gh` through your trusted system package source if it is missing.

## Check the setup

Run these commands as your regular user:

```bash
omg --help
omg doctor
omg status --fast
omg search ripgrep --no-aur
```

Help lists the ordinary command groups. `omg --all-commands --help` also includes advanced commands. Status reports package counts, and search reads configured package sources without installing the result.

`omg doctor` exits with code 0 when its checks pass and code 1 when it finds issues. Add `--network` to probe mirror connectivity or `--eol` to inspect runtime end-of-life status. `doctor --turbo` primes sudo credentials and is a separate operation.

Search may need network access. On Arch, `--no-aur` excludes community results. Other backends do not gain AUR support from this option.

## Select a runtime

Install and select a Node.js 22 release in your user account:

```bash
omg use node 22
omg list node
omg which node
```

The first command can download a matching release. `omg which node` prints the selected version, rather than an executable path. The major request `22` does not lock a specific patch release.

To use installed versions automatically in a project, add the hook for your shell. For Bash, add this line once to `~/.bashrc`, then open a new terminal:

```bash
eval "$(omg hook bash)"
```

Zsh and Fish setup, pin precedence, and removal are covered in [shell integration](/docs/shell/). The hook selects installed versions. It does not download missing ones.

Enter a project that has a reviewed `.node-version` file and check both selection and execution:

```bash
omg which node
node --version
command -v node
```

If the pin names an unavailable release, install that version with `omg use node VERSION`, replacing `VERSION` with the project's exact request. Keep application dependencies and their lockfiles under the project's normal package manager.

## Preview a system package change

If you want to install a system package, inspect its metadata and preview the operation first:

```bash
omg info ripgrep
omg install --dry-run ripgrep
```

To apply that change, run `omg install ripgrep` and review the confirmation. The native backend may request administrator credentials. Package names and dependencies vary by distribution.

Run OMG as your regular user and let the transaction request elevation. A root invocation uses different state paths and ignores caller-controlled OMG path overrides.

Read [package management](/docs/packages/) before using removal, cleanup, AUR builds, or update shortcuts.

## Recover from setup problems

If the shell cannot find OMG, repeat the PATH export above and inspect `command -v omg`. If several installations appear in your PATH, identify their owners before replacing files.

If a command cannot contact package sources, run `omg doctor --network` and compare with your native package manager. A network failure does not mean that the local runtime store needs to be removed.

The optional daemon keeps derived status and package data warm. Start with `omg daemon-status`; read [daemon operation](/docs/daemon/) if you want to enable it. Most package commands work without it.

Keep the exact command, version, and error for support. Remove tokens and private paths before sharing logs. Continue with [runtime management](/docs/runtimes/), [project tasks](/docs/tasks/), or [troubleshooting](/docs/troubleshooting/).
