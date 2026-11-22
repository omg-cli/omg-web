import { makeCloudflareAdapter } from '@alchemy.run/frontend-frameworks/sveltekit/cloudflare';
import { sveltepress } from '@sveltepress/vite';
import { codeToHtml, type ThemeRegistration } from 'shiki';
import { fileURLToPath } from 'node:url';
import { defineConfig, normalizePath } from 'vite';
import documentationHeadings from './tools/documentation-remark.ts';
import { documentationOnlyPlugins } from './tools/sveltepress-scope.ts';

const omgCodeTheme: ThemeRegistration = {
  name: 'omg-workbench',
  type: 'light',
  colors: {
    'editor.background': 'transparent',
    'editor.foreground': 'var(--code-command)',
  },
  tokenColors: [
    {
      scope: ['comment', 'punctuation.definition.comment'],
      settings: { foreground: 'var(--code-comment)' },
    },
    {
      scope: ['string', 'string.quoted', 'constant.other.url', 'markup.underline.link'],
      settings: { foreground: 'var(--code-string)' },
    },
    {
      scope: [
        'constant.other.option',
        'punctuation.definition.parameter',
        'variable.parameter',
        'keyword.operator',
        'punctuation.separator',
        'punctuation.definition.variable',
        'variable.other',
        'support.type.property-name',
        'entity.name.tag',
      ],
      settings: { foreground: 'var(--code-flag)' },
    },
    {
      scope: [
        'entity.name.function',
        'support.function',
        'keyword',
        'storage',
        'constant.numeric',
        'constant.language',
      ],
      settings: { foreground: 'var(--code-command)' },
    },
  ],
};

export default defineConfig({
  plugins: [
    sveltepress({
      siteConfig: {
        title: 'OMG documentation',
        description: 'Source-reviewed OMG CLI documentation',
      },
      versions: false,
      pagefind: false,
      theme: {
        name: 'omg',
        globalLayout: '',
        pageLayout: normalizePath(
          fileURLToPath(
            new URL('./src/lib/components/docs/SveltePressPage.svelte', import.meta.url)
          )
        ),
        vitePlugins: documentationOnlyPlugins,
        highlighter: async (code: string, language: string) => {
          const lang =
            language === 'json' || language === 'toml' || language === 'yaml'
              ? language
              : language === 'sh' || language === 'bash'
                ? 'bash'
                : 'text';
          const html = await codeToHtml(code, {
            lang,
            theme: omgCodeTheme,
          });
          const className = code.trimEnd().includes('\n')
            ? 'docs-code'
            : 'docs-code single-command';
          return (
            `<div class="${className}" data-lang="${lang}" data-copy-container><div class="code-actions"><span data-copy-status role="status"></span><button type="button" data-copy-code>Copy code</button></div>` +
            html.replaceAll('{', '&#123;').replaceAll('}', '&#125;') +
            '</div>'
          );
        },
      },
      remarkPlugins: [documentationHeadings],
      svelteKitOptions: {
        inlineStyleThreshold: 20_000,
        adapter: makeCloudflareAdapter({ fallback: 'plaintext', notFoundHandling: '404-page' }),
        csp: {
          mode: 'auto',
          directives: {
            'default-src': ['self'],
            'script-src': ['self', 'https://static.cloudflareinsights.com'],
            'style-src': ['self', 'unsafe-inline'],
            'img-src': ['self', 'data:', 'https://avatars.githubusercontent.com'],
            'font-src': ['self', 'data:'],
            'connect-src': ['self', 'https://cloudflareinsights.com'],
            'frame-ancestors': ['none'],
            'base-uri': ['self'],
            'form-action': ['self'],
            'object-src': ['none'],
            'worker-src': ['self'],
          },
        },
      },
    }),
  ],
});
