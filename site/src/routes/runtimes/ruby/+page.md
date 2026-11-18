---
title: 'Manage Ruby versions with OMG'
description: 'Install ruby-builder releases, select project Ruby versions, inspect gem paths, and understand host and checksum limits.'
navLabel: 'Ruby'
section: Runtimes
order: 100
release: v0.1.224
source:
  repo: omg-cli/omg
  path: docs/runtimes.md
  reviewedCommit: f0d8cb5d8a95dbbc6cae50460178702ac0263ebb
  reviewedAt: '2026-11-11'
implementation:
  - src/runtimes/ruby.rs
  - src/runtimes/common.rs
  - src/cli/runtimes.rs
  - src/hooks/mod.rs
---

## Choose a Ruby build

OMG v0.1.224 installs prebuilt MRI Ruby archives from `ruby/ruby-builder` GitHub releases. It does not compile Ruby or install JRuby through this manager.

The release code selects `ubuntu-22.04` archives on Linux and `darwin` archives on macOS, with `x64` or `arm64` architecture tokens. A Linux target therefore means an Ubuntu-built, glibc-dependent payload, not verified compatibility with every Linux distribution. The requested release must contain the exact matching asset and its digest.

OMG's published CLI targets are narrower than those provider mappings: Linux x86_64 and Apple Silicon macOS. A provider mapping alone does not establish an OMG release install on Linux ARM64 or Intel macOS. Use a supported Linux guest for WSL; native Windows is unsupported.

## Install and inspect

Choose a numeric version listed by the provider. A partial request such as `3.2` resolves against the available Ruby release list; do not assume a `latest` alias exists for this manager.

```sh
omg list ruby --available
omg use ruby 3.2
omg list ruby
omg which ruby
```

`omg use` installs when necessary and updates the managed `current` link. `omg which ruby` reports the selected version, not the executable path. With the OMG hook enabled, inspect the actual commands at a fresh prompt:

```sh
ruby --version
gem --version
which -a ruby
which -a gem
```

A working Ruby binary does not guarantee that every native gem extension can build. Bundler, project gems, and any required compiler or system libraries remain separate from OMG's runtime installation.

## Pin a project

Within one directory, `.ruby-version` takes priority over `.tool-versions`. The hook searches the current directory before its parents; supported mise tool layers follow the dedicated and universal pin files in each directory.

Write the exact resolved version when the project needs a stable pin. For example, after confirming that `3.2.0` is the intended installed release:

```sh
printf '%s\n' '3.2.0' > .ruby-version
omg use ruby
omg which ruby
```

This example is pin syntax, not a claim that an old Ruby release is appropriate for your project. Preserve an existing project pin rather than replacing it with the example. The hook selects installed versions; entering a directory does not download Ruby.

## Install a newer version or remove an old one

Inspect `omg list ruby --available`, then use `omg use ruby VERSION` with the chosen numeric version. There is no separate `omg update ruby` command. Run the project's tests and install its dependencies with the project's existing Ruby tools.

To remove a version, first switch to another installed version. Then run `omg use ruby VERSION --uninstall`, replacing `VERSION` with the exact directory version shown by `omg list ruby`. Removal refuses the active managed version; omitting the version does not infer one from the pin.

## Verification and storage

The selected GitHub asset must publish a SHA-256 digest. OMG validates that digest, verifies the downloaded archive, extracts into staging, and checks the runtime layout before activation. Missing integrity metadata is an error rather than permission to install unchecked bytes.

The checksum ties the archive to provider metadata obtained over HTTPS. It does not certify arbitrary Ruby code or gems installed afterward.

Versions live under the OMG data directory in `versions/ruby`. Linux defaults to `~/.local/share/omg`; macOS defaults to `~/Library/Application Support/omg`. Inspect the active root with:

```sh
omg config get data_dir
```

## When Ruby or gem resolves unexpectedly

| Symptom                                      | Check                                                                                                                                 |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Release asset not found                      | Compare the exact Ruby version and host architecture with the provider list; an archive can be absent even when a release tag exists. |
| Missing shared library                       | The Linux archive targets Ubuntu 22.04; inspect the host's compatibility rather than disabling checks.                                |
| Ruby or gem comes from another manager       | Compare `omg which ruby` with `which -a ruby` and `which -a gem`; inspect the shell hook and project pin.                             |
| Gem command cannot find project dependencies | Use the project's Gemfile, lockfile, and Bundler workflow; OMG does not install those libraries.                                      |

## Continue

Read the [runtime handbook](/docs/runtimes/), [configuration guide](/docs/configuration/), and [task runner guide](/guides/task-runner/).

Implementation reviewed at the pinned release: [Ruby provider](https://github.com/omg-cli/omg/blob/f0d8cb5d8a95dbbc6cae50460178702ac0263ebb/src/runtimes/ruby.rs), [runtime command dispatch](https://github.com/omg-cli/omg/blob/f0d8cb5d8a95dbbc6cae50460178702ac0263ebb/src/cli/runtimes.rs), and [project pin detection](https://github.com/omg-cli/omg/blob/f0d8cb5d8a95dbbc6cae50460178702ac0263ebb/src/hooks/mod.rs). These are source-reviewed instructions; no archive was executed as part of this documentation review.
