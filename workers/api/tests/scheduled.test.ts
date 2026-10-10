import '../src/cloudflare-test.d.ts';
import { createExecutionContext, env, waitOnExecutionContext } from 'cloudflare:test';
import { describe, expect, it, vi } from 'vitest';
import worker from '../src/worker';

async function invokeScheduled(cron: string): Promise<void> {
  const context = createExecutionContext();
  try {
    await worker.scheduled({ cron, scheduledTime: Date.now(), noRetry: vi.fn() }, env, context);
  } finally {
    await waitOnExecutionContext(context);
  }
}

async function seedExpiredStripeEvent(id: string): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO stripe_events
     (id, stripe_event_id, event_type, processed, processed_at, status)
     VALUES (?, ?, 'customer.updated', 1, datetime('now', '-100 days'), 'processed')`
  )
    .bind(id, id)
    .run();
}

describe('scheduled invocation outcome', () => {
  it.each([
    ['dead', '-1 minute', null, true],
    ['failed', '-16 minutes', null, true],
    ['received', '-16 minutes', null, true],
    ['processing', '-1 hour', '-16 minutes', true],
    ['processing', '-16 minutes', null, true],
    ['received', null, null, true],
    ['failed', '-14 minutes', null, false],
    ['received', '-14 minutes', null, false],
    ['processing', '-1 hour', '-1 minute', false],
  ] as const)(
    'checks %s backlog with creation %s and lease %s without modifying the inbox',
    async (status, createdAge, leaseAge, shouldFail) => {
      const id = crypto.randomUUID();
      await env.DB.prepare(
        `INSERT INTO stripe_events
         (id, stripe_event_id, event_type, status, created_at, processing_started_at,
          claim_token, event_data, last_error)
         VALUES (?, ?, 'customer.updated', ?, datetime('now', ?), datetime('now', ?),
                 'retained-claim', 'retained-payload', 'retained-error')`
      )
        .bind(id, id, status, createdAge, leaseAge)
        .run();
      const select = () =>
        env.DB.prepare('SELECT * FROM stripe_events WHERE id = ?').bind(id).first();
      const before = await select();
      try {
        if (shouldFail) {
          await expect(invokeScheduled('*/5 * * * *')).rejects.toMatchObject({
            errors: [
              expect.objectContaining({
                message: 'Unresolved Stripe webhook backlog requires review',
              }),
            ],
          });
        } else {
          await expect(invokeScheduled('*/5 * * * *')).resolves.toBeUndefined();
        }
        expect(await select()).toEqual(before);
      } finally {
        await env.DB.prepare('DELETE FROM stripe_events WHERE id = ?').bind(id).run();
      }
    }
  );

  it('keeps daily retention out of the five-minute aggregation job', async () => {
    const id = crypto.randomUUID();
    await seedExpiredStripeEvent(id);
    try {
      await expect(invokeScheduled('*/5 * * * *')).resolves.toBeUndefined();
      expect(
        await env.DB.prepare('SELECT id FROM stripe_events WHERE id = ?').bind(id).first('id')
      ).toBe(id);
      await expect(invokeScheduled('0 2 * * *')).resolves.toBeUndefined();
      expect(
        await env.DB.prepare('SELECT id FROM stripe_events WHERE id = ?').bind(id).first('id')
      ).toBeNull();
    } finally {
      await env.DB.prepare('DELETE FROM stripe_events WHERE id = ?').bind(id).run();
    }
  });

  it('keeps retention running when an unresolved dead event fails the health check', async () => {
    const expiredId = crypto.randomUUID();
    const deadId = crypto.randomUUID();
    await seedExpiredStripeEvent(expiredId);
    await env.DB.prepare(
      `INSERT INTO stripe_events (id, stripe_event_id, event_type, status)
       VALUES (?, ?, 'customer.updated', 'dead')`
    )
      .bind(deadId, deadId)
      .run();
    try {
      await expect(invokeScheduled('0 2 * * *')).rejects.toThrow('scheduled OMG task(s) failed');
      expect(
        await env.DB.prepare('SELECT id FROM stripe_events WHERE id = ?')
          .bind(expiredId)
          .first('id')
      ).toBeNull();
      expect(
        await env.DB.prepare('SELECT id FROM stripe_events WHERE id = ?').bind(deadId).first('id')
      ).toBe(deadId);
    } finally {
      await env.DB.prepare('DELETE FROM stripe_events WHERE id IN (?, ?)')
        .bind(expiredId, deadId)
        .run();
    }
  });

  it.each(['docs_analytics_pageviews_daily', 'audit_log'])(
    'rejects a failure in %s while still completing independent Stripe retention',
    async table => {
      const id = crypto.randomUUID();
      await seedExpiredStripeEvent(id);
      await env.DB.exec(`ALTER TABLE ${table} RENAME TO scheduled_fault_table`);
      try {
        await expect(invokeScheduled('0 2 * * *')).rejects.toThrow('scheduled OMG task(s) failed');
        expect(
          await env.DB.prepare('SELECT id FROM stripe_events WHERE id = ?').bind(id).first('id')
        ).toBeNull();
      } finally {
        await env.DB.exec(`ALTER TABLE scheduled_fault_table RENAME TO ${table}`);
        await env.DB.prepare('DELETE FROM stripe_events WHERE id = ?').bind(id).run();
      }
    }
  );
});
