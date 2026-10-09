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
