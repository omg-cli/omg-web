import * as Schema from 'effect/Schema';

const InboxHealthSchema = Schema.Struct({ unhealthy: Schema.Literal(0, 1) });

/** Detect abandoned deliveries without claiming, replaying, or exposing their data. */
export async function checkStripeInboxHealth(db: D1Database): Promise<void> {
  const row = await db
    .prepare(
      `SELECT EXISTS (
       SELECT 1 FROM stripe_events
       WHERE processed = 0 AND (
         status = 'dead' OR (
           status IN ('received', 'failed', 'processing') AND (
             datetime(CASE WHEN status = 'processing'
               THEN COALESCE(processing_started_at, created_at) ELSE created_at END) IS NULL
             OR datetime(CASE WHEN status = 'processing'
               THEN COALESCE(processing_started_at, created_at) ELSE created_at END)
               < datetime('now', '-15 minutes')
           )
         )
       )
     ) AS unhealthy`
    )
    .first();
  const health = Schema.decodeUnknownSync(InboxHealthSchema)(row);
  if (health.unhealthy === 1) {
    throw new Error('Unresolved Stripe webhook backlog requires review');
  }
}
