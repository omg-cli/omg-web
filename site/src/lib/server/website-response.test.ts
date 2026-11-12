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
