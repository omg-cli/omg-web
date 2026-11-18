---
title: Capture and compare environments
description: Record inventory in omg.lock, detect drift, share a reviewed Gist, and preview explicit package mappings for another platform.
navLabel: Environments
section: Guides
order: 50
release: v0.1.224
source:
  repo: omg-cli/omg
  path: docs/environment-portability.md
  reviewedCommit: f0d8cb5d8a95dbbc6cae50460178702ac0263ebb
  reviewedAt: '2026-11-11'
implementation:
  - src/cli/env.rs
  - src/core/env/fingerprint.rs
  - src/core/env/portable.rs
  - src/cli/args.rs
---

## Check what capture can record

Environment capture records detected runtime and tool versions together with explicitly installed system package names. It writes `omg.lock` in your current directory.

Capture and live drift checking require an Arch or Debian package backend in v0.1.224. This includes the native Debian backend used on Ubuntu. Fedora and Homebrew builds do not gain capture support merely because the portability planner accepts their target names.

The runtime probe iterates all supported native runtime names and registry tool names. Only successfully detected versions are recorded. It is not a fixed subset of seven runtimes, nor a list of everything that could be installed.

The lockfile records package names rather than their versions. It contains neither an application dependency graph nor dotfile contents. Keep npm, Cargo, Python, and other project lockfiles alongside your build instructions.

## Capture a reviewed baseline

Open a terminal in the project whose inventory you want to record. If an existing lockfile matters, preserve it before recapturing.

```bash
omg env capture
less omg.lock
```

Capture writes normalized TOML with a schema version, detected versions, explicit package names, a timestamp, and a state hash. Review the package list before committing or publishing it. Inventory can reveal private tools or organizational details.

The hash checks consistency of the file's own contents. A writer can recalculate it. Trust comes from the file's owner, reviewed history, or sharing source rather than that hash.

Readers reject malformed lockfiles, unsupported newer schemas, non-regular files, symlinks, and files above the 16 MiB limit. Do not edit a hash to silence an unexplained failure.

## Detect drift without repairing it

```bash
omg env check
```

The check compares a fresh capture against `omg.lock`. It exits successfully when there is no detected drift. Missing or invalid locks, unsupported capture backends, probe errors, and detected drift cause failure.

Use it as a CI condition only on a backend that can perform the underlying capture. A successful check covers the captured fields; it does not prove that package versions or application dependencies match.

For an intentional environment change, review the difference and recapture the baseline. For an unintended change, install or select the intended tools through their normal commands, then check again. The check command does not install missing packages.

To compare two saved snapshots rather than the current machine:

```bash
omg diff --from before.lock after.lock
```

Without `--from`, `omg diff` compares its destination lock with the current environment. Its comparison scope remains the inventory fields.

## Share a lockfile through GitHub Gist

Sharing needs a `GITHUB_TOKEN` that GitHub accepts for Gist creation. Supply it through your existing secret mechanism; keep it out of committed files and command arguments.

Review `omg.lock`, then upload it:

```bash
omg env share --description "Project development inventory"
```

The default creates a secret Gist. A secret Gist is unlisted, not access-controlled private storage. Anyone who obtains its URL can read it. The release may print the visibility label `Private`; do not interpret that label as a confidentiality guarantee.

`--public` creates a public Gist. The description defaults to `OMG Environment State` and is bounded to 1000 bytes by the implementation. The file content is uploaded as `omg.lock`.

Sharing contacts GitHub and does not synchronize installed software. Missing tokens, rejected requests, and unreadable locks fail the command.

## Pull a shared inventory

Use a Gist you reviewed and whose owner you trust:

```bash
omg env sync https://gist.github.com/OWNER/0123abcdef
```

Replace the example owner and ID. You can also pass the hexadecimal ID alone. Gist URLs must use HTTPS on `gist.github.com` without a query or fragment; IDs must contain 7 to 64 hexadecimal characters.

Sync validates the downloaded lock before writing it. When a readable regular local lock differs, the previous content is saved as `omg.lock.backup`. A later replacement can overwrite that backup, so preserve important history separately.

After replacing the file, sync runs a local drift check. A nonzero result can therefore mean the download and write succeeded but your environment differs. Inspect both the new file and the reported drift before retrying.

Sync downloads inventory. It does not install packages, select runtimes, copy dotfiles, or recreate application dependencies.

## Export explicit portability intent

Export starts from an existing valid lockfile. State the platform where the capture was made:

```bash
omg env export --source-target arch-x86_64
```

The old capture schema cannot verify your source declaration. The command prints a starter TOML environment section and does not overwrite `.omg.toml`. Review and merge that section into the project's configuration.

Package names are not assumed to mean the same thing on another distribution. Declare each destination mapping yourself:

```toml
[environment]
schema_version = 1
tools = ["git", "compiler"]

[environment.runtimes]
node = "22"

[environment.packages.arch-x86_64]
git = "git"
compiler = "base-devel"

[environment.packages.ubuntu-x86_64]
git = "git"
compiler = "build-essential"

[environment.dotfiles]
"dotfiles/editor.toml" = ".config/editor/config.toml"
```

Keep the separate `[scripts]` section if the project uses task preferences.

## Preview another platform

```bash
omg env plan --target ubuntu-x86_64
```

The planner reads `.omg.toml` and prints JSON. Supported explicit targets are `arch-x86_64`, `debian-x86_64`, `ubuntu-x86_64`, `fedora-x86_64`, and `macos-aarch64`.

Planning does not install tools, contact registries, copy files, execute scripts, or change `omg.lock`. Runtime requirements remain uninterpreted intent. Missing mappings appear in `unmapped_tools`; exit success means valid input, not that every tool is mapped or available.

Dotfile sources are relative to the manifest directory and destinations to the user's home. Validation checks path syntax. It does not inspect contents, existence, symlinks, ownership, or destination conflicts on disk.

The schema accepts manifests up to 256 KiB, at most 512 tools, and at most 128 dotfile mappings. Invalid targets, undeclared tool mappings, unsafe paths, and duplicate destinations fail validation.

There is no released `omg env apply` command. Keep destination installation and file copying explicit. See [workflows](/docs/workflows/) for onboarding, [configuration](/docs/configuration/) for project versus user settings, and [troubleshooting](/docs/troubleshooting/) for lockfile failures.
