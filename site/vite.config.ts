import { makeCloudflareAdapter } from '@alchemy.run/frontend-frameworks/sveltekit/cloudflare';
import { sveltepress } from '@sveltepress/vite';
import { codeToHtml } from 'shiki';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import documentationHeadings from './tools/documentation-remark.ts';
import { documentationOnlyPlugins } from './tools/sveltepress-scope.ts';

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
        pageLayout: fileURLToPath(
          new URL('./src/lib/components/docs/SveltePressPage.svelte', import.meta.url)
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
            themes: { light: 'github-light', dark: 'github-dark' },
          });
          return (
            '<div class="docs-code" data-copy-container><div class="code-actions"><span data-copy-status role="status"></span><button type="button" data-copy-code>Copy code</button></div>' +
            html.replaceAll('{', '&#123;').replaceAll('}', '&#125;') +
            '</div>'
          );
        },
      },
      remarkPlugins: [documentationHeadings],
      svelteKitOptions: {
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
