import type { LearningContent } from '../page';

export const content: LearningContent = {
  sections: [
    {
      id: 'decision',
      heading: 'A migration decision for an existing Volta project',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            'Volta’s maintainers say the project is unmaintained. They also say there is no urgent reason to leave a setup that still works. If you are reviewing alternatives, start with one project and keep Volta installed while you test.',
            'OMG reads the Node.js version in package.json’s volta.node field. On a supported system, it can select that Node.js version while also giving you OS package commands, other language runtimes, and project tasks in one CLI. That overlap does not make OMG a drop-in replacement for every part of a Volta toolchain.',
          ],
        },
      ],
    },
    {
      id: 'differences',
      heading: 'What carries over, and what does not',
      blocks: [
        {
          kind: 'table',
          title: 'Check these differences before moving a project',
          columns: ['Need', 'What the tools do'],
          rows: [
            [
              'A Node.js pin in package.json',
              'Volta writes its project Node.js pin to volta.node. OMG reads that field when a higher-priority Node.js pin is absent. In the same package.json, engines.node takes priority over volta.node for OMG.',
            ],
            [
              'Pinned JavaScript package managers and global tools',
              'Volta pins npm or Yarn versions for a project and binds installed global JavaScript tools to a Node.js engine. OMG selects the Node.js runtime but does not recreate those Volta package-manager or global-tool guarantees.',
            ],
            [
              'System packages and other runtimes',
              'OMG provides OS package commands and manages supported runtimes including Python, Go, and Rust. Volta concentrates on JavaScript toolchains.',
            ],
            [
              'Native Windows',
              'Volta supports native Windows. OMG’s published binaries target supported Linux distributions and Apple Silicon macOS; Windows users run OMG inside a supported WSL guest.',
            ],
            [
              'Speed',
              'Volta routes commands through compiled shims; OMG’s shell hook selects runtime directories on PATH. We have no matched Volta-versus-OMG benchmark, so this page makes no speed ranking.',
            ],
          ],
        },
      ],
    },
    {
      id: 'try',
      heading: 'Try OMG against one Volta-pinned project',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            'First inspect package.json and record what Volta runs. In a separate shell with the OMG hook enabled, check which version OMG resolves before installing it. Keep the project’s tests and package-manager lockfile as the acceptance check.',
          ],
        },
        {
          kind: 'commands',
          title: 'Compare the selected Node.js runtime',
          commands: [
            'volta which node',
            'volta list node',
            'omg which node',
            'omg use node',
            'command -v node',
            'node --version',
          ],
        },
        {
          kind: 'note',
          tone: 'info',
          text: 'omg which node reports the selected version, not an executable path. omg use node may download that version. If package.json also has engines.node, OMG uses that value before volta.node; check the result rather than assuming the tools selected the same version.',
        },
      ],
    },
    {
      id: 'choose',
      heading: 'Choose based on the work your project actually needs',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            'Choose OMG when your supported Linux, WSL, or Apple Silicon macOS workflow needs OS packages, Node.js and other runtimes, and project tasks under one command. On Arch, Debian, and Ubuntu, its environment capture and check commands can also report package and runtime drift; they do not recreate an identical machine.',
            'Keep Volta where native Windows, per-project npm or Yarn pins, or stable global JavaScript-tool engines are essential. Its maintainers recommend mise as a migration option too. Compare those capabilities before removing a working installation.',
            'To evaluate OMG, install it using the platform guide, try one project, then run that project’s normal tests. You do not need to remove Volta or change package.json to find out whether OMG fits.',
          ],
        },
      ],
    },
  ],
  sources: [
    { title: 'Volta project maintenance notice', href: 'https://github.com/volta-cli/volta' },
    {
      title: 'Volta project pins and global tools',
      href: 'https://docs.volta.sh/guide/understanding',
    },
    {
      title: 'Volta installation and Windows support',
      href: 'https://docs.volta.sh/guide/getting-started',
    },
    {
      title: 'OMG package.json version detection in the v0.1.223 release',
      href: 'https://github.com/omg-cli/omg/blob/v0.1.223/src/hooks/mod.rs',
    },
    { title: 'OMG installation and platforms', href: '/docs/installation/' },
    { title: 'OMG runtime behavior', href: '/docs/runtimes/' },
  ],
  related: ['/runtimes/node/', '/compare/omg-vs-nvm/', '/compare/omg-vs-mise/'],
};
