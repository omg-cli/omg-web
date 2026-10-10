import '../src/cloudflare-test.d.ts';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { env } from 'cloudflare:test';
import * as Schema from 'effect/Schema';
import { createTestCustomer, fetchWorker } from './test-utils';
import { ACHIEVEMENTS, type Env } from '../src/api';
import { LicensingDashboardSchema } from '../../../shared/licensing-dashboard';

const ErrorPayloadSchema = Schema.Struct({ error: Schema.String });
const DashboardStatsPayloadSchema = Schema.Struct({
  global_stats: Schema.Struct({
    top_package: Schema.NullOr(Schema.String),
    top_runtime: Schema.NullOr(Schema.String),
    percentile: Schema.NullOr(Schema.Number),
  }),
});

async function decodeError(response: Response): Promise<{ readonly error: string }> {
  return Schema.decodeUnknownSync(ErrorPayloadSchema)(await response.json());
}

const TEST_EMAIL = 'dashboard@example.com';
const TEST_TOKEN = 'dashboard-session-token';
const OTHER_EMAIL = 'other-dashboard@example.com';

function withBatch(batch: D1Database['batch']): Env {
  return {
    ...env,
    DB: {
      prepare: env.DB.prepare.bind(env.DB),
      batch,
      exec: env.DB.exec.bind(env.DB),
      dump: env.DB.dump.bind(env.DB),
      withSession: env.DB.withSession.bind(env.DB),
    },
  };
}

async function seedAccount() {
  const account = await createTestCustomer(env.DB, TEST_EMAIL, 'free');
  await env.DB.prepare(
    'INSERT INTO sessions (id, customer_id, token, expires_at) VALUES (?, ?, ?, ?)'
  )
    .bind(
      'dash-session',
      account.customerId,
      TEST_TOKEN,
      new Date(Date.now() + 60_000).toISOString()
    )
    .run();
  return account;
}

async function ensureSchema(): Promise<void> {
  await env.DB.prepare(`ALTER TABLE customers ADD COLUMN admin INTEGER DEFAULT 0`)
    .run()
    .catch(() => undefined);
  await env.DB.prepare(`ALTER TABLE licenses ADD COLUMN max_seats INTEGER DEFAULT 1`)
    .run()
    .catch(() => undefined);
}

function getDashboard(token: string | null): Request {
  const headers = new Headers();
  if (token !== null) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return new Request('http://localhost/api/dashboard', { method: 'GET', headers });
}

describe('GET /api/dashboard', () => {
  beforeEach(async () => {
    await ensureSchema();
    env.API_RATE_LIMITER = { limit: async () => ({ success: true }) };
  });

  afterEach(async () => {
    await env.DB.prepare('DELETE FROM customers WHERE email = ?').bind(OTHER_EMAIL).run();
    await env.DB.prepare(
      `DELETE FROM sessions WHERE customer_id IN (SELECT id FROM customers WHERE email = ?)`
    )
      .bind(TEST_EMAIL)
      .run();
    await env.DB.prepare(
      `DELETE FROM licenses WHERE customer_id IN (SELECT id FROM customers WHERE email = ?)`
    )
      .bind(TEST_EMAIL)
      .run();
    await env.DB.prepare(`DELETE FROM customers WHERE email = ?`).bind(TEST_EMAIL).run();
  });

  it('rate limits session routes before reading D1', async () => {
    env.API_RATE_LIMITER = { limit: async () => ({ success: false }) };
    const response = await fetchWorker(getDashboard('untrusted-session-token'));

    expect(response.status).toBe(429);
  });

  it('uses a one-way token digest as the limiter key', async () => {
    const limiterKeys: string[] = [];
    env.API_RATE_LIMITER = {
      limit: async ({ key }: RateLimitOptions) => {
        limiterKeys.push(key);
        return { success: true };
      },
    };
    const response = await fetchWorker(getDashboard('untrusted-session-token'));

    expect(response.status).toBe(401);
    expect(limiterKeys).toHaveLength(1);
    expect(limiterKeys[0]).toMatch(/^session_token:sha256:v1:[0-9a-f]{64}$/);
    expect(limiterKeys[0]).not.toContain('untrusted-session-token');
  });

  it('returns 401 when the Authorization header is missing', async () => {
    const response = await fetchWorker(getDashboard(null));
    expect(response.status).toBe(401);
    const payload = await decodeError(response);
    expect(payload.error).toBe('Authorization required');
  });

  it('returns 401 for an unknown session token', async () => {
    const response = await fetchWorker(getDashboard('not-a-session'));
    expect(response.status).toBe(401);
    const payload = await decodeError(response);
    expect(payload.error).toBe('Invalid or expired session');
  });

  it('updates the authenticated customer company field', async () => {
    await env.DB.prepare(
      `INSERT INTO customers (id, email, company, tier, admin) VALUES (?, ?, ?, 'free', 0)`
    )
      .bind('dash-cust', TEST_EMAIL, 'Before')
      .run();
    await env.DB.prepare(
      `INSERT INTO sessions (id, customer_id, token, expires_at) VALUES (?, ?, ?, ?)`
    )
      .bind('dash-sess', 'dash-cust', TEST_TOKEN, new Date(Date.now() + 60_000).toISOString())
      .run();

    const response = await fetchWorker(
      new Request('http://localhost/api/user/profile', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${TEST_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ company: 'After' }),
      })
    );

    expect(response.status).toBe(200);
    const customer = await env.DB.prepare(`SELECT company FROM customers WHERE id = ?`)
      .bind('dash-cust')
      .first<{ company: string }>();
    expect(customer?.company).toBe('After');
  });

  it('returns null global metrics when the license has no usage', async () => {
    await env.DB.prepare(
      `INSERT INTO customers (id, email, company, tier, admin) VALUES (?, ?, ?, 'free', 0)`
    )
      .bind('dash-cust', TEST_EMAIL, 'Dash')
      .run();
    await env.DB.prepare(
      `INSERT INTO sessions (id, customer_id, token, expires_at) VALUES (?, ?, ?, ?)`
    )
      .bind('dash-sess', 'dash-cust', TEST_TOKEN, new Date(Date.now() + 60_000).toISOString())
      .run();
    await env.DB.prepare(
      `INSERT INTO licenses (id, customer_id, license_key, tier, status, max_seats, max_machines)
       VALUES (?, ?, ?, 'free', 'active', 1, 1)`
    )
      .bind('dash-license', 'dash-cust', 'OMG-DASH-TEST')
      .run();

    const response = await fetchWorker(getDashboard(TEST_TOKEN));

    expect(response.status).toBe(200);
    const payload = Schema.decodeUnknownSync(DashboardStatsPayloadSchema)(await response.json());
    expect(payload.global_stats).toEqual({
      top_package: null,
      top_runtime: null,
      percentile: null,
    });
  });

  it('returns 404 when the customer has no license', async () => {
    await env.DB.prepare(
      `INSERT INTO customers (id, email, company, tier, admin) VALUES (?, ?, ?, 'free', 0)`
    )
      .bind('dash-cust', TEST_EMAIL, 'Dash')
      .run();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    await env.DB.prepare(
      `INSERT INTO sessions (id, customer_id, token, expires_at) VALUES (?, ?, ?, ?)`
    )
      .bind('dash-sess', 'dash-cust', TEST_TOKEN, expiresAt)
      .run();

    const response = await fetchWorker(getDashboard(TEST_TOKEN));
    expect(response.status).toBe(404);
    const payload = await decodeError(response);
    expect(payload.error).toBe('License not found');
  });

  it('preserves populated account data and tenant scope with one detail batch', async () => {
    const achievement = ACHIEVEMENTS[0];
    if (achievement === undefined) throw new Error('Achievement fixture unavailable');
    const account = await seedAccount();
    const other = await createTestCustomer(env.DB, OTHER_EMAIL, 'free');
    await env.DB.batch([
      env.DB.prepare(
        "INSERT INTO machines (id, license_id, machine_id, hostname) VALUES ('dash-active', ?, 'active-machine', 'My laptop')"
      ).bind(account.licenseId),
      env.DB.prepare(
        "INSERT INTO machines (id, license_id, machine_id, hostname, is_active) VALUES ('dash-inactive', ?, 'inactive-machine', 'Old laptop', 0)"
      ).bind(account.licenseId),
      env.DB.prepare(
        "INSERT INTO machines (id, license_id, machine_id, hostname) VALUES ('dash-other', ?, 'other-machine', 'Other laptop')"
      ).bind(other.licenseId),
      env.DB.prepare(
        "INSERT INTO usage_daily (id, license_id, date, commands_run, packages_installed, packages_searched, runtimes_switched, sbom_generated, vulnerabilities_found, time_saved_ms) VALUES ('dash-today', ?, date('now'), 10, 2, 3, 1, 1, 2, 3000)"
      ).bind(account.licenseId),
      env.DB.prepare(
        "INSERT INTO usage_daily (id, license_id, date, commands_run, packages_installed, time_saved_ms) VALUES ('dash-yesterday', ?, date('now', '-1 day'), 20, 4, 6000)"
      ).bind(account.licenseId),
      env.DB.prepare(
        "INSERT INTO usage_daily (id, license_id, date, commands_run, time_saved_ms) VALUES ('dash-other-usage', ?, date('now'), 1000, 999000)"
      ).bind(other.licenseId),
      env.DB.prepare("INSERT INTO usage_package_daily VALUES (?, date('now'), 'ripgrep', 7)").bind(
        account.licenseId
      ),
      env.DB.prepare(
        "INSERT INTO usage_package_daily VALUES (?, date('now'), 'other-package', 999)"
      ).bind(other.licenseId),
      env.DB.prepare("INSERT INTO usage_runtime_daily VALUES (?, date('now'), 'node', 5)").bind(
        account.licenseId
      ),
      env.DB.prepare(
        "INSERT INTO usage_runtime_daily VALUES (?, date('now'), 'other-runtime', 999)"
      ).bind(other.licenseId),
      env.DB.prepare(
        "INSERT INTO achievements (id, customer_id, achievement_id) VALUES ('dash-achievement', ?, ?)"
      ).bind(account.customerId, achievement.id),
      env.DB.prepare(
        "INSERT INTO subscriptions (id, customer_id, status, cancel_at_period_end) VALUES ('dash-subscription', ?, 'active', 1)"
      ).bind(account.customerId),
      env.DB.prepare(
        "INSERT INTO invoices (id, customer_id, amount_cents, status) VALUES ('dash-invoice', ?, 1200, 'paid')"
      ).bind(account.customerId),
      env.DB.prepare(
        "INSERT INTO invoices (id, customer_id, amount_cents, status) VALUES ('other-invoice', ?, 9900, 'paid')"
      ).bind(other.customerId),
    ]);
    const batchSizes: number[] = [];
    const observed = withBatch(async <T>(statements: D1PreparedStatement[]) => {
      batchSizes.push(statements.length);
      return env.DB.batch<T>(statements);
    });
    const response = await fetchWorker(getDashboard(TEST_TOKEN), observed);
    expect(response.status).toBe(200);
    const payload = Schema.decodeUnknownSync(LicensingDashboardSchema)(await response.json());
    expect(batchSizes).toEqual([12]);
    expect(payload.user.id).toBe(account.customerId);
    expect(payload.license.id).toBe(account.licenseId);
    expect(payload.is_admin).toBe(false);
    expect(payload.machines.map(machine => machine.hostname)).toEqual(['My laptop']);
    expect(payload.usage).toMatchObject({
      total_commands: 30,
      total_packages_installed: 6,
      total_packages_searched: 3,
      total_runtimes_switched: 1,
      total_sbom_generated: 1,
      total_vulnerabilities_found: 2,
      total_time_saved_ms: 9000,
      current_streak: 2,
      longest_streak: 2,
      breakdown: { installed: 6, searched: 3, switched: 1, sbom: 1, vulns: 2 },
    });
    expect(payload.usage.daily.map(day => day.commands_run)).toEqual([20, 10]);
    expect(payload.global_stats).toEqual({
      top_package: 'ripgrep',
      top_runtime: 'node',
      percentile: 50,
    });
    expect(payload.achievements.filter(item => item.unlocked).map(item => item.id)).toEqual([
      achievement.id,
    ]);
    expect(payload.subscription).toMatchObject({ status: 'active', cancel_at_period_end: 1 });
    expect(payload.invoices).toMatchObject([
      { id: 'dash-invoice', amount_cents: 1200, status: 'paid' },
    ]);
    expect(payload.invoices).toHaveLength(1);
    expect(payload.leaderboard.map(item => item.time_saved)).toEqual([999000, 9000]);
  });

  it('does not run a dashboard batch before session and license validation', async () => {
    const account = await seedAccount();
    let batches = 0;
    const observed = withBatch(async () => {
      batches++;
      throw new Error('must not query details');
    });
    expect((await fetchWorker(getDashboard('invalid'), observed)).status).toBe(401);
    await env.DB.prepare('DELETE FROM licenses WHERE id = ?').bind(account.licenseId).run();
    expect((await fetchWorker(getDashboard(TEST_TOKEN), observed)).status).toBe(404);
    expect(batches).toBe(0);
  });

  it('returns a failure instead of partial dashboard data when the batch fails', async () => {
    await seedAccount();
    const response = await fetchWorker(
      getDashboard(TEST_TOKEN),
      withBatch(async () => {
        throw new Error('D1 detail read unavailable');
      })
    );
    expect(response.status).toBe(500);
    expect(await decodeError(response)).toEqual({
      error: 'Dashboard store unavailable during dashboardBatch',
    });
  });

  it('rejects incomplete batch results', async () => {
    await seedAccount();
    const response = await fetchWorker(
      getDashboard(TEST_TOKEN),
      withBatch(async () => [])
    );
    expect(response.status).toBe(500);
  });

  it('still rejects malformed rows returned in a successful D1 batch', async () => {
    const account = await seedAccount();
    await env.DB.prepare(
      "INSERT INTO machines (id, license_id, machine_id, last_seen_at) VALUES ('dash-malformed', ?, 'malformed-machine', NULL)"
    )
      .bind(account.licenseId)
      .run();
    const response = await fetchWorker(getDashboard(TEST_TOKEN));
    expect(response.status).toBe(500);
    expect(await decodeError(response)).toEqual({ error: 'Machine rows have an invalid shape' });
  });
});
