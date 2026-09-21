/**
 * Curated CLI reference. Reviewed against src/cli/args.rs and docs/cli.md in
 * the omg-cli/omg repository at the commit recorded in the topic registry.
 *
 * The site keeps this page typed and intentionally explicit. It is a usable
 * index for people who need to choose a command, while the upstream markdown
 * remains the canonical long-form reference for command behavior and limits.
 */
import type { DocsTopic } from '../topic';
import { docsTopicMeta } from '../topics';

export const cliTopic: DocsTopic = {
  ...docsTopicMeta('cli'),
  sections: [
    {
      id: 'orientation',
      heading: 'How to read the command line',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            'The CLI has one parser for package operations, runtime managers, project tasks, environment records, and team or enterprise workflows. `omg --help` shows the public command list. Add `--all-commands` to include advanced commands, and add `--help` after any command or subcommand for its exact arguments.',
            'Package commands use the native backend of the host: ALPM and the AUR on Arch, APT on Debian or Ubuntu, DNF and RPM on Fedora, and Homebrew on Apple Silicon macOS. Native Windows has no backend; use OMG inside WSL so the Linux guest supplies the backend. Runtime and audit coverage still varies by provider and platform.',
            '`omg completions` supports Bash, Zsh, Fish, PowerShell (`pwsh`), and Elvish. The directory-change PATH hook currently emits Bash, Zsh, and Fish scripts; PowerShell and Elvish are completion-only values and return an unsupported-shell error when passed to `omg hook`.',
          ],
        },
        {
          kind: 'commands',
          title: 'Start here',
          commands: [
            'omg --help',
            'omg --all-commands --help',
            'omg doctor --network --eol',
            'omg status',
          ],
        },
        {
          kind: 'table',
          title: 'Global options',
          columns: ['Option', 'Effect'],
          rows: [
            [
              '-v, --verbose (repeatable)',
              'Increase detail; package build output is streamed live',
            ],
            [
              '-q, --quiet',
              'Suppress non-essential logs and fast-path banners; command results still print',
            ],
            [
              '--json',
              'Request JSON where that command implements it; do not assume one stable schema across commands',
            ],
            ['--all-commands', 'Include advanced commands in top-level help'],
            ['-h, --help / -V, --version', 'Print command help or the installed OMG version'],
          ],
        },
        {
          kind: 'table',
          title: 'Nested parser options',
          columns: ['Command family', 'Exact nested arguments and options'],
          rows: [
            [
              'hooks and workspace',
              '`hooks install --force`; `hooks run <hook>`; `workspace add <path> --name`; `workspace run <command> [-- <args...>] --parallel --filter --yes`; `workspace diff [branch]` defaults to `main`',
            ],
            [
              'config, privacy, and env',
              '`config reset --yes`; `privacy export --output`; `env share --description --public`; `env sync <url-or-id>`',
            ],
            [
              'audit',
              '`sbom --output`; `secrets --path`; `log --limit --severity --export`; `slsa <package> [--certificate-identity]`; `licenses --format --export --filter --check-policy`; `fix --dry-run --yes --min-severity`; `export --framework --period --output`',
            ],
            [
              'snapshots, CI, and migration',
              '`snapshot create --message`; `restore <id> --dry-run --yes`; `ci init <provider> --advanced`; `migrate export --output`; `migrate import <manifest> --dry-run`',
            ],
            [
              'team',
              '`team init <team-id> --name`; `golden-path create <name> --node --python --packages`; `compliance --export --enforce`; `activity --days`',
            ],
            [
              'containers',
              '`run <image> [-- <command...>] --name --detach --interactive --env --volume --workdir`; `shell --image --workdir --env --volume`; `build --dockerfile --tag --no-cache --build-arg --target`; `init --base`',
            ],
            [
              'account and enterprise',
              '`account link --token-stdin`; `enterprise reports --report-type`; `policy show --scope`; `audit-export --framework --period --output`; `license-scan --export`',
            ],
            [
              'hidden shell helpers',
              '`hook-env --shell` is called by generated hooks; `complete --shell --current --last [--full]` powers dynamic completion',
            ],
          ],
        },
      ],
    },
    {
      id: 'packages',
      heading: 'Package management',
      blocks: [
        {
          kind: 'table',
          title: 'Every package command',
          columns: ['Command', 'Purpose and important options'],
          rows: [
            [
              'omg search <query> (s)',
              'Search configured repositories; --detailed, --no-aur, and --limit control source detail and result count',
            ],
            [
              'omg install [packages] (i)',
              'Install packages or open the interactive picker; --yes, --dry-run, --review, and --allow-local-file',
            ],
            [
              'omg remove <packages> (r)',
              'Remove packages; --recursive is Arch-only, with --yes and --dry-run',
            ],
            [
              'omg update (u)',
              'Update packages; --check, --yes, --dry-run, --review, --no-sync, --aur-only, --fast, and --turbo',
            ],
            ['omg info <package>', 'Show package metadata from the active backend'],
            ['omg why <package>', 'Show dependency parents; --reverse shows dependents'],
            ['omg outdated', 'List packages with available updates'],
            ['omg size', 'Show package disk usage; --tree <package> and --limit <n> refine it'],
            ['omg blame <package>', 'Show when and why a package was installed'],
            [
              'omg clean',
              'Remove orphans or caches; --orphans, --cache, --aur, --all, --dry-run, --yes',
            ],
            ['omg explicit', 'List explicitly installed packages; --count prints only the count'],
            [
              'omg ec / tc / oc / uc',
              'Fast explicit, total, orphan, and available-update counters',
            ],
            ['omg sync (sy)', 'Refresh package databases from mirrors'],
          ],
        },
        {
          kind: 'commands',
          title: 'Safe package workflow',
          commands: [
            'omg search ripgrep --detailed',
            'omg install ripgrep --dry-run',
            'omg install ripgrep --yes',
            'omg history --search ripgrep',
          ],
        },
        {
          kind: 'note',
          tone: 'warning',
          text: 'Package operations are backend-specific. AUR recipes execute community build code, and rollback depends on cached archives or reachable source history. Keep the native package manager available for recovery.',
        },
      ],
    },
    {
      id: 'runtimes',
      heading: 'Runtime management',
      blocks: [
        {
          kind: 'table',
          title: 'Runtime commands',
          columns: ['Command', 'Purpose and options'],
          rows: [
            [
              'omg use <runtime> [version]',
              'Install or select a version; omit the version to use a detected project pin, or pass --uninstall to remove it',
            ],
            [
              'omg list [runtime]',
              'List installed versions; --available or -a lists downloadable versions',
            ],
            ['omg which <runtime>', 'Report the version selected for the current directory'],
            [
              'omg hook <shell>',
              'Print or install the directory-change hook; --uninstall removes the managed hook',
            ],
          ],
        },
        {
          kind: 'table',
          title: 'Native runtime managers',
          columns: ['Runtime', 'Names, pins, and exposed tools'],
          rows: [
            [
              'node',
              'Alias nodejs; .node-version, .nvmrc, package.json, and .tool-versions; node, npm, npx',
            ],
            [
              'python',
              'Alias python3; .python-version, pyproject.toml, and .tool-versions; python3, pip',
            ],
            ['go', 'Alias golang; .go-version, go.mod, and .tool-versions; go, gofmt'],
            [
              'rust',
              'Alias rustlang; rust-toolchain, rust-toolchain.toml, and .tool-versions; rustc, cargo',
            ],
            ['ruby', '.ruby-version and .tool-versions; ruby, gem'],
            ['java', '.java-version and .tool-versions; java, javac'],
            ['bun', 'Alias bunjs; .bun-version, package.json, and .tool-versions; bun'],
            ['pi', '.tool-versions; pi'],
            ['deno', '.deno-version, .dvmrc, and .tool-versions; deno'],
            ['zig', 'Alias ziglang; .zig-version and .tool-versions; zig'],
            ['dotnet', 'global.json and .tool-versions; dotnet'],
            ['erlang', '.tool-versions; erl, erlc'],
            ['php', '.php-version and .tool-versions; php'],
            ['swift', '.swift-version and .tool-versions; swift, swiftc'],
          ],
        },
        {
          kind: 'table',
          title: 'The exact 54 registry tools',
          columns: ['Registry', 'Names'],
          rows: [
            [
              'GitHub-release tools',
              'ripgrep, fd, bat, eza, fzf, zoxide, starship, just, task, jq, yq, gh, lazygit, delta, neovim, helix, zellij, helm, k9s, terraform, opentofu, vault, consul, minikube, kind, kustomize, tilt, skaffold, lazydocker, glow, pandoc, shellcheck, shfmt, hadolint, actionlint, hyperfine, tokei, dust, duf, procs, ruff, uv, fnm, protoc, terragrunt, packer, dive, golangci-lint, delve, stylua, kotlin, scala, elixir, ghcup',
            ],
          ],
        },
        {
          kind: 'paragraphs',
          paragraphs: [
            'The hook walks from the current directory toward its parents; the nearest explicit pin wins. It also reads `mise.toml`, `.mise.toml`, and `package.json` where the native parser supports them. Unknown runtime names fail explicitly instead of invoking another version manager.',
          ],
        },
      ],
    },
    {
      id: 'shell-and-workspaces',
      heading: 'Shell integration, Git hooks, and workspaces',
      blocks: [
        {
          kind: 'table',
          title: 'Shell and monorepo commands',
          columns: ['Command', 'Purpose and options'],
          rows: [
            [
              'omg completions <shell>',
              'Install completions for bash, zsh, fish, powershell/pwsh, or elvish; --stdout prints instead',
            ],
            [
              'omg hooks install',
              'Install environment-sync Git hooks; --force overwrites existing hooks',
            ],
            ['omg hooks uninstall / status', 'Remove hooks or show their status'],
            ['omg hooks run <hook>', 'Run pre-commit, post-checkout, or post-merge manually'],
            ['omg workspace init <name>', 'Create a workspace definition'],
            ['omg workspace add <path>', 'Add a project; --name overrides the directory name'],
            ['omg workspace remove <project> / list', 'Remove a project or list workspace members'],
            [
              'omg workspace run <command>',
              'Run across projects; --parallel, --filter, and --yes control execution',
            ],
            [
              'omg workspace diff [branch]',
              'Compare workspace environments with a branch (default main)',
            ],
            ['omg workspace check / status', 'Check project environments or show workspace state'],
          ],
        },
        {
          kind: 'commands',
          title: 'Shell setup examples',
          commands: [
            'eval "$(omg hook bash)"',
            'eval "$(omg hook zsh)"',
            'omg hook fish | source',
            'omg completions powershell',
          ],
        },
      ],
    },
    {
      id: 'diagnostics',
      heading: 'Status, health, and security',
      blocks: [
        {
          kind: 'table',
          title: 'Health and diagnostics',
          columns: ['Command', 'Purpose and options'],
          rows: [
            [
              'omg status',
              'Show package totals, updates, orphans, vulnerabilities, and cached runtimes; --fast uses counts only',
            ],
            [
              'omg doctor',
              'Check network, backend, daemon, PATH, and shell hook; --network tests mirrors, --eol checks runtime EOL, --turbo primes sudo',
            ],
            ['omg audit [scan]', 'Scan installed packages for advisories'],
            [
              'omg audit sbom',
              'Write an Arch package CycloneDX inventory; -o/--output selects the file',
            ],
            ['omg audit secrets', 'Scan a directory for credentials; -p/--path selects it'],
            [
              'omg audit log',
              'Read or export audit entries; --limit, --severity, and --export filter output',
            ],
            [
              'omg audit verify / policy',
              'Check local audit-chain consistency or show policy status',
            ],
            [
              'omg audit slsa <package>',
              'Verify supported artifact signatures; optional --certificate-identity binds the Fulcio SAN',
            ],
            [
              'omg audit licenses',
              'Report license inventory; --format, --export, --filter, and --check-policy',
            ],
            ['omg audit fix', 'Upgrade vulnerable packages; --dry-run, --yes, and --min-severity'],
            [
              'omg audit export',
              'Export generic compliance evidence; --framework, --period, and --output',
            ],
            ['omg audit eol', 'Check end-of-life status of installed runtimes'],
          ],
        },
        {
          kind: 'note',
          tone: 'warning',
          text: 'Audit verification checks local consistency, not authenticity or completeness. SBOM and compliance exports are plaintext evidence bundles; the SLSA-named command does not certify a SLSA build level.',
        },
      ],
    },
    {
      id: 'development',
      heading: 'Tasks, tools, and project setup',
      blocks: [
        {
          kind: 'table',
          title: 'Development commands',
          columns: ['Command', 'Purpose and options'],
          rows: [
            [
              'omg run <task>',
              'Run a detected project task; --watch, --parallel, --using <ecosystem>, and --all are mutually exclusive modes',
            ],
            [
              'omg new <stack> <name>',
              'Scaffold rust, react, node, python, or go projects; alias create',
            ],
            ['omg tool install <name>', 'Install a registry developer tool from supported sources'],
            ['omg tool list / remove <name>', 'Inspect or remove managed tools'],
            ['omg tool update <name>', 'Update one tool or use the special name all'],
            ['omg tool search <query> / registry', 'Search or list the curated tool registry'],
            [
              'omg init',
              'Run first setup; --defaults, --skip-shell, and --skip-daemon make it non-interactive',
            ],
          ],
        },
        {
          kind: 'table',
          title: 'Task detection',
          columns: ['Project file', 'Native command family'],
          rows: [
            ['package.json', 'npm, yarn, pnpm, or bun scripts'],
            ['deno.json', 'deno task'],
            ['Cargo.toml / Makefile / Taskfile.yml', 'cargo, make, or task'],
            ['pyproject.toml / Pipfile', 'poetry or pipenv'],
            ['composer.json / pom.xml / build.gradle', 'composer, Maven, or Gradle'],
            ['mise.toml / .mise.toml', 'OMG reads supported tasks, tools, and environment entries'],
          ],
        },
      ],
    },
    {
      id: 'environments',
      heading: 'Environments, snapshots, history, and rollback',
      blocks: [
        {
          kind: 'table',
          title: 'Environment state commands',
          columns: ['Command', 'Purpose and options'],
          rows: [
            ['omg env capture', 'Write current supported package and runtime state to omg.lock'],
            ['omg env check', 'Report drift against omg.lock without changing the machine'],
            [
              'omg env share',
              'Publish a GitHub Gist; --description and --public control metadata and visibility',
            ],
            ['omg env sync <url-or-id>', 'Fetch and check a shared environment record'],
            ['omg diff <to>', 'Compare the current lock or --from <file> with another lock file'],
            [
              'omg snapshot create / list',
              'Create a state snapshot with optional --message or list snapshots',
            ],
            ['omg snapshot restore <id>', 'Preview or restore a snapshot with --dry-run and --yes'],
            ['omg snapshot delete <id>', 'Delete one snapshot'],
            [
              'omg migrate export',
              'Write a portable manifest; -o/--output defaults to omg-manifest.json',
            ],
            [
              'omg migrate import <manifest>',
              'Map and install from a manifest; --dry-run previews changes',
            ],
          ],
        },
        {
          kind: 'table',
          title: 'History and rollback',
          columns: ['Command', 'Purpose and options'],
          rows: [
            [
              'omg history',
              'Show transactions; --limit, --search, --type, --from, and --to filter entries',
            ],
            [
              'omg rollback [id]',
              'Restore a previous package state; omit the id for the newest transaction and use --yes in non-interactive shells',
            ],
          ],
        },
        {
          kind: 'note',
          tone: 'warning',
          text: 'Environment records are inventories and drift checks, not complete machine images. A shared Gist can disclose private package and runtime information, even when it is secret and unlisted.',
        },
      ],
    },
    {
      id: 'team-and-containers',
      heading: 'Team, container, and account commands',
      blocks: [
        {
          kind: 'table',
          title: 'Team workflows',
          columns: ['Command', 'Purpose and options'],
          rows: [
            ['omg team init <team-id>', 'Create a team workspace; --name sets its display name'],
            ['omg team join <url>', 'Join a team from a GitHub Gist URL or ID'],
            ['omg team status / members', 'Show sync state or members'],
            ['omg team push / pull', 'Publish local state or fetch team state'],
            ['omg team dashboard', 'Open the interactive team TUI'],
            ['omg team roles list', 'List available roles'],
            [
              'omg team golden-path create <name>',
              'Create a template with --node, --python, and --packages',
            ],
            ['omg team golden-path list / delete <name>', 'Inspect or delete templates'],
            [
              'omg team compliance',
              'Check compliance; --export writes a report and --enforce blocks non-compliant operations',
            ],
            ['omg team activity', 'Show activity; --days sets the lookback window'],
          ],
        },
        {
          kind: 'table',
          title: 'Containers and dashboard account',
          columns: ['Command', 'Purpose and options'],
          rows: [
            ['omg container status', 'Check Docker or Podman'],
            [
              'omg container run <image>',
              'Run a command; --name, --detach, --interactive, --env, --volume, and --workdir',
            ],
            [
              'omg container shell',
              'Open a project-mounted shell; --image, --workdir, --env, and --volume',
            ],
            [
              'omg container build',
              'Build an image; --dockerfile, --tag, --no-cache, --build-arg, and --target',
            ],
            [
              'omg container list / images / pull <image>',
              'Inspect containers, images, or download an image',
            ],
            [
              'omg container stop <container> / exec <container>',
              'Stop or execute in a running container',
            ],
            ['omg container init', 'Generate a Dockerfile; --base selects the image'],
            [
              'omg account link / status / unlink',
              'Optional dashboard link; --token-stdin avoids putting the token in shell history',
            ],
          ],
        },
      ],
    },
    {
      id: 'configuration-and-privacy',
      heading: 'Configuration and privacy',
      blocks: [
        {
          kind: 'table',
          title: 'Configuration commands',
          columns: ['Command', 'Purpose'],
          rows: [
            ['omg config get <key> / set <key> <value>', 'Read or change a setting'],
            ['omg config list / validate', 'List effective settings or validate syntax and values'],
            ['omg config reset', 'Restore defaults; --yes skips confirmation'],
            ['omg config path', 'Print the active configuration path'],
            ['omg privacy status', 'Show local privacy settings and policy summary'],
            ['omg privacy export', 'Export local OMG data; -o/--output selects a file'],
            ['omg privacy opt-out / opt-in', 'Disable or re-enable telemetry collection'],
          ],
        },
        {
          kind: 'paragraphs',
          paragraphs: [
            'Configuration paths follow XDG on Linux and WSL and Application Support on macOS. `OMG_DATA_DIR`, `OMG_CONFIG_DIR`, and `OMG_SOCKET_PATH` can override the active locations. Review exported data before sharing it.',
          ],
        },
      ],
    },
    {
      id: 'ci-and-enterprise',
      heading: 'CI, daemon, dashboard, and enterprise',
      blocks: [
        {
          kind: 'table',
          title: 'CI and lifecycle commands',
          columns: ['Command', 'Purpose and options'],
          rows: [
            [
              'omg ci init <provider>',
              'Generate GitHub, GitLab, or CircleCI configuration; --advanced adds matrices and audit steps',
            ],
            ['omg ci validate / cache', 'Check CI expectations or print recommended cache paths'],
            ['omg daemon [--foreground]', 'Start omgd on Unix; --foreground keeps it attached'],
            ['omg daemon-status', 'Show daemon health and socket details (Unix)'],
            ['omg metrics', 'Print Prometheus-style system metrics (Unix)'],
            ['omg dash (d)', 'Open the interactive system dashboard'],
            ['omg stats', 'Show usage statistics'],
            [
              'omg self-update (up)',
              'Update the paired omg and omgd binaries; --force or --version selects the update',
            ],
            ['omg generate-man', 'Generate man pages; -o/--output changes the destination'],
          ],
        },
        {
          kind: 'table',
          title: 'Fleet and enterprise commands',
          columns: ['Command', 'Purpose and options'],
          rows: [
            ['omg fleet status', 'Show fleet status across machines'],
            [
              'omg enterprise reports',
              'Create monthly, quarterly, or custom executive reports with --report-type',
            ],
            ['omg enterprise policy show', 'Show policies, optionally scoped with --scope'],
            [
              'omg enterprise audit-export',
              'Export generic evidence with --framework, --period, and --output',
            ],
            [
              'omg enterprise license-scan',
              'Scan license compliance; --export accepts json or csv',
            ],
          ],
        },
        {
          kind: 'note',
          tone: 'warning',
          text: 'Unix-only commands are not available in a native Windows process. The account command is compiled when the license feature is enabled. Compliance labels do not turn a plaintext inventory into certified framework evidence.',
        },
      ],
    },
  ],
};
