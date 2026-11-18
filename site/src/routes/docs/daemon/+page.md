---
title: Operate the optional daemon
description: Start and inspect omgd, configure a user service, understand cached state, and recover from socket or upgrade problems.
navLabel: Daemon
section: Guides
order: 40
release: v0.1.224
source:
  repo: omg-cli/omg
  path: docs/daemon.md
  reviewedCommit: f0d8cb5d8a95dbbc6cae50460178702ac0263ebb
  reviewedAt: '2026-11-11'
implementation:
  - src/daemon/server.rs
  - src/cli/commands.rs
  - src/cli/daemon_status.rs
  - src/core/paths.rs
  - src/cli/args.rs
---

## Decide whether to run omgd

`omgd` keeps derived package indexes, security state, and status snapshots warm. Package transactions still run through the CLI and selected native backend.

The daemon requires Unix domain sockets. Use the matching `omg` and `omgd` from your supported Linux or macOS release. Run both as your regular user.

| Operation                                        | Without a daemon                                     |
| ------------------------------------------------ | ---------------------------------------------------- |
| Search, information, install, remove, and update | Uses the direct backend path                         |
| Package counters                                 | Uses a fresh status snapshot or direct package data  |
| `omg audit scan`                                 | Uses a direct cold scan                              |
| `omg audit sbom`                                 | Uses supported system inventory and advisory sources |
| `omg metrics`                                    | Fails because it requires the daemon                 |

SBOM inventory supports Arch, Debian, Ubuntu, and Fedora. Running a daemon does not add an unsupported inventory backend.

## Inspect the current process before starting another

```bash
omg --version
omgd --version
omg daemon-status
```

Status prints whether the socket exists, whether the daemon answers, and available metrics. When reachable, it also reports cached package status.

In v0.1.224, `daemon-status` can return success after printing a missing socket, failed connection, or failed ping. Read its diagnostic text. Do not use its exit status alone as a readiness check.

`omg metrics` requires a successful daemon connection and is a separate command. Read the [CLI reference](/docs/cli/) before parsing its output in monitoring scripts.

## Start in the foreground for diagnosis

If status shows no running daemon, start it in an attended terminal:

```bash
omg daemon --foreground
```

Keep that terminal open and run `omg daemon-status` from another terminal under the same account. Foreground startup lets you inspect startup and request errors directly.

For a detached process, use:

```bash
omg daemon
```

Startup takes an exclusive lock before touching the socket. Another responding instance causes startup to stop instead of launching a second daemon. The lock releases when the process exits.

The CLI has no `omg daemon stop` subcommand. Stop a foreground instance with Ctrl+C. For a detached process, use its service manager or identify its owner and process before sending SIGTERM.

## Resolve the socket as the same user

For a regular user, the socket location is selected in this order:

1. `OMG_SOCKET_PATH`, when set to a nonempty value.
2. `XDG_RUNTIME_DIR/omg.sock`.
3. `/run/user/UID/omg.sock`.
4. `/tmp/omg-UID/omg.sock`.
5. A private run directory under the data directory if the temporary fallback is unsafe.

Use the actual UID of the account running the daemon. `omg daemon-status` shows the resolved path or a diagnostic about that path.

The socket uses mode `0600`; its private parent uses mode `0700`. Client and daemon validate directory type, ownership, and permissions. A stale socket is removed during startup only after the safety checks pass.

Do not loosen socket permissions to share the daemon between users. Configure each user session deliberately. Starting OMG through `sudo` does not connect to your ordinary user state by inheriting overrides.

Root ignores caller-controlled `OMG_CONFIG_DIR`, `OMG_DATA_DIR`, `OMG_CACHE_DIR`, `OMG_DAEMON_DATA_DIR`, and `OMG_SOCKET_PATH`. See [configuration](/docs/configuration/) for the complete path contract.

## Use your user service manager

If you already configured the documented Linux user service, inspect and restart that service with:

```bash
systemctl --user status omgd.service
journalctl --user -u omgd.service -n 50
```

These commands assume that `omgd.service` exists in your user session. They do not install a unit or apply to macOS. Use the service setup in [configuration](/docs/configuration/) and point `ExecStart` at the installed `omgd` executable.

Run a service in the foreground under the manager so the manager owns its lifecycle and captures output. Avoid starting a detached CLI instance alongside an already managed service.

## Understand stale counts

The daemon maintains memory caches, a package index, JSON status, and a binary status snapshot for prompt counters. Native package databases remain the package authority.

A background pass refreshes vital signs every five minutes. Package changes between passes can leave counters behind. A failed refresh leaves the previous snapshot available for readers that accept it.

The daemon does not own transaction history. Removing its derived state is therefore a different operation from removing installed runtimes or history. Do not delete the entire OMG data directory to repair a cache.

See [architecture](/docs/architecture/) for request ownership and [package management](/docs/packages/) for transaction verification.

## Restart after replacing the binaries

After a verified OMG update, check the installed pair again:

```bash
omg --version
omgd --version
```

Replacing the executable files does not update the process already in memory. For the configured Linux user service:

```bash
systemctl --user restart omgd.service
omg daemon-status
```

For a manual foreground instance, stop the old process and start `omg daemon --foreground` again. Do not start another daemon to hide a version mismatch.

SIGINT and SIGTERM stop new connections, cancel background work, and allow owned tasks up to 30 seconds to finish. A forced termination can leave an old snapshot or socket, so inspect state before restarting.

## Recover from startup errors

If another daemon responds, use that instance or stop it through its owner. If a socket belongs to another UID, check your account and overrides before changing ownership.

If no process responds, retain the startup error, socket path, and directory ownership details. Startup can recover a genuinely stale socket after validating its parent. Do not remove arbitrary socket files as a first step.

A missing daemon does not block ordinary package commands. Continue through the direct backend while diagnosing, or use [troubleshooting](/docs/troubleshooting/) for the reported error. Read [updates](/docs/updates/) before repairing an installed binary pair.
