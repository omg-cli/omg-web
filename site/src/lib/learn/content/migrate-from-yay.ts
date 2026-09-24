import type { LearningContent } from '../page';

export const content: LearningContent = {
  sections: [
    {
      id: 'overview',
      heading: 'Migrating from yay to OMG on Arch Linux',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            'If you have been using yay as your primary pacman wrapper and AUR helper, OMG offers package commands alongside runtime management. On Arch, it uses `libalpm` and defaults to an unprivileged Bubblewrap build sandbox using Linux namespaces and mounts.',
            'OMG is not a 1:1 clone of every yay flag. Its default AUR build method uses Bubblewrap, and exceptional package permissions require attended confirmation. An unsafe native build method requires an explicit configuration change. Keep `pacman` and `yay` installed while validating your workflows.',
          ],
        },
      ],
    },
    {
      id: 'command-mapping',
      heading: 'Command mapping reference',
      blocks: [
        {
          kind: 'table',
          title: 'yay commands mapped to OMG equivalents',
          columns: ['yay command', 'OMG equivalent and behavior'],
          rows: [
            [
              'yay -Ss <query>',
              'omg search <query> (searches both official Arch repositories and the AUR; pass --no-aur for official only).',
            ],
            [
              'yay -Si <pkg>',
              'omg info <pkg> (displays comprehensive package and repository metadata).',
            ],
            [
              'yay -S <pkg>',
              'omg install <pkg> (resolves official packages and AUR recipes, presenting diff review and sandboxed build).',
            ],
            [
              'yay -S --noconfirm',
              'omg install -y (skips standard confirmation prompts, but preserves attended approval for privileged hooks).',
            ],
            [
              'yay -R <pkg>',
              'omg remove <pkg> (reviews removal plan and package reverse-dependencies before confirmation).',
            ],
            [
              'yay -Rns <pkg>',
              'omg remove --recursive <pkg> (removes target package and unneeded cascade dependencies).',
            ],
            [
              'yay -Syu',
              'omg update (synchronizes repositories and upgrades official packages and AUR software).',
            ],
            [
              'yay -Sua',
              'omg update --aur-only (upgrades installed AUR packages while leaving official packages untouched).',
            ],
            [
              'yay -Sy',
              'omg sync (refreshes repository sync databases without triggering an upgrade).',
            ],
            [
              'yay -Qu',
              'omg outdated (lists packages with newer versions available in repos or the AUR).',
            ],
            [
              'yay -Qe',
              'omg explicit (lists explicitly installed user packages without dependencies).',
            ],
            [
              'yay -Qtd',
              'omg clean --orphans --dry-run (previews orphan cleanup without removing packages). Use omg clean --orphans only when you intend to remove them.',
            ],
            [
              'yay -Sc',
              'omg clean --cache (cleans cached package archives and build directories).',
            ],
          ],
        },
      ],
    },
    {
      id: 'dry-run',
      heading: 'Previewing mutations safely with dry-run flags',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            'Before changing packages, use OMG’s dry-run and check flags to preview the proposed operation. A preview cannot predict every build-script effect or package-manager decision:',
          ],
        },
        {
          kind: 'commands',
          title: 'Preview package mutations',
          commands: [
            'omg install --dry-run <package>',
            'omg remove --dry-run <package>',
            'omg update --check',
            'omg clean --dry-run --all',
          ],
        },
      ],
    },
    {
      id: 'security-differences',
      heading: 'Key security and workflow differences',
      blocks: [
        {
          kind: 'steps',
          steps: [
            {
              text: 'Always run OMG as your regular unprivileged user account. sudo omg is deprecated; OMG elevates via sudo only for the validated package transaction.',
            },
            {
              text: 'By default, AUR builds execute inside an isolated Bubblewrap sandbox with read-only system mounts and no access to your home directory or SSH keys. Unsafe native builds are an explicit opt-in.',
            },
            {
              text: 'Packages containing install scripts (.INSTALL), setuid/setgid files, or Linux file capabilities trigger an attended confirmation gate that cannot be bypassed with -y.',
            },
            {
              text: 'Interactive number menus from yay are replaced with OMG’s arrow-key interactive package picker (running bare omg install).',
            },
          ],
        },
      ],
    },
    {
      id: 'beyond-packages',
      heading: 'What you gain beyond yay',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            'OMG also manages project runtimes and developer tools, runs supported project tasks, and captures package names and selected runtime versions in a file you can check for drift:',
          ],
        },
        {
          kind: 'commands',
          title: 'Unified development workflows',
          commands: [
            'omg use node 22',
            'omg tool install ripgrep',
            'omg tool install starship',
            'omg run test',
            'omg env capture',
            'omg env check',
          ],
        },
      ],
    },
  ],
  sources: [
    { title: 'OMG Arch Linux migration documentation', href: '/docs/workflows/' },
    { title: 'OMG security architecture and sandbox model', href: '/docs/security/' },
    { title: 'Arch Linux yay documentation', href: 'https://github.com/Jguer/yay' },
  ],
  related: [
    '/compare/omg-vs-yay/',
    '/guides/task-runner/',
    '/guides/reproducible-dev-environments/',
  ],
};
