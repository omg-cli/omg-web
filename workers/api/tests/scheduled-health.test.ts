import '../src/cloudflare-test.d.ts';
import {
  createExecutionContext,
  createScheduledController,
  env,
  waitOnExecutionContext,
} from 'cloudflare:test';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import worker from '../src/worker';
import { fetchWorker } from './test-utils';
import {
  beginScheduledTaskHealth,
  completeScheduledTaskHealth,
  failScheduledTaskHealth,
} from '../src/scheduled-health';

async function scheduled(): Promise<void> {
  const ctx = createExecutionContext();
  await worker.scheduled(createScheduledController({ cron: '*/5 * * * *' }), env, ctx);
  await waitOnExecutionContext(ctx);
}

function health(): Promise<Response> {
  return fetchWorker(new Request('https://example.test/health/scheduled'));
}

beforeEach(async () => {
  await env.DB.prepare('DELETE FROM scheduled_task_health').run();
});

describe('durable scheduled health', () => {
  it('stays healthy while previously successful tasks run again', async () => {
    await scheduled();
    const docsAttempt = await beginScheduledTaskHealth(env.DB, 'docs_analytics.aggregate');
    const stripeAttempt = await beginScheduledTaskHealth(env.DB, 'stripe_inbox.health');
    expect((await health()).status).toBe(200);
    await completeScheduledTaskHealth(env.DB, 'docs_analytics.aggregate', docsAttempt);
    expect((await health()).status).toBe(200);
    await completeScheduledTaskHealth(env.DB, 'stripe_inbox.health', stripeAttempt);
    expect((await health()).status).toBe(200);
  });

  it('limits a pending attempt to sixty seconds', async () => {
    await scheduled();
    const attempt = await beginScheduledTaskHealth(env.DB, 'docs_analytics.aggregate');
    await env.DB.prepare(
      `UPDATE scheduled_task_health
       SET last_attempt_at = unixepoch('subsec') * 1000 - 59_000 WHERE task = ?`
    )
      .bind('docs_analytics.aggregate')
      .run();
    expect((await health()).status).toBe(200);
    await env.DB.prepare(
      `UPDATE scheduled_task_health
       SET last_attempt_at = unixepoch('subsec') * 1000 - 60_001 WHERE task = ?`
    )
      .bind('docs_analytics.aggregate')
      .run();
    expect((await health()).status).toBe(503);
    await completeScheduledTaskHealth(env.DB, 'docs_analytics.aggregate', attempt);
    expect((await health()).status).toBe(200);
  });

  it('does not hide a failure during pending grace or a new recovery attempt', async () => {
    await scheduled();
    await beginScheduledTaskHealth(env.DB, 'docs_analytics.aggregate');
    expect((await health()).status).toBe(200);
    await failScheduledTaskHealth(env.DB, 'docs_analytics.aggregate');
    expect((await health()).status).toBe(503);
    const recovery = await beginScheduledTaskHealth(env.DB, 'docs_analytics.aggregate');
    expect((await health()).status).toBe(503);
    await completeScheduledTaskHealth(env.DB, 'docs_analytics.aggregate', recovery);
    expect((await health()).status).toBe(200);
  });

  it('allows bounded daily cleanup with a successful receipt from yesterday', async () => {
    await scheduled();
    const previous = await beginScheduledTaskHealth(env.DB, 'audit_log.cleanup');
    await completeScheduledTaskHealth(env.DB, 'audit_log.cleanup', previous);
    await env.DB.prepare(
      `UPDATE scheduled_task_health SET last_success_at = unixepoch('subsec') * 1000 - 86_400_000
       WHERE task = ?`
    )
      .bind('audit_log.cleanup')
      .run();
    await beginScheduledTaskHealth(env.DB, 'audit_log.cleanup');
    expect((await health()).status).toBe(200);
    await env.DB.prepare(
      `UPDATE scheduled_task_health SET last_attempt_at = unixepoch('subsec') * 1000 - 60_001
       WHERE task = ?`
    )
      .bind('audit_log.cleanup')
      .run();
    expect((await health()).status).toBe(503);
  });

  it('keeps first attempts and stale success unavailable during pending grace', async () => {
    const first = await beginScheduledTaskHealth(env.DB, 'docs_analytics.aggregate');
    expect((await health()).status).toBe(503);
    await completeScheduledTaskHealth(env.DB, 'docs_analytics.aggregate', first);
    await env.DB.prepare(
      `UPDATE scheduled_task_health SET last_success_at = unixepoch('subsec') * 1000 - 1_200_001
       WHERE task = ?`
    )
      .bind('docs_analytics.aggregate')
      .run();
    await beginScheduledTaskHealth(env.DB, 'docs_analytics.aggregate');
    expect((await health()).status).toBe(503);
  });

  it('rejects a future attempt during pending grace', async () => {
    await scheduled();
    await beginScheduledTaskHealth(env.DB, 'docs_analytics.aggregate');
    await env.DB.prepare(
      `UPDATE scheduled_task_health SET last_attempt_at = unixepoch('subsec') * 1000 + 30_000
       WHERE task = ?`
    )
      .bind('docs_analytics.aggregate')
      .run();
    expect((await health()).status).toBe(503);
  });

  it('uses query execution time when a success follows the worker clock snapshot', async () => {
    const beforeCompletion = Date.now() - 1_000;
    await scheduled();
    const clock = vi.spyOn(Date, 'now').mockReturnValue(beforeCompletion);
    try {
      expect((await health()).status).toBe(200);
    } finally {
      clock.mockRestore();
    }
  });

  it('does not let a superseded completion clear an expired pending attempt', async () => {
    await scheduled();
    const earlier = await beginScheduledTaskHealth(env.DB, 'docs_analytics.aggregate');
    const latest = await beginScheduledTaskHealth(env.DB, 'docs_analytics.aggregate');
    await env.DB.prepare(
      `UPDATE scheduled_task_health SET last_attempt_at = unixepoch('subsec') * 1000 - 60_001
       WHERE task = ?`
    )
      .bind('docs_analytics.aggregate')
      .run();
    await completeScheduledTaskHealth(env.DB, 'docs_analytics.aggregate', earlier);
    expect((await health()).status).toBe(503);
    await completeScheduledTaskHealth(env.DB, 'docs_analytics.aggregate', latest);
    expect((await health()).status).toBe(200);
  });

  it('requires recovery after a superseded attempt fails after the latest success', async () => {
    await beginScheduledTaskHealth(env.DB, 'docs_analytics.aggregate');
    const latest = await beginScheduledTaskHealth(env.DB, 'docs_analytics.aggregate');
    await completeScheduledTaskHealth(env.DB, 'docs_analytics.aggregate', latest);
    expect((await health()).status).toBe(200);
    await failScheduledTaskHealth(env.DB, 'docs_analytics.aggregate');
    expect((await health()).status).toBe(503);
    await scheduled();
    expect((await health()).status).toBe(200);
  });
  it('does not let an earlier attempt clear a newer pending or failed attempt', async () => {
    const earlier = await beginScheduledTaskHealth(env.DB, 'docs_analytics.aggregate');
    const latest = await beginScheduledTaskHealth(env.DB, 'docs_analytics.aggregate');
    await completeScheduledTaskHealth(env.DB, 'docs_analytics.aggregate', earlier);
    expect((await health()).status).toBe(503);
    await completeScheduledTaskHealth(env.DB, 'docs_analytics.aggregate', latest);
    expect((await health()).status).toBe(200);
  });

  it('stays unavailable if the completion receipt cannot be written', async () => {
    await scheduled();
    await env.DB.exec(
      "CREATE TRIGGER reject_health_success BEFORE UPDATE ON scheduled_task_health WHEN NEW.last_attempt_succeeded = 1 BEGIN SELECT RAISE(FAIL, 'Receipt unavailable'); END"
    );
    try {
      await expect(scheduled()).rejects.toMatchObject({
        errors: expect.arrayContaining([
          expect.objectContaining({ message: expect.stringContaining('Receipt unavailable') }),
        ]),
      });
      expect((await health()).status).toBe(503);
    } finally {
      await env.DB.exec('DROP TRIGGER reject_health_success');
    }
    await scheduled();
    expect((await health()).status).toBe(200);
  });
  it('reports unavailable before the first successful aggregation', async () => {
    const response = await health();
    expect(response.status).toBe(503);
    expect(response.headers.get('Cache-Control')).toContain('no-store');
  });

  it('becomes healthy after a real scheduled aggregation', async () => {
    await scheduled();
    const response = await health();
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: 'ok' });
  });

  it('reports stale success and rejects future timestamps', async () => {
    await scheduled();
    for (const timestamp of [
      Date.now() - 20 * 60_000 - 1,
      Date.now() + 30_000,
      Date.now() + 120_000,
    ]) {
      await env.DB.prepare('UPDATE scheduled_task_health SET last_success_at = ? WHERE task = ?')
        .bind(timestamp, 'docs_analytics.aggregate')
        .run();
      expect((await health()).status).toBe(503);
    }
  });

  it('retains a task failure until that task succeeds, without exposing details', async () => {
    await scheduled();
    await env.DB.exec('ALTER TABLE docs_analytics_pageviews_daily RENAME TO health_fault_table');
    try {
      await expect(scheduled()).rejects.toThrow('scheduled OMG task(s) failed');
      const response = await health();
      expect(response.status).toBe(503);
      expect(await response.text()).not.toContain('health_fault_table');
    } finally {
      await env.DB.exec('ALTER TABLE health_fault_table RENAME TO docs_analytics_pageviews_daily');
    }
    await scheduled();
    expect((await health()).status).toBe(200);
  });

  it('reports a database outage as unavailable', async () => {
    await env.DB.exec('ALTER TABLE scheduled_task_health RENAME TO health_fault_table');
    try {
      expect((await health()).status).toBe(503);
    } finally {
      await env.DB.exec('ALTER TABLE health_fault_table RENAME TO scheduled_task_health');
    }
  });
});
