SELECT name FROM d1_migrations ORDER BY name;
PRAGMA quick_check;
PRAGMA foreign_key_check;
SELECT COUNT(*) = 1 AS valid FROM auth_session s JOIN auth_user u ON u.id = s.user_id
WHERE s.id = 'drill-session' AND u.email_verified = 1
  AND s.token = 'synthetic-session-never-used-by-a-worker' AND s.expires_at = 4102444800000;
SELECT COUNT(*) = 1 AS valid FROM licenses l JOIN customers c ON c.id = l.customer_id
JOIN machines m ON m.license_id = l.id
WHERE l.id = 'drill-license' AND l.status = 'active' AND l.tier = 'pro'
  AND c.tier = 'pro' AND l.used_seats = 1 AND m.is_active = 1;
SELECT COUNT(*) = 1 AS valid FROM stripe_events
WHERE id = 'drill-event' AND status = 'processing' AND processed = 0 AND attempt_count = 2
  AND claim_token = 'synthetic-lease-before' AND processing_started_at = '2026-01-01 00:00:00';
SELECT COUNT(*) = 1 AS valid FROM stripe_subscription_reconciliations
WHERE stripe_subscription_id = 'sub_synthetic_recovery' AND token = 'synthetic-fence-before';
SELECT COUNT(*) = 0 AS valid FROM auth_user WHERE id = 'after-bookmark';
