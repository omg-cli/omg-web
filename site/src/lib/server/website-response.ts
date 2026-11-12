import { headSafeFetch } from './head-safe-fetch';

/** Apply stage policy after adapter cache hits and prerendered asset responses. */
export async function websiteFetch(
  request: Request,
  fetch: Parameters<typeof headSafeFetch>[1],
  deploymentStage: string | undefined
): Promise<Response> {
  const response = await headSafeFetch(request, fetch);
  if (
    deploymentStage === 'prod' ||
    (response.headers.get('Content-Type') ?? '').includes('application/xml')
  ) {
    return response;
  }

  const headers = new Headers(response.headers);
  headers.set('X-Robots-Tag', 'noindex, nofollow');
  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  });
}
