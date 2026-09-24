import type { LearningContent } from '../page';

export const content: LearningContent = {
  sections: [
    {
      id: 'summary',
      heading: 'Architecture and security models',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            'yay is an Arch User Repository (AUR) helper written in Go. It uses ALPM bindings for package information and invokes `pacman` and `makepkg` for package transactions and community builds.',
            'OMG is a systems and developer tool written in Rust. On Arch Linux, it connects to `libalpm` for package queries, parses `PKGBUILD` metadata in Rust, and builds AUR packages inside an unprivileged Bubblewrap (`bwrap`) sandbox by default. Users can explicitly opt into unsafe native builds.',
            'While yay is strictly an Arch Linux package and AUR tool, OMG spans system packages (Arch ALPM, Debian/Ubuntu APT, Fedora DNF, and macOS Homebrew), 14 language runtimes, 54 developer CLI tools, and a polyglot task runner.',
          ],
        },
      ],
    },
    {
      id: 'comparison',
      heading: 'Direct technical comparison',
      blocks: [
        {
          kind: 'table',
          title: 'Architectural and security comparison',
          columns: ['Dimension', 'OMG and yay'],
          rows: [
            [
              'ALPM database integration',
              'OMG uses `libalpm` through Rust bindings for package database operations. yay also uses ALPM bindings and invokes pacman for package transactions. Compare equivalent operations on your system before drawing speed conclusions.',
            ],
            [
              'PKGBUILD metadata parsing',
              'OMG parses selected PKGBUILD metadata in Rust (`src/package_managers/pkgbuild.rs`) with a 1MB input limit and `O_NOFOLLOW` protection. Both tools still run AUR build scripts through makepkg; review those scripts before installing.',
            ],
            [
              'AUR build sandboxing',
              'OMG defaults to a Bubblewrap build sandbox (`bwrap --clearenv --unshare-pid --new-session --die-with-parent`) with read-only system mounts and isolated writable build directories (`src/package_managers/aur/client.rs`). Unsafe native builds require an explicit configuration change. yay invokes makepkg without this OMG sandbox.',
            ],
            [
              'Privilege separation',
              'OMG performs fetching, review, and building completely unprivileged, elevating via sudo only for the sealed package transaction. Sudo OMG is deprecated. yay prompts for sudo when makepkg requires dependency installation.',
            ],
            [
              'Attended security gates',
              'OMG halts for explicit attended confirmation if an archive contains install hooks, setuid/setgid files, or Linux file capabilities; `-y` does not bypass these checks. yay has no equivalent install hook analysis.',
            ],
            [
              'Build caching',
              'OMG maintains a hash-indexed build cache to avoid rebuilding unchanged AUR recipes across updates. yay stores sources in ~/.cache/yay but rebuilds when prompted.',
            ],
            [
              'Cross-platform and polyglot',
              'OMG also manages language runtimes (Node, Python, Go, Rust, etc.), 54 developer tools, and polyglot tasks on Arch, Debian, Ubuntu, Fedora, and macOS. yay is exclusive to Arch Linux.',
            ],
          ],
        },
      ],
    },
    {
      id: 'aur-sandbox',
      heading: 'How OMG’s Bubblewrap sandbox secures AUR builds',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            'Because AUR packages are user-submitted scripts, executing `PKGBUILD` files with full access to your home directory presents serious security risks. A rogue or compromised `prepare()` or `build()` script could read SSH keys, access cloud credentials, or modify user shell configurations.',
            'With the default Bubblewrap build method, `src/package_managers/aur/client.rs` configures an unprivileged Linux sandbox:',
          ],
        },
        {
          kind: 'steps',
          steps: [
            {
              text: 'Pre-flight dependency resolution: official repository dependencies are resolved and installed before entering the sandbox.',
            },
            {
              text: 'Read-only root binds: /usr, /etc, /lib, and /lib64 are mounted read-only inside the container.',
            },
            {
              text: 'Isolated filesystem: the build process has no access to your $HOME directory, SSH keys, or personal files; only the build staging directory and /tmp are writable.',
            },
            {
              text: 'Process isolation: --clearenv strips environment variables, --unshare-pid isolates process namespaces, and --die-with-parent ensures child processes terminate with the build.',
            },
            {
              text: 'Privilege isolation: the untrusted build process receives no sudo-capable TTY and cannot elevate privileges.',
            },
          ],
        },
      ],
    },
    {
      id: 'choosing',
      heading: 'When to choose OMG or yay',
      blocks: [
        {
          kind: 'bullets',
          items: [
            'Choose OMG if you want its default Bubblewrap AUR build isolation from your home directory and SSH keys.',
            'Choose OMG if you want a single unified tool that manages Arch packages, AUR software, language runtimes (Node, Python, Go, Rust), and developer CLI tools (`ripgrep`, `starship`, `fzf`).',
            'Choose OMG if you use its package and runtime commands on multiple supported Linux distributions. Check backend support for each workflow; environment capture currently requires Arch or Debian/Ubuntu.',
            'Choose yay if you rely on yay-specific interactive number-key selection menus or need to download unbuilt PKGBUILD trees via `yay -G`.',
          ],
        },
      ],
    },
  ],
  sources: [
    {
      title: 'OMG Arch Linux AUR client (src/package_managers/aur/client.rs)',
      href: '/docs/security/',
    },
    {
      title: 'OMG PKGBUILD parser (src/package_managers/pkgbuild.rs)',
      href: '/docs/architecture/',
    },
    {
      title: 'Arch Linux PKGBUILD specification',
      href: 'https://man.archlinux.org/man/PKGBUILD.5',
    },
    { title: 'Bubblewrap sandbox documentation', href: 'https://github.com/containers/bubblewrap' },
    { title: 'yay manual', href: 'https://github.com/Jguer/yay/blob/next/doc/yay.8' },
  ],
  related: ['/guides/migrate-from-yay/', '/compare/omg-vs-mise/', '/docs/security/'],
};
