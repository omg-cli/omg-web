---
title: 'Manage .NET SDK versions with OMG'
description: 'Install Microsoft .NET SDKs, use global.json pins, understand SHA-512 verification, and diagnose host and SDK-selection limits.'
navLabel: '.NET SDK'
section: Runtimes
order: 105
release: v0.1.224
source:
  repo: omg-cli/omg
  path: docs/runtimes.md
  reviewedCommit: f0d8cb5d8a95dbbc6cae50460178702ac0263ebb
  reviewedAt: '2026-11-11'
implementation:
  - src/runtimes/dotnet.rs
  - src/runtimes/common.rs
  - src/cli/runtimes.rs
  - src/hooks/mod.rs
---

## Select an SDK, not just a language runtime

OMG v0.1.224 manages the Microsoft .NET SDK. The `dotnet` host provides SDK commands used by languages such as C# and F#; this manager does not install a separate programming language called .NET.

The provider reads Microsoft's official release-metadata index and channel documents. It excludes channels marked end-of-life from discovery and installation metadata selection. Supported phases include active, maintenance, preview, release-candidate, and go-live phases; `latest` selects a non-prerelease SDK.

## Check the host target

The provider maps `linux-x64`, `linux-arm64`, `osx-x64`, and `osx-arm64` artifacts. It does not select Windows or musl-specific payloads. The host must also meet the selected SDK's native-library requirements.

OMG's published CLI targets are Linux x86_64 and Apple Silicon macOS. Additional provider mappings are not additional OMG binary releases. On Windows, use OMG inside a supported WSL Linux guest rather than in a native Windows process.

## Install and inspect

```sh
omg list dotnet --available
omg use dotnet latest
omg list dotnet
omg which dotnet
```

Partial requests such as `9.0` resolve against supported-channel metadata. Use an exact listed SDK version when your project needs a specific feature band. An unavailable or end-of-life channel is not made available by writing its version into a pin file.

At a fresh prompt with the OMG hook enabled:

```sh
dotnet --version
dotnet --list-sdks
which -a dotnet
```

`omg which dotnet` reports OMG's selected version. The `dotnet` host can perform its own project-level SDK selection, so compare the actual `dotnet --version` inside the project as well.

## Pin the SDK with global.json

OMG reads `global.json`'s `sdk.version` before `.tool-versions` within the same directory. It searches the current directory before parents; supported mise layers follow those files in each directory.

A `global.json` pin has this shape; replace the example with an exact installed SDK version your project accepts:

```json
{
  "sdk": {
    "version": "9.0.100"
  }
}
```

```sh
omg use dotnet
omg which dotnet
dotnet --version
```

OMG reads the version field; this is not a full reimplementation of .NET's SDK resolution and roll-forward rules. The prompt hook selects an installed version and does not download a missing SDK. Keep the project's NuGet configuration, dependency lockfiles, and restore policy separate.

## Use the SDK in a project

Once the selected SDK is verified, use the project's normal commands:

```sh
dotnet restore
dotnet build
```

These commands can fetch dependencies or execute project build logic. OMG's archive integrity check does not review that code. A `.csproj` file alone is not a promise that the reviewed OMG task runner discovers a `build` task; use an explicit supported task declaration when needed.

## Change or remove an SDK

Install another listed version with `omg use dotnet VERSION`. Using `latest` does not rewrite `global.json`; update a project pin deliberately after checking its build and tests.

To remove an old SDK, first select another installed version, then run `omg use dotnet VERSION --uninstall` with the exact installed SDK directory version. The active managed version cannot be removed. There is no separate `omg update dotnet` command.

## Verify downloads and troubleshoot

.NET archives use SHA-512 hashes from Microsoft's metadata. OMG requires a valid hash, verifies the download, extracts the SDK's flat archive layout in staging, and checks the root `dotnet` launcher before publication. Unlike most archive managers here, this is SHA-512 rather than SHA-256.

| Symptom                                         | Check                                                                                                                  |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| SDK cannot be found                             | Compare the exact version and channel support phase with the available list.                                           |
| Unsupported host or missing native library      | Check the selected Linux/macOS runtime identifier and SDK prerequisites; a target entry does not install OS libraries. |
| `dotnet --version` differs from OMG's selection | Inspect the nearest global.json, .NET's own resolver behavior, and competing PATH entries.                             |
| Another host appears first                      | Compare `which -a dotnet` with the project pin and hook setup.                                                         |
| Hash verification fails                         | Keep the error and stop; do not replace the expected digest with the downloaded file's hash.                           |

## Continue

Read [runtime management](/docs/runtimes/), [configuration](/docs/configuration/), and [task execution](/guides/task-runner/).

Reviewed release source: [.NET provider](https://github.com/omg-cli/omg/blob/f0d8cb5d8a95dbbc6cae50460178702ac0263ebb/src/runtimes/dotnet.rs), [runtime CLI](https://github.com/omg-cli/omg/blob/f0d8cb5d8a95dbbc6cae50460178702ac0263ebb/src/cli/runtimes.rs), and [global.json detection](https://github.com/omg-cli/omg/blob/f0d8cb5d8a95dbbc6cae50460178702ac0263ebb/src/hooks/mod.rs). The guide documents source behavior, not execution of each Microsoft SDK artifact.
