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

Browser failures are sent through Sentry only when the server-owned `SENTRY_DSN` configuration is present. Browser code must not receive Worker credentials. The production and staging Wrangler configurations redact query strings; this change takes effect when those configurations are deployed. Application error messages still need their own privacy review.

## Alerting

Saved queries do not send notifications. The following initial alert conditions are proposed and NOT yet provisioned. Validate them with the account's available datasets and destination before activation:

1. Runtime exceptions: any in five minutes. HTTP failures: at least five 5xx responses and at least 5% of requests in five minutes, scoped separately to each production Worker. Client cancellations are not automatically server errors.
2. Scheduled failures: any failed invocation. Missing aggregation: no successful five-minute aggregation in 20 minutes; missing daily retention: no successful daily invocation in 26 hours. Enable these conditions after the scheduled-error fix is deployed and verified.
3. Billing inbox: any dead event, failed event older than 15 minutes, or received/processing event older than 15 minutes. A fresh in-flight event is not a failure. Inspect retries and claims before replaying anything.
4. Latency: gather a representative baseline first. The 2026-10-09 observation had only five site requests and two API requests in 15 minutes, which is insufficient to choose a reliable p95 threshold.
5. Credit spend: preserve the existing account budget policy while confirming grant eligibility, balance, and expiry. Do not treat a usage alert as proof that credits cover the charge.

Configure notifications in Cloudflare Alerts. A synthetic failure and confirmed delivery are required before calling alerting complete. The available SQL dataset catalogue was readable on 2026-10-09, but a SQL log query using the local Wrangler OAuth credentials returned 403. Workers Observability queries through the connector succeeded. Catalogue discovery alone does not prove SQL-query permission.

## Saved queries and measured baseline

The following queries were validated against live data and saved on 2026-10-09 in account `f1e95b3e1b502cf366dfc81a863695fa`. Their exact API definitions are in [omg-observability-queries.json](./omg-observability-queries.json).

| Saved query                       | ID                         |
| --------------------------------- | -------------------------- |
| OMG production HTTP 5xx           | `lpzf314nc05gagwzwtq3e1vv` |
| OMG production request latency    | `0g0dmd7bmbmaubxtn0ophd5g` |
| OMG production scheduled outcomes | `4u8l0gwysxw4vzeccl2tfop5` |

The sampled 15-minute window had no matching 5xx rows and three five-minute scheduled invocations with runtime outcome `ok`. The 24-hour query reported 289 scheduled invocations with `ok`; before the scheduled-error fix is published, caught task failures can still appear successful. A read-only D1 aggregate found three processed Stripe events and no other statuses. These are point-in-time observations, not an uptime or delivery guarantee.

Scheduled tasks now emit `<task>_completed` only after success and `<task>_failed` on failure. All independent tasks settle before the handler rejects with an aggregate error. `scheduled.completed` is emitted only when every selected task succeeds. Audit-log cleanup propagates its error to this coordinator. Tests remove individual D1 tables and verify that the invocation rejects while independent Stripe retention still runs.

## Operational queries

Use Cloudflare Workers Logs to monitor:

1. Uncaught exceptions and invocations with 5xx responses.
2. Repeated authentication, rate-limit, Stripe, email, and provider failures.
3. Scheduled-handler failures and missing successful aggregation events.
4. Elevated D1, R2, service-binding, or external-fetch latency in traces.

Correlate by Cloudflare invocation metadata and trace identifiers. Do not introduce customer identifiers solely for log correlation.

Both `/health` responses expose `version` from `CF_VERSION_METADATA`: Cloudflare's version ID, deployment tag, and upload timestamp. Missing metadata is `null`; an empty tag does not establish a source revision. Releases must use the full Git SHA as `wrangler deploy --tag` and retain both Worker version IDs. Health probes do not verify OAuth, billing, or CLI activation.

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
- [Workers traces](https://developers.cloudflare.com/workers/observability/traces/)
- [Wrangler observability configuration](https://developers.cloudflare.com/workers/wrangler/configuration/#observability)
- [Scheduled handler failure and lifetime semantics](https://developers.cloudflare.com/workers/runtime-apis/handlers/scheduled/)
- [Worker version metadata](https://developers.cloudflare.com/workers/runtime-apis/bindings/version-metadata/)
- [Cloudflare alert conditions](https://developers.cloudflare.com/notifications/notification-available/)
