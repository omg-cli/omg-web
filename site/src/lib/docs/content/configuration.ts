/**
 * Curated configuration handbook. Reviewed against the omg-cli/omg implementation
 * and docs/configuration.md at the commit recorded in the topic registry.
 */
import type { DocsTopic } from '../topic';
import { docsTopicMeta } from '../topics';

export const configurationTopic: DocsTopic = {
  ...docsTopicMeta('configuration'),
  sections: [
    {
      id: 'locations',
      heading: 'File locations',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            'On Linux, OMG follows the XDG base directory specification. macOS uses its Application Support directory. An empty configuration is valid. Every setting has a default, so most machines need no configuration.',
          ],
        },
        {
          kind: 'table',
          title: 'Linux and WSL default paths',
          columns: ['Path', 'Purpose'],
          rows: [
            [
              '~/.config/omg/config.toml',
              'General settings such as telemetry and AUR build tuning',
            ],
            [
              '~/.config/omg/policy.toml',
              'Package policy enforced against prepared Arch transactions',
            ],
            ['~/.local/share/omg/versions/', 'Installed runtime versions'],
            ['~/.local/share/omg/tools/', 'CLI tools installed with omg tool'],
            ['~/.local/share/omg/status-cache.json', 'Versioned daemon status snapshot'],
            ['~/.local/share/omg/completion-cache.json', 'Shell completion cache'],
            ['~/.local/share/omg/history.json', 'Transaction history'],
            ['~/.local/share/omg/audit/audit.jsonl', 'Hash-chained audit log'],
          ],
        },
        {
          kind: 'diagram',
          diagram: {
            title: 'Where the files live',
            caption:
              'Your home folder holds the settings you edit and the data OMG keeps. Nothing in the figure is created until you ask for it.',
            nodes: [
              { id: 'home', label: 'Home folder', detail: 'the tilde, ~' },
              { id: 'config', label: 'config.toml', detail: 'general settings' },
              { id: 'policy', label: 'policy.toml', detail: 'security policy' },
              { id: 'data', label: 'Local data', detail: 'runtimes and history' },
            ],
            edges: [
              { from: 'home', to: 'config' },
              { from: 'home', to: 'policy' },
              { from: 'home', to: 'data' },
            ],
          },
        },
        {
          kind: 'note',
          tone: 'info',
          text: 'For ordinary Linux users, the daemon normally keeps its socket and omg.status prompt snapshot in the session runtime directory, with validated fallbacks when needed. Root uses /var/lib/omg for data and daemon state and /var/cache/omg for caches. It ignores caller-supplied OMG storage, configuration, daemon, and socket overrides; existing user state is not imported automatically.',
        },
        {
          kind: 'note',
          tone: 'info',
          text: 'The table shows unprivileged Linux and WSL defaults. On macOS, data and configuration default to ~/Library/Application Support/omg. XDG data and config variables apply on Linux. Unprivileged OMG path overrides apply across supported platforms. Use omg config path and omg config get data_dir to inspect the active locations before changing files.',
        },
      ],
    },
    {
      id: 'config-toml',
      heading: 'General settings in config.toml',
      blocks: [
        {
          kind: 'commands',
          title: 'Developer workstation example',
          language: 'toml',
          commands: [
            'telemetry_enabled = false',
            '',
            '[aur]',
            'build_concurrency = 8',
            'enable_ccache = true',
            'cache_builds = true',
          ],
        },
        {
          kind: 'table',
          title: 'AUR build settings and defaults',
          columns: ['Setting', 'Default and meaning'],
          rows: [
            ['build_method', '"bubblewrap" by default; alternatives are "chroot" and "native"'],
            [
              'build_concurrency',
              '1 by default; the config command accepts 1 through 8 parallel AUR builds',
            ],
            [
              'review_pkgbuild',
              'true by default; requires interactive PKGBUILD review before building',
            ],
            ['secure_makepkg', 'true by default; uses stricter makepkg flags'],
            ['allow_unsafe_builds', 'false by default; permits native builds without sandboxing'],
            [
              'allow_network',
              'false by default; opt in to expose host networking to sandboxed build code',
            ],
            ['use_metadata_archive', 'true by default; bulk AUR metadata for fast update checks'],
            [
              'metadata_cache_ttl_secs',
              '300 seconds by default; freshness window for AUR metadata',
            ],
            ['makeflags', 'Unset by default; optional make flags, validated before use'],
            [
              'pkgdest / srcdest',
              'Unset by default; optional shared package and source cache paths',
            ],
            ['ccache_dir / sccache_dir', 'Unset by default; optional compiler-cache paths'],
            ['cache_builds', 'true by default; reuses built packages'],
            ['enable_ccache', 'false by default; speeds up C and C++ builds'],
            ['enable_sccache', 'false by default; speeds up Rust builds'],
            ['telemetry_enabled', 'false by default; runtime telemetry is strictly opt-in'],
          ],
        },
        {
          kind: 'commands',
          title: 'Read and change settings from the CLI',
          commands: [
            'omg config list',
            'omg config get data_dir',
            'omg config set aur.build_concurrency 8',
            'omg config set telemetry.enabled false',
            'omg config validate',
          ],
        },
        {
          kind: 'paragraphs',
          paragraphs: [
            'The TOML telemetry key is telemetry_enabled, while config get and config set use telemetry.enabled. In v0.1.224, writable CLI keys are telemetry.enabled, aur.build_concurrency, aur.enable_ccache, aur.enable_sccache, aur.secure_makepkg, and aur.makeflags. The data_dir and socket keys are read-only. Edit the file printed by omg config path for other supported TOML settings.',
            'Inspect validation output: v0.1.224 can print configuration issues and still return exit status 0. Do not use that status alone as a CI policy gate. Unknown current-schema keys and invalid values can also fail settings loading in commands that consume them. Configuration files larger than 1 MiB are rejected.',
          ],
        },
      ],
    },
    {
      id: 'policy-toml',
      heading: 'Security policy in policy.toml',
      blocks: [
        {
          kind: 'table',
          title: 'Security grades from lowest to highest',
          columns: ['Grade', 'Meaning'],
          rows: [
            ['Risk', 'The configured vulnerability scanner found a known vulnerability'],
            ['Community', 'AUR or another nonofficial package source'],
            ['Verified', 'Official repository metadata identifies the package'],
            [
              'Locked',
              'Reserved for provenance evidence that automatic grading does not yet assign',
            ],
          ],
        },
        {
          kind: 'steps',
          steps: [
            { text: 'Package grading. Every candidate gets a grade from the table above.' },
            { text: 'Grade check. The grade must meet minimum_grade.' },
            { text: 'AUR check. AUR packages are rejected when allow_aur is false.' },
            { text: 'Trust check. Grades below Verified are rejected when require_pgp is true.' },
            {
              text: 'License check. Licenses outside allowed_licenses are rejected when the list is set.',
            },
            { text: 'Ban check. Packages in banned_packages are always rejected.' },
          ],
        },
        {
          kind: 'commands',
          title: 'Corporate style policy',
          language: 'toml',
          commands: [
            'minimum_grade = "Verified"',
            'allow_aur = false',
            'require_pgp = true',
            'allowed_licenses = ["Apache-2.0", "MIT", "BSD-3-Clause"]',
            'banned_packages = []',
          ],
        },
        {
          kind: 'paragraphs',
          paragraphs: [
            'The default policy uses a minimum_grade of Community. It allows AUR packages and does not require the Verified grade. Tighten minimum_grade, allow_aur, require_pgp, allowed_licenses, and banned_packages when the machine needs stricter controls. Explicit policy is enforced against prepared Arch transactions, including dependencies. Native APT, DNF, and Homebrew mutations refuse explicit policy because a precheck cannot guarantee their final transactions.',
          ],
        },
      ],
    },
    {
      id: 'version-files',
      heading: 'Version files OMG reads',
      blocks: [
        {
          kind: 'table',
          title: 'Detected version files',
          columns: ['File', 'Runtime'],
          rows: [
            ['.nvmrc', 'Node.js'],
            ['.node-version', 'Node.js'],
            ['.bun-version', 'Bun'],
            ['.python-version', 'Python'],
            ['.ruby-version', 'Ruby'],
            ['.go-version', 'Go'],
            ['.java-version', 'Java'],
            ['rust-toolchain', 'Rust'],
            ['rust-toolchain.toml', 'Rust'],
            ['.tool-versions', 'Multiple runtimes in asdf format'],
            ['package.json', 'Node.js and Bun through the engines or volta field'],
            ['go.mod', 'Go through the go directive'],
          ],
        },
        {
          kind: 'commands',
          title: 'Rust toolchain file format',
          language: 'toml',
          commands: [
            '[toolchain]',
            'channel = "stable"',
            'components = ["rustfmt", "clippy"]',
            'profile = "minimal"',
          ],
        },
      ],
    },
    {
      id: 'environment-variables',
      heading: 'Environment variables',
      blocks: [
        {
          kind: 'table',
          title: 'Variables OMG respects',
          columns: ['Variable', 'Purpose'],
          rows: [
            ['OMG_SOCKET_PATH', 'Unprivileged override for the daemon socket path'],
            ['OMG_DATA_DIR', 'Unprivileged override for runtime, tool, history, and audit data'],
            ['OMG_CACHE_DIR', 'Unprivileged override for derived cache and update-notice state'],
            [
              'OMG_DAEMON_DATA_DIR',
              'Unprivileged daemon data override; set consistently for a separately configured service',
            ],
            [
              'OMG_CONFIG_DIR',
              'Unprivileged configuration-directory override; must be absolute, otherwise it is ignored with a warning',
            ],
            ['OMG_TELEMETRY=0', 'Disable runtime telemetry; false, off, and no are also accepted'],
            [
              'OMG_DISABLE_TELEMETRY=1',
              'Disable runtime telemetry; true, on, and yes are also accepted',
            ],
            [
              'OMG_NO_UPDATE_CHECK=1',
              'Suppress built-in update notices and checks; presence of the variable is sufficient',
            ],
            [
              'OMG_NO_TELEMETRY=1',
              'Installer-only consent opt-out; use runtime controls for installed OMG',
            ],
            ['OMG_SKIP_SHELL=1', 'Installer-only control to skip shell integration'],
            [
              'OMG_VERSION=v0.1.224',
              'Installer-only release selection; unset defaults to its latest release marker',
            ],
            [
              'RUST_LOG',
              'Logging filter. The CLI defaults to warn and the daemon defaults to info',
            ],
            ['GITHUB_TOKEN', 'Credential required by omg env share; supply through a secret store'],
            [
              'OMG_DASHBOARD_TOKEN',
              'Optional dashboard-link credential; omg account link --token-stdin accepts stdin instead',
            ],
            [
              'XDG_RUNTIME_DIR',
              'Linux socket directory. Falls back to /run/user/$UID or a private /tmp/omg-$UID directory',
            ],
            ['XDG_DATA_HOME', 'Linux data directory. The default is ~/.local/share'],
            ['XDG_CONFIG_HOME', 'Linux configuration directory. The default is ~/.config'],
            ['XDG_CACHE_HOME', 'Linux cache directory. The default is ~/.cache'],
            [
              'MISE_ENV',
              'Select supported mise environment configuration layers during project detection',
            ],
          ],
        },
      ],
    },
    {
      id: 'daemon-service',
      heading: 'Running the daemon with systemd',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            'The daemon omgd is optional. Without it, the CLI falls back to direct package-manager queries. On Linux, a systemd user unit can keep it running across logins.',
          ],
        },
        {
          kind: 'steps',
          steps: [
            {
              text: 'Create ~/.config/systemd/user/omgd.service with ExecStart pointing at %h/.local/bin/omgd and Restart=on-failure.',
            },
            {
              text: 'Enable and start the unit.',
              command: 'systemctl --user enable omgd && systemctl --user start omgd',
            },
            { text: 'Check the result.', command: 'omg daemon-status' },
          ],
        },
        {
          kind: 'note',
          tone: 'info',
          text: 'There is no config switch to disable the daemon. Simply do not start omgd on machines where you do not want it.',
        },
      ],
    },
    {
      id: 'problems',
      heading: 'When configuration misbehaves',
      blocks: [
        {
          kind: 'table',
          title: 'Common configuration problems',
          columns: ['Symptom', 'Fix'],
          rows: [
            [
              'Config not loading',
              'Check the file path and TOML syntax, then run omg config validate',
            ],
            [
              'Permission denied',
              'Ensure the socket and data directories are writable by your user',
            ],
            [
              'Policy blocks installs',
              'Raise or lower minimum_grade, or adjust allow_aur and require_pgp',
            ],
            [
              'Runtime not found',
              'Use one of the documented native runtime names, such as node or python',
            ],
          ],
        },
        {
          kind: 'commands',
          title: 'Back up Linux or WSL configuration and reset',
          commands: [
            'mv ~/.config/omg/config.toml ~/.config/omg/config.toml.bak',
            'mv ~/.config/omg/policy.toml ~/.config/omg/policy.toml.bak',
            'omg config validate',
          ],
        },
        {
          kind: 'note',
          tone: 'warning',
          text: 'On macOS, configuration and runtime data share ~/Library/Application Support/omg. Moving that directory resets both. Back it up before making changes.',
        },
      ],
    },
  ],
};
