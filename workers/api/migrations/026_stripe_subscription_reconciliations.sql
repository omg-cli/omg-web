-- One fencing token per subscription. Reserve before fetching current Stripe
-- state and project only while that token remains current. A newer read fences
-- out older in-flight work without assuming subscription statuses are monotonic.
CREATE TABLE stripe_subscription_reconciliations (
  stripe_subscription_id TEXT PRIMARY KEY NOT NULL,
  token TEXT NOT NULL
);
