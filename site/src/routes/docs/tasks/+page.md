---
title: Run project tasks
description: Run detected project tasks, choose an ecosystem, forward arguments, and use the supported mise, watch, and parallel modes.
navLabel: Project tasks
section: Guides
order: 60
release: v0.1.224
source:
  repo: omg-cli/omg
  path: docs/task-runner.md
  reviewedCommit: f0d8cb5d8a95dbbc6cae50460178702ac0263ebb
  reviewedAt: '2026-11-11'
implementation:
  - src/core/task_runner.rs
  - src/config/mise_env.rs
  - src/cli/args.rs
---

## Prepare the project

`omg run` executes repository-defined code. Review the project and its parent configuration before running tasks from an unfamiliar checkout.

Install the project's runtime, build tools, and application dependencies first. OMG can offer to install a missing runtime or enable a JavaScript manager, but task discovery does not install the whole development environment.

Open a terminal in the project directory. Most task discovery reads that directory only. Supported mise files can also come from ancestors.

## Run a named task

For a project that defines `build` and `test`:

```bash
omg run build
omg run test -- --coverage
```

OMG prints the selected ecosystem and source file before execution. Arguments after `--` belong to the task. Choose arguments supported by the actual underlying command.

Requested task names accept ASCII letters, digits, hyphens, underscores, and dots. A name such as `test:watch` is rejected. Run that script with its native tool when the name cannot be changed.

There is no `omg run --list` option. Read scripts or targets in the project files, or use the ecosystem's native task-list command.

## Check what OMG can discover

| Project marker | Discovered tasks or entry point |
| --- | --- |
| `package.json` | `scripts`, plus `install` if there is no install script |
| `deno.json` | `tasks` through `deno task` |
| `composer.json` | `scripts` through `composer run-script` |
| `Cargo.toml` | `build`, `test`, `check`, `run`, `clippy`, `fmt` |
| `Makefile` | Plain targets the detector can read |
| `pyproject.toml` | `[tool.poetry.scripts]` through `poetry run` |
| `Pipfile` | `[scripts]` through `pipenv run` |
| `pom.xml` | `clean`, `compile`, `test`, `package`, `install` |
| `build.gradle` or `build.gradle.kts` | `build`, `test`, `run`, `clean` through `./gradlew` |
| Supported mise files | Supported `[tasks]` entries through native OMG execution |
| `Taskfile.yml` or `Taskfile.yaml` | `list`; other names can use the fallback |
| `Rakefile` | `tasks`; other names can use the fallback |

The release does not discover `deno.jsonc`. Use `deno task` directly for a JSONC-only project. Taskfile and Rakefile support does not parse every declared task.

When no discovered task matches, OMG tries an ordered marker-based fallback: Make, the JavaScript manager, Taskfile, Rake, Pipenv, Deno, then Composer. Without a marker, it tries an executable with the requested name. A misspelled task can therefore reach a fallback command rather than produce an inventory error.

## Choose between several ecosystems

Rust tasks rank above JavaScript, then Python, Go, Ruby, Java, PHP, mise, and Make. Node, Bun, and Deno share the JavaScript priority. An unresolved highest-priority tie can prompt in an attended terminal and fails without one.

Select a source explicitly when the project has competing tasks:

```bash
omg run test --using rust
omg run build --using node
```

To save a per-task preference, edit the project's `.omg.toml`:

```toml
[scripts]
test = "rust"
build = "node"
```

Use `omg run test --all` to run all detected matches sequentially. Execution stops at the first failure.

## Check the JavaScript manager

The detector checks `packageManager` first. Without a recognized field, it checks `bun.lockb`, `pnpm-lock.yaml`, `yarn.lock`, then `package-lock.json` or `npm-shrinkwrap.json`. With no marker, it uses npm.

The release does not use `bun.lock` as a detection marker. Set the manager explicitly in the project if that file is your only marker.

```json
{
	"packageManager": "pnpm@9.0.0",
	"scripts": { "build": "vite build" }
}
```

The field chooses the manager name. It does not pin or install the exact manager version after `@`. If pnpm or Yarn is missing, OMG can offer to enable it through Corepack. Verify the installed manager separately when exact versions matter.

## Use watch or parallel mode

```bash
omg run test --watch
omg run build,test --parallel
```

Watch reruns a task after watched files change. Stop it with Ctrl+C. An unsuccessful watched run is reported while the watcher can continue waiting for another change.

Parallel mode accepts a comma-separated list of at most 16 names. Each task receives the arguments after `--`. Empty list entries are rejected. Check that concurrent tasks do not write the same output directory or shared fixture.

`--watch`, `--parallel`, `--using`, and `--all` conflict with one another. Choose one mode per invocation; the parser rejects combinations.

## Run the supported mise subset

OMG accepts a string task or a table with `run`, `depends`, `dir`, `env`, `description`, and `hide`. A run array executes in order and stops at failure.

```toml
[tasks]
generate = "echo ready"
build = { run = "cargo build", depends = ["generate"] }
```

```bash
omg run build --using mise
```

Dependencies execute once in declared order. Missing dependencies and cycles fail before task execution. Arguments after `--` go only to the requested task. Task-local environment values do not flow into dependency tasks.

Tasks run from the declaring configuration root unless `dir` supplies a literal relative path. Unsupported controls, dependency patterns, custom shells, file tasks, and templates in `run` or `dir` fail instead of being silently treated as supported.

Layered mise project and local files can override earlier values. `MISE_ENV=test omg run test` selects the supported test layer. Comma-separated environment names are applied in order; later layers win.

Explicit tasks resolve supported mise `[env]` values and `[env._]` path, file, and source directives. A source directive executes project code. Automatic shell hooks only select runtime pins and do not execute these environment sources.

OMG does not import mise plugins, arbitrary backends, or `mise.lock`. Keep the native tool for features outside the supported subset.

## Make automated execution deterministic

Preinstall the selected runtime and manager, install application dependencies, and resolve task ambiguity with `--using` or project preferences before running in CI.

The released `omg run` has no `--yes` flag. Dependency installation prompts fail when no terminal is attached. `omg workspace run` has a separate `--yes` option for its own repository-command confirmation; that option does not belong to `omg run`.

An ordinary failed child task makes the command fail with a reported child exit code. Do not assume that OMG preserves that exact numeric child code for every task path. `--all` stops on failure; parallel mode reports task failures after the launched work.

If detection picks the wrong task, inspect the reported file and select an ecosystem. If execution fails afterward, run the underlying command to diagnose project dependencies. Continue with [runtimes](/docs/runtimes/), [shell integration](/docs/shell/), [environment capture](/docs/environments/), and [troubleshooting](/docs/troubleshooting/).
