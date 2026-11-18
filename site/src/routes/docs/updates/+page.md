---
title: Update OMG and control notices
description: Update a standalone OMG binary pair, restart omgd, and understand or disable advisory update notices.
navLabel: Updates
section: Guides
order: 80
release: v0.1.224
source:
  repo: omg-cli/omg
  path: docs/update-notices.md
  reviewedCommit: f0d8cb5d8a95dbbc6cae50460178702ac0263ebb
  reviewedAt: '2026-11-11'
implementation:
  - src/cli/self_update.rs
  - src/cli/update_notice.rs
  - src/core/paths.rs
  - install.sh
---

## Identify who owns the installed programs

`omg self-update` updates OMG itself. `omg update` handles managed system packages and runtimes. Choose the operation that matches the thing you intend to change.

Before updating, inspect the selected executables:

```bash
command -v omg
command -v omgd
omg --version
omgd --version
```

Use the standalone updater for a standalone installation you own. If your distribution or another package manager owns the executables, update through that package source. Avoid replacing package-managed files with a separate updater.

Released Linux archives are backend-specific x86_64 builds. The macOS archive targets Apple Silicon. The updater chooses a compatible archive for its platform, including the available native APT ABI.

## Update a standalone installation

You need network access, write access to the installation directory, and a trusted GitHub CLI capable of `gh attestation verify`.

```bash
omg self-update
```

Without a requested version, the updater reads the production release marker at `https://releases.omg.latham.cloud/latest-version`. This marker can intentionally select a different release from GitHub's latest listing.

The updater downloads the archive and SHA-256 sidecar, checks the digest, and verifies GitHub build provenance. It stages both `omg` and `omgd`, checks that each starts and reports the target version, then replaces the installed pair.

Binary startup probes establish loader and version compatibility. They do not test every package operation on the host.

The updater resolves `gh` from trusted fixed locations rather than arbitrary project PATH entries. A `gh` executable found by your shell is therefore not sufficient evidence that the updater accepts it.

To request one specific release:

```bash
omg self-update --version 0.1.224
```

An equal version returns success without replacement. An older requested version fails unless `--force` is present. `--force` allows reinstallation or deliberate downgrade; it does not turn off archive verification.

To repair the same installed release deliberately:

```bash
omg self-update --version 0.1.224 --force
```

Read the selected release's notes before a downgrade. Restoring old executable files does not automatically restore package state, installed runtimes, or configuration formats.

## Verify the pair and restart the daemon

```bash
omg --version
omgd --version
omg daemon-status
```

The installed versions should match the requested release. A daemon already running in memory continues to use its old executable image until restarted.

If you configured the Linux user service:

```bash
systemctl --user restart omgd.service
omg daemon-status
```

For a manually managed daemon, stop the identified old process and start `omg daemon` again. Do not launch a second instance alongside a running service. Read [daemon operation](/docs/daemon/) for startup ownership and diagnostic exit-status limits.

## Recover from a failed update

A missing compatible archive, invalid checksum, rejected attestation, missing trusted `gh`, failed binary probe, or unwritable destination makes the update fail.

If a candidate fails its startup probe, the existing pair remains in place. Replacement failures trigger restoration of previous files; if restoration itself needs attention, retain that error and inspect both installed programs before retrying.

Install a supported GitHub CLI or repair the destination's ownership through its actual owner. Do not retry the whole operation as root just to inherit a user path override. Root ignores caller-controlled OMG storage, configuration, and socket overrides.

For checksum or provenance failures, preserve the version, archive name, and full error. Retry only after checking the cause. The normal verification path should remain enabled.

See [installation](/docs/installation/) for reinstalling a verified pair. Older updaters that replaced only `omg` can require a second forced update from the corrected updater to repair the daemon as well.

## Understand an update notice

On Unix, an eligible successful interactive command can print an advisory that a newer final OMG release exists. Bash, Zsh, and Fish hooks can show the same notice.

The foreground command reads local cached metadata. A separate background check has at most three seconds to fetch the release marker. The first eligible command can start that check; a later command can display its result.

Checks and notices occur at most once per day per user cache. Failed network attempts count toward the check interval. Results older than seven days are ignored.

Only strictly newer final versions without prerelease or build metadata are advertised. The check does not download an archive, replace a binary, or run an update.

The request sends no install identifier or telemetry payload. The HTTPS server still receives normal request and network metadata.

## Explain a missing notice

Notices are suppressed for root and CI sessions, quiet or JSON output, help and completion protocols, the updater itself, and other excluded command paths. Ordinary command notices require terminal stdout and stderr.

Examples that suppress the notice include:

```bash
omg status --json
omg status --quiet
omg status > status.txt
```

Failed commands do not receive an update notice or have their failure status replaced. An offline host, old cache, disabled check, or unsupported command path can all explain silence.

A notice compares version strings. It does not report vulnerabilities or certify the candidate release. Use the release notes and [security guide](/docs/security/) for those separate decisions.

## Disable or inspect notice state

For Bash or Zsh, add this before the OMG hook in the shell configuration:

```bash
export OMG_NO_UPDATE_CHECK=1
```

For Fish:

```fish
set -gx OMG_NO_UPDATE_CHECK 1
```

The presence of `OMG_NO_UPDATE_CHECK` disables checks, even if its value is `0`. Remove or unset it to re-enable them. The other suppression rules still apply.

Notice state lives in `update-notice.json` under the resolved OMG cache directory, normally `~/.cache/omg` on Linux. `OMG_CACHE_DIR` can override the location for a regular user.

The cache contains check time, notice time, and the last version string. Unsafe, unreadable, symlinked, or oversized state is ignored. If the single notice file is damaged, preserve or remove that file after identifying its resolved path; the next eligible check can recreate it.

Do not clear the entire data or runtime directory to repair an advisory cache. Read [configuration](/docs/configuration/) for platform paths and [troubleshooting](/docs/troubleshooting/) for persistent errors.
