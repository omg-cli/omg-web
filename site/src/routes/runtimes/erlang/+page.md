---
title: 'Manage Erlang/OTP versions with OMG'
description: 'Install checksum-verified Erlang/OTP prebuilts, understand Linux compatibility and install scripts, and pin project versions.'
navLabel: 'Erlang/OTP'
section: Runtimes
order: 106
release: v0.1.224
source:
  repo: omg-cli/omg
  path: docs/runtimes.md
  reviewedCommit: f0d8cb5d8a95dbbc6cae50460178702ac0263ebb
  reviewedAt: '2026-11-11'
implementation:
  - src/runtimes/erlang.rs
  - src/runtimes/common.rs
  - src/cli/runtimes.rs
  - src/hooks/mod.rs
---

## Choose an Erlang/OTP prebuilt

OMG v0.1.224 installs prebuilt Erlang/OTP rather than compiling OTP from source. Linux downloads use Hex's `bob` build indexes at `builds.hex.pm`; macOS uses the `erlef/otp_builds` publisher index and release archives.

The provider maps Linux and macOS on x86_64 and aarch64. Linux payloads are Ubuntu builds. Ubuntu 20.04, 22.04, and 24.04 have explicit mappings; Debian versions map to corresponding Ubuntu build generations. Other Linux identities fall back to the Ubuntu 24.04 build and rely on a runtime smoke check to reject incompatibility.

A fallback is not verified support for every Linux distribution. The provider does not switch to a source build when a prebuilt cannot run. OMG's own published binaries target Linux x86_64 and Apple Silicon macOS; provider ARM64/Intel mappings do not add release targets. WSL uses the guest's Linux identity.

## Install and inspect

```sh
omg list erlang --available
omg use erlang latest
omg list erlang
omg which erlang
```

The available list comes from the host-specific publisher index. Linux rows without an archive SHA-256 are not installable: a source-commit hash is not an archive checksum. `latest` and partial numeric requests resolve against that index.

With the shell hook enabled, check the selected runtime at a fresh prompt:

```sh
which -a erl
which -a erlc
```

To print OTP's own release identifier without entering an interactive shell:

```sh
erl -noshell -eval 'io:format("~s~n", [erlang:system_info(otp_release)]), halt().'
```

The OTP release identifier can be less specific than the complete managed archive version. Compare it with `omg which erlang` rather than assuming both strings must have identical patch detail.

## Pin a project

Erlang uses `.tool-versions` in the reviewed hook; there is no dedicated `.erlang-version` entry. Add an exact chosen version to the project's existing file, for example:

```text
erlang 26.2
```

Preserve other tool entries. The nearest directory with a pin wins, and supported mise tool layers are considered after the ordinary version files within each directory.

```sh
omg use erlang
omg which erlang
```

The hook selects installed versions and does not run a network installation on directory entry. An OTP pin does not install project dependencies, rebar3, Elixir, or other BEAM tooling.

## Understand installation and verification

Both provider paths require a published archive SHA-256. OMG verifies the archive before extraction. On Linux, OTP's bundled `Install -minimal` script must run in the final version directory because it records absolute paths.

The installer marks the version as pending while setup runs, then performs an `erl` smoke check before activating it. A failed install script or smoke check causes cleanup of the broken version. This is executable provider setup, not a pure archive-copy operation.

Checksums establish integrity against the chosen publisher index. They do not establish a SLSA build level, certify project code, or prove compatibility with every glibc and native-library combination.

Versions live under `versions/erlang` in OMG's data root. Inspect it with:

```sh
omg config get data_dir
```

## Change or remove a version

Choose a listed exact version with `omg use erlang VERSION`. Using `latest` does not rewrite the project's `.tool-versions` entry. Test the application with its expected OTP version before changing that pin.

After switching to another installed version, run `omg use erlang VERSION --uninstall` to remove the old one. Supply the explicit installed version; the active managed version cannot be removed. There is no separate `omg update erlang` command.

## Troubleshoot the selected build

| Symptom                                    | Check                                                                                                                                                          |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Version missing from the list              | Inspect the host-specific publisher index; not every OTP release has every build.                                                                              |
| Missing archive digest                     | The release refuses checksum-less rows; do not use a source commit as the expected archive hash.                                                               |
| glibc or shared-library failure            | The selected Linux prebuilt is an Ubuntu build; inspect host compatibility and the smoke-check error.                                                          |
| Linux build generation needs investigation | The provider supports `OMG_ERLANG_UBUNTU_RELEASE` for an explicit Ubuntu build-series selection; only choose a real publisher series compatible with the host. |
| Different Erlang is executed               | Compare `omg which erlang`, `.tool-versions`, and `which -a erl` at a fresh prompt.                                                                            |

## Continue

See [runtime management](/docs/runtimes/), [configuration](/docs/configuration/), and [security boundaries](/docs/security/).

Reviewed release source: [OTP providers and setup](https://github.com/omg-cli/omg/blob/f0d8cb5d8a95dbbc6cae50460178702ac0263ebb/src/runtimes/erlang.rs), [runtime dispatch](https://github.com/omg-cli/omg/blob/f0d8cb5d8a95dbbc6cae50460178702ac0263ebb/src/cli/runtimes.rs), and [project hooks](https://github.com/omg-cli/omg/blob/f0d8cb5d8a95dbbc6cae50460178702ac0263ebb/src/hooks/mod.rs). No downloaded OTP archive or installer script was executed for this review.
