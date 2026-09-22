/**
 * Curated installation handbook. Reviewed against the omg-cli/omg implementation
 * and docs/installation.md at the commit recorded in the topic registry.
 */
import { SITE_ORIGIN } from '../../../../../shared/public-site';
import type { DocsTopic } from '../topic';
import { docsTopicMeta } from '../topics';

export const installationTopic: DocsTopic = {
  ...docsTopicMeta('installation'),
  sections: [
    {
      id: 'installer',
      heading: 'Install with the universal installer',
      blocks: [
        {
          kind: 'diagram',
          diagram: {
            title: 'What the installer checks',
            caption:
              'Two independent gates run before anything is copied into your home folder. A failed gate stops the install.',
            nodes: [
              {
                id: 'download',
                label: 'Download the script',
                detail: 'curl to omg-install.sh',
                tone: 'signal',
              },
              { id: 'inspect', label: 'Read it with less', detail: 'you decide to run it' },
              { id: 'check-archive', label: 'Check the archive', detail: 'published sha256' },
              { id: 'provenance', label: 'Verify build proof', detail: 'gh attestation verify' },
              { id: 'install', label: 'Install the binaries', detail: 'into ~/.local/bin' },
              { id: 'path', label: 'Add the folder to PATH' },
              {
                id: 'stop',
                label: 'Stop and report',
                detail: 'do not disable the check',
                tone: 'danger',
              },
            ],
            edges: [
              { from: 'download', to: 'inspect' },
              { from: 'inspect', to: 'check-archive' },
              { from: 'check-archive', to: 'provenance' },
              { from: 'provenance', to: 'install' },
              { from: 'install', to: 'path' },
              { from: 'check-archive', to: 'stop', label: 'mismatch', dashed: true },
              { from: 'provenance', to: 'stop', label: 'failed', dashed: true },
            ],
          },
        },
        {
          kind: 'paragraphs',
          paragraphs: [
            'The universal installer detects your operating system and package backend, downloads the matching release binaries, and installs them to ~/.local/bin. It requires the GitHub CLI (gh) to verify the release attestation. Download the script, review it, then run it.',
          ],
        },
        {
          kind: 'commands',
          title: 'Linux and macOS, including WSL',
          commands: [
            `curl -fsSL ${SITE_ORIGIN}/install.sh -o omg-install.sh`,
            'less omg-install.sh && bash omg-install.sh',
          ],
        },
        {
          kind: 'note',
          tone: 'info',
          text: 'Native Windows is not supported. Run the same installer inside WSL2 on Arch, Debian 12, Ubuntu 24.04, or Fedora, and OMG will use the package backend of that Linux guest. Debian 13 and Ubuntu 26.04 need an APT 7 release archive that v0.1.223 does not publish.',
        },
      ],
    },
    {
      id: 'platforms',
      heading: 'Platform packages',
      blocks: [
        {
          kind: 'table',
          title: 'Supported platforms and install methods',
          columns: ['Platform', 'Install method'],
          rows: [
            ['Arch Linux', 'Universal installer or a matching GitHub release archive'],
            [
              'Debian 12 and Ubuntu 24.04',
              'Universal installer, or download a release tarball and copy the binary to /usr/local/bin',
            ],
            ['Fedora', 'Universal installer or a matching Fedora release archive'],
            ['macOS', 'Universal installer. Homebrew packaging is not available yet'],
            [
              'Windows',
              'WSL2 on Arch, Debian 12, Ubuntu 24.04, or Fedora, using the universal installer inside the distribution',
            ],
          ],
        },
        {
          kind: 'paragraphs',
          paragraphs: [
            'Release binaries support x86_64 Linux and Apple Silicon macOS. Linux archives are backend-specific for Arch, Debian/Ubuntu, and Fedora. Intel macOS, Linux ARM64, 32-bit x86, ARMv7 release installs, and native Windows are unsupported. The installer maps RHEL/CentOS-family identification to the Fedora artifact as a best-effort fallback, but Fedora evidence does not establish RHEL compatibility. The supported installation channels are the universal installer and GitHub release downloads.',
            'Debian 12 and Ubuntu 24.04 use the APT 6 archives. Debian 13 and Ubuntu 26.04 need APT 7 binaries. The newer installer selects a `debian-trixie` release pair for those hosts, but v0.1.223 does not publish that pair, so installation cannot complete there until a compatible release is available.',
          ],
        },
        {
          kind: 'table',
          title: 'Backend and feature matrix',
          columns: ['Backend', 'What it means'],
          rows: [
            ['Arch (`arch`)', 'libalpm plus AUR workflows; the default source-build feature set'],
            [
              'Debian/Ubuntu (`debian`)',
              'Native APT operations; source builds need libapt-pkg-dev and native build headers',
            ],
            [
              'Fedora (`fedora`)',
              'DNF/RPM operations; source builds use the pure-Rust RPM database path',
            ],
            [
              'Apple Silicon macOS (`macos`)',
              'Homebrew package operations; published macOS binaries are ARM64',
            ],
            [
              'Debian index/test (`debian-pure`)',
              'Pure-Rust index fixtures only; refuses live package mutations',
            ],
            [
              'Windows',
              'No native backend or binary; install inside WSL and use the guest distribution backend',
            ],
          ],
        },
      ],
    },
    {
      id: 'setup',
      heading: 'Shell integration and first checks',
      blocks: [
        {
          kind: 'steps',
          steps: [
            {
              text: 'Enable the shell hook so runtime versions switch when you change directories.',
              command: 'echo \'eval "$(omg hook bash)"\' >> ~/.bashrc',
            },
            {
              text: 'For Zsh, add the same hook to ~/.zshrc. For Fish, add omg hook fish | source to ~/.config/fish/config.fish.',
            },
            { text: 'Verify the installation.', command: 'omg --version && omg doctor' },
            {
              text: 'Optionally install completions for your shell.',
              command: 'omg completions zsh',
            },
          ],
        },
        {
          kind: 'note',
          tone: 'info',
          text: 'omg doctor checks connectivity, required tools, package-backend health, the daemon, PATH, and the shell hook. Add --network to test mirrors. Add --eol to find end-of-life runtimes.',
        },
      ],
    },
    {
      id: 'options',
      heading: 'Installer options',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            'The installer reads environment variables. Put them on the bash side of the pipe, not in front of curl, so they reach the installer process.',
          ],
        },
        {
          kind: 'table',
          title: 'Installer environment variables',
          columns: ['Variable', 'Effect'],
          rows: [
            ['OMG_NO_TELEMETRY=1', 'Skip the telemetry consent prompt and keep telemetry disabled'],
            ['OMG_SKIP_SHELL=1', 'Skip shell integration setup'],
            ['OMG_VERSION=v0.1.223', 'Install a specific release'],
            ['INSTALL_DIR=~/.omg/bin', 'Install to a custom directory'],
          ],
        },
        {
          kind: 'commands',
          title: 'Combine options in one command',
          commands: [
            `curl -fsSL ${SITE_ORIGIN}/install.sh | OMG_NO_TELEMETRY=1 OMG_SKIP_SHELL=1 bash`,
          ],
        },
      ],
    },
    {
      id: 'updating',
      heading: 'Updating and uninstalling',
      blocks: [
        {
          kind: 'commands',
          title: 'Update OMG itself',
          commands: ['omg self-update'],
        },
        {
          kind: 'paragraphs',
          paragraphs: [
            'omg self-update verifies and stages the matching omg and omgd binaries before replacing either one. Each replacement is atomic, and a failure restores the prior files. Restart a running daemon afterward so it loads the new code. You can also obtain a release through the universal installer or GitHub releases.',
          ],
        },
        {
          kind: 'commands',
          title: 'Remove a script installation',
          commands: [
            `curl -fsSL ${SITE_ORIGIN}/install.sh -o omg-install.sh`,
            'less omg-install.sh && bash omg-install.sh --uninstall',
          ],
        },
        {
          kind: 'note',
          tone: 'warning',
          text: 'The installer backs up shell files it changes as <file>.omg-backup and leaves configuration and caches in place. On Linux and WSL, removing ~/.local/share/omg or ~/.config/omg deletes installed runtimes, tools, history, policy, and settings. On macOS, data and configuration default to ~/Library/Application Support/omg. Back up state before deleting it.',
        },
      ],
    },
    {
      id: 'source-builds',
      heading: 'Build from source',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            'Source builds use the Rust toolchain pinned by the repository. Select exactly one package backend with `--no-default-features`; feature names are additive. A source build is not the same trust path as a release archive and should come from a reviewed checkout.',
          ],
        },
        {
          kind: 'commands',
          title: 'Backend-specific builds',
          commands: [
            'cargo build --release --locked --no-default-features --features arch,pgp,license',
            'cargo build --release --locked --no-default-features --features debian,pgp,license',
            'cargo build --release --locked --no-default-features --features fedora,pgp,license',
            'cargo build --release --locked --no-default-features --features macos,pgp,license',
            'cargo build --release --locked --no-default-features --features debian-pure,pgp,license',
          ],
        },
        {
          kind: 'note',
          tone: 'warning',
          text: 'The optional license feature gates only `omg account`. It is not a local paywall. The `debian-pure` feature is for indexing and test fixtures and refuses live Debian or Ubuntu mutations. Native Windows has no Cargo backend feature.',
        },
      ],
    },
    {
      id: 'daemon',
      heading: 'Daemon and release pairing',
      blocks: [
        {
          kind: 'commands',
          title: 'Check and start the daemon',
          commands: ['omg daemon-status', 'omg daemon --foreground', 'omg daemon'],
        },
        {
          kind: 'paragraphs',
          paragraphs: [
            'Release archives pair `omg` with `omgd` on supported Linux and macOS targets. Restart a running daemon after `omg self-update` so it loads the new binary. Package queries and vulnerability scans can use direct backends when the daemon is unavailable. Metrics still need the daemon; SOC 2 export can scan directly on Unix.',
          ],
        },
      ],
    },
    {
      id: 'path-problems',
      heading: 'If the command is not found',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            'The installer places the binary in ~/.local/bin. If that directory is missing from PATH, add it and restart the shell. If the binary exists but will not run, restore its execute permission.',
          ],
        },
        {
          kind: 'commands',
          title: 'Fix PATH and permissions',
          commands: [
            'echo \'export PATH="$HOME/.local/bin:$PATH"\' >> ~/.bashrc',
            'chmod +x ~/.local/bin/omg',
          ],
        },
        {
          kind: 'paragraphs',
          paragraphs: [
            'For CI pipelines, install OMG in a setup step, add ~/.local/bin to PATH, then select the runtime your build needs, for example omg use node 20 followed by omg run build.',
          ],
        },
      ],
    },
  ],
};
