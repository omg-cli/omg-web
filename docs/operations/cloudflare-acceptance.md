# Cloudflare acceptance status

Verified through 2026-10-10 02:15 UTC. This record supersedes older deployment
checkpoints in the delivery, staging and observability runbooks.

## Deployed release

Production API `omg-saas` runs source
`e5bfbec3245d62a59001252024469cb2939bb79e`, version
`29cf10ed-5d71-496a-bd43-98a8b3388a4f`, deployment
`9f467453-4019-459b-9a0b-1dbba7fdd45d`. HTTP 200 health reports the expected identity.
Signed-in Overview, Analytics and Machines pages and all three deployed
authorization checks passed. The API-only release applied no migrations and
preserved the site version, bindings, Smart Placement, logs, traces and schedules.
Rollback version is `9153c55b-0bdb-4bd0-9781-345e50504975`; rolling back a Worker
does not restore database writes.

The same source passed fresh staging sign-in through the existing production
GitHub OAuth app. Signing out of staging left production signed in, and a
production session could not authenticate signed-out staging. Staging billing is
disabled; all seven billing routes return 404. Paid purchase, webhook and CLI
license activation acceptance remain explicitly deferred to future paid tiers.

The dashboard batches twelve independent authorized reads while preserving
tenant filters and response contracts. Nine staging samples had median wall time
738 ms before and 247 ms after. This is not a production percentile measurement.

## Operational acceptance

- The actual production five-minute invocation scheduled at 00:55:51 UTC passed.
- The actual daily invocation scheduled at 02:00:51 UTC completed all six tasks
  and the coordinator, with outcome `ok`, zero exceptions and an untruncated live
  capture. Retained logs independently match the deployed version and invocation.
  The 26-hour daily absence query changed from 1 to 0. Both owned tails were
  deleted and their absence verified.
- The disposable D1 recovery drill applied 17 migrations, passed eight checks and
  deleted the drill database. Its migration hashes match the current source. This
  does not establish whole-provider recovery or a production recovery-time SLA.
- Existing runtime, API/site HTTP, aggregation and scheduled-failure notifications
  are enabled. Cloudflare recorded the previously authorized synthetic email as
  sent; actual incident delivery and inbox receipt remain unobserved.
- The additional daily-retention notification is still disabled and has no policy
  ID. Its execution/query prerequisites passed; the specific delivery-authorization
  question is pending. No additional test email is authorized.

The release-tooling follow-up at `cef21e98b643abd52fe88f369a06fd1943178030`
passed 19 local release tests and exact-source CI run `38014568549`, attempt 2.
The browser retry passed 22 tests with three configured deployed-auth skips;
separate deployed authorization checks passed. Attempt 1 timed out while installing
Ubuntu dependencies before browser tests began. Its evidence is retained; the
successful retry does not establish a permanent mirror fix. This tooling-only
follow-up was not published as a Worker release.

## Remaining external work

- Removed staging Cron: an eleven-minute observation covered two schedule
  boundaries with live health controls and no scheduled events. Cause and
  permanent cessation remain unproven. Cloudflare case `02369828` is open.
- DNSSEC: both zones report pending. `getomg.dev` uses Cloudflare Registrar and was
  enabled on October 9 at 22:42 UTC, within the documented one-to-two-day activation
  window. `getomg.xyz` uses Spaceship; registry RDAP reports an unsigned delegation,
  and the resolver returns no DS record. Registrar sign-in is required to finish
  publishing Cloudflare's DS record. Do not treat these as identical propagation
  waits. See [Cloudflare Registrar DNSSEC](https://developers.cloudflare.com/registrar/get-started/enable-dnssec/).
- Daily email delivery still requires the pending explicit authorization.

The bounded Artifacts/Containers trial is stopped after its approved third run.
Its full project check and backup passed, but allocation failed before browser
execution. Compute cleanup was verified. No fourth trial is authorized.

## Evidence

Sanitized receipts are retained in the local audit workspace
`C:/Users/olen/Documents/Codex/cloudflare-startup-review-20261007/evidence/`:

- `d1-batch-production-acceptance-20261010.json`
- `staging-dashboard-batch-acceptance-20261009.json`
- `production-native-daily-acceptance-20261010.json`
- `recovery-drill-current-20261009-verified/receipt.json`
- `health-polling-ci-acceptance-20261010.json`

The older production receipt's pending-daily limitation is superseded by the
later daily receipt. Its notification authorization field predates the pending
question; neither receipt is evidence that the additional alert is enabled.
