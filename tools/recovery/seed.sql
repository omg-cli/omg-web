INSERT INTO auth_user (id, name, email, email_verified)
VALUES ('drill-user', 'Synthetic recovery fixture', 'recovery@example.invalid', 1);
INSERT INTO auth_session (id, user_id, token, expires_at)
VALUES ('drill-session', 'drill-user', 'synthetic-session-never-used-by-a-worker', 4102444800000);
INSERT INTO customers (id, stripe_customer_id, email, tier)
VALUES ('drill-customer', 'cus_synthetic_recovery', 'recovery@example.invalid', 'pro');
INSERT INTO licenses (id, customer_id, license_key, tier, status, used_seats)
VALUES ('drill-license', 'drill-customer', 'synthetic-license-never-issued', 'pro', 'active', 1);
INSERT INTO machines (id, license_id, machine_id, is_active)
VALUES ('drill-machine', 'drill-license', 'synthetic-machine', 1);
INSERT INTO stripe_events (
  id, stripe_event_id, event_type, customer_id, status, attempt_count,
  processing_started_at, claim_token, event_data
) VALUES (
  'drill-event', 'evt_synthetic_recovery', 'customer.subscription.updated',
  'drill-customer', 'processing', 2, '2026-01-01 00:00:00', 'synthetic-lease-before', '{}'
);
INSERT INTO stripe_subscription_reconciliations (stripe_subscription_id, token)
VALUES ('sub_synthetic_recovery', 'synthetic-fence-before');
