import { SITE_ORIGIN } from '../../../../../shared/public-site';
import type { LearningContent } from '../page';

export const content: LearningContent = {
  sections: [
    {
      id: 'why-migrate',
      heading: 'How the shell integrations differ',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            'nvm is a shell tool commonly sourced during shell startup. Its nvm use command selects a version from .nvmrc; automatic switching on directory changes requires extra shell integration.',
            'OMG uses a compiled Rust binary (`src/runtimes/node.rs` and `src/hooks/mod.rs`) and a shell hook that evaluates project pins at the prompt, then adjusts PATH to the installed runtime. The actual shell cost depends on your configuration and machine.',
            'OMG reads existing `.nvmrc` files without changing them, so you can test one project before changing your established setup.',
          ],
        },
      ],
    },
    {
      id: 'command-mapping',
      heading: 'Command mapping from nvm to OMG',
      blocks: [
        {
          kind: 'table',
          title: 'Direct command equivalents',
          columns: ['nvm command', 'OMG equivalent and notes'],
          rows: [
            [
              'nvm install <version>',
              'omg use node <version> (downloads prebuilt binary, verifies SHA-256 in memory, extracts with pure-Rust tar.xz unpacker, and activates).',
            ],
            [
              'nvm install --lts',
              'omg use node lts (or omg use node lts/<codename> like lts/iron).',
            ],
            ['nvm use <version>', 'omg use node <version> (switches active version via symlink).'],
            [
              'nvm ls',
              'omg list node (displays installed Node.js versions and indicates active symlink).',
            ],
            [
              'nvm ls-remote',
              'omg list node --available (queries nodejs.org/dist/index.json in pure Rust).',
            ],
            [
              'nvm current',
              'omg which node (reports the selected version); use command -v node to see the executable path.',
            ],
          ],
        },
      ],
    },
    {
      id: 'step-by-step',
      heading: 'Safe, step-by-step migration process',
      blocks: [
        {
          kind: 'steps',
          steps: [
            {
              text: 'Audit your current Node.js setup and list globally installed packages.',
              command: 'node --version && which -a node && npm list -g --depth=0',
            },
            {
              text: 'Install OMG and enable shell integration for your shell (Bash, Zsh, or Fish).',
              command: `curl -fsSL ${SITE_ORIGIN}/install.sh | bash`,
            },
            {
              text: 'Install your desired Node.js version using OMG.',
              command: 'omg use node lts',
            },
            {
              text: 'Comment out the nvm sourcing lines in your ~/.bashrc or ~/.zshrc file.',
              command: '# source ~/.nvm/nvm.sh\n# [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"',
            },
            {
              text: 'Open a fresh terminal and verify the selected version and executable path.',
              command: 'node --version && omg which node && command -v node',
            },
          ],
        },
        {
          kind: 'paragraphs',
          paragraphs: [
            'Keep your `~/.nvm` directory while you test your local repositories. OMG reads existing `.nvmrc` files; check each project’s requested version, installed runtime, and command path before removing your nvm shell setup.',
          ],
        },
      ],
    },
    {
      id: 'beyond-node',
      heading: 'What you gain beyond Node.js',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            'While nvm only manages Node.js, OMG is a polyglot manager. You can use the exact same CLI syntax and fast shell hook for 14 runtimes (Python, Go, Rust, Bun, Deno, Ruby, Java, PHP, Swift, Zig, .NET), 54 curated developer CLI tools (`ripgrep`, `starship`, `fzf`, `bat`, `eza`), and native system packages across Linux and macOS.',
          ],
        },
        {
          kind: 'commands',
          title: 'Explore polyglot management with OMG',
          commands: [
            'omg use go 1.24',
            'omg use rust stable',
            'omg tool install ripgrep',
            'omg run build',
          ],
        },
      ],
    },
  ],
  sources: [
    { title: 'OMG Node.js manager (src/runtimes/node.rs)', href: '/docs/runtimes/' },
    { title: 'OMG shell hook architecture (src/hooks/mod.rs)', href: '/docs/architecture/' },
    { title: 'nvm project documentation', href: 'https://github.com/nvm-sh/nvm' },
  ],
  related: ['/runtimes/node/', '/compare/omg-vs-nvm/', '/guides/node-npm-pnpm/'],
};
