import * as Schema from 'effect/Schema';
import { jsonResponse, type Env } from './api';
import { reportError } from './observability';

const HealthRow = Schema.Struct({ healthy: Schema.Literal(0, 1) });

export async function beginScheduledTaskHealth(db: D1Database, task: string): Promise<string> {
  const now = Date.now();
  const attempt = crypto.randomUUID();
  await db
    .prepare(
      `INSERT INTO scheduled_task_health
       (task, attempt_token, last_success_at, last_attempt_at, last_attempt_succeeded)
     VALUES (?, ?, NULL, ?, 0)
     ON CONFLICT(task) DO UPDATE SET
       attempt_token = excluded.attempt_token,
       last_attempt_at = excluded.last_attempt_at,
       last_attempt_succeeded = 0`
    )
    .bind(task, attempt, now)
    .run();
  return attempt;
}

export async function completeScheduledTaskHealth(
  db: D1Database,
  task: string,
  attempt: string
): Promise<void> {
  const completedAt = Date.now();
  await db
    .prepare(
      `UPDATE scheduled_task_health SET last_success_at = ?,
       last_attempt_succeeded = CASE WHEN ? > last_failure_at THEN 1 ELSE 0 END
     WHERE task = ? AND attempt_token = ?`
    )
    .bind(completedAt, completedAt, task, attempt)
    .run();
}

export async function failScheduledTaskHealth(db: D1Database, task: string): Promise<void> {
  const failedAt = Date.now();
  await db
    .prepare(
      `UPDATE scheduled_task_health SET last_failure_at = MAX(last_failure_at, ?),
       last_attempt_succeeded = CASE WHEN last_success_at > ? THEN last_attempt_succeeded ELSE 0 END
     WHERE task = ?`
    )
    .bind(failedAt, failedAt, task)
    .run();
}

export async function handleScheduledHealth(env: Pick<Env, 'DB'>): Promise<Response> {
  try {
    const row = await env.DB.prepare(
      `WITH clock AS (SELECT round(unixepoch('subsec') * 1000) AS now)
       SELECT CASE WHEN EXISTS (
         SELECT 1 FROM scheduled_task_health, clock
         WHERE task = 'docs_analytics.aggregate'
           AND last_success_at BETWEEN clock.now - 20 * 60 * 1000 AND clock.now
       ) AND NOT EXISTS (
         SELECT 1 FROM scheduled_task_health, clock
         WHERE last_success_at IS NULL OR last_success_at > clock.now
           OR last_attempt_at > clock.now
           OR (last_attempt_succeeded = 0 AND (
             last_failure_at >= last_success_at
             OR last_attempt_at < clock.now - 60 * 1000
           ))
       ) THEN 1 ELSE 0 END AS healthy`
    ).first();
    const { healthy } = Schema.decodeUnknownSync(HealthRow)(row);
    return jsonResponse(
      { status: healthy === 1 ? 'ok' : 'unavailable' },
      healthy === 1 ? 200 : 503
    );
  } catch (error) {
    reportError('scheduled_health.read_failed', error);
    return jsonResponse({ status: 'unavailable' }, 503);
  }
}
