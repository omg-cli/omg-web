import type { LearningContent } from '../page';

export const content: LearningContent = {
  sections: [
    {
      id: 'install',
      heading: 'Pure Rust Node.js installation without external processes',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            'Unlike shell wrappers that spawn curl, tar, and xz subprocesses, OMG manages Node.js entirely in compiled Rust (`src/runtimes/node.rs`). It queries the official index at `nodejs.org/dist/index.json`, downloads release archives directly over HTTPS, and parses `SHASUMS256.txt` to verify the archive hash in memory before extraction.',
            'Extraction is handled by OMG’s pure-Rust `.tar.xz` streaming unpacker (`extract_tar_xz`) into an isolated temporary directory. Once the regular file at `bin/node` is verified, the installation is published atomically to `~/.local/share/omg/versions/node/<version>`.',
          ],
        },
        {
          kind: 'commands',
          title: 'Install Node.js releases and aliases',
          commands: [
            'omg use node lts',
            'omg use node lts/iron',
            'omg use node 22',
            'omg list node',
            'omg which node',
          ],
        },
        {
          kind: 'paragraphs',
          paragraphs: [
            'OMG resolves aliases deterministically: `lts` maps to the current active LTS release from `index.json`, `lts/<codename>` (e.g. `lts/iron` or `lts/jod`) maps to that named release, and partial version numbers like `20` or `20.1` resolve to the newest matching release.',
            'Published OMG releases target Linux x86_64 and Apple Silicon macOS. On Windows, run OMG inside WSL; Intel macOS and Linux ARM64 are not published release targets.',
          ],
        },
      ],
    },
    {
      id: 'version-files',
      heading: 'Project version pin resolution order',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            'When you enter a project directory, OMG’s compiled shell hook (`src/hooks/mod.rs`) walks upward through the directory tree. The nearest directory with a Node.js pin wins. Within one directory, it checks these sources in order:',
          ],
        },
        {
          kind: 'steps',
          steps: [
            {
              text: 'Explicit `.node-version` file in the project directory or any parent directory.',
            },
            {
              text: 'Legacy `.nvmrc` file (reused directly without configuration translation).',
            },
            {
              text: 'Multi-runtime `.tool-versions` file (asdf and mise compatibility).',
            },
            {
              text: '`package.json` engines (`engines.node`) or Volta pin (`volta.node`).',
            },
          ],
        },
        {
          kind: 'commands',
          title: 'Verify active Node.js and npm path in your shell',
          commands: ['omg which node', 'which -a node', 'node --version', 'npm --version'],
        },
      ],
    },
    {
      id: 'npm-boundary',
      heading: 'Runtime ownership vs package management',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            'OMG manages the Node.js executable and the `npm` and `npx` binaries bundled with that release. It activates them by symlinking the selected version to `~/.local/share/omg/versions/node/current/bin` and prepending that directory to your PATH.',
            'OMG does not intercept or wrap `npm install` or `pnpm install`. Dependency resolution, `node_modules`, and lockfiles (`package-lock.json`, `pnpm-lock.yaml`) remain strictly under the control of their respective package managers.',
          ],
        },
        {
          kind: 'note',
          tone: 'info',
          text: 'To run project tasks defined in package.json without switching tools, use OMG’s native task runner: omg run <script> (e.g. omg run build, omg run test).',
        },
      ],
    },
    {
      id: 'troubleshooting',
      heading: 'Diagnosing PATH precedence and conflicting shims',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            'A previously activated nvm, system installation, or another version manager can appear earlier in PATH. Review the shell profile and enable only the manager intended for this project. Keep the old installation until the new workflow works.',
            'OMG is approaching beta. These instructions are reviewed against the linked source documentation, not a claim of execution on every supported platform. Consult the runtime handbook for verification, storage, and version-file details.',
          ],
        },
        {
          kind: 'commands',
          title: 'Inspect shell runtime resolution',
          commands: ['omg which node', 'which -a node', 'which -a npm'],
        },
      ],
    },
  ],
  sources: [
    { title: 'OMG runtime implementation (src/runtimes/node.rs)', href: '/docs/runtimes/' },
    { title: 'OMG shell hook resolution (src/hooks/mod.rs)', href: '/docs/architecture/' },
    { title: 'Node.js official release distribution', href: 'https://nodejs.org/dist/' },
  ],
  related: [
    '/guides/node-npm-pnpm/',
    '/guides/migrate-from-nvm/',
    '/compare/omg-vs-nvm/',
    '/compare/omg-vs-volta/',
  ],
};
