import type { LearningContent } from '../page';

export const content: LearningContent = {
  sections: [
    {
      id: 'boundaries',
      heading: 'Toolchain responsibilities and boundaries',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            'Maintaining clean developer environments requires clear boundaries between runtime orchestration and project dependency management. Mixing these responsibilities leads to lockfile corruption and unexpected executable resolution.',
          ],
        },
        {
          kind: 'table',
          title: 'Layer responsibilities in the Node.js ecosystem',
          columns: ['Layer', 'Responsibility'],
          rows: [
            [
              'OMG',
              'Downloads, validates, and activates the Node.js runtime and its bundled npm/npx executables on PATH. Auto-switches versions based on project pins (.node-version, .nvmrc, package.json).',
            ],
            [
              'npm',
              'Resolves JavaScript/TypeScript dependencies, creates node_modules, and maintains package-lock.json for npm-based repositories.',
            ],
            [
              'pnpm',
              'Manages content-addressable dependencies, hard links, and maintains pnpm-lock.yaml for pnpm-based repositories.',
            ],
            [
              'OMG Task Runner',
              'Auto-discovers and runs tasks declared in package.json (omg run <task>) across ecosystems with priority 90, passing arbitrary arguments directly.',
            ],
          ],
        },
      ],
    },
    {
      id: 'working-with-npm',
      heading: 'Working with an existing npm project',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            'When entering an npm project, OMG’s shell hook activates the Node.js version pinned in `.node-version` or `.nvmrc`. To ensure repeatable builds from your committed `package-lock.json`, use `npm ci` rather than `npm install`.',
          ],
        },
        {
          kind: 'commands',
          title: 'Verify environment and install with npm ci',
          commands: ['omg which node', 'node --version', 'npm --version', 'npm ci', 'omg run test'],
        },
      ],
    },
    {
      id: 'working-with-pnpm',
      heading: 'Working with an existing pnpm project',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            'pnpm uses its own global store and hard-link layout. When using OMG to provide the base Node.js interpreter for pnpm, ensure your frozen lockfile checks match the project requirements.',
          ],
        },
        {
          kind: 'commands',
          title: 'Verify environment and install with pnpm',
          commands: [
            'node --version',
            'pnpm --version',
            'pnpm install --frozen-lockfile',
            'omg run build',
          ],
        },
        {
          kind: 'note',
          tone: 'info',
          text: 'OMG’s task runner selects npm, pnpm, Yarn, or Bun from package.json packageManager or recognized lockfiles. The published CLI recognizes bun.lockb, but not Bun’s newer bun.lock; set packageManager to bun in package.json for a bun.lock project. Deno tasks are read from deno.json.',
        },
      ],
    },
    {
      id: 'task-runner',
      heading: 'Cross-ecosystem task execution with OMG run',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            'In `src/core/task_runner.rs`, OMG inspects `package.json` `scripts` and executes them directly. You do not need to remember whether a repository uses `npm run`, `pnpm run`, or `bun run`: `omg run` detects the appropriate runner automatically.',
          ],
        },
        {
          kind: 'commands',
          title: 'Execute project scripts through OMG',
          commands: ['omg run dev', 'omg run build', 'omg run test -- --watch'],
        },
      ],
    },
  ],
  sources: [
    { title: 'OMG runtime handbook', href: '/docs/runtimes/' },
    { title: 'pnpm installation', href: 'https://pnpm.io/installation' },
    { title: 'OMG polyglot task runner (src/core/task_runner.rs)', href: '/guides/task-runner/' },
    { title: 'npm ci command documentation', href: 'https://docs.npmjs.com/cli/commands/npm-ci' },
    {
      title: 'Bun lockfile documentation',
      href: 'https://github.com/oven-sh/bun/blob/main/docs/pm/lockfile.mdx',
    },
  ],
  related: ['/runtimes/node/', '/guides/migrate-from-nvm/', '/compare/omg-vs-mise/'],
};
