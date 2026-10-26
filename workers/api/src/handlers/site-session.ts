import { Effect } from 'effect';
import { type Env, errorResponse, logAudit, rateLimitClientIp, respondFromEffect } from '../api';
import { decodeJsonBody, type InvalidJsonBodyError } from '../body';
import * as Schema from 'effect/Schema';
import {
  decodeCustomerRow,
  SessionToken,
  SiteSessionRequestSchema,
  type SiteSessionWorkerResponse,
} from '../../../../shared/site-session';
import { requireInternalSecret } from '../admin-secret';
import { casesHandled } from '../prelude';
import { deriveSiteSessionToken, hashSessionToken } from '../session-token';
import {
  enforceInternalRateLimit,
  enforceInternalPrincipalRateLimit,
  InternalRateLimitError,
} from '../internal-rate-limit';

/** D1 was unavailable or returned an unreadable row during site-session minting. */
class CustomerStoreUnavailable extends Error {
  readonly _tag = 'CustomerStoreUnavailable';
  constructor(
    readonly operation:
      | 'findByEmail'
      | 'insertCustomer'
      | 'insertLicense'
      | 'syncRole'
      | 'revokeSessionsOnRoleChange'
      | 'deriveSessionToken'
      | 'insertSession',
    override readonly cause?: unknown
  ) {
    super(`Customer store unavailable during ${operation}`);
  }
}

function storeOperation<A>(
  operation: CustomerStoreUnavailable['operation'],
  run: () => Promise<A>
): Effect.Effect<A, CustomerStoreUnavailable> {
  return Effect.tryPromise({
    try: run,
    catch: cause => new CustomerStoreUnavailable(operation, cause),
  });
}

/**
 * Mint or reuse a Worker session for a server-authenticated Better Auth user.
 *
 * @param request - Incoming POST with `X-Admin-Secret` and JSON body.
 * @param env - Worker bindings, including D1 and caller-specific BFF secrets.
 * @returns The session wire payload, or a tagged site-session error.
 */
function mintSiteSession(
  request: Request,
  env: Env
): Effect.Effect<
  SiteSessionWorkerResponse,
  InvalidJsonBodyError | CustomerStoreUnavailable | InternalRateLimitError
> {
  return Effect.gen(function* () {
    const body = yield* decodeJsonBody(request, SiteSessionRequestSchema);
    yield* enforceInternalPrincipalRateLimit(env, 'internal_site_session:customer', body.email);
    const customerRow = yield* storeOperation('findByEmail', () =>
      env.DB.prepare(`SELECT id, email, admin FROM customers WHERE email = ?`)
        .bind(body.email)
        .first()
    );
    let customer =
      customerRow === null
        ? null
        : yield* decodeCustomerRow(customerRow).pipe(
            Effect.mapError(cause => new CustomerStoreUnavailable('findByEmail', cause))
          );

    const admin = body.role === 'admin' ? 1 : 0;
    if (customer === null) {
      // Unique constraint on email + ON CONFLICT DO NOTHING closes the
      // find-then-insert race. Note: miniflare/D1 .run() meta may not carry
      // `changes`, so success is determined by re-selecting, never by meta.
      yield* storeOperation('insertCustomer', () =>
        env.DB.prepare(
          `INSERT INTO customers (id, email, company, tier, admin) VALUES (?, ?, ?, 'free', ?)
           ON CONFLICT (email) DO NOTHING`
        )
          .bind(crypto.randomUUID(), body.email, body.name ?? null, admin)
          .run()
      );
      const adoptedRow = yield* storeOperation('findByEmail', () =>
        env.DB.prepare(`SELECT id, email, admin FROM customers WHERE email = ?`)
          .bind(body.email)
          .first()
      );
      if (adoptedRow === null) {
        return yield* Effect.fail(new CustomerStoreUnavailable('findByEmail'));
      }
      const adopted = yield* decodeCustomerRow(adoptedRow).pipe(
        Effect.mapError(cause => new CustomerStoreUnavailable('findByEmail', cause))
      );
      customer = adopted;
    }
    const customerId = customer.id;
    // Ensure retries repair a customer committed before its license insert failed.
    const insertedLicense = yield* storeOperation('insertLicense', () =>
      env.DB.prepare(
        `INSERT INTO licenses (id, customer_id, license_key, tier, status, max_seats)
           VALUES (?, ?, ?, 'free', 'active', 1)
           ON CONFLICT (customer_id) DO NOTHING
           RETURNING id`
      )
        .bind(crypto.randomUUID(), customerId, crypto.randomUUID())
        .first()
    );
    if (insertedLicense !== null) {
      yield* logAudit(env.DB, customerId, 'site.session_created', 'customer', customerId, request);
    }

    if (customer.admin !== admin) {
      yield* storeOperation('syncRole', () =>
        env.DB.prepare(`UPDATE customers SET admin = ? WHERE id = ?`).bind(admin, customerId).run()
      );
      // A privilege change revokes outstanding sessions: the stored Bearer [REDACTED]
      // would otherwise survive demotion until expiry. The fresh session
      // minted below keeps the current login working.
      yield* storeOperation('revokeSessionsOnRoleChange', () =>
        env.DB.prepare('DELETE FROM sessions WHERE customer_id = ?').bind(customerId).run()
      );
      customer = { ...customer, admin };
    }

    const token = Schema.decodeUnknownSync(SessionToken)(
      yield* Effect.tryPromise({
        try: () =>
          deriveSiteSessionToken(env.JWT_SECRET, customer.id, body.betterAuthUserId ?? body.email),
        catch: cause => new CustomerStoreUnavailable('deriveSessionToken', cause),
      })
    );
    const tokenHash = yield* Effect.tryPromise({
      try: () => hashSessionToken(token),
      catch: cause => new CustomerStoreUnavailable('deriveSessionToken', cause),
    });
    const sessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    yield* storeOperation('insertSession', () =>
      env.DB.prepare(
        `INSERT INTO sessions (id, customer_id, token, token_hash, expires_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT DO UPDATE SET expires_at = excluded.expires_at`
      )
        .bind(sessionId, customer.id, tokenHash, tokenHash, expiresAt)
        .run()
    );
    return { token, expiresAt, customerId: customer.id };
  });
}

/**
 * HTTP adapter for the internal site-session endpoint.
 *
 * @param request - Incoming request.
 * @param env - Worker bindings.
 * @returns JSON session payload or a mapped error response.
 */
export async function handleCreateSiteSession(request: Request, env: Env): Promise<Response> {
  // Defense-in-depth: this route is publicly reachable; only the BFF service
  // binding should ever call it.
  if (request.headers.get('X-Internal-Call') !== 'service-binding') {
    return errorResponse('Not found', 404);
  }
  const authorization = Effect.runSyncExit(
    requireInternalSecret(request.headers.get('X-Admin-Secret'), [
      env.ADMIN_API_SECRET,
      env.SVELTE_BFF_SECRET,
    ])
  );
  if (authorization._tag === 'Failure') {
    const limited = await enforceInternalRateLimit(
      env,
      `internal_site_session:${rateLimitClientIp(request)}`
    );
    return limited ?? errorResponse('Unauthorized', 401);
  }
  return respondFromEffect(mintSiteSession(request, env), error => {
    switch (error._tag) {
      case 'InternalRateLimitError':
        return error.response;
      case 'InvalidJsonBodyError':
        return errorResponse(error.message, 400);
      case 'CustomerStoreUnavailable':
        return errorResponse('Site session unavailable', 500);
      default:
        return casesHandled(error);
    }
  });
}
