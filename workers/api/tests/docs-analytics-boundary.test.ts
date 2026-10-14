import '../src/cloudflare-test.d.ts';
import { afterEach, describe, expect, it } from 'vitest';
import {
  env,
  createExecutionContext,
  waitOnExecutionContext,
  createScheduledController,
} from 'cloudflare:test';
import worker from '../src/worker';
import {
  handleDocsAnalytics,
  handleDocsAnalyticsDashboard,
  refreshDocsAnalyticsAggregates,
} from '../src/handlers/docs-analytics';
import { fetchWorker } from './test-utils';

const tables = [
  'docs_analytics_events',
  'docs_analytics_sessions',
  'docs_analytics_pageviews_daily',
  'docs_analytics_referrers_daily',
  'docs_analytics_utm_daily',
  'docs_analytics_interactions_daily',
  'docs_analytics_geo_daily',
];
afterEach(async () => {
  for (const table of tables) await env.DB.prepare(`DELETE FROM ${table}`).run();
  await env.DB.prepare('DELETE FROM site_analytics_events').run();
});

function request(empty: boolean) {
  return new Request('https://example.test/api/docs/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      events: empty
        ? []
        : [
            {
              event_type: 'pageview',
              event_name: 'view',
              properties: { url: '/docs' },
              session_id: 'reader',
              timestamp: '2000-01-01T00:00:00Z',
            },
          ],
    }),
  });
}

describe('docs ingestion resource boundary', () => {
  it('aggregates documentation CTA clicks without a legacy target property', async () => {
    const response = await fetchWorker(
      new Request('https://example.test/api/site/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          events: [
            {
              event_type: 'cta_click',
              event_name: 'cta_interaction',
              session_id: 'docs-reader',
              properties: {
                path: '/docs/install/',
                cta_type: 'install_command_copied',
                cta_label: 'Install command',
              },
            },
          ],
        }),
      })
    );
    expect(response.status).toBe(200);
    await refreshDocsAnalyticsAggregates(env.DB, Date.now());
    const dashboard = await handleDocsAnalyticsDashboard(
      new Request('https://example.test/api/docs/analytics/dashboard'),
      env
    );
    expect(dashboard.status).toBe(200);
    expect(await dashboard.json()).toMatchObject({
      top_interactions: [
        { interaction_type: 'cta_interaction', target: 'install_command_copied', count: 1 },
      ],
    });
  });
  it('includes collected site documentation traffic and excludes other paths', async () => {
    const response = await fetchWorker(
      new Request('https://example.test/api/site/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'CF-IPCountry': 'US' },
        body: JSON.stringify({
          events: ['/docs', '/docs/install/', '/docs-lookalike', '/pricing'].map(path => ({
            event_type: 'pageview',
            event_name: 'page_view',
            session_id: 'docs-reader',
            properties: { path, referrer: 'github.com', utm: { source: 'newsletter' } },
          })),
        }),
      })
    );
    expect(response.status).toBe(200);
    await refreshDocsAnalyticsAggregates(env.DB, Date.now());
    await refreshDocsAnalyticsAggregates(env.DB, Date.now());
    const dashboard = await handleDocsAnalyticsDashboard(
      new Request('https://example.test/api/docs/analytics/dashboard?days=7'),
      env
    );
    expect(dashboard.status).toBe(200);
    expect(await dashboard.json()).toMatchObject({
      summary: { total_pageviews: 2 },
      top_pages: expect.arrayContaining([
        expect.objectContaining({ path: '/docs', views: 1 }),
        expect.objectContaining({ path: '/docs/install/', views: 1 }),
      ]),
      top_referrers: [expect.objectContaining({ referrer: 'github.com', pageviews: 2 })],
      utm_campaigns: [expect.objectContaining({ utm_source: 'newsletter', pageviews: 2 })],
      geographic: [expect.objectContaining({ country_code: 'US', pageviews: 2 })],
    });
    expect(
      await env.DB.prepare('SELECT COUNT(*) AS count FROM site_analytics_events').first('count')
    ).toBe(4);
    expect(
      await env.DB.prepare('SELECT COUNT(*) AS count FROM docs_analytics_events').first('count')
    ).toBe(0);
  });
  it.each([true, false])('does not schedule aggregates for empty=%s', async empty => {
    const ctx = createExecutionContext();
    const queries: string[] = [];
    const prepare = env.DB.prepare;
    env.DB.prepare = function (sql: string) {
      queries.push(sql);
      return prepare.call(env.DB, sql);
    };
    try {
      const response = await handleDocsAnalytics(request(empty), env, ctx);
      await waitOnExecutionContext(ctx);
      expect(response.status).toBe(200);
      expect(queries.some(query => /GROUP BY/i.test(query))).toBe(false);
      if (empty) expect(queries).toHaveLength(0);
    } finally {
      env.DB.prepare = prepare;
    }
  });

  it('refreshes today and yesterday idempotently including late writes', async () => {
    const now = Date.UTC(2026, 8, 13, 0, 5);
    for (const [id, date, session, duration] of [
      ['one', '2026-09-12 23:59:00', 'a', 100],
      ['two', '2026-09-12 23:59:30', 'a', 300],
      ['three', '2026-09-13 00:01:00', 'b', 200],
    ] as const) {
      await env.DB.prepare(
        `INSERT INTO docs_analytics_events (id, event_type, event_name, properties, timestamp, session_id, duration_ms) VALUES (?, 'pageview', 'view', ?, ?, ?, ?)`
      )
        .bind(
          id,
          JSON.stringify({ url: '/docs', country: 'US', utm: { source: 'newsletter' } }),
          date,
          session,
          duration
        )
        .run();
    }
    await refreshDocsAnalyticsAggregates(env.DB, now);
    await env.DB.prepare(
      `INSERT INTO docs_analytics_events (id, event_type, event_name, properties, timestamp, session_id, duration_ms) VALUES ('late', 'pageview', 'view', ?, '2026-09-12 23:59:59', 'c', 200)`
    )
      .bind(JSON.stringify({ url: '/docs', country: 'US', utm: { source: 'newsletter' } }))
      .run();
    await refreshDocsAnalyticsAggregates(env.DB, now);
    const ctx = createExecutionContext();
    await worker.scheduled(
      createScheduledController({ scheduledTime: now, cron: '*/5 * * * *' }),
      env,
      ctx
    );
    await waitOnExecutionContext(ctx);
    const rows = await env.DB.prepare(
      'SELECT date, views, unique_sessions, avg_time_on_page_ms FROM docs_analytics_pageviews_daily ORDER BY date'
    ).all();
    expect(rows.results).toEqual([
      { date: '2026-09-12', views: 3, unique_sessions: 2, avg_time_on_page_ms: 200 },
      { date: '2026-09-13', views: 1, unique_sessions: 1, avg_time_on_page_ms: 200 },
    ]);
    expect(
      (
        await env.DB.prepare('SELECT COUNT(*) AS count FROM docs_analytics_utm_daily').first<{
          count: number;
        }>()
      )?.count
    ).toBe(2);
  });
});
