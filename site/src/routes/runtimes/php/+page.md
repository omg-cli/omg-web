---
title: 'Manage PHP channels with OMG'
description: 'Install PHP prebuilts on Debian/Ubuntu, understand rolling minor-channel refreshes, verify downloads, and pin project channels.'
navLabel: 'PHP'
section: Runtimes
order: 107
release: v0.1.224
source:
  repo: omg-cli/omg
  path: docs/runtimes.md
  reviewedCommit: f0d8cb5d8a95dbbc6cae50460178702ac0263ebb
  reviewedAt: '2026-11-11'
implementation:
  - src/runtimes/php.rs
  - src/runtimes/common.rs
  - src/cli/runtimes.rs
  - src/hooks/mod.rs
---

## Understand the rolling-channel contract

OMG v0.1.224 installs PHP prebuilts from `shivammathur/php-builder` GitHub releases. Each upstream `major.minor` tag is a rolling channel; rebuilt assets can replace the previous patch within that channel.

Use a channel such as `8.3`, not an exact patch such as `8.3.1`. The managed directory records the channel, while `php -v` reports the actual interpreter build. A channel pin does not provide immutable patch-level reproducibility.

Unlike most OMG managers, explicit `omg use php CHANNEL` refreshes the rolling channel even if that channel is installed. Treat it as an operation that may download and replace the interpreter, not merely a selection shortcut.

## Check platform limits

This provider uses Linux Debian/Ubuntu system-root payloads. It has known distro tokens for Debian 11/12/13 and Ubuntu 22.04/24.04/26.04; architecture selection uses x86_64 or an ARM64 asset suffix. An asset must exist for the exact channel, distro, and architecture combination. In particular, a provider architecture mapping does not promise Debian ARM64 archives.

Other Linux identities can fall back to an Ubuntu 24.04 payload, followed by a smoke check. That is a compatibility attempt, not a support guarantee for Arch or Fedora. The PHP manager refuses macOS installation and points to Homebrew instead.

OMG's published CLI artifacts target Linux x86_64 and Apple Silicon macOS; the macOS CLI's presence does not make this PHP archive provider available there. On Windows, run within a supported WSL Linux guest.

## Install and inspect

```sh
omg list php --available
omg use php 8.3
omg list php
omg which php
```

The version shown above illustrates a channel request. Choose a channel your application accepts. `latest` selects the newest channel not marked prerelease by upstream; a rolling channel can still contain a development snapshot, so inspect the actual PHP version before relying on it.

At a fresh prompt with the OMG hook enabled:

```sh
php -v
php --ini
which -a php
```

The first command reports the installed patch; the second helps identify the interpreter's configuration. OMG does not convert this into a system-wide PHP/FPM service installation or manage a web server's chosen interpreter.

## Pin a project channel

Within one directory, `.php-version` precedes `.tool-versions`. The hook checks the current directory before parents and supported mise layers after ordinary version files in each directory.

```sh
printf '%s\n' '8.3' > .php-version
omg which php
```

Preserve a project's existing accepted channel. Entering the directory selects an installed matching channel; it does not refresh that channel or download PHP. An explicit `omg use php` reads the pin and can perform the rolling-channel refresh described above.

Keep Composer dependencies, extension requirements, application lockfiles, and service configuration under their own tooling. A PHP runtime pin does not install those project dependencies.

## Refresh, switch, or remove a channel

To refresh the channel deliberately, run `omg use php CHANNEL`, replacing `CHANNEL` with a listed minor channel. Recheck `php -v` and run the application's tests afterward. The same channel name may now represent different patch bytes.

To move to another minor release, select that listed channel explicitly and update the project pin after validation. There is no separate `omg update php` command.

To remove an old channel, first select a different installed channel, then run `omg use php CHANNEL --uninstall`. An explicit channel is required, and removal refuses the active managed one.

## Verification and installation boundaries

The chosen GitHub asset must provide a SHA-256 digest. OMG refuses missing integrity metadata, verifies the downloaded `.tar.xz`, and extracts it into an OMG-owned staging tree rather than into the host system root.

The provider searches the staged payload for the PHP binary, creates its internal `bin/php` link, and performs a version smoke check. A failed binary check does not justify installing an unchecked or incompatible payload.

Checksum verification is against the current rolling asset metadata; it does not freeze that channel forever. A successful CLI interpreter check also does not establish that all optional extensions, FPM, or application dependencies work.

## Diagnose failures

| Symptom                                       | Check                                                                                                  |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Exact patch cannot be found                   | Request a `major.minor` channel; this backend does not preserve exact patch releases.                  |
| No asset for the host                         | Compare the channel/distro/architecture combination; do not substitute a foreign system-root archive.  |
| Runtime changed after `omg use php`           | Explicit use refreshes an installed rolling channel; compare `php -v` with the prior build.            |
| Missing shared library or smoke-check failure | Inspect native-library compatibility with the selected Debian/Ubuntu payload.                          |
| Web server still uses another PHP             | Inspect the service's PHP/FPM configuration; interactive PATH selection does not reconfigure services. |

## Continue

Read [runtime management](/docs/runtimes/), [configuration](/docs/configuration/), and [task execution](/guides/task-runner/).

Reviewed release source: [PHP rolling-channel provider](https://github.com/omg-cli/omg/blob/f0d8cb5d8a95dbbc6cae50460178702ac0263ebb/src/runtimes/php.rs), [runtime command dispatch](https://github.com/omg-cli/omg/blob/f0d8cb5d8a95dbbc6cae50460178702ac0263ebb/src/cli/runtimes.rs), and [pin detection](https://github.com/omg-cli/omg/blob/f0d8cb5d8a95dbbc6cae50460178702ac0263ebb/src/hooks/mod.rs). No PHP payload was installed or executed during this documentation review.
