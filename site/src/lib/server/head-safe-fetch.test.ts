import { describe, expect, it, vi } from 'vitest';

import { headSafeFetch } from './head-safe-fetch';

describe('headSafeFetch', () => {
  it('runs HEAD through the GET-only asset cache and returns no body', async () => {
    const fetch = vi.fn(async (request: Request) => {
      expect(request.method).toBe('GET');
      expect(request.url).toBe('https://getomg.xyz/docs/installation/');
      return new Response('page contents', {
        status: 200,
        headers: { 'content-type': 'text/html', 'content-length': '13' },
      });
    });

    const response = await headSafeFetch(
      new Request('https://getomg.xyz/docs/installation/', { method: 'HEAD' }),
      fetch
    );

    expect(fetch).toHaveBeenCalledOnce();
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('text/html');
    expect(response.headers.get('content-length')).toBe('13');
    expect(await response.text()).toBe('');
  });

  it('leaves GET requests and responses unchanged', async () => {
    const response = new Response('page contents');
    const fetch = vi.fn(async () => response);

    expect(await headSafeFetch(new Request('https://getomg.xyz/'), fetch)).toBe(response);
    expect(fetch).toHaveBeenCalledOnce();
  });

  it('does not copy an incoming HEAD body into the GET request', async () => {
    // Some HTTP clients send a body stream on HEAD despite the Fetch restriction.
    const request = new Request('https://getomg.xyz/install.sh', {
      method: 'POST',
      body: 'unexpected body',
    });
    Object.defineProperty(request, 'method', { value: 'HEAD' });
    const fetch = vi.fn(async (safeRequest: Request) => {
      expect(safeRequest.method).toBe('GET');
      expect(safeRequest.body).toBeNull();
      expect(safeRequest.headers.get('content-type')).toBeNull();
      return new Response('installer');
    });

    const response = await headSafeFetch(request, fetch);

    expect(fetch).toHaveBeenCalledOnce();
    expect(await response.text()).toBe('');
  });
});
