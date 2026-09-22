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
              text: 'Change into a project. The shell hook reads version files and switches runtimes automatically.',
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
            'On Arch, Debian, and Ubuntu, omg env capture writes supported package names and selected runtime versions to omg.lock. Commit that file with your project and run omg env check to inspect drift. It does not record system package versions or all application dependencies. Fedora and macOS do not support this capture path.',
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
            'In Docker images, install OMG in a RUN step, copy the project including omg.lock, and run omg env check before building. For non-interactive shells, pass --yes to commands that would prompt.',
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
            'In v0.1.223, run the full routine on Arch and start omgd for the audit step; Debian and Ubuntu SBOM generation fails because required vulnerability matching is unavailable there. The newer checkout supports SBOMs on Arch, Debian, Ubuntu, and Fedora and can audit without a daemon. Findings alone do not make the vulnerability command exit with a failure status. The secret scan covers your project directory. The SBOM records installed packages and matched findings when inventory and advisory data are available. audit verify checks the retained log for local consistency; filesystem access can still delete, truncate, or rewrite it. Review the results before changing packages.',
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
