import type { LearningContent } from '../page';

export const content: LearningContent = {
  sections: [
    {
      id: 'summary',
      heading: 'Node.js shell integration and multi-language scope',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            'nvm (Node Version Manager) is a POSIX-compatible shell tool commonly sourced when a new shell starts. It can use .nvmrc when you invoke nvm use; automatic switching on directory changes requires extra shell integration.',
            'OMG is a multi-language version manager and system package tool written in Rust. Its shell hook checks project pins at the prompt and adjusts PATH for installed runtimes, including versions requested in .nvmrc or .node-version files. Startup and prompt cost depend on your shell and configuration.',
            'This comparison was reviewed against documented behavior. If you already use .nvmrc across your repositories, OMG can select those versions without requiring you to rewrite project configurations.',
          ],
        },
      ],
    },
    {
      id: 'differences',
      heading: 'Documented differences between OMG and nvm',
      blocks: [
        {
          kind: 'table',
          title: 'Documented differences between OMG and nvm',
          columns: ['Capability', 'OMG and nvm'],
          rows: [
            [
              'Shell startup mechanism',
              'OMG installs a shell hook that invokes its compiled binary to evaluate project pins at the prompt. nvm is sourced into the shell when the shell starts.',
            ],
            [
              'Language support',
              'OMG manages Node.js, Bun, Python, Go, Rust, and 9 other runtimes through one interface. nvm is strictly specialized to Node.js and its bundled npm.',
            ],
            [
              'Project version files',
              'Both tools support .nvmrc. OMG also checks .node-version, .tool-versions, and package.json.',
            ],
            [
              'System package management',
              'OMG installs and manages OS-level software packages through native backends. nvm does not manage system packages.',
            ],
            [
              'Shell compatibility',
              'OMG supports Bash, Zsh, and Fish on its supported Linux, macOS, and WSL targets. nvm supports POSIX shells including Bash, Zsh, sh, dash, and ksh; Fish requires third-party integration.',
            ],
          ],
        },
      ],
    },
    {
      id: 'choose',
      heading: 'When to choose OMG over nvm',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            'Choose OMG if you want project pin detection through its compiled shell hook, a single tool that manages Python, Go, and Rust alongside Node.js, or system package commands in the same CLI.',
            'Stay with nvm if your project relies on custom bash scripting that invokes nvm-specific internal functions, or if you exclusively write JavaScript and are satisfied with current terminal launch speed.',
          ],
        },
        {
          kind: 'note',
          tone: 'info',
          text: 'OMG does not overwrite or remove your nvm directory (~/.nvm). You can test OMG with your existing projects while leaving nvm installed.',
        },
      ],
    },
    {
      id: 'workflow',
      heading: 'Reusing your existing .nvmrc with OMG',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            'When entering a repository containing a .nvmrc file, OMG reads the pinned version and selects the matching runtime automatically.',
          ],
        },
        {
          kind: 'commands',
          title: 'Check Node version resolution from .nvmrc',
          commands: ['cat .nvmrc', 'omg which node', 'node --version'],
        },
      ],
    },
  ],
  sources: [
    { title: 'OMG Node.js guide', href: '/runtimes/node/' },
    { title: 'Migrate from nvm to OMG guide', href: '/guides/migrate-from-nvm/' },
    { title: 'nvm official repository', href: 'https://github.com/nvm-sh/nvm' },
  ],
  related: [
    '/guides/migrate-from-nvm/',
    '/guides/node-npm-pnpm/',
    '/runtimes/node/',
    '/compare/omg-vs-mise/',
  ],
};
