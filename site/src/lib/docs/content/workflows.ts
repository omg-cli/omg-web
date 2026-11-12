/**
 * Curated workflows handbook. Reviewed against the omg-cli/omg implementation and
 * docs/workflows.md at the commit recorded in the topic registry.
 */
import type { DocsTopic } from '../topic';
import { docsTopicMeta } from '../topics';

export const workflowsTopic: DocsTopic = {
  ...docsTopicMeta('workflows'),
  sections: [
    {
      id: 'daily',
      heading: 'A daily development loop',
      blocks: [
        {
          kind: 'steps',
          steps: [
            { text: 'Start the day with a system check.', command: 'omg status' },
            { text: 'Apply available updates when you are ready.', command: 'omg update' },
            {
              text: 'Change into a project. The shell hook reads version files and selects matching installed runtimes automatically; it does not install missing versions.',
            },
            {
              text: 'Run project tasks without knowing the ecosystem tool.',
              command: 'omg run dev',
            },
            { text: 'Record the day at a natural stopping point.', command: 'omg env capture' },
          ],
        },
        {
          kind: 'diagram',
          diagram: {
            title: 'Inspect, preview, approve, verify',
            caption:
              'Every mutation follows the same order. The dashed line is the step most people skip: going back to inspect when the preview surprises them.',
            nodes: [
              { id: 'inspect', label: 'Inspect the package', detail: 'search, info, why' },
              { id: 'preview', label: 'Preview the change', detail: 'dry run first' },
              { id: 'review', label: 'Review source and policy', detail: 'AUR and rules' },
              {
                id: 'approve',
                label: 'Approve the mutation',
                detail: 'the real command',
                tone: 'signal',
              },
              { id: 'verify', label: 'Check the result', detail: 'native state and history' },
            ],
            edges: [
              { from: 'inspect', to: 'preview' },
              { from: 'preview', to: 'review' },
              { from: 'review', to: 'approve' },
              { from: 'approve', to: 'verify' },
              { from: 'review', to: 'inspect', label: 'adjust', dashed: true },
            ],
          },
        },
        {
          kind: 'paragraphs',
          paragraphs: [
            'On Arch, Debian, and Ubuntu, omg env capture writes explicit package names and probed OMG runtime and registry-tool versions to omg.lock. Commit that file with your project and run omg env check to inspect drift. It does not record system package versions or all application dependencies. Fedora and macOS do not support this capture path.',
          ],
        },
      ],
    },
    {
      id: 'team',
      heading: 'Team onboarding',
      blocks: [
        {
          kind: 'steps',
          steps: [
            { text: 'The team lead pins versions in version files and captures omg.lock.' },
            {
              text: 'Commit the lockfile and version files to the repository.',
              command: 'git add omg.lock .nvmrc .python-version',
            },
            {
              text: 'A new member installs OMG and the shell hook, clones the project, and verifies the machine against the lock.',
              command: 'omg env check',
            },
            {
              text: 'Differences are visible immediately; fix them before running the project.',
              command: 'omg run dev',
            },
          ],
        },
        {
          kind: 'commands',
          title: 'Keeping a team in sync',
          commands: [
            'omg team init mycompany/frontend',
            'omg team pull',
            'omg env capture',
            'omg team push',
          ],
        },
        {
          kind: 'note',
          tone: 'info',
          text: 'Environment capture and drift checks require an Arch, Debian, or Ubuntu backend. omg env share publishes the lockfile as a GitHub Gist and needs GITHUB_TOKEN. Teammates fetch and check it with omg env sync followed by the Gist URL; sync does not install missing software.',
        },
      ],
    },
    {
      id: 'ci',
      heading: 'CI and container pipelines',
      blocks: [
        {
          kind: 'steps',
          steps: [
            { text: 'Install OMG in a setup step and add ~/.local/bin to PATH.' },
            {
              text: 'Fail fast when the runner does not match the committed lockfile.',
              command: 'omg env check',
            },
            { text: 'Run tasks through the task runner.', command: 'omg run test' },
            {
              text: 'Print the recommended Linux cache paths and lockfile-based key, then copy them into your CI provider cache step.',
              command: 'omg ci cache',
            },
          ],
        },
        {
          kind: 'commands',
          title: 'Generate CI configuration',
          commands: ['omg ci init github', 'omg ci init gitlab', 'omg ci validate'],
        },
        {
          kind: 'paragraphs',
          paragraphs: [
            'In Docker images, install a chosen OMG release in a RUN step, copy the project including omg.lock and version files, and install the required runtimes before checking the inventory. omg env check compares state; it does not install anything. Use --yes only on commands that accept it. Required source reviews and attended AUR security gates can still prevent non-interactive installation.',
          ],
        },
      ],
    },
    {
      id: 'security-routine',
      heading: 'A practical security routine',
      blocks: [
        {
          kind: 'commands',
          title: 'Periodic security review',
          commands: [
            'omg audit',
            'omg audit secrets -p .',
            'omg audit sbom -o sbom.json',
            'omg audit verify',
          ],
        },
        {
          kind: 'paragraphs',
          paragraphs: [
            'In v0.1.224, SBOM generation supports Arch, Debian, Ubuntu, and Fedora when inventory and advisory data are available, and vulnerability scans can run without a daemon. Ordinary scans report findings; use omg audit scan --fail-on-findings when CI must fail on vulnerabilities. Inventory-only SBOMs explicitly omit advisory matching and are not clean scan results. The secret scan covers your project directory. audit verify checks the retained log for local consistency; filesystem access can still delete, truncate, or rewrite it. Review the results before changing packages.',
          ],
        },
      ],
    },
    {
      id: 'maintenance',
      heading: 'System maintenance',
      blocks: [
        {
          kind: 'commands',
          title: 'Weekly maintenance',
          commands: ['omg update', 'omg clean --orphans', 'omg clean --cache', 'omg doctor'],
        },
        {
          kind: 'note',
          tone: 'warning',
          text: 'Remove an installed runtime with omg use <runtime> <version> --uninstall. Switch away from an active version first, then confirm the result with omg list <runtime>.',
        },
        {
          kind: 'steps',
          steps: [
            {
              text: 'Before a major upgrade, create a restoration point.',
              command: 'omg snapshot create -m "Before upgrade"',
            },
            {
              text: 'Review recent transactions if anything looks wrong.',
              command: 'omg history --limit 20',
            },
            {
              text: 'Roll back the last transaction if the upgrade misbehaves.',
              command: 'omg rollback',
            },
          ],
        },
      ],
    },
    {
      id: 'prompt',
      heading: 'Monitoring from the shell prompt',
      blocks: [
        {
          kind: 'commands',
          title: 'Prompt helper functions on Zsh',
          commands: ['omg-ec', 'omg-uc'],
        },
        {
          kind: 'paragraphs',
          paragraphs: [
            'The Bash and Zsh shell hooks provide count functions for prompts. omg-ec shows explicit packages, omg-tc shows all packages, omg-oc shows orphans, and omg-uc shows available updates. They use the daemon binary status snapshot when it is fresh; consult omg status or the native package manager when you need current counts. Run omg dash for a full-screen view.',
          ],
        },
      ],
    },
  ],
};
