import type { LearningContent } from '../page';

export const content: LearningContent = {
  sections: [
    {
      id: 'install',
      heading: 'Pure Rust Bun installation from verified GitHub releases',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            'OMG manages the Bun runtime using a compiled Rust pipeline in `src/runtimes/bun.rs`. Rather than relying on external install scripts or cURL pipelines, OMG communicates directly with GitHub Releases (`oven-sh/bun`), fetches platform release archives over HTTPS, and parses the release asset SHA-256 digest directly from the release metadata before allowing any disk writes.',
            'The downloaded zip archive is unpacked into a staging directory using OMG’s pure-Rust zip decompressor (`extract_zip`) with single-directory component stripping. Upon successful extraction, OMG publishes the installation atomically to `~/.local/share/omg/versions/bun/<version>` and updates the `current` symlink.',
          ],
        },
        {
          kind: 'commands',
          title: 'Install and inspect Bun releases',
          commands: ['omg use bun latest', 'omg use bun 1.2.4', 'omg list bun', 'omg which bun'],
        },
        {
          kind: 'paragraphs',
          paragraphs: [
            'OMG’s version resolver deterministically filters out release candidates and prereleases when resolving `latest` or partial version requests like `1.0`. Only stable production releases are selected unless an explicit prerelease tag is requested.',
            'Published OMG releases target Linux x86_64 and Apple Silicon macOS. On Windows, run OMG inside WSL; Intel macOS and Linux ARM64 are not published release targets.',
          ],
        },
      ],
    },
    {
      id: 'version-files',
      heading: 'Project version pins and shell detection',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            'When navigating between repositories, OMG’s directory hook (`src/hooks/mod.rs`) checks the nearest directory with a Bun pin first. Within one directory, it checks these sources in order:',
          ],
        },
        {
          kind: 'steps',
          steps: [
            {
              text: 'Project `.bun-version` file in the current working directory or any parent directory.',
            },
            {
              text: 'Multi-runtime `.tool-versions` file (asdf and mise compatible).',
            },
            {
              text: '`package.json` engines (`engines.bun`) or Volta configuration (`volta.bun`).',
            },
          ],
        },
        {
          kind: 'commands',
          title: 'Verify active Bun version at a new prompt',
          commands: ['bun --version', 'omg which bun', 'which -a bun'],
        },
      ],
    },
    {
      id: 'bun-boundary',
      heading: 'Separating runtime management from package dependencies',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            'OMG is responsible for fetching, validating, and activating the Bun binary on PATH. All project-level dependency operations—such as `bun install`, `bun add`, and managing `bun.lock` / `bun.lockb`—are handled natively by Bun itself.',
            'If your project contains a `package.json` with scripts, you can execute them through Bun directly (`bun run build`) or through OMG’s task runner (`omg run build`). The published OMG task runner selects Bun when package.json names Bun in packageManager or when the project has a legacy bun.lockb. For a project using bun.lock, set packageManager to Bun to make runner selection explicit.',
          ],
        },
        {
          kind: 'commands',
          title: 'Install dependencies and run project tasks',
          commands: ['bun install --frozen-lockfile', 'omg run build', 'omg run test'],
        },
      ],
    },
    {
      id: 'troubleshooting',
      heading: 'Diagnosing unexpected Bun executables',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            'If your shell finds an unexpected Bun binary, check if an existing installation from `~/.bun/bin` or a system package manager precedes OMG in your PATH. Ensure the OMG shell hook is initialized in your shell configuration file.',
          ],
        },
        {
          kind: 'commands',
          title: 'Inspect shell PATH resolution',
          commands: ['omg which bun', 'which -a bun', 'bun --version'],
        },
      ],
    },
  ],
  sources: [
    { title: 'OMG Bun runtime implementation (src/runtimes/bun.rs)', href: '/docs/runtimes/' },
    { title: 'OMG shell hook resolution (src/hooks/mod.rs)', href: '/docs/architecture/' },
    { title: 'Bun official GitHub releases', href: 'https://github.com/oven-sh/bun/releases' },
    {
      title: 'Bun lockfile documentation',
      href: 'https://github.com/oven-sh/bun/blob/main/docs/pm/lockfile.mdx',
    },
  ],
  related: ['/runtimes/node/', '/guides/node-npm-pnpm/', '/compare/omg-vs-mise/'],
};
