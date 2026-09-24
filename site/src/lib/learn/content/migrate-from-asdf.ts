import type { LearningContent } from '../page';

export const content: LearningContent = {
  sections: [
    {
      id: 'decide',
      heading: 'Start with one project, not your whole asdf setup',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            "You have a project with .tool-versions and want to try OMG's package commands or task runner without losing a working asdf setup. Keep asdf installed while you test one runtime and one project task.",
            'Current asdf is a Go binary and still uses shims to select executables. OMG reads supported .tool-versions pins and adds its installed runtime directories to PATH through a shell hook. The two tools keep separate runtime installations.',
          ],
        },
        {
          kind: 'commands',
          title: 'Record what asdf selects in this project',
          commands: ['cat .tool-versions', 'asdf current', 'asdf which node'],
        },
        {
          kind: 'note',
          tone: 'info',
          text: 'Use asdf which node only if this project has a Node.js pin. Save the version and executable path so you can compare them after switching shells.',
        },
      ],
    },
    {
      id: 'install-runtime',
      heading: 'Install one pinned runtime with OMG',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            "For a project with one supported Node.js version in .tool-versions, omg use node reads the pin and installs or selects that version in OMG's own data directory. OMG recognizes the common asdf nodejs name as node. It does not reuse files in asdf's installs directory.",
          ],
        },
        {
          kind: 'commands',
          title: 'Check the pin and install the matching Node.js version',
          commands: ['omg which node', 'omg use node', 'omg list node'],
        },
        {
          kind: 'note',
          tone: 'warning',
          text: 'Review .tool-versions before going further. OMG reads the first version for each tool and supports its own runtime names, not every asdf plugin or multi-version request. omg which node shows the selected version, not an executable path.',
        },
      ],
    },
    {
      id: 'shell',
      heading: 'Check which Node.js your shell runs',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            "In a separate Bash session, activate OMG's hook and inspect the command path and version inside the project. The hook selects installed runtimes when you change directories. Use the shell integration guide for Zsh or Fish.",
          ],
        },
        {
          kind: 'commands',
          title: 'Activate OMG in a separate Bash session',
          commands: ['eval "$(omg hook bash)"'],
        },
        {
          kind: 'paragraphs',
          paragraphs: [
            'At the next shell prompt, check where node resolves and which version runs. The hook updates the path when Bash displays a prompt.',
          ],
        },
        {
          kind: 'commands',
          title: 'Compare the active Node.js command with your asdf baseline',
          commands: ['command -v node', 'node --version'],
        },
        {
          kind: 'paragraphs',
          paragraphs: [
            "If the version and path match the OMG installation you selected, run your project's usual tests. If you decide to keep OMG, remove the asdf shims directory from this shell's PATH setup and keep the OMG hook in the shell profile. Keep .tool-versions and the asdf installation until your projects pass their own checks.",
          ],
        },
      ],
    },
    {
      id: 'choose',
      heading: 'Keep asdf where its plugins matter',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            'asdf remains the better fit for a project that needs one of its plugins or shim behavior outside an interactive shell. OMG is useful when its supported runtimes can share a CLI with OS package commands and project tasks. The migration does not require changing .tool-versions, deleting asdf, or running omg migrate.',
            'Start with the OMG installation guide if you have not installed it. The runtime reference lists supported tools, and the installation guide explains the hook before you change your profile.',
          ],
        },
      ],
    },
  ],
  sources: [
    { title: 'Install OMG', href: '/docs/installation/' },
    { title: 'OMG runtimes', href: '/docs/runtimes/' },
    {
      title: 'asdf 0.16 migration and Go rewrite',
      href: 'https://asdf-vm.com/guide/upgrading-to-v0-16.html',
    },
    { title: 'asdf version and shim commands', href: 'https://asdf-vm.com/manage/versions.html' },
    { title: 'asdf getting started', href: 'https://asdf-vm.com/guide/getting-started.html' },
  ],
  related: [
    '/compare/omg-vs-asdf/',
    '/guides/migrate-from-nvm/',
    '/guides/reproducible-dev-environments/',
    '/runtimes/node/',
  ],
};
