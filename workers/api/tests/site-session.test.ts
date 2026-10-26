import '../src/cloudflare-test.d.ts';
import { Effect } from 'effect';
import * as Schema from 'effect/Schema';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import worker from '../src/worker';
import { decodeSiteSessionWorkerResponse } from '../../../shared/site-session';

const TEST_SECRET = 'test-admin-secret';
const TEST_EMAIL = 'site-session-admin@example.com';
const NON_ADMIN_EMAIL = 'site-session-user@example.com';

async function ensureSchema(): Promise<void> {
  await env.DB.prepare(`ALTER TABLE customers ADD COLUMN admin INTEGER DEFAULT 0`)
    .run()
    .catch(() => undefined);
  await env.DB.prepare(`ALTER TABLE licenses ADD COLUMN max_seats INTEGER DEFAULT 1`)
    .run()
    .catch(() => undefined);
}

function createSessionRequest(secret: string | null, serializedBody: string): Request {
  const headers = new Headers({
    'Content-Type': 'application/json',
    'X-Internal-Call': 'service-binding',
  });
  if (secret !== null) {
    headers.set('X-Admin-Secret', secret);
  }
  return new Request('http://localhost/api/internal/site-session', {
    method: 'POST',
    headers,
    body: serializedBody,
  });
}

describe('POST /api/internal/site-session', () => {
  beforeEach(async () => {
    env.ADMIN_API_SECRET = TEST_SECRET;
    env.SVELTE_BFF_SECRET = '';
    env.JWT_SECRET = 'test-site-session-signing-secret';
    env.API_RATE_LIMITER = { limit: async () => ({ success: true }) };
    await ensureSchema();
  });

  afterEach(async () => {
    await env.DB.prepare(
      `DELETE FROM sessions WHERE customer_id IN (
      SELECT id FROM customers WHERE email IN (?, ?)
    )`
    )
      .bind(TEST_EMAIL, NON_ADMIN_EMAIL)
      .run();
    await env.DB.prepare(
      `DELETE FROM licenses WHERE customer_id IN (
      SELECT id FROM customers WHERE email IN (?, ?)
    )`
    )
      .bind(TEST_EMAIL, NON_ADMIN_EMAIL)
      .run();
    await env.DB.prepare(`DELETE FROM customers WHERE email IN (?, ?)`)
      .bind(TEST_EMAIL, NON_ADMIN_EMAIL)
      .run();
  });

  it('rate limits unauthorized public requests without a principal bucket', async () => {
    const keys: string[] = [];
    env.API_RATE_LIMITER = {
      limit: async ({ key }: { key: string }) => {
        keys.push(key);
        return { success: false };
      },
    };
    const ctx = createExecutionContext();
    const response = await worker.fetch(
      createSessionRequest('wrong-secret', JSON.stringify({ email: TEST_EMAIL })),
      env,
      ctx
    );
    await waitOnExecutionContext(ctx);

    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('60');
    expect(keys).toEqual(['internal_site_session:unknown']);
  });

  it('isolates authenticated customer budgets without a connecting IP', async () => {
    const keys: string[] = [];
    env.API_RATE_LIMITER = {
      limit: async ({ key }: { key: string }) => {
        keys.push(key);
        return { success: true };
      },
    };
    for (const email of [NON_ADMIN_EMAIL, TEST_EMAIL, NON_ADMIN_EMAIL.toUpperCase()]) {
      const context = createExecutionContext();
      const response = await worker.fetch(
        createSessionRequest(TEST_SECRET, JSON.stringify({ email, role: 'user' })),
        env,
        context
      );
      await waitOnExecutionContext(context);
      expect(response.status).toBe(200);
    }
    expect(keys).toHaveLength(3);
    expect(keys[0]).not.toBe(keys[1]);
    expect(keys[2]).toBe(keys[0]);
    expect(keys.every(key => key.startsWith('internal_site_session:customer:'))).toBe(true);
    expect(keys.join()).not.toContain('@');
  });

  it.each(['exhausted', 'missing', 'failed'])(
    'fails closed for an authenticated customer when the limiter is %s',
    async state => {
      env.API_RATE_LIMITER =
        state === 'missing'
          ? undefined
          : {
              limit: async () => {
                if (state === 'failed') throw new Error('limiter unavailable');
                return { success: false };
              },
            };
      const context = createExecutionContext();
      const response = await worker.fetch(
        createSessionRequest(TEST_SECRET, JSON.stringify({ email: NON_ADMIN_EMAIL, role: 'user' })),
        env,
        context
      );
      await waitOnExecutionContext(context);
      expect(response.status).toBe(state === 'exhausted' ? 429 : 503);
      if (state === 'exhausted') expect(response.headers.get('Retry-After')).toBe('60');
      expect(
        await env.DB.prepare('SELECT id FROM customers WHERE email = ?')
          .bind(NON_ADMIN_EMAIL)
          .first()
      ).toBeNull();
    }
  );

  it('rejects invalid trusted payloads before selecting a principal bucket', async () => {
    const keys: string[] = [];
    env.API_RATE_LIMITER = {
      limit: async ({ key }: { key: string }) => {
        keys.push(key);
        return { success: true };
      },
    };
    const context = createExecutionContext();
    const response = await worker.fetch(
      createSessionRequest(TEST_SECRET, JSON.stringify({ email: 'invalid', role: 'user' })),
      env,
      context
    );
    await waitOnExecutionContext(context);
    expect(response.status).toBe(400);
    expect(keys).toEqual([]);
  });

  it('returns 401 when the secret is missing', async () => {
    const ctx = createExecutionContext();
    const response = await worker.fetch(
      createSessionRequest(null, JSON.stringify({ email: TEST_EMAIL })),
      env,
      ctx
    );
    await waitOnExecutionContext(ctx);
    expect(response.status).toBe(401);
  });

  it('returns 401 when the secret is wrong', async () => {
    const ctx = createExecutionContext();
    const response = await worker.fetch(
      createSessionRequest('wrong-secret', JSON.stringify({ email: TEST_EMAIL })),
      env,
      ctx
    );
    await waitOnExecutionContext(ctx);
    expect(response.status).toBe(401);
  });

  it('returns 401 when every configured internal secret is empty', async () => {
    env.ADMIN_API_SECRET = '';
    const ctx = createExecutionContext();
    const response = await worker.fetch(
      createSessionRequest(TEST_SECRET, JSON.stringify({ email: TEST_EMAIL })),
      env,
      ctx
    );
    await waitOnExecutionContext(ctx);
    expect(response.status).toBe(401);
  });

  it('accepts the caller-specific Svelte BFF secret', async () => {
    env.SVELTE_BFF_SECRET = 'test-svelte-bff-secret';
    const ctx = createExecutionContext();
    const response = await worker.fetch(
      createSessionRequest(
        'test-svelte-bff-secret',
        JSON.stringify({ email: NON_ADMIN_EMAIL, role: 'user' })
      ),
      env,
      ctx
    );
    await waitOnExecutionContext(ctx);
    expect(response.status).toBe(200);
  });

  it('returns 400 when the body is invalid', async () => {
    const ctx = createExecutionContext();
    const response = await worker.fetch(
      createSessionRequest(TEST_SECRET, JSON.stringify({ email: 'not-an-email' })),
      env,
      ctx
    );
    await waitOnExecutionContext(ctx);
    expect(response.status).toBe(400);
  });

  it('returns 400 for an unknown role', async () => {
    const ctx = createExecutionContext();
    const response = await worker.fetch(
      createSessionRequest(TEST_SECRET, JSON.stringify({ email: TEST_EMAIL, role: 'owner' })),
      env,
      ctx
    );
    await waitOnExecutionContext(ctx);
    expect(response.status).toBe(400);
  });

  it('creates a session for an existing non-admin user', async () => {
    await env.DB.prepare(
      `INSERT INTO customers (id, email, company, tier, admin) VALUES (?, ?, ?, 'free', 0)`
    )
      .bind('user-cust', NON_ADMIN_EMAIL, 'User')
      .run();

    const ctx = createExecutionContext();
    const response = await worker.fetch(
      createSessionRequest(TEST_SECRET, JSON.stringify({ email: NON_ADMIN_EMAIL, role: 'user' })),
      env,
      ctx
    );
    await waitOnExecutionContext(ctx);
    expect(response.status).toBe(200);
  });

  it('revokes stale licensing-admin state when Better Auth reports a user role', async () => {
    await env.DB.prepare(
      `INSERT INTO customers (id, email, company, tier, admin) VALUES (?, ?, ?, 'free', 1)`
    )
      .bind('stale-admin-cust', NON_ADMIN_EMAIL, 'Former Admin')
      .run();

    const ctx = createExecutionContext();
    const response = await worker.fetch(
      createSessionRequest(TEST_SECRET, JSON.stringify({ email: NON_ADMIN_EMAIL, role: 'user' })),
      env,
      ctx
    );
    await waitOnExecutionContext(ctx);
    const customer = Schema.decodeUnknownSync(Schema.Struct({ admin: Schema.Number }))(
      await env.DB.prepare(`SELECT admin FROM customers WHERE email = ?`)
        .bind(NON_ADMIN_EMAIL)
        .first()
    );

    expect(response.status).toBe(200);
    expect(customer.admin).toBe(0);
  });

  it('revokes worker sessions when Better Auth reports a role change', async () => {
    await env.DB.prepare(
      `INSERT INTO customers (id, email, company, tier, admin) VALUES (?, ?, ?, 'free', 1)`
    )
      .bind('demote-cust', NON_ADMIN_EMAIL, 'Demoted Admin')
      .run();
    await env.DB.prepare(
      `INSERT INTO sessions (id, customer_id, token, expires_at) VALUES (?, ?, ?, ?)`
    )
      .bind(
        'demote-session',
        'demote-cust',
        'stale-token',
        new Date(Date.now() + 3600_000).toISOString()
      )
      .run();

    const ctx = createExecutionContext();
    const response = await worker.fetch(
      createSessionRequest(TEST_SECRET, JSON.stringify({ email: NON_ADMIN_EMAIL, role: 'user' })),
      env,
      ctx
    );
    await waitOnExecutionContext(ctx);
    expect(response.status).toBe(200);

    // Only the freshly minted login session survives the demotion.
    const remaining = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM sessions WHERE customer_id = ?'
    )
      .bind('demote-cust')
      .first();
    expect(remaining?.count).toBe(1);
  });

  it('provisions a new user without granting admin access', async () => {
    const ctx = createExecutionContext();
    const response = await worker.fetch(
      createSessionRequest(
        TEST_SECRET,
        JSON.stringify({ email: NON_ADMIN_EMAIL, name: 'Lin', role: 'user' })
      ),
      env,
      ctx
    );
    await waitOnExecutionContext(ctx);
    const customer = Schema.decodeUnknownSync(Schema.Struct({ admin: Schema.Number }))(
      await env.DB.prepare(`SELECT admin FROM customers WHERE email = ?`)
        .bind(NON_ADMIN_EMAIL)
        .first()
    );

    expect(response.status).toBe(200);
    expect(customer.admin).toBe(0);
  });

  it('keeps concurrent new-customer provisioning idempotent', async () => {
    const firstContext = createExecutionContext();
    const secondContext = createExecutionContext();
    const body = JSON.stringify({ email: NON_ADMIN_EMAIL, name: 'Lin', role: 'user' });

    const [first, second] = await Promise.all([
      worker.fetch(createSessionRequest(TEST_SECRET, body), env, firstContext),
      worker.fetch(createSessionRequest(TEST_SECRET, body), env, secondContext),
    ]);
    await Promise.all([
      waitOnExecutionContext(firstContext),
      waitOnExecutionContext(secondContext),
    ]);
    const licenseCount = Schema.decodeUnknownSync(Schema.Struct({ count: Schema.Number }))(
      await env.DB.prepare(
        `SELECT COUNT(*) count FROM licenses
         WHERE customer_id = (SELECT id FROM customers WHERE email = ?)`
      )
        .bind(NON_ADMIN_EMAIL)
        .first()
    );

    expect([first.status, second.status]).toEqual([200, 200]);
    expect(licenseCount.count).toBe(1);
  });

  it('repairs a license insert failure on concurrent session retries', async () => {
    const body = JSON.stringify({ email: NON_ADMIN_EMAIL, role: 'user' });
    await env.DB.prepare(
      `CREATE TRIGGER reject_site_license BEFORE INSERT ON licenses
       BEGIN SELECT RAISE(ABORT, 'license store unavailable'); END`
    ).run();
    try {
      const context = createExecutionContext();
      const response = await worker.fetch(createSessionRequest(TEST_SECRET, body), env, context);
      await waitOnExecutionContext(context);
      expect(response.status).toBe(500);
      expect(
        await env.DB.prepare('SELECT id FROM customers WHERE email = ?')
          .bind(NON_ADMIN_EMAIL)
          .first()
      ).not.toBeNull();
    } finally {
      await env.DB.prepare('DROP TRIGGER reject_site_license').run();
    }

    const responses = await Promise.all(
      [0, 1].map(async () => {
        const context = createExecutionContext();
        const response = await worker.fetch(createSessionRequest(TEST_SECRET, body), env, context);
        await waitOnExecutionContext(context);
        return response;
      })
    );
    expect(responses.map(response => response.status)).toEqual([200, 200]);
    const licenses = await env.DB.prepare(
      `SELECT l.tier, l.status, l.max_seats FROM licenses l
       JOIN customers c ON c.id = l.customer_id WHERE c.email = ?`
    )
      .bind(NON_ADMIN_EMAIL)
      .all();
    expect(licenses.results).toEqual([{ tier: 'free', status: 'active', max_seats: 1 }]);
    const session = await Effect.runPromise(
      decodeSiteSessionWorkerResponse(await responses[0]?.json())
    );
    const dashboardContext = createExecutionContext();
    const dashboard = await worker.fetch(
      new Request('http://localhost/api/dashboard', {
        headers: { Authorization: `Bearer ${session.token}` },
      }),
      env,
      dashboardContext
    );
    await waitOnExecutionContext(dashboardContext);
    expect(dashboard.status).toBe(200);
  });

  it('preserves an existing paid license when minting a session', async () => {
    await env.DB.prepare("INSERT INTO customers (id, email, tier) VALUES ('paid-cust', ?, 'team')")
      .bind(NON_ADMIN_EMAIL)
      .run();
    await env.DB.prepare(
      `INSERT INTO licenses (id, customer_id, license_key, tier, status, max_seats)
       VALUES ('paid-license', 'paid-cust', 'paid-key', 'team', 'active', 17)`
    ).run();
    const context = createExecutionContext();
    const response = await worker.fetch(
      createSessionRequest(TEST_SECRET, JSON.stringify({ email: NON_ADMIN_EMAIL, role: 'user' })),
      env,
      context
    );
    await waitOnExecutionContext(context);
    expect(response.status).toBe(200);
    expect(
      await env.DB.prepare(
        'SELECT license_key, tier, max_seats FROM licenses WHERE customer_id = ?'
      )
        .bind('paid-cust')
        .first()
    ).toEqual({ license_key: 'paid-key', tier: 'team', max_seats: 17 });
  });

  it('creates a session for a new admin customer', async () => {
    const ctx = createExecutionContext();
    const response = await worker.fetch(
      createSessionRequest(
        TEST_SECRET,
        JSON.stringify({ email: TEST_EMAIL.toUpperCase(), name: 'Ada', role: 'admin' })
      ),
      env,
      ctx
    );
    await waitOnExecutionContext(ctx);
    expect(response.status).toBe(200);
    const decoded = await Effect.runPromise(decodeSiteSessionWorkerResponse(await response.json()));
    expect(decoded.token.length).toBeGreaterThan(0);
    expect(decoded.expiresAt.length).toBeGreaterThan(0);
    expect(decoded.customerId.length).toBeGreaterThan(0);
  });

  it('reuses an existing unexpired session', async () => {
    const firstCtx = createExecutionContext();
    const first = await worker.fetch(
      createSessionRequest(
        TEST_SECRET,
        JSON.stringify({ email: TEST_EMAIL, name: 'Ada', role: 'admin' })
      ),
      env,
      firstCtx
    );
    await waitOnExecutionContext(firstCtx);
    const firstBody = await Effect.runPromise(decodeSiteSessionWorkerResponse(await first.json()));

    const secondCtx = createExecutionContext();
    const second = await worker.fetch(
      createSessionRequest(
        TEST_SECRET,
        JSON.stringify({ email: TEST_EMAIL, name: 'Ada', role: 'admin' })
      ),
      env,
      secondCtx
    );
    await waitOnExecutionContext(secondCtx);
    const secondBody = await Effect.runPromise(
      decodeSiteSessionWorkerResponse(await second.json())
    );
    const persisted = Schema.decodeUnknownSync(
      Schema.Struct({ count: Schema.Number, plaintext: Schema.Number, hashed: Schema.Number })
    )(
      await env.DB.prepare(
        `SELECT COUNT(*) count,
                SUM(CASE WHEN token = ? THEN 1 ELSE 0 END) plaintext,
                SUM(CASE WHEN token_hash IS NOT NULL THEN 1 ELSE 0 END) hashed
         FROM sessions WHERE customer_id = ?`
      )
        .bind(firstBody.token, firstBody.customerId)
        .first()
    );

    expect(second.status).toBe(200);
    expect(secondBody.token).toBe(firstBody.token);
    expect(persisted).toEqual({ count: 1, plaintext: 0, hashed: 1 });
  });
});
