import { SITE_ORIGIN } from '../../../../shared/public-site';
import { DOCS_TOPICS, docsTopicHref } from '../../lib/docs/topics';
import { LEARNING_PAGES, learningHref } from '../../lib/learn/catalog';
import type { RequestHandler } from './$types';

// Preserve the endpoint's response headers through the production adapter.
export const prerender = false;

export const GET: RequestHandler = () =>
  new Response(
    [
      '# OMG Package Manager',
      '',
      '> OMG is an open-source CLI for system packages and multi-language runtimes (Node.js, Python, Go, Rust, Bun) on supported x86_64 Linux distributions and Apple Silicon macOS, including Linux inside WSL2. It provides direct PATH shell switching for .nvmrc and .tool-versions without wrapper shims and automatic version-file detection. Environment capture and drift checks are available on Arch and Debian/Ubuntu backends.',
      '',
      'The latest published release predates beta. Follow the versioned source references in the handbook. npm, pnpm, and Bun retain ownership of their dependency installation and lockfiles. Native Windows is not supported.',
      '',
      '## Guides',
      ...LEARNING_PAGES.map(
        page =>
          `- [${page.title}](${SITE_ORIGIN}/markdown/${page.category}/${page.slug}/): ${page.description} HTML: ${SITE_ORIGIN}${learningHref(page)}`
      ),
      '',
      '## Reference',
      ...DOCS_TOPICS.map(
        topic => `- [${topic.title}](${SITE_ORIGIN}${docsTopicHref(topic.slug)}): ${topic.summary}`
      ),
      '',
      '## Source',
      `- [Complete OMG documentation](https://github.com/omg-cli/omg/tree/${DOCS_TOPICS[0].source.reviewedCommit}/docs)`,
      '- [OMG source and releases](https://github.com/omg-cli/omg)',
      '',
    ].join('\n'),
    {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'public, max-age=0, must-revalidate',
        'X-Robots-Tag': 'noindex',
        'Content-Signal': 'search=yes, ai-train=no',
      },
    }
  );
