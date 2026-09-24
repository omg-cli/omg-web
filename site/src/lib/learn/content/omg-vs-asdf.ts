import type { LearningContent } from '../page';

export const content: LearningContent = {
  sections: [
    {
      id: 'summary',
      heading: 'Start with architecture: direct PATH vs shell shims',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            'asdf selects installed tool versions through shims on PATH. Current asdf is a Go binary and still uses shims to route commands to the selected version.',
            'OMG is written in Rust and uses a shell hook to add installed runtime directories directly to PATH. It also offers native system package commands and environment inventory checks.',
            'This comparison was reviewed against documented behavior. Validate the commands and platform support your team requires before migrating your toolchain.',
          ],
        },
      ],
    },
    {
      id: 'differences',
      heading: 'Documented behavior and tradeoffs',
      blocks: [
        {
          kind: 'table',
          title: 'Documented behavior and tradeoffs',
          columns: ['Area', 'OMG and asdf'],
          rows: [
            [
              'Execution architecture',
              'OMG adds selected runtime directories to PATH at prompt evaluation. asdf places shims on PATH; those shims select versions from the current project configuration when a tool runs.',
            ],
            [
              'System package operations',
              'OMG integrates native system package management (pacman, apt, dnf, brew) alongside language runtimes. asdf is dedicated strictly to runtime versions and plugins.',
            ],
            [
              'Project version files',
              'OMG natively checks .tool-versions alongside idiomatic files like .nvmrc, .node-version, and .python-version. asdf defaults to .tool-versions with legacy-file opt-in.',
            ],
            [
              'Implementation and performance',
              'OMG implements its hook in Rust without runtime shims. asdf was rewritten from Bash to Go in v0.16 and still uses shims. Compare measured startup, prompt, and command times on your own setup if performance is important.',
            ],
            [
              'Environment workflows',
              'OMG provides environment inventory capture and drift checks on Arch and Debian/Ubuntu (omg env capture/check), plus Gist lockfile sharing (omg env share/sync). asdf focuses on tool version selection rather than system package inventory.',
            ],
            [
              'Platform support',
              'OMG targets Linux (Arch, Debian, Ubuntu, Fedora) and Apple Silicon macOS, with Windows supported through WSL. asdf supports POSIX shells on Linux and macOS.',
            ],
          ],
        },
      ],
    },
    {
      id: 'choose',
      heading: 'When each tool fits your workflow',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            'Evaluate OMG when you want one CLI for system packages and language runtimes, direct PATH selection through a shell hook, or environment inventory checks across a team.',
            'Evaluate asdf when your project depends on niche community plugins that do not have native OMG support, or when your existing CI/CD pipelines are tightly integrated with asdf action steps.',
            'Because OMG recognizes .tool-versions files, teams can test OMG locally without requiring team members to rewrite their existing version configuration.',
          ],
        },
      ],
    },
    {
      id: 'migration',
      heading: 'Reusing your existing .tool-versions',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            'You do not need to delete asdf to evaluate OMG. OMG reads existing .tool-versions files in your repositories. When enabled in your shell profile, OMG resolves Node.js, Python, Go, and Rust versions specified in that file.',
            'Keep your asdf installation intact while verifying that your build and test scripts execute cleanly with OMG-managed runtimes.',
          ],
        },
        {
          kind: 'commands',
          title: 'Inspect runtime resolution in a project with .tool-versions',
          commands: ['cat .tool-versions', 'omg list', 'omg which node'],
        },
      ],
    },
  ],
  sources: [
    { title: 'OMG runtime handbook', href: '/docs/runtimes/' },
    { title: 'OMG architecture and daemon model', href: '/docs/architecture/' },
    { title: 'asdf official documentation', href: 'https://asdf-vm.com/' },
    { title: 'asdf plugins repository', href: 'https://github.com/asdf-vm/asdf-plugins' },
  ],
  related: [
    '/compare/omg-vs-mise/',
    '/guides/migrate-from-asdf/',
    '/runtimes/node/',
    '/runtimes/python/',
  ],
};
