import '../src/cloudflare-test.d.ts';
import { env } from 'cloudflare:test';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { reconcileStripeSubscriptionSignal, type StripeFetch } from '../src/stripe-reconciliation';
import { handleAdminStripeSync } from '../src/handlers/billing';

const catalog = { proPriceId: 'price_recovery_pro', teamPriceId: 'price_recovery_team' };
const periodEnd = 1_900_000_000;

function uninitializedSignal(): never {
  throw new Error('Signal not initialized');
}

function signal() {
  let resolve: () => void = uninitializedSignal;
  const promise = new Promise<void>(done => {
    resolve = done;
  });
  return { promise, resolve };
}

function snapshot(status: string, priceId = catalog.proPriceId): StripeFetch {
  return async () =>
    Response.json({
      id: 'sub_recovery',
      customer: 'cus_recovery',
      status,
      current_period_end: periodEnd,
      items: { data: [{ price: { id: priceId }, quantity: 1 }] },
    });
}

function reconcile(fetcher: StripeFetch) {
  return reconcileStripeSubscriptionSignal(env.DB, 'sub_recovery', 'sk_test', catalog, fetcher);
}

async function projection() {
  return env.DB.prepare(
    `SELECT s.status, c.tier, l.status AS license_status
    FROM subscriptions s JOIN customers c ON c.id = s.customer_id
    JOIN licenses l ON l.customer_id = c.id WHERE s.stripe_subscription_id = 'sub_recovery'`
  ).first();
}

describe('Stripe subscription recovery', () => {
  beforeEach(async () => {
    await env.DB.prepare(
      `INSERT INTO customers (id, email, stripe_customer_id, tier)
      VALUES ('recovery-customer', 'recovery@example.com', 'cus_recovery', 'free')`
    ).run();
  });
  afterEach(async () => {
    vi.restoreAllMocks();
    await env.DB.prepare(`DELETE FROM sessions WHERE customer_id = 'recovery-customer'`).run();
    await env.DB.prepare(
      `DELETE FROM stripe_subscription_reconciliations WHERE stripe_subscription_id = 'sub_recovery'`
    ).run();
    await env.DB.prepare(`DELETE FROM subscriptions WHERE customer_id = 'recovery-customer'`).run();
    await env.DB.prepare(`DELETE FROM licenses WHERE customer_id = 'recovery-customer'`).run();
    await env.DB.prepare(`DELETE FROM customers WHERE id = 'recovery-customer'`).run();
  });

  it.each(['past_due', 'unpaid'])(
    'restores paid access after same-period %s recovery',
    async status => {
      await reconcile(snapshot('active'));
      await reconcile(snapshot(status));
      expect(await projection()).toEqual({ status, tier: 'free', license_status: 'cancelled' });
      await reconcile(snapshot('active'));
      expect(await projection()).toEqual({
        status: 'active',
        tier: 'pro',
        license_status: 'active',
      });
    }
  );

  it.each(['past_due', 'active'])(
    'rejects a delayed %s snapshot after a newer Team recovery',
    async status => {
      await reconcile(snapshot('active'));
      const entered = signal();
      const release = signal();
      const delayed = reconcile(async () => {
        entered.resolve();
        await release.promise;
        return snapshot(status)('https://api.stripe.com');
      });
      // Attach rejection handling immediately, then drive the race without timers.
      const outcome = delayed.then(
        () => 'applied',
        () => 'superseded'
      );
      await entered.promise;
      try {
        await reconcile(snapshot('active', catalog.teamPriceId));
      } finally {
        release.resolve();
      }
      expect(await outcome).toBe('superseded');
      expect(await projection()).toEqual({
        status: 'active',
        tier: 'team',
        license_status: 'active',
      });
    }
  );

  it.each(['canceled', 'incomplete_expired'])('keeps %s terminal', async status => {
    await reconcile(snapshot('active'));
    await reconcile(snapshot(status));
    await expect(reconcile(snapshot('active'))).rejects.toThrow('terminal');
    expect(await projection()).toEqual({
      status,
      tier: 'free',
      license_status: 'cancelled',
    });
  });

  it('can retry after a provider failure without leaving reconciliation locked', async () => {
    await reconcile(snapshot('active'));
    await reconcile(snapshot('past_due'));
    await expect(
      reconcile(async () => new Response('Unavailable', { status: 503 }))
    ).rejects.toThrow('Unable to load');
    await reconcile(snapshot('active'));
    expect(await projection()).toEqual({ status: 'active', tier: 'pro', license_status: 'active' });
  });

  it('rejects a provider response for a different subscription', async () => {
    await expect(
      reconcile(async () =>
        Response.json({
          id: 'sub_other',
          customer: 'cus_recovery',
          status: 'active',
          current_period_end: periodEnd,
          items: { data: [{ price: { id: catalog.proPriceId }, quantity: 1 }] },
        })
      )
    ).rejects.toThrow('different id');
    expect(await projection()).toBeNull();
  });

  it('admin sync recovers using the current subscription rather than a stale list result', async () => {
    env.STRIPE_SECRET_KEY = 'sk_test';
    env.STRIPE_PRO_PRICE_ID = catalog.proPriceId;
    env.STRIPE_TEAM_PRICE_ID = catalog.teamPriceId;
    await reconcile(snapshot('active'));
    await reconcile(snapshot('past_due'));
    await env.DB.prepare(`UPDATE customers SET admin = 1 WHERE id = 'recovery-customer'`).run();
    await env.DB.prepare(
      `INSERT INTO sessions (id, customer_id, token, expires_at)
      VALUES ('recovery-session', 'recovery-customer', 'recovery-admin-token', datetime('now', '+1 hour'))`
    ).run();
    const staleListItem = await (await snapshot('past_due')('https://api.stripe.com')).json();
    vi.spyOn(globalThis, 'fetch').mockImplementation(async input => {
      const url = new URL(input instanceof Request ? input.url : input);
      if (url.pathname === '/v1/subscriptions/sub_recovery') return snapshot('active')(url);
      if (url.pathname === '/v1/subscriptions')
        return Response.json({ data: [staleListItem], has_more: false });
      if (url.pathname === '/v1/customers' || url.pathname === '/v1/invoices')
        return Response.json({ data: [], has_more: false });
      throw new Error(`Unexpected Stripe path ${url.pathname}`);
    });
    const response = await handleAdminStripeSync(
      new Request('https://getomg.xyz/api/admin/stripe/sync', {
        method: 'POST',
        headers: { Authorization: 'Bearer recovery-admin-token' },
      }),
      env
    );
    expect(response.status).toBe(200);
    expect(await projection()).toEqual({ status: 'active', tier: 'pro', license_status: 'active' });
  });
});
