import { Effect } from 'effect';

type FetchHandler = (request: Request) => Promise<Response>;

/** The generated Alchemy shim caches responses using GET-only Cache API keys. */
export async function headSafeFetch(request: Request, fetch: FetchHandler): Promise<Response> {
  if (request.method !== 'HEAD') {
    return Effect.runPromise(
      Effect.tryPromise({ try: () => fetch(request), catch: cause => cause })
    );
  }

  const headers = new Headers(request.headers);
  headers.delete('content-length');
  headers.delete('content-type');
  const response = await Effect.runPromise(
    Effect.tryPromise({
      try: () => fetch(new Request(request.url, { method: 'GET', headers })),
      catch: cause => cause,
    })
  );
  return new Response(null, response);
}
