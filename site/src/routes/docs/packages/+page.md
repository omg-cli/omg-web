---
title: Manage system packages
description: Search, preview, install, update, remove, and clean system packages with the limits of each native backend.
navLabel: Packages
section: Guides
order: 20
release: v0.1.224
source:
  repo: omg-cli/omg
  path: docs/packages.md
  reviewedCommit: f0d8cb5d8a95dbbc6cae50460178702ac0263ebb
  reviewedAt: '2026-11-11'
implementation:
  - src/cli/args.rs
  - src/cli/packages/mod.rs
  - src/cli/packages/update/arch.rs
  - src/config/settings.rs
---

## Check the backend first

Install the build for your operating system and run package transactions as your regular user. OMG requests elevation when its native backend needs it.

| Platform            | Package source                | Limit to keep in mind                    |
| ------------------- | ----------------------------- | ---------------------------------------- |
| Arch Linux          | Official repositories and AUR | AUR packages build from reviewed recipes |
| Debian and Ubuntu   | Native APT                    | Package cache cleanup is not implemented |
| Fedora              | DNF and RPM                   | No AUR builds                            |
| Apple Silicon macOS | Homebrew                      | No AUR builds                            |
| Native Windows      | None                          | Use a supported WSL distribution         |

The `debian-pure` build feature supports index and test work. It refuses live Debian or Ubuntu package mutations. See [installation](/docs/installation/) for the release and backend matrix.

## Find a package and its source

```bash
omg search ripgrep
omg search ripgrep --detailed --limit 30
omg search ripgrep --no-aur
omg info ripgrep
```

Search defaults to 15 results. On Arch, it includes AUR entries unless you pass `--no-aur`. `--detailed` adds source metadata where available. A name match or security grade does not certify the package's behavior.

An attended search can offer a picker that opens details. Selecting a result does not install it. Use `--json` only with commands whose output contract you have checked in the [CLI reference](/docs/cli/).

To inspect an installed package's relationships and disk use:

```bash
omg why ripgrep
omg why ripgrep --reverse
omg size --limit 10
omg size --tree ripgrep
omg blame ripgrep
```

Available details depend on the backend and recorded history. `--reverse` asks what depends on the package.

## Preview and install

```bash
omg install --dry-run ripgrep
omg install ripgrep
```

The preview describes the requested operation without applying the package transaction. It can still read package metadata and contact sources. The real command can install dependencies and change the system package database.

Name several packages in one invocation when you want one operation. Bare `omg install` requires an attended picker and fails without a terminal. It does not install a project's application dependencies.

`--yes` skips ordinary confirmation. `--review` forces PKGBUILD review for AUR builds. Normal AUR review is already enabled by the released default `aur.review_pkgbuild` setting. Separate AUR approvals and policy checks are not blanket-disabled by `--yes`.

For a local package archive, explicitly permit file input:

```bash
omg install --allow-local-file ./package.pkg.tar.zst
```

Use an archive format supported by your backend and review its origin first. See [security](/docs/security/) for policy and signature limits.

## Check and apply updates

```bash
omg outdated
omg update --check
omg update --dry-run
omg update
```

The normal update workflow can update system packages and managed runtimes. On Arch, it also handles installed AUR packages. A successful check does not prove that a later build, download, or transaction will succeed.

Use these options only for the workflow they describe:

- `--check` lists updates without installing them.
- `--dry-run` previews the transaction.
- `--yes` skips ordinary confirmation.
- `--review` forces review for each AUR build.
- `--no-sync` uses cached package metadata.
- `--aur-only` skips the official database sync and system upgrade on Arch.
- `--fast` combines sync and upgrade without a preview.
- `--turbo` skips sync and uses cached data with the optimized Arch path.

`--aur-only` conflicts with both `--fast` and `--turbo`. These performance modes do not promise equivalent support on every backend. Prefer the normal update path while diagnosing a failure.

`omg sync` refreshes package metadata without installing updates. Refreshing metadata can change a later preview.

## Remove and clean deliberately

```bash
omg remove --dry-run ripgrep
omg remove ripgrep
```

`--recursive` also removes unused dependencies on Arch. Other backends do not promise that behavior. Add `--yes` only after reviewing the package set.

Bare `omg clean` lists cleanup actions. Preview a chosen action before applying it:

```bash
omg clean --orphans --dry-run
omg clean --cache --dry-run
omg clean --aur --dry-run
```

`--all` combines orphan, cache, and AUR cleanup. `--yes` skips ordinary confirmation. The APT backend rejects `--cache`, `--aur`, and `--all`. Fedora supports orphan and downloaded package cache cleanup, with no AUR cleanup.

On Arch, cache cleanup keeps one recent package version by default. Warnings about versions mentioned in history do not preserve those artifacts. Cleanup can therefore remove files needed for a later rollback.

## Check results and retain recovery evidence

```bash
omg explicit
omg explicit --count
omg ec
omg tc
omg oc
omg uc
omg history --limit 5
```

The four short counters report explicit, total, orphan, and available-update counts. A cached count can lag a transaction. Use package metadata and the transaction result to confirm the actual change.

Command errors return a nonzero status. A dry run or a successful status report does not certify the safety of a future transaction. Security scans report findings without failing by default; CI must request `omg audit scan --fail-on-findings` for a finding gate.

History covers supported OMG transactions, rather than every action through the native package manager. Rollback depends on the backend and older package availability. It does not restore all machine state.

If a transaction fails, keep its output and inspect `omg doctor` before deleting caches or retrying with different privileges. Use the native package tool to investigate backend failures. Read [troubleshooting](/docs/troubleshooting/) for bounded diagnostics, [configuration](/docs/configuration/) for released AUR settings, and [updates](/docs/updates/) for updating OMG itself.
