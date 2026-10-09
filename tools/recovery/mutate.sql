DELETE FROM auth_session WHERE id = 'drill-session';
UPDATE licenses SET status = 'cancelled' WHERE id = 'drill-license';
UPDATE machines SET is_active = 0 WHERE id = 'drill-machine';
UPDATE stripe_events SET status = 'processed', processed = 1, claim_token = 'synthetic-lease-after'
WHERE id = 'drill-event';
UPDATE stripe_subscription_reconciliations SET token = 'synthetic-fence-after'
WHERE stripe_subscription_id = 'sub_synthetic_recovery';
INSERT INTO auth_user (id, name, email) VALUES ('after-bookmark', 'Discarded synthetic row', 'discard@example.invalid');
