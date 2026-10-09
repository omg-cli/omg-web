# Production observability policy

This repository treats version-controlled Alchemy and Wrangler configuration as the source of truth for Cloudflare Workers observability. Deployments must not rely on dashboard-only logging settings.

## Coverage

The following deployed applications enable persistent Workers Logs and traces:

- `site/alchemy.run.ts` — SvelteKit website (`omgsveltesite-website-prod-dlaqgfttmir2ky5x`)
- `workers/api/wrangler.toml` — licensing and telemetry API (`omg-saas`)

Local Worker tests use `workers/api/wrangler.test.toml` and intentionally omit production observability and Workers AI bindings.

## Sampling

Production configuration for both deployed Workers persists:

- Logs and invocation logs at `head_sampling_rate = 1`.
- Traces at `head_sampling_rate = 0.01`.

The configured log ingestion rate is 100%; query results may still carry adaptive sampling weights. Check the returned sampling metadata before interpreting counts. Traces are sampled because a trace can contain several spans. Review traffic and observability-event volume monthly. Change sampling in version control, validate it with the installed Wrangler version, and deploy through the normal release process.

## Event format and privacy

Worker application logs use Effect's JSON logger. Each event contains a stable `event` field and may contain a bounded error description. Do not log:

- Access tokens, session cookies, authorization headers, license keys, OTPs, Stripe secrets, or webhook signatures.
- Raw request or response bodies.
- Email addresses, names, IP addresses, machine identifiers, or other customer data unless an approved incident procedure requires it.
- D1 records or provider payloads.

Browser failures are sent through Sentry only when the server-owned `SENTRY_DSN` configuration is present. Browser code must not receive Worker credentials. Query-string redaction is verified enabled on both production and staging Workers. Application error messages still need their own privacy review.

## Alerting

Four native Issues automations are enabled as of 2026-10-09, using the authorized existing email destination on policy `919cda26f3474d09bf66616a2e4b54ab` (`OMG production runtime issues`). Each production Worker has a first-occurrence rule (`afterOccurrences: 1`) and a recurrence rule after one hour of inactivity (`afterInactivitySeconds: 3600`). Exact IDs and API bodies are in [omg-runtime-issue-automations.json](./omg-runtime-issue-automations.json). Update these IDs rather than creating duplicate rules.

Issue detection requires `observability.issues.enabled = true` independently of logs and notification rules. Both production Workers were opted in through the script-settings API; readback confirmed the setting and unchanged deployments/bindings. Wrangler production configs and the Alchemy production definition retain the setting, and `check:staging` checks it. Detection processes new traffic only. The first-occurrence rule runs once when an issue crosses its threshold; it does not email on every error. These rules cover detected runtime issues, not every operational condition below.

The synthetic drill found and corrected the missing detection opt-in. Its initial invocation was logged but produced no issue or notification. After enabling detection, one invocation created issue `5b348f48-f45d-4833-8870-6cfcf8a1bb5f`; automation run `531c93cd-1e96-4059-a569-1ad3ef9f8c41` succeeded. Cloudflare notification history records exactly one email sent at `2026-10-09T17:13:11.183702Z`, history ID `d44289b8-6f6b-4fb5-ad19-50cb6bbbe6b7`, with the label **OMG ALERT DELIVERY TEST**. This confirms Cloudflare's send record, not inbox receipt. The synthetic issue was resolved, and the temporary Worker and automation were deleted. No production failure was injected.

Detection immediately reported two live site issues classified as low-risk vulnerability scans (secret-files and source-control), with successful notification runs at 17:15 UTC. These are separate from the single synthetic email and do not establish a breach or an application failure. Native issue rules can therefore include scanner noise; observe their volume before treating every first-occurrence email as a paging incident. Both production health endpoints remained HTTP 200.

Saved queries do not send notifications. These additional alert conditions remain proposed and NOT yet provisioned:

1. HTTP failure rates: at least five 5xx responses and at least 5% of requests in five minutes, scoped separately to each production Worker. Client cancellations are not automatically server errors. Native Issues detection also recognizes 5xx/error events, but its occurrence rules are not this rate calculation.
2. Scheduled failures: any failed invocation. Missing aggregation: no successful five-minute aggregation in 20 minutes; missing daily retention: no successful daily invocation in 26 hours. Enable these conditions after the scheduled-error fix is deployed and verified.
3. Billing inbox: the pending scheduled health check detects any unprocessed dead event, received/failed event older than 15 minutes, or processing lease older than 15 minutes. A processing row without a lease uses its creation time; a missing/invalid age is unhealthy. Fresh processing leases are protected even for an older event. The check is read-only and does not replay events. Publication and live notification acceptance are still pending.
4. Latency: gather a representative baseline first. The 2026-10-09 observation had only five site requests and two API requests in 15 minutes, which is insufficient to choose a reliable p95 threshold.
5. Credit spend: existing policy `dba385c80560401793bffee7b8c119f6` is enabled with a $10 usage-spend threshold, verified on 2026-10-09. Preserve it while confirming grant eligibility, balance, and expiry. It monitors account-wide usage spend, not remaining grant credit. Budget alerts do not cap spend or include recurring subscription fees.

The available SQL dataset catalogue was readable on 2026-10-09, but a SQL log query using the local Wrangler OAuth credentials returned 403. A fresh scoped `logs.workersLogs` count query confirmed the same authorization failure. The connector also treats the SQL API's nonstandard success envelope as an error, so that path did not provide a usable query result. Workers Observability queries through the connector succeeded. Catalogue discovery alone does not prove SQL-query permission. Native Issues automation does not depend on those SQL-query credentials.

Four [metric alert candidates](./omg-metric-alert-candidates.json) record the proposed HTTP rate and missing-job queries. They are review artifacts, not provisioned policies or API request bodies. All remain disabled, without delivery mechanisms. Verify SQL permission, log-type values, and structured-event fields before saving them. Missing completion logs can also reflect ingestion or sampling gaps; these candidates are not independent synthetic uptime checks.

## Saved queries and measured baseline

The following queries were validated against live data and saved on 2026-10-09 in account `f1e95b3e1b502cf366dfc81a863695fa`. Their exact API definitions are in [omg-observability-queries.json](./omg-observability-queries.json).

| Saved query                       | ID                         |
| --------------------------------- | -------------------------- |
| OMG production HTTP 5xx           | `lpzf314nc05gagwzwtq3e1vv` |
| OMG production request latency    | `0g0dmd7bmbmaubxtn0ophd5g` |
| OMG production scheduled outcomes | `4u8l0gwysxw4vzeccl2tfop5` |

The sampled 15-minute window had no matching 5xx rows and three five-minute scheduled invocations with runtime outcome `ok`. The 24-hour query reported 289 scheduled invocations with `ok`; before the scheduled-error fix is published, caught task failures can still appear successful. A read-only D1 aggregate found three processed Stripe events and no other statuses. These are point-in-time observations, not an uptime or delivery guarantee.

The pending production API release changes scheduled tasks to emit `<task>_completed` only after success and `<task>_failed` on failure. All independent tasks settle before the handler rejects with an aggregate error. `scheduled.completed` is emitted only when every selected task succeeds. Audit-log cleanup propagates its error to this coordinator. Tests remove individual D1 tables and verify that the invocation rejects while independent Stripe retention still runs. This code is in staging, whose cron triggers remain disabled; it is not yet deployed to the production API.

The pending scheduler additionally runs `stripe_inbox.health` independently of
aggregation and retention. It emits `stripe_inbox.health_completed` on success
or `stripe_inbox.health_failed` and rejects the invocation when the inbox needs
review. Its error text contains no event IDs, customer data, payload, or claim.
Real Worker/D1 tests verify dead/stale detection, fresh lease protection, missing
timestamps, inbox preservation, and independent daily retention. The scheduler,
webhook, and reconciliation suites pass 40 tests. This code is not deployed;
staging cron triggers remain disabled, and live notification acceptance remains
required after production promotion.

The webhook follow-up emits `stripe_webhook.retry_limit_exhausted` when an incoming
delivery finds an exhausted failed row or an exhausted processing row whose lease
has expired. The atomic transition clears the raw payload and claim and records a
dead event without starting a twenty-first attempt. Subsequent deliveries are
acknowledged. An active final lease is still busy and can complete. This code is
deployed to staging at `5925bce` but not production; it does not detect an abandoned event without another delivery,
so the pending scheduled health check remains necessary.

A refreshed 24-hour query ending at `2026-10-09T18:04:37Z` reported 2,678 site
requests with p95 wall time of 138 ms and 38 API requests with p95 of 885 ms.
The site aggregate has an effective sample interval of approximately 1.0384;
the API interval is 1. These include all fetch traffic, including scans and
health probes. They are not a representative authenticated-checkout baseline,
so latency alert thresholds remain unset.

## Operational queries

Use Cloudflare Workers Logs to monitor:

1. Uncaught exceptions and invocations with 5xx responses.
2. Repeated authentication, rate-limit, Stripe, email, and provider failures.
3. Scheduled-handler failures and missing successful aggregation events.
4. Elevated D1, R2, service-binding, or external-fetch latency in traces.

Correlate by Cloudflare invocation metadata and trace identifiers. Do not introduce customer identifiers solely for log correlation.

Both implementations expose `version` from `CF_VERSION_METADATA` in `/health`: Cloudflare's version ID, deployment tag, and upload timestamp. The production API still awaits this release; the staging API readiness guard returns 503 until Stripe test configuration exists. Live site health responses carry the verified version tags. Missing metadata is `null`; an empty tag does not establish a source revision. Releases must use the full Git SHA as `wrangler deploy --tag` and retain both Worker version IDs. Health probes do not verify OAuth, billing, or CLI activation.

## Release validation

Before deploying an observability change:

1. Run repository checks and Worker tests.
2. Run `wrangler types --check` for Workers with generated bindings.
3. Run `wrangler deploy --dry-run` for each standalone Worker.
4. Build the SvelteKit application and run its production client bundle budget.
5. After an approved deployment, confirm invocation logs, one structured application event, and sampled traces in the Cloudflare dashboard.

Never mutate production bindings or sampling settings during an audit-only task.

## Primary references

- [Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/)
- [Enable Issues detection](https://developers.cloudflare.com/workers/observability/issues/)
- [Issue automation semantics and notification runs](https://developers.cloudflare.com/workers/observability/issues/automations/)
- [Workers traces](https://developers.cloudflare.com/workers/observability/traces/)
- [Wrangler observability configuration](https://developers.cloudflare.com/workers/wrangler/configuration/#observability)
- [Scheduled handler failure and lifetime semantics](https://developers.cloudflare.com/workers/runtime-apis/handlers/scheduled/)
- [Worker version metadata](https://developers.cloudflare.com/workers/runtime-apis/bindings/version-metadata/)
- [Cloudflare alert conditions](https://developers.cloudflare.com/notifications/notification-available/)
- [Budget alert scope and behavior](https://developers.cloudflare.com/billing/manage/budget-alerts/)
- [SQL API function and sampling semantics](https://developers.cloudflare.com/analytics/sql-api/sql-reference/functions/)
