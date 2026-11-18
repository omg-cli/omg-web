---
title: Build and run containers
description: Generate a reviewed Dockerfile, build with Docker or Podman, and run commands with explicit environment variables and mounts.
navLabel: Containers
section: Guides
order: 70
release: v0.1.224
source:
  repo: omg-cli/omg
  path: docs/containers.md
  reviewedCommit: f0d8cb5d8a95dbbc6cae50460178702ac0263ebb
  reviewedAt: '2026-11-11'
implementation:
  - src/cli/container.rs
  - src/core/container.rs
  - src/cli/args.rs
---

## Connect an existing engine

OMG wraps selected Docker and Podman commands. Install and configure an engine separately on your supported host. OMG prefers an available Podman executable, then Docker.

```bash
omg container status
omg container list
omg container images
```

Status checks the detected engine by listing containers. A missing engine or failed engine request makes it fail. If both engines are installed, check the runtime named in the result before looking for a container in the other engine.

Engine permissions, images, repository code, and host mounts remain separate trust decisions. Do not expose an engine socket or a private host directory merely to make a project command work.

## Generate a project recipe

From a reviewed project directory:

```bash
omg container init
```

This writes `Dockerfile.omg`. It also creates or extends `.dockerignore` with protective rules and updates existing `Dockerfile.omg.dockerignore` and `.containerignore` files.

Generation can run without a working engine. It generates a file rather than building an image or running a complete development environment.

The default base is `ubuntu:24.04`. `--base` accepts another base-image reference:

```bash
omg container init --base debian:bookworm-slim
```

Choose one init invocation. The command refuses to overwrite an existing `Dockerfile.omg`; inspect or preserve that file before regenerating it.

The release detects these project markers in the current directory:

| Marker                                 | Generator request |
| -------------------------------------- | ----------------- |
| `package.json`                         | Node `lts`        |
| `Cargo.toml`                           | Rust `stable`     |
| `go.mod`                               | Go `latest`       |
| `pyproject.toml` or `requirements.txt` | Python `3.12`     |

These are generator defaults. It does not resolve every project's exact runtime pin or application lockfile into an equivalent image. Some generated package commands use the base distribution's available versions.

## Review downloads and build context

When the generated recipe needs a remote installer, OMG resolves a SHA-256 digest during generation and emits a verification step. Scripts are fetched over HTTPS; Go archive digests come from published Go release metadata.

Generation fails if it cannot establish the required digests. The v0.1.224 CLI accepts `--base` for init and has no `--installer-digest` option. Retry a failed fetch after diagnosing publisher access rather than removing verification from the recipe.

A digest captured during generation identifies the bytes fetched then. It does not authenticate the publisher independently or lock all later package downloads. Review every emitted install step before building.

Inspect the recipe and ignore rules:

```bash
less Dockerfile.omg
less .dockerignore
```

The generated recipe copies the project into `/app`. Protective ignore rules reduce accidental inclusion of credentials and repository internals, but review your actual context and any engine-specific ignore file before sharing an image.

## Build the reviewed recipe

```bash
omg container build --dockerfile Dockerfile.omg --tag myapp:dev
```

The current directory is the build context. `--dockerfile`, or `-f`, must name a valid relative path in that context. Without the flag, build looks for `Dockerfile`, rather than `Dockerfile.omg`.

`--tag`, or `-t`, defaults to `omg-dev:latest`. Optional controls are `--no-cache`, repeatable `--build-arg KEY=VALUE`, and `--target` for a named build stage.

```bash
omg container build -f Dockerfile.omg -t myapp:dev --no-cache
```

There is no trailing context argument for this OMG command. Build contacts package and image sources as required by the recipe. Success means the engine completed the build; run your application checks separately.

## Run a command with explicit inputs

```bash
omg container run alpine -- echo hello
omg container run alpine --env APP_MODE=test -- printenv APP_MODE
```

An ordinary run attaches with a TTY and removes the container on exit. `--interactive` explicitly requests the interactive configuration. `--detach` starts in the background and keeps the container after the launching command returns.

The released wrapper has no non-TTY attached mode. Exec also requests a TTY. Use the native engine when a pipeline needs its noninteractive controls.

Use `--name` to choose a container name, `--workdir` for its working directory, repeatable `--env KEY=VALUE` for environment values, and repeatable `--volume HOST:CONTAINER` for mounts.

```bash
omg container run alpine --volume "$PWD/data:/data" -- ls /data
```

Create and review the host data directory first. These mounts can expose writable host files. The wrapper rejects suffix modes such as `HOST:CONTAINER:ro`. Use the native engine's reviewed read-only controls when you need a read-only mount.

Environment arguments require a nonempty key and `=`. Keep secrets out of ordinary command history and image build arguments. Use your engine's appropriate secret mechanism for credentials.

## Open a development shell

```bash
omg container shell
```

The default shell uses `ubuntu:24.04`, mounts the current project at `/app`, and starts there. Files written through that mount can change the host project.

Override the image with `--image`, the working directory with `--workdir`, or add `--env` and `--volume` entries. Changing `--workdir` does not remove the default project mount.

The image must provide a usable shell and the programs you intend to run. The generator's recipe is a starting point; opening a shell does not validate the project's runtime or install dependencies.

## Manage an existing container

```bash
omg container pull alpine
omg container list
omg container exec CONTAINER -- uname -a
omg container stop CONTAINER
```

Replace `CONTAINER` with the exact name or ID you inspected. Pull downloads an image. Exec runs in an existing container; stop changes that container's state.

Run, shell, and exec propagate a nonzero container process status through their wrapper path. Build, pull, stop, listing, and validation failures also fail the command. Detached launch success does not prove the background application stays healthy.

If a command fails, inspect the engine's own status and logs. Check malformed mounts or environment entries before retrying. Preserve an existing recipe when generation refuses to overwrite it. See [project tasks](/docs/tasks/) for host execution, [installation](/docs/installation/) for verified OMG downloads, and [troubleshooting](/docs/troubleshooting/) for support evidence.
