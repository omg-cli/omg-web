import type { LearningContent } from '../page';

export const content: LearningContent = {
  sections: [
    {
      id: 'overview',
      heading: 'Run project tasks through one command',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            'In multi-language projects and polyglot teams, developers constantly switch between different task runners: `cargo` in Rust, `npm`/`pnpm`/`bun` in JavaScript, `poetry` in Python, `go task` in Go, and `make` for legacy tooling. Remembering the specific runner syntax and configuration file for every project slows down daily development.',
            'OMG’s task runner in `src/core/task_runner.rs` discovers supported project tasks and runs them with `omg run <task>`. It can select a runtime required by a supported task before executing the underlying command.',
          ],
        },
        {
          kind: 'commands',
          title: 'Run project tasks with OMG',
          commands: ['omg run build', 'omg run test', 'omg run dev -- --port 8080'],
        },
        {
          kind: 'paragraphs',
          paragraphs: [
            'Name a task when running this command. The CLI requires the task argument; if multiple ecosystems define the same task at equal priority, an attended shell prompts you to choose one.',
          ],
        },
      ],
    },
    {
      id: 'priority-hierarchy',
      heading: 'Ecosystem detection priority',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            'When a repository contains multiple project files (for example, a monorepo with a `Makefile`, a `Cargo.toml`, and a `package.json`), OMG avoids ambiguity by evaluating tasks according to an explicit, compiled priority hierarchy in `src/core/task_runner.rs`:',
          ],
        },
        {
          kind: 'table',
          title: 'Task runner ecosystem priority order',
          columns: ['Ecosystem and priority', 'Manifest files and detection logic'],
          rows: [
            [
              '1. Rust (Priority 100)',
              'Cargo.toml enables the built-in Cargo tasks build, test, check, run, clippy, and fmt.',
            ],
            [
              '2. Node / Bun / Deno (Priority 90)',
              'package.json scripts and deno.json tasks. The packageManager field or recognized lockfiles select npm, pnpm, Yarn, or Bun for package.json scripts; current bun.lock is not recognized without packageManager.',
            ],
            [
              '3. Python (Priority 80)',
              'pyproject.toml [tool.poetry.scripts] and Pipfile [scripts].',
            ],
            [
              '4. Go Task (Priority 75)',
              'Taskfile.yml or Taskfile.yaml enables task --list and fallback execution through task.',
            ],
            [
              '5. Ruby (Priority 70)',
              'Rakefile enables task listing and fallback execution through rake.',
            ],
            [
              '6. Java (Priority 60)',
              'pom.xml (Apache Maven) or build.gradle / build.gradle.kts (Gradle).',
            ],
            ['7. PHP (Priority 50)', 'composer.json (`scripts`) executed via composer.'],
            [
              '8. mise (Priority 45)',
              'mise.toml or .mise.toml [tasks.*] declarations, parsed and planned without spawning the mise CLI; task scripts run through a shell.',
            ],
            ['9. Make (Priority 40)', 'Makefile targets executed via make.'],
            [
              'OMG Project Config',
              '.omg.toml [scripts] selects a preferred ecosystem when an existing task name is ambiguous; it does not define executable tasks.',
            ],
          ],
        },
      ],
    },
    {
      id: 'argument-forwarding',
      heading: 'Argument forwarding and environment passthrough',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            'OMG passes arguments directly to the underlying tool using the standard `--` separator. All flags following `--` are forwarded untouched to the underlying compiler, test framework, or script.',
          ],
        },
        {
          kind: 'commands',
          title: 'Forwarding arguments to underlying tasks',
          commands: [
            'omg run test -- --nocapture',
            'omg run build -- --release',
            'omg run lint -- --fix',
          ],
        },
      ],
    },
    {
      id: 'mise-parity',
      heading: 'Native execution of mise.toml tasks',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            'If you are migrating a repository from mise or working in a repository that uses `mise.toml` for task definitions (`[tasks.build]`, `[tasks.test]`), OMG runs these tasks natively in pure Rust. You do not need to install the mise binary or convert your configuration: OMG detects and executes `[tasks.*]` entries out of the box.',
          ],
        },
      ],
    },
  ],
  sources: [
    {
      title: 'OMG task runner implementation (src/core/task_runner.rs)',
      href: '/docs/architecture/',
    },
    { title: 'OMG CLI reference for omg run', href: '/docs/cli/' },
    { title: 'OMG daily workflows guide', href: '/docs/workflows/' },
  ],
  related: ['/compare/omg-vs-mise/', '/guides/reproducible-dev-environments/', '/docs/runtimes/'],
};
