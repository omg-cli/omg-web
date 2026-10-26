import { Effect } from 'effect';
import { type Env, enforceRateLimit, errorResponse } from './api';
import { hashSessionToken } from './session-token';

export class InternalRateLimitError extends Error {
  readonly _tag = 'InternalRateLimitError';
  constructor(
    readonly response: Response,
    override readonly cause?: unknown
  ) {
    super('Private request rate limit rejected');
  }
}

export async function enforceInternalRateLimit(env: Env, key: string): Promise<Response | null> {
  const response = await enforceRateLimit(env.API_RATE_LIMITER, key);
  if (response?.status === 429) response.headers.set('Retry-After', '60');
  return response;
}

export function enforceInternalPrincipalRateLimit(
  env: Env,
  scope: string,
  principal: string
): Effect.Effect<void, InternalRateLimitError> {
  return Effect.tryPromise({
    try: async () => {
      const digest = await hashSessionToken(principal);
      return enforceInternalRateLimit(env, `${scope}:${digest}`);
    },
    catch: cause =>
      new InternalRateLimitError(errorResponse('Rate limiting unavailable', 503), cause),
  }).pipe(
    Effect.flatMap(response =>
      response === null ? Effect.void : Effect.fail(new InternalRateLimitError(response))
    )
  );
}
