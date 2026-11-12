import { SITE_ORIGIN } from '../../../../shared/public-site';
import { agentResponse, documentationEntries } from '../../lib/docs/documentation.server';
import type { RequestHandler } from './$types';

export const prerender = false;
export const GET: RequestHandler = async () => {
  const entries = await documentationEntries();
  return agentResponse(
    [
      '# OMG Package Manager',
      '',
      '> OMG manages system packages and language versions on supported x86_64 Linux and Apple Silicon macOS, including Linux inside WSL2. Native Windows is not supported.',
      '',
      'The handbook and new operational guides describe released v0.1.224. Development-only changes are labeled. Each page provides its reviewed sources and date. Source review does not certify execution on every host. Compare a guide’s own sources before assuming version-specific behavior.',
      '',
      'npm, pnpm, and Bun retain ownership of JavaScript dependency installation and lockfiles. Environment capture and drift checks are available on Arch, Debian, and Ubuntu and do not capture application dependency graphs or system package versions.',
      '',
      '## Machine-readable entry points',
      `- [Documentation manifest](${SITE_ORIGIN}/docs/manifest.json): Page URLs, Markdown URLs, release scope, dates, sources, and section anchors.`,
      `- [Complete documentation](${SITE_ORIGIN}/llms-full.txt): Full text of all published handbook and guide pages.`,
      `- [Search](${SITE_ORIGIN}/docs/search.json?q=env%20capture): Public JSON search. Use q with 2–160 characters. Results link directly to matching sections.`,
      '',
      ...['Handbook', 'Guides', 'Runtime guides', 'Comparisons'].flatMap(category => [
        `## ${category}`,
        ...entries
          .filter(entry => entry.category === category)
          .map(
            entry =>
              `- [${entry.title}](${SITE_ORIGIN}${entry.markdownHref}): ${entry.description} HTML: ${SITE_ORIGIN}${entry.href}`
          ),
        '',
      ]),
      '## Source',
      '- [Released source](https://github.com/omg-cli/omg/tree/f0d8cb5d8a95dbbc6cae50460178702ac0263ebb)',
      '- [Releases](https://github.com/omg-cli/omg/releases)',
      '',
    ].join('\n'),
    'text/plain; charset=utf-8'
  );
};
