import '../src/cloudflare-test.d.ts';
import {
  createExecutionContext,
  createScheduledController,
  env,
  waitOnExecutionContext,
} from 'cloudflare:test';
import { beforeEach, describe, expect, it } from 'vitest';
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
    const attempt = await beginScheduledTaskHealth(env.DB, 'docs_analytics.aggregate');
    await env.DB.exec(
      "CREATE TRIGGER reject_health_success BEFORE UPDATE ON scheduled_task_health WHEN NEW.last_attempt_succeeded = 1 BEGIN SELECT RAISE(FAIL, 'Receipt unavailable'); END"
    );
    try {
      await expect(
        completeScheduledTaskHealth(env.DB, 'docs_analytics.aggregate', attempt)
      ).rejects.toThrow('Receipt unavailable');
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
