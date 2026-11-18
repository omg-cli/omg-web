import { describe, expect, it } from 'vitest';
import { websiteFetch } from './website-response';

describe('outer website response policy', () => {
  it.each([
    ['staging', 'GET', 'noindex, nofollow', '<h1>Installing OMG</h1>'],
    ['staging', 'HEAD', 'noindex, nofollow', ''],
    [undefined, 'GET', 'noindex, nofollow', '<h1>Installing OMG</h1>'],
    ['prod', 'GET', null, '<h1>Installing OMG</h1>'],
    ['prod', 'HEAD', null, ''],
  ] as const)(
    'applies %s robots policy to a static %s response',
    async (stage, method, robots, body) => {
      const csp = "default-src 'self'; script-src 'self' 'sha256-rendered'; frame-ancestors 'none'";
      const response = await websiteFetch(
        new Request('https://example.test/docs/installation/', { method }),
        async request => {
          expect(request.method).toBe('GET');
          return new Response('<h1>Installing OMG</h1>', {
            headers: {
              'Content-Type': 'text/html',
              'Content-Security-Policy': csp,
              'X-Content-Type-Options': 'nosniff',
              'Cache-Control': 'public, max-age=0, must-revalidate',
            },
          });
        },
        stage
      );

      expect(response.status).toBe(200);
      expect(response.headers.get('X-Robots-Tag')).toBe(robots);
      expect(response.headers.get('Content-Security-Policy')).toBe(csp);
      expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
      expect(response.headers.get('Cache-Control')).toBe('public, max-age=0, must-revalidate');
      expect(await response.text()).toBe(body);
    }
  );

  it('keeps a production endpoint noindex policy and its rendered CSP', async () => {
    const original = new Response('agent index', {
      headers: { 'X-Robots-Tag': 'noindex', 'Content-Security-Policy': "default-src 'none'" },
    });
    const response = await websiteFetch(
      new Request('https://example.test/llms.txt'),
      async () => original,
      'prod'
    );

    expect(response).toBe(original);
    expect(response.headers.get('X-Robots-Tag')).toBe('noindex');
    expect(response.headers.get('Content-Security-Policy')).toBe("default-src 'none'");
  });

  it.each([
    ['text/markdown', true],
    ['text/markdown, */*', true],
    ['text/html;q=0.5, text/markdown;q=0.9', true],
    ['text/markdown;q=0.1, text/*;q=0.8', false],
    ['text/markdown;q=0, */*', false],
    ['text/html, */*;q=0.8', false],
    ['*/*', false],
  ] as const)('negotiates %s before the adapter cache lookup', async (accept, markdown) => {
    const response = await websiteFetch(
      new Request('https://example.test/docs/installation/', { headers: { Accept: accept } }),
      async request => {
        expect(new URL(request.url).pathname).toBe(
          markdown ? '/markdown/docs/installation/' : '/docs/installation/'
        );
        return new Response(markdown ? '# Install' : '<h1>Install</h1>', {
          headers: {
            'Content-Type': markdown ? 'text/markdown' : 'text/html',
            Vary: 'Accept-Encoding',
          },
        });
      },
      'prod'
    );
    expect(response.headers.get('Vary')).toBe('Accept-Encoding, Accept');
    expect(response.headers.get('Link')).toContain('rel="describedby"');
    expect(response.headers.get('Link')).toContain(
      markdown ? 'rel="canonical"' : 'rel="alternate"'
    );
    expect(await response.text()).toBe(markdown ? '# Install' : '<h1>Install</h1>');
  });

  it('keeps a missing Markdown section out of caches shared with HTML', async () => {
    const response = await websiteFetch(
      new Request('https://example.test/docs/cli/?section=missing', {
        headers: { Accept: 'text/markdown' },
      }),
      async () => new Response('Section not found', { status: 404 }),
      'prod'
    );
    expect(response.status).toBe(404);
    expect(response.headers.get('Vary')).toContain('Accept');
    expect(response.headers.get('Cache-Control')).toBe('private, no-store');
    expect(response.headers.get('Cloudflare-CDN-Cache-Control')).toBe('no-store');
  });

  it('preserves requested sections and HEAD semantics for Markdown aliases', async () => {
    const response = await websiteFetch(
      new Request('https://example.test/docs/cli.md?section=packages&ref=home', { method: 'HEAD' }),
      async request => {
        expect(request.url).toBe('https://example.test/markdown/docs/cli/?section=packages');
        expect(request.method).toBe('GET');
        return new Response('## Packages', { headers: { 'Content-Type': 'text/markdown' } });
      },
      'prod'
    );
    expect(response.headers.get('Content-Location')).toBe('/markdown/docs/cli/?section=packages');
    expect(response.headers.get('Link')).toContain('</docs/cli/#packages>; rel="canonical"');
    expect(await response.text()).toBe('');
  });

  it.each(['/dashboard/', '/api/analytics/', '/docs/search/', '/docs/invented.md'])(
    'leaves %s with its own handler and policies',
    async path => {
      const request = new Request(`https://example.test${path}`, {
        headers: { Accept: 'text/markdown' },
      });
      const original = new Response(null, { status: 404 });
      expect(
        await websiteFetch(
          request,
          async received => {
            expect(received).toBe(request);
            return original;
          },
          'prod'
        )
      ).toBe(original);
    }
  );

  it('preserves the sitemap discovery exception on staging', async () => {
    const response = await websiteFetch(
      new Request('https://example.test/sitemap.xml'),
      async () => new Response('<urlset/>', { headers: { 'Content-Type': 'application/xml' } }),
      'staging'
    );

    expect(response.headers.has('X-Robots-Tag')).toBe(false);
    expect(await response.text()).toBe('<urlset/>');
  });
});
