# Production observability policy

This repository treats version-controlled Alchemy and Wrangler configuration as the source of truth for Cloudflare Workers observability. Deployments must not rely on dashboard-only logging settings.

Current runtime, 2026-10-09: the production API was promoted after explicit approval
from `b2ef8e92d8b2bc85a47327ff4b7e33447f095b9f` / exact-source CI `37988739309`.
Version `9153c55b-0bdb-4bd0-9781-345e50504975` reports actual deployment metadata and
HTTP200 health. Prior production bindings, variables, secret names and Cron
expressions remain intact. Persistent logs/traces and Issues detection are retained.
The site was not republished. Native staging Cron acceptance passed for the identical
runtime, including all completion logs and outcome `ok`. Configuration cleanup is
verified; runtime cessation remains open as described below. Retained structured
logs and signed-in SQL preview verify exact `attributes['message.event']` matching.
The two newly authorized scheduled policies are enabled; actual incident delivery
and native daily retention still
require separate evidence. The implementation checkpoints below retain their original
scope; statements about the pending production API release are historical.

Native production five-minute acceptance passed for the new API version: scheduled
at `2026-10-09T21:10:51Z`, completed at `21:11:18.317Z`, outcome `ok`, no exceptions.
The untruncated live tail records `stripe_inbox.health_completed`,
`docs_analytics.aggregate_completed` and `scheduled.completed`. The retained query
returned one matching analytics completion row; it independently confirms the
version and scheduledTime but does not prove all three persisted completions.
The owned tail was deleted and its absence verified.

A later untruncated live tail found that staging native five-minute runs continued
through `2026-10-09T21:45:51Z` despite empty configured schedules after the 21:02 UTC
cleanup and 21:28 UTC refresh. The latter invocation occurred beyond the documented
15-minute propagation window. A staging-only Wrangler trigger deployment reapplied
empty schedules at 21:47:40 UTC, without uploading runtime, routes, bindings or
secrets. Readback confirms empty schedules, unchanged production/staging deployment
IDs, unchanged production Cron, and disabled staging workers.dev/previews. The owned
tail was deleted with empty inventory readback. Runtime cessation after this direct
client repair remains unverified; inspect the first post-propagation 22:05 UTC
boundary after invocation/log latency. API readback alone does not prove dispatch
stopped. No additional provider work or production failure was injected.

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

Saved queries do not send notifications. The following operational conditions have separate acceptance states:

1. HTTP failure rates: two custom SQL policies enabled on 2026-10-09 after explicit authorization, separately for the production API (`9fdb3dbf577c4a65b0ad1052b140dff4`) and site (`ff4eac3a988545e4b5cbc0ad531e5b68`). They trigger on at least five 5xx responses and at least 5% of requests in five minutes, evaluate every five minutes, and repeat at most hourly to the authorized existing email destination. Readback verifies both SQL expressions, thresholds, intervals, enabled state, and sole destination. No additional synthetic email was sent; real incident delivery has not yet been observed. Client cancellations are not automatically server errors. Native Issues occurrence rules are distinct from this rate calculation.
2. Scheduled failures: any of the six explicit failed-task events in 15 minutes. Missing aggregation: no successful five-minute aggregation in 20 minutes. Both policies were enabled after explicit authorization on 2026-10-09: `99d5c43a4f9b41bda659420135d86630` and `5ff482687d4f4415aac1bed9ec84c705`. Exact queries, threshold >=1, one-minute evaluation windows, five-minute checks, hourly repeats, enabled state and sole existing email destination passed API readback. Incident delivery is unverified, and no additional test email was sent. Missing daily retention remains disabled until its native daily completion and healthy SQL signal are accepted.
3. Billing inbox: the deployed scheduled health check detects any unprocessed dead event, received/failed event older than 15 minutes, or processing lease older than 15 minutes. A processing row without a lease uses its creation time; a missing/invalid age is unhealthy. Fresh processing leases are protected even for an older event. The check is read-only and does not replay events. Native healthy completion is verified in production; notification delivery for this condition remains pending.
4. Latency: gather a representative baseline first. The 2026-10-09 observation had only five site requests and two API requests in 15 minutes, which is insufficient to choose a reliable p95 threshold.
5. Credit spend: existing policy `dba385c80560401793bffee7b8c119f6` is enabled with a $10 usage-spend threshold, verified on 2026-10-09. The signed-in Credits dashboard confirms an active $10,000 grant, estimated remaining balance $10,000 as of October 9, programme start October 6, 2026, and expiry October 6, 2027. Monthly invoices confirm the final balance. The dashboard excludes Registrar purchases and AI Gateway and lists product credit caps of $10,000 for R2 and $50,000 for Workers AI; these caps do not increase the account's $10,000 grant. Preserve the alert: it monitors account-wide usage spend, not remaining grant credit. Budget alerts do not cap spend or include recurring subscription fees.

The available SQL dataset catalogue was readable on 2026-10-09, but a SQL log query using the local Wrangler OAuth credentials returned 403. A fresh scoped `logs.workersLogs` count query confirmed the same authorization failure. The connector also treats the SQL API's nonstandard success envelope as an error, so that path did not provide a usable query result. Workers Observability queries through the connector succeeded. Catalogue discovery alone does not prove SQL-query permission. Native Issues automation does not depend on those SQL-query credentials.

After dashboard sign-in on 2026-10-09, Alerts → Create an alert → Custom alert → Custom SQL successfully previewed `logs.workersLogs` without changing credentials. One preview initially returned a permission-service 503; retry succeeded. The proposed `logType = 'invocation'` filter returned no site requests. The documented invocation value `cf-worker-event` returned live site fetches with HTTP status values. Both corrected HTTP failure expressions previewed as 0, and a read-only positive control using known successful responses returned 1. These are query-validation results, not notification delivery tests.

The [metric alert record](./omg-metric-alert-candidates.json) contains two enabled HTTP policies, two enabled scheduled-job policies and one disabled daily candidate. It is an operational record, not an API request body; update the enabled policy IDs rather than creating duplicates. The expressions use threshold detection and a manual SQL time range because they contain rolling windows. The saved one-minute evaluation window avoids averaging the result over a longer period. The daily candidate has no policy or delivery configured. Missing completion logs can also reflect ingestion or sampling gaps; these queries are not independent synthetic uptime checks.

After the production API promotion, signed-in SQL preview on 2026-10-09 exposed a
broken draft: `message LIKE '%docs_analytics.aggregate_completed%'` returned zero
despite known native completions. A source-log control returned data, and the exact
JSON key `attributes['message.event'] = 'docs_analytics.aggregate_completed'`
matched the live completions. Use this exact key; SQL JSON lookup treats the dotted
name as one top-level attribute, not nested traversal.

The corrected missing-aggregation expression returns numeric `1` when its
20-minute count is zero and `0` otherwise. Its healthy preview returned `0`; a
read-only nonexistent-event control returned `1`, including the empty aggregate
case. Filter native scheduled custom logs with `invocationType = 'scheduled'`
and `logType = 'cf-worker'`. Check every five minutes and repeat at most hourly
to the separately authorized existing destination. Preview controls do not prove delivery.

Daily completion now checks `scheduled.completed` together with
`invocationLabel = '0 2 * * *'` in a 26-hour window. The native five-minute
control verified Cron-label correlation. The coordinator emits success only after
every selected task succeeds, so this avoids combining unrelated daily task logs.
The daily absence expression currently returns `1`: this version has not yet
reached its first 02:00 UTC native daily run. Keep this candidate disabled until
that invocation and the healthy SQL result are observed; do not activate it from
the absence result or the earlier manual daily drill.

The scheduled-failure candidate counts the six explicit `<task>_failed` events,
including `stripe_inbox.health_failed`, in 15 minutes. All six names match the
deployed scheduler source. The actual production expression previewed as `0`;
the same OR predicate using known completion names had positive matches. This
validates field/predicate matching, not an injected production failure or incident
delivery. Its five-minute evaluation and hourly repeat were enabled after the
separate human approval; exact API readback matched the prepared request.

Even with full ingestion, retained queries can adaptively sample rows. A refreshed
production query represented the first analytics completion with sample interval
10 and a later native run with interval 1. Represented counts are not actual run
counts. Do not interpret an absent sampled log as conclusive proof that a job did
not run, or require four individually sampled daily completions when one correlated
successful coordinator signal expresses the required outcome.

The live Traces dashboard also verifies an actual staging native scheduled trace
on version `38887e7f-e0c5-4f12-b9c6-a8c2082b51d1`: one scheduled root and three D1
spans, 292 ms root duration, with no errors. The D1 spans show the read-only inbox
health query and analytics batches.

Current production tracing was subsequently accepted for both actual deployed
versions without changing 1% sampling:

- API trace `845669cce5ad52641cd1172bb6a6d243` on version
  `9153c55b-0bdb-4bd0-9781-345e50504975` records the native 21:35:51 UTC five-minute
  invocation: one scheduled root and three D1 spans, 432 ms trace duration, no
  errors and outcome `ok`. Invocation wall time is separately 461 ms and CPU 19 ms.
  Retained inbox-health, analytics and coordinator completions match the same
  request ID, trace ID, version, Cron expression and scheduledTime.
- Site trace `aa5dbaf1e6ccdb0f2664f7c639545928` on version
  `65974306-855b-4aa7-9c40-eadb911eeb00` records a public CSS asset GET with a cache
  span: 238 ms trace duration, no errors, outcome `ok` and HTTP 200. Its invocation
  log and dashboard root independently confirm the actual version. This proves
  site tracing, not an authenticated application latency baseline.

A traces-view query filtered by both service and script version returned no site
rows even though the service-only query exposed the above current-version trace.
Use `$metadata.service` to find traces, then verify the actual version with a
trace-ID-correlated invocation event and the dashboard root. An empty traces-view
version filter is not sufficient evidence of absent tracing. Keep HTTP evidence
bounded; do not retain headers, cookies, customer data or precise location.

The API inbox-health span has 258 ms duration while its D1 SQL reports 0.3041 ms,
zero changes, and zero rows written. The Worker ran at LHR and the D1 primary at
LAX. Binding/network overhead is a performance lead, not a network-only measurement
or an interactive p95 baseline. Placement affects fetch handlers, not Cron; changing
Smart Placement does not address this scheduled sample. D1 read replication would
require a Sessions API consistency design before adoption.

## Saved queries and measured baseline

The following queries were validated against live data and saved on 2026-10-09 in account `f1e95b3e1b502cf366dfc81a863695fa`. Their exact API definitions are in [omg-observability-queries.json](./omg-observability-queries.json).

| Saved query                       | ID                         |
| --------------------------------- | -------------------------- |
| OMG production HTTP 5xx           | `lpzf314nc05gagwzwtq3e1vv` |
| OMG production request latency    | `0g0dmd7bmbmaubxtn0ophd5g` |
| OMG production scheduled outcomes | `4u8l0gwysxw4vzeccl2tfop5` |

The sampled 15-minute window had no matching 5xx rows and three five-minute scheduled invocations with runtime outcome `ok`. The 24-hour query reported 289 scheduled invocations with `ok`; before the scheduled-error fix is published, caught task failures can still appear successful. A read-only D1 aggregate found three processed Stripe events and no other statuses. These are point-in-time observations, not an uptime or delivery guarantee.

The deployed production API emits `<task>_completed` only after success and `<task>_failed` on failure. All independent tasks settle before the handler rejects with an aggregate error. `scheduled.completed` is emitted only when every selected task succeeds. Audit-log cleanup propagates its error to this coordinator. Tests remove individual D1 tables and verify that the invocation rejects while independent Stripe retention still runs. Production native five-minute success is accepted; native daily execution remains pending. Staging configured Cron is empty, but runtime cessation remains open as described above.

The deployed scheduler additionally runs `stripe_inbox.health` independently of
aggregation and retention. It emits `stripe_inbox.health_completed` on success
or `stripe_inbox.health_failed` and rejects the invocation when the inbox needs
review. Its error text contains no event IDs, customer data, payload, or claim.
Real Worker/D1 tests verify dead/stale detection, fresh lease protection, missing
timestamps, inbox preservation, and independent daily retention. The scheduler,
webhook, and reconciliation suites pass 40 tests. Production native healthy
completion is accepted; actual incident notification delivery remains unverified.

The webhook follow-up emits `stripe_webhook.retry_limit_exhausted` when an incoming
delivery finds an exhausted failed row or an exhausted processing row whose lease
has expired. The atomic transition clears the raw payload and claim and records a
dead event without starting a twenty-first attempt. Subsequent deliveries are
acknowledged. An active final lease is still busy and can complete. This code is
included in the accepted production API source `b2ef8e9`; it does not detect an
abandoned event without another delivery, so the deployed scheduled health check
remains necessary. Paid webhook acceptance is deferred.

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

Both implementations expose `version` from `CF_VERSION_METADATA` in `/health`: Cloudflare's version ID, deployment tag, and upload timestamp. Production API identity is accepted for source `b2ef8e9` and its actual version above. Current staging source `ddee760` runs with `BILLING_ENABLED=false`; both health endpoints return200 with verified source/version identities, and API health reports `features.billing=disabled`. Stripe test configuration is only required when staging billing is enabled. Live site health responses carry the verified version tags. Missing metadata is `null`; an empty tag does not establish a source revision. Releases must use the full Git SHA as `wrangler deploy --tag` and retain both Worker version IDs. Health probes do not verify OAuth, paid billing, or CLI activation; paid-tier acceptance is deferred.

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
- [Placement scope and requirements](https://developers.cloudflare.com/workers/configuration/placement/)
- [D1 read replication and Sessions API consistency](https://developers.cloudflare.com/d1/best-practices/read-replication/)
- [Cron trigger propagation](https://developers.cloudflare.com/workers/configuration/cron-triggers/)
- [Wrangler observability configuration](https://developers.cloudflare.com/workers/wrangler/configuration/#observability)
- [Scheduled handler failure and lifetime semantics](https://developers.cloudflare.com/workers/runtime-apis/handlers/scheduled/)
- [Worker version metadata](https://developers.cloudflare.com/workers/runtime-apis/bindings/version-metadata/)
- [Cloudflare alert conditions](https://developers.cloudflare.com/notifications/notification-available/)
- [Budget alert scope and behavior](https://developers.cloudflare.com/billing/manage/budget-alerts/)
- [SQL API function and sampling semantics](https://developers.cloudflare.com/analytics/sql-api/sql-reference/functions/)
