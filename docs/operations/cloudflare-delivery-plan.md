# OMG Cloudflare delivery plan

Status: implementation in progress, 2026-10-09. Production has not been changed.
Staging isolation and test-mode guards are implemented locally; a fresh staging
D1 database now has all 17 canonical migrations. A synthetic D1 Time Travel drill
passed. See [staging and recovery evidence](./cloudflare-staging.md).

## First milestone: isolated staging

- Use the existing GitHub OAuth application. Verify its callback configuration before enabling staging sign-in. Do not introduce a second OAuth application or share session cookies.
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
- Passed 37 focused Worker tests and 28 site tests, typechecks, source policy, lint, and four deployment dry-runs. Changes remain unpublished.
- Saved three validated production observability queries. Notifications, synthetic delivery, and release acceptance remain pending; see [observability](./observability.md).
- GitHub CI at `72afa59` passed anonymous browser tests and failed the dependency audit on the unpatched `braces` advisory. Keep that release gate intact.

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
deployments. Research and test the production authentication boundary before
choosing this approach; it is not enabled by this PR. Stripe test access remains
unverified; the connected Stripe app requires reauthentication. Never substitute
a production live key to satisfy staging readiness.

Cloudflare's native Previews were also checked: new Previews inherit secrets from
their Previews Base configuration, but importing production settings still
requires secrets to be re-entered. They do not copy the existing production GitHub
secret into an isolated preview automatically. See [preview configuration](https://developers.cloudflare.com/workers/previews/configuration/)
and [Better Auth's proxy trust model](https://better-auth.com/docs/plugins/oauth-proxy).

## Current baseline

- Source: `omg-cli/omg-web` main at `c68f4c6bfb1c0a753e19fc2b01c5c3207ea2ccf4`.
- Production site Worker: `omgsveltesite-website-prod-dlaqgfttmir2ky5x`; version `d3ce7f47-df97-474b-9fab-1e2a4735a823`.
- Production API Worker: `omg-saas`; version `bfb4d141-00ec-48a4-9918-aae150b7d659`.
- Both versions were uploaded on 2026-10-07 without a Git SHA in the deployment message. Their exact source revision is unverified.
- Existing shadow site still binds production D1 and `omg-saas`; it is not an isolated test environment.
- Wrangler is authenticated. Worker secret values are write-only; listing secret names is not proof that their values are available to provision another Worker.

## References

- [GitHub OAuth redirect matching](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps#redirect-urls): callback matching depends on the application's configured callbacks and wildcard settings. Verify the actual application.
- [Cloudflare preview configuration](https://developers.cloudflare.com/workers/previews/configuration/): service bindings need deliberate isolation; a preview is not an isolated data environment by itself.
- [Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/): use explicit bindings and deployment configuration for each environment.
