import type { LearningContent } from '../page';

export const content: LearningContent = {
  sections: [
    {
      id: 'case',
      heading: 'If mise already works for you, why try OMG?',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            'For runtime pins, environment variables, and project tasks, mise is hard to beat. It also installs host packages through bootstrap configuration. OMG has to offer more than another way to select Node.',
            'OMG earns its place when the host package is part of your daily work. Search your configured repositories, inspect a package and its dependencies, preview the transaction, then inspect recorded history and vulnerability findings without changing tools. On Arch, that same CLI also handles AUR builds through its own review and sandbox pipeline.',
            'That is a workflow difference, not a claim that OMG does everything mise does or that it wins a speed benchmark. Try these commands against the packages and projects you actually use.',
          ],
        },
      ],
    },
    {
      id: 'package-work',
      heading: 'Follow a package beyond installation',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            'mise lets you declare packages in [bootstrap.packages], preview an apply, and check whether the declared packages are present. OMG centers the package itself, including packages that were already installed outside a project config.',
          ],
        },
        {
          kind: 'commands',
          title: 'An OMG package investigation on a supported Linux system',
          commands: [
            'omg search ripgrep',
            'omg info ripgrep',
            'omg why ripgrep',
            'omg install ripgrep --dry-run',
            'omg history --search ripgrep',
            'omg audit scan',
          ],
        },
        {
          kind: 'paragraphs',
          paragraphs: [
            'Search and info use the selected OS package backend. The dry run shows a plan without installing. History records supported mutations; it does not retroactively record work done by other package managers. Audit scan checks installed packages against available advisory sources, so a clean result is not a guarantee that no vulnerability exists. Some releases require a running omgd daemon for this command.',
            'OMG can also write a CycloneDX system-package inventory with matched vulnerability findings. Availability depends on the release, backend, and advisory source. Check the security reference for the version you installed. This is system package evidence, not an application dependency graph.',
          ],
        },
      ],
    },
    {
      id: 'aur',
      heading: 'On Arch, the AUR path is materially different',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            'mise supports AUR packages in [bootstrap.packages], but its AUR manager calls an installed yay or paru. Its documentation says mise adds no independent trust or verification layer to that helper.',
            'OMG searches official repositories and the AUR together. For an AUR install, it reviews recipe and source metadata, builds as an unprivileged user inside Bubblewrap with network access off by default, and inspects the resulting archive. Archives with privileged content require attended approval that --yes cannot bypass. Some high-risk outputs are rebuilt and compared byte for byte before installation.',
            'These checks reduce specific risks; they cannot make a malicious recipe safe. They do mean the review and build boundary is part of OMG itself, rather than a property of whichever AUR helper you installed.',
          ],
        },
        {
          kind: 'commands',
          title: 'Preview an AUR install on Arch',
          commands: [
            'omg search visual-studio-code-bin',
            'omg install visual-studio-code-bin --dry-run',
          ],
        },
      ],
    },
    {
      id: 'comparison',
      heading: 'Pick the strength your setup needs',
      blocks: [
        {
          kind: 'table',
          title: 'What each product is built to do',
          columns: ['Your priority', 'Better fit and why'],
          rows: [
            [
              'Investigate and operate OS packages',
              'OMG: search, info, dependency questions, install plans, update, history, and vulnerability scans are direct CLI workflows on supported backends.',
            ],
            [
              'Declare a whole machine',
              'mise: bootstrap covers packages, services, files, repositories, dotfiles, and more. OMG environment capture and drift checks are narrower inventory workflows.',
            ],
            [
              'Handle AUR builds on Arch',
              'OMG: its own review, sandbox, archive inspection, and attended gates. mise delegates AUR installation to yay or paru.',
            ],
            [
              'Use many tool backends and advanced tasks',
              'mise: wider tool registry, plugins, lockfile support, and a deeper task system. OMG reads supported mise.toml pins, environment values, and tasks, but does not implement all mise behavior.',
            ],
            [
              'Work on native Windows',
              'mise: native Windows and PowerShell support. OMG runs on supported Linux distributions in WSL, not native Windows.',
            ],
          ],
        },
      ],
    },
    {
      id: 'try',
      heading: 'Give OMG one real package problem',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            'Keep mise in your project. Install OMG on a supported machine and use it to investigate a package you already depend on. Start with search, info, why, and a dry run. Those commands let you judge the package workflow before making a system change.',
            'If that workflow saves you trips between your runtime manager, package manager, and security tools, OMG has earned a place beside your existing setup. If your main need is reproducible machine bootstrap, native Windows, or the full mise task and plugin ecosystem, stay with mise.',
          ],
        },
        {
          kind: 'note',
          tone: 'info',
          text: 'OMG supports Arch, Debian, Ubuntu, and Apple Silicon macOS; Fedora package support is experimental. Security and environment commands vary by backend. Check the linked references for your platform before relying on them.',
        },
      ],
    },
  ],
  sources: [
    { title: 'OMG package and CLI reference', href: '/docs/cli/' },
    { title: 'OMG security model and SBOM limits', href: '/docs/security/' },
    { title: 'OMG architecture and AUR pipeline', href: '/docs/architecture/' },
    { title: 'OMG installation and platform matrix', href: '/docs/installation/' },
    { title: 'mise bootstrap packages', href: 'https://mise.jdx.dev/bootstrap/packages/' },
    { title: 'mise AUR manager', href: 'https://mise.jdx.dev/bootstrap/packages/aur.html' },
    { title: 'mise tasks', href: 'https://mise.jdx.dev/tasks/' },
  ],
  related: ['/compare/omg-vs-yay/', '/guides/reproducible-dev-environments/', '/docs/security/'],
};
