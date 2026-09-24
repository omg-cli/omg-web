import type { LearningContent } from '../page';

export const content: LearningContent = {
  sections: [
    {
      id: 'why-reproducibility',
      heading: 'Recording installed packages and language runtimes',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            'Most developer environments drift because developers use different tools for each layer: OS packages are installed ad-hoc (`apt-get`, `pacman`, `brew`), language runtimes are managed by separate version tools, and project libraries are pinned in application lockfiles.',
            'OMG’s environment subsystem (`src/cli/env.rs` and `src/core/env/fingerprint.rs`) records explicitly installed system package names and selected OMG runtime versions in `omg.lock`. The published CLI captures seven runtimes (Node.js, Python, Rust, Go, Ruby, Java, and Bun). It does not record system package versions or application dependencies.',
          ],
        },
      ],
    },
    {
      id: 'capture-and-check',
      heading: 'Capturing state and verifying drift',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            '`omg env capture` supports the Arch ALPM and Debian/Ubuntu APT backends. It records explicit package names and selected runtime versions, then writes a full SHA-256 hash of that inventory to `omg.lock`. The CLI displays the first 16 characters as a short identifier.',
            'Run `omg env check` to compare `omg.lock` with the live system without installing packages. It reports missing or extra package names and runtime version differences. System package version changes under the same name are outside this check.',
          ],
        },
        {
          kind: 'commands',
          title: 'Capture environment state and detect drift',
          commands: ['omg env capture', 'omg env check'],
        },
        {
          kind: 'note',
          tone: 'info',
          text: 'Commit omg.lock to your repository alongside your version files (.node-version, .python-version) and package manager lockfiles (package-lock.json, Cargo.lock).',
        },
      ],
    },
    {
      id: 'export-and-share',
      heading: 'Sharing the captured inventory',
      blocks: [
        {
          kind: 'paragraphs',
          paragraphs: [
            'You can share `omg.lock` through GitHub Gist with `omg env share`. The Gist is secret by default; add `--public` only when you want public visibility.',
            '`omg env sync <url>` downloads the lockfile into the current directory and runs a drift check. It does not install packages or runtimes. Review differences and install the needed software with the appropriate commands.',
          ],
        },
        {
          kind: 'commands',
          title: 'Share and check an environment inventory',
          commands: ['omg env share', 'omg env sync <gist-url>'],
        },
      ],
    },
    {
      id: 'team-workflow',
      heading: 'A verified team onboarding workflow',
      blocks: [
        {
          kind: 'steps',
          steps: [
            {
              text: 'The repository maintainer configures runtime pins and captures the working environment.',
              command:
                'omg env capture && git add omg.lock .node-version && git commit -m "chore: pin environment"',
            },
            {
              text: 'A new contributor clones the repository and runs an initial environment check.',
              command: 'git clone <repo> && cd <repo> && omg env check',
            },
            {
              text: 'If drift or missing runtimes are reported, inspect the differences and install the required versions.',
              command: 'omg use node lts && npm ci',
            },
            {
              text: 'Run the project tasks using OMG’s polyglot task runner.',
              command: 'omg run test',
            },
          ],
        },
      ],
    },
  ],
  sources: [
    { title: 'OMG environment CLI implementation (src/cli/env.rs)', href: '/docs/cli/' },
    {
      title: 'OMG environment fingerprinting (src/core/env/fingerprint.rs)',
      href: '/docs/architecture/',
    },
    { title: 'OMG daily workflows guide', href: '/docs/workflows/' },
  ],
  related: ['/compare/omg-vs-mise/', '/guides/task-runner/', '/docs/configuration/'],
};
