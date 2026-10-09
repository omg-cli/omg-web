# OMG Cloudflare delivery plan

Status: implementation in progress, 2026-10-09. Staging isolation and test-mode
guards are deployed. The production site received the GitHub OAuth broker
bootstrap; the production API remains unchanged from PR #131. The staging D1
database has all 17 canonical migrations, and a synthetic D1 Time Travel drill
passed against the current schema with eight checks. Stripe test configuration is deferred at the user's request, so staging
API requests fail closed. See [deployment and recovery receipts](./cloudflare-staging.md).

## First milestone: isolated staging

- Use the existing GitHub OAuth application and production callback through the tested OAuth broker configuration. Do not introduce a second OAuth application or share session cookies.
- Give staging its own site Worker, API Worker, D1 binding, rate-limit namespaces, session secrets, BFF secret, and license signing key.
- The old `omg-platform-shadow` database initially had a migration absent from GitHub main; PR #131 subsequently added it. Retain the fresh `omg-platform-staging` database with the current canonical chain. Never copy production users, OAuth tokens, licenses, or Stripe data into staging.
- Keep Stripe in test mode, reject live keys in staging, and return checkout and portal traffic to staging.
- Keep production's canonical public URLs and existing sessions stable. Tag staging telemetry separately.
- Validate bindings and run the real Worker tests and deployment dry-runs before provisioning or publishing.
- Verify GitHub sign-in, Stripe test checkout and webhook delivery, then CLI activation against the staging API with a staging-only verification key. A health response alone does not satisfy this milestone.

## Subsequent milestones

1. Connect releases to a reviewed Git SHA, require CI and staging checks, retain Worker version receipts, and document rollback. Keep the CLI's QEMU validation on its existing runners.
2. Verify D1 migration history and recovery using a separate disposable database. Record restore timing and application checks; do not run a restore against production as a drill.
3. Add actionable error, latency, scheduled-job, webhook backlog, and credit-spend alerts. Confirm a synthetic failure reaches the configured alert destination. Redact tokens and OAuth query parameters from logs and traces.
4. Measure current webhook retry behavior and implement a durable retry path only where the current delivery contract needs it. Exercise duplicate delivery, transient failure, retry exhaustion, and reconciliation.
5. Consider documentation search only after delivery, recovery, and monitoring have evidence.

## Deployment identity and scheduled-task implementation

- Implemented Cloudflare's generated version metadata binding for both Workers and staging configurations. Health responses expose actual metadata, or `null` when unavailable; releases must use the full Git SHA as the version tag.
- Scheduled tasks now settle independently, emit completion only after success, and reject the invocation after any failure. The inner audit-log cleanup no longer swallows its error.
- Passed 37 focused Worker tests and 28 site tests, typechecks, source policy, lint, and four deployment dry-runs. The site changes and staging API are deployed; the production API code remains unpublished.
- Saved three validated production observability queries. Four production runtime issue automations and Worker detection are enabled. Cloudflare records one synthetic test email sent, and temporary test resources are removed. Other operational alert conditions and authenticated release acceptance remain pending; see [observability](./observability.md).
- GitHub CI at `cf3f725` passed both the full check and anonymous browser jobs (run `37961070002`). The earlier dependency audit failure is resolved by the merged Alchemy update; the audit gate remains intact.

## Recovery and webhook retry follow-up

The [staging release command](./staging-release.md) now ties publication to a clean
source commit, successful CI with explicit checkout verification, current-main
ancestry, fixed isolated bindings, required secret names, and the migration ledger.
It installs locked dependencies, captures rollback IDs, tags both Worker uploads,
and checks live version metadata. Readiness checks are read-only by default;
`--deploy` is explicit. This path deliberately refuses the current incomplete
Stripe configuration. The original bootstrap deployments do not count as full
release acceptance, and production promotion still requires the authenticated
purchase and CLI flow.

The release gate passed CI at `c4360bb` (run `37968540400`). Live refusal checks
reject a dirty checkout, an older CI/source pair, and the four missing Stripe
settings before upload. Both staging deployment IDs remain unchanged. Successful
publication through the command is still unverified while Stripe is deferred.

CLI preparation found that staging tokens still declared the production issuer.
A real Worker regression reproduced the mismatch. The pending correction chooses
`https://staging-api.getomg.xyz` only for the configured staging environment and
retains the production issuer otherwise; request hosts cannot choose the issuer.
This change is not deployed. Both CI jobs passed for runtime revision `c7f7509`
(run `37969502436`): 364 site tests, 348 API tests, and 22 public browser tests,
with three deployed-auth skips. The current OMG CLI uses
`omg account link --token-stdin` (or `OMG_DASHBOARD_TOKEN`) for optional dashboard
identity, with no feature gating. Its staging acceptance
build still needs the separate staging API origin and public verification key;
keep its signature, audience, expiry, and issuer validation intact.

The repeatable remote D1 drill now creates and deletes its own disposable database,
rejects existing database selectors, and retains source/migration hashes plus
restore receipts. From clean source `e8a7970`, all 17 migrations and eight checks
passed, including restored webhook leases and reconciliation fencing. The restore
call took 2.41 seconds; this is not a production RTO or authenticated application
recovery proof. See [the drill](./d1-recovery-drill.md).

Recovery review reproduced a webhook retry defect: a Worker interrupted on its
twentieth attempt left an expired processing row that every subsequent delivery
treated as busy. An exhausted failed row had the same behavior. The correction
atomically moves exhausted inactive rows to `dead`, clears their payload and claim,
retains an existing error, and acknowledges subsequent delivery. Active final
attempts remain protected, and an expired nineteenth attempt can still finish.
The real webhook/reconciliation suites pass 27 checks, including both reproduced
failures. This follow-up is deployed to staging at `5925bce` after both CI jobs
passed, including 364 site tests, 347 API tests, and 22 public browser tests.
Three deployed staging authorization checks also pass. Production application
versions are unchanged. It preserves the existing Stripe
redelivery contract; it does not add a background replay queue or reconcile Stripe
state after a database restore. A fresh production inbox aggregate still shows
three processed events, a maximum of one attempt, and no pending/failed/dead rows
or expired processing leases.

## Concurrent production update and credential constraint

Main advanced to `dcf0895` (PR #131) during this work and was deployed separately.
Integrate its billing reconciliation fix, migration 026, dependency patches, and
public-site move to `getomg.dev`. Account OAuth and billing returns remain on
`getomg.xyz`; staging remains on `staging.getomg.xyz`. All three merged dependency
audits pass. The new staging database now has migration 026 as well (17 canonical
migrations total).

Combined-branch verification passed: the full `npm run check`, 356 site tests,
343 API tests, and 22 public browser tests. Three deployed-auth browser tests are
skipped against the local unbound server. The separately executed production-site
dry-run also passed and is now part of `check:deploy` for future CI runs.

The user confirmed that the deployed Wrangler secrets are the only known source;
do not keep requesting another store. Better Auth's supported OAuth Proxy can
leave GitHub code exchange on production and create staging sessions in staging
D1. It requires a new shared proxy credential and a coordinated auth deployment,
and its documentation warns that holders can assert identities in participating
deployments. The local implementation now removes all proxy completion endpoints
from production while retaining the code-exchange hooks. Eight real-handler tests
cover separated accounts/sessions, production endpoint removal, normal production
sign-in with and without the proxy, rejected provider codes, tampering, expiry,
replay, and staging configuration failures. Better Auth is pinned to `1.7.7`.
This application customization is deployed from `2204a63`, whose exact CI run
`37962598220` passed both jobs. Live OAuth initiation and production completion
endpoint rejection pass, as do three deployed browser auth checks per site.
Successful GitHub sign-in and the subsequent purchase/activation path remain
required. See the [cutover and trust boundary](./cloudflare-staging.md).
The broker revision passes the complete local gate with 364 site and 343 API
tests, all four deployment dry-runs, and clean audits. Public browser verification
passes 22 tests with three deployed-auth skips. Staging cookie isolation is also
verified through the real auth handlers.
Stripe test access remains
unverified; the connected Stripe app requires reauthentication. Never substitute
a production live key to satisfy staging readiness.

Cloudflare's native Previews were also checked: new Previews inherit secrets from
their Previews Base configuration, but importing production settings still
requires secrets to be re-entered. They do not copy the existing production GitHub
secret into an isolated preview automatically. See [preview configuration](https://developers.cloudflare.com/workers/previews/configuration/)
and [Better Auth's proxy trust model](https://better-auth.com/docs/plugins/oauth-proxy).

## Initial baseline before the separate PR #131 deployment

- Source: `omg-cli/omg-web` main at `c68f4c6bfb1c0a753e19fc2b01c5c3207ea2ccf4`.
- Production site Worker: `omgsveltesite-website-prod-dlaqgfttmir2ky5x`; version `d3ce7f47-df97-474b-9fab-1e2a4735a823`.
- Production API Worker: `omg-saas`; version `bfb4d141-00ec-48a4-9918-aae150b7d659`.
- Both versions were uploaded on 2026-10-07 without a Git SHA in the deployment message. Their exact source revision is unverified.
- At this initial baseline, the shadow site bound production D1 and `omg-saas`; the subsequent staging deployment isolated those bindings.
- Wrangler is authenticated. Worker secret values are write-only; listing secret names is not proof that their values are available to provision another Worker.

## References

- [GitHub OAuth redirect matching](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps#redirect-urls): callback matching depends on the application's configured callbacks and wildcard settings. Verify the actual application.
- [Cloudflare preview configuration](https://developers.cloudflare.com/workers/previews/configuration/): service bindings need deliberate isolation; a preview is not an isolated data environment by itself.
- [Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/): use explicit bindings and deployment configuration for each environment.
