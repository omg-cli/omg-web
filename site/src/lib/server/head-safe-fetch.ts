type SiteHandler = (request: Request) => Promise<Response>;

/** The generated Alchemy shim caches responses using GET-only Cache API keys. */
export async function headSafeFetch(request: Request, dispatch: SiteHandler): Promise<Response> {
  if (request.method !== 'HEAD') return dispatch(request);

  const headers = new Headers(request.headers);
  headers.delete('content-length');
  headers.delete('content-type');
  const response = await dispatch(new Request(request.url, { method: 'GET', headers }));
  return new Response(null, response);
}
