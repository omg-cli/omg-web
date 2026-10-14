CREATE TABLE scheduled_task_health (
  task TEXT PRIMARY KEY,
  attempt_token TEXT NOT NULL,
  last_success_at INTEGER,
  last_attempt_at INTEGER NOT NULL,
  last_attempt_succeeded INTEGER NOT NULL CHECK (last_attempt_succeeded IN (0, 1))
);

CREATE VIEW docs_analytics_source_events AS
SELECT id, event_type, event_name, properties, timestamp, session_id, duration_ms
FROM docs_analytics_events
UNION ALL
SELECT id,
       CASE WHEN event_type = 'click' THEN 'interaction' ELSE event_type END,
       event_name,
       json_set(properties,
         '$.url', json_extract(properties, '$.path'),
         '$.referrer', COALESCE(json_extract(properties, '$.referrer_domain'), 'direct'),
         '$.country', COALESCE(country_code, 'XX'),
         '$.target', COALESCE(json_extract(properties, '$.target'),
           json_extract(properties, '$.cta_type'), event_name)),
       strftime('%Y-%m-%d %H:%M:%f', created_at / 1000.0, 'unixepoch'),
       session_id, duration_ms
FROM site_analytics_events
WHERE event_type IN ('pageview', 'click', 'performance')
  AND (json_extract(properties, '$.path') = '/docs'
       OR substr(json_extract(properties, '$.path'), 1, 6) = '/docs/');
