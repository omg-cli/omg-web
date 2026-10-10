# Cloudflare acceptance status

Verified through 2026-10-10 22:39 UTC. This record supersedes older deployment
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

The production site runs source `252dd24e1f071b77170388485409c803acb4166e`,
version `62b1124c-06cd-40b4-9a3b-c01d480562c0`, deployment
`9536379b-a65e-4f8e-99ad-17e3a9df067c`. Its rollback version is
`65974306-855b-4aa7-9c40-eadb911eeb00`. The staging site runs the same source
at version `6cb9ad84-afc1-4724-84e6-b5bcd06cff18`; the staging API runs the
API source above at version `c01608aa-bfc7-4ca4-89f8-690263b79c44`.
Live bindings confirm that staging uses its separate D1 database and API Worker.

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
  A fresh retained-log check also found successful production invocations at
  22:15, 22:20, 22:25 and 22:30 UTC on the current API version.
- The actual daily invocation scheduled at 02:00:51 UTC completed all six tasks
  and the coordinator, with outcome `ok`, zero exceptions and an untruncated live
  capture. Retained logs independently match the deployed version and invocation.
  The 26-hour daily absence query changed from 1 to 0. Both owned tails were
  deleted and their absence verified.
- The disposable D1 recovery drill applied 17 migrations, passed eight checks and
  deleted the drill database. Both live databases contain all 17 canonical
  migration names, and all current migration hashes match the drill. This
  does not establish whole-provider recovery or a production recovery-time SLA.
- Existing runtime, API/site HTTP, aggregation and scheduled-failure notifications
  are enabled. Cloudflare recorded the previously authorized synthetic email as
  sent; actual incident delivery and inbox receipt remain unobserved.
- The additional daily-retention notification remains disabled and has no policy
  ID. It is outside the approved notification scope and is not an acceptance
  blocker. No additional test email is authorized.
- Production site and API logs persist at 100%, with query strings redacted;
  production trace sampling is 1%. Staging traces sample at 100%. These settings
  were rechecked against the deployed Workers. Native traces were correlated to
  invocation logs on both current production versions: API health trace
  `17673e49406f852ab64240f84819c479` and site asset trace
  `4600dc1a6e426a64129f261a12a4b206`, both HTTP 200 with outcome `ok`.
  The API capture used 200 bounded health requests at concurrency two, all healthy,
  without changing settings. It establishes health-request tracing and version
  correlation, not authenticated dashboard or D1 spans.

Exact-source CI run `38023712287`, attempt 1, passed at site source
`252dd24e1f071b77170388485409c803acb4166e`: 19 release tests, 369 site tests,
376 API tests and 22 browser tests. Three deployed-auth tests are configured to
skip in anonymous CI; separate deployed authorization checks passed all three.
Earlier dependency-installation timeout evidence remains retained. The release
tooling now bounds health polling; a green run does not establish a permanent
Ubuntu mirror fix.

HTTP/3 is enabled for `getomg.dev` and passed a real HTTP/3-only request.
Installer-only compression reduced measured shell installer transfer size from
34,236 to 10,341 bytes and PowerShell installer size from 348 to 220 bytes when
the client advertises gzip. Decoded content hashes matched. The final delivery
check passed 50 HTTP responses, 45 static-content/cache-policy comparisons and
six controls. Compression is restricted to GET/HEAD on `/install.sh` and
`/install.ps1`; other delivery settings retain their baseline values.

A narrow scanner-path WAF rule is also enabled for `getomg.dev`. Its expression
passed 66 observation-mode trace cases, eight block-mode trace cases and 21 real
HTTP checks. This does not establish that the broader managed WAF is enforcing.

## Remaining external work

- Removed staging Cron: the live API schedule list is empty. The earlier
  observation found no scheduled events with live health controls. Cause and
  permanent cessation remain unproven; Cloudflare case `02369828` remains the
  follow-up record, rather than a reason to stop other work.
- Registrar and `getomg.xyz` DNSSEC work is explicitly deferred by the user. No
  Spaceship sign-in or registrar change is required for this acceptance scope.
- Paid purchase, licensing and paid CLI activation are deferred to future tiers.

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
- `security-feed-cache-ci-acceptance-20261010.json`
- `core-goal-live-state-audit-20261010.json`
- `core-goal-ledger-audit-20261010.json`
- `core-goal-recovery-hash-audit-20261010.json`
- `current-api-health-trace-capture-20261010.json`
- `current-production-trace-correlation-20261010.json`
- `public-delivery-final-verification-20261010.json`
- `scanner-waf-acceptance-20261010.json`

The older production receipt's pending-daily limitation is superseded by the
later daily receipt. Neither receipt is evidence that the additional daily alert
is enabled. Historical trace receipts identify earlier Worker versions and must
not be presented as proof of a trace on the current release.
