# Isolated Cloudflare staging

Reviewed 2026-10-09. Configuration is implemented; the staged Workers have not
been published. Production traffic and secrets have not been changed.

Main's separately deployed PR #131 has since moved the public site to
`getomg.dev` while retaining account OAuth on `getomg.xyz`. This branch incorporates
that change. Staging remains on `staging.getomg.xyz`, and billing returns use the
account origin rather than the public marketing origin. The new staging D1 now
also includes migration 026, bringing its canonical migration count to 17.

## Resources

| Component            | Staging                                         | Production                                    |
| -------------------- | ----------------------------------------------- | --------------------------------------------- |
| Site Worker          | `omgsveltesite-website-shadow-bfrqe2m2mfps2gu6` | `omgsveltesite-website-prod-dlaqgfttmir2ky5x` |
| Site origin          | `https://staging.getomg.xyz`                    | `https://getomg.xyz`                          |
| API Worker           | `omg-saas-staging`                              | `omg-saas`                                    |
| API origin           | `https://staging-api.getomg.xyz`                | `https://omg-api.latham.cloud`                |
| D1                   | `omg-platform-staging`                          | `omg-platform`                                |
| D1 ID                | `0f059202-7042-4588-a89f-ce0ae3f6deba`          | `fee8ddab-fb4a-4be4-b8d2-8abb7c2db188`        |
| Site rate namespaces | `4001`, `4002`                                  | `2001`, `2002`                                |
| API rate namespaces  | `3001`–`3004`                                   | `1001`–`1004`                                 |

The old `omg-platform-shadow` database is retained untouched. Its migration ledger
contains `026_stripe_subscription_reconciliations.sql`, which is absent from
GitHub main at `c68f4c6`. It cannot be used to prove that main's migration chain
recreates the schema. The new staging database uses only the canonical migrations.

The existing shadow site currently points at production. Publish the API and
provision separate credentials before publishing the site's staging configuration.
Do not use the existing shadow URL for test purchases before that cutover.

## Credentials and behavior

Reuse production's GitHub OAuth application, client ID, and client secret. Verify
that the existing application accepts
`https://staging.getomg.xyz/api/auth/callback/github`. GitHub's callback matching
depends on the app's callback and wildcard settings; do not assume that a sibling
hostname is accepted. No callback relay or second OAuth app is implemented.

The existing shadow Worker's live client ID was rechecked on 2026-10-09:
`Ov23liHbO8Uyd3LI0bU4`, which differs from production's `Ov23lim96hwzllDXL6Dm`.
Its existing `GITHUB_CLIENT_SECRET` cannot be assumed to belong to the production
app. Supply the production app's existing secret during the isolated cutover.

Provision independent staging values for `BETTER_AUTH_SECRET`, `SVELTE_BFF_SECRET`,
`JWT_SECRET`, `JWT_PRIVATE_KEY` (Ed25519 PKCS#8), and `ADMIN_API_SECRET`. Both staged
Workers share only their staging BFF secret. The site and production use separate,
host-scoped sessions and separate D1 data. A shared OAuth app still shares GitHub
client credential trust; it is not a separate GitHub authorization boundary.

For the API, a Stripe test key, a test endpoint's `STRIPE_WEBHOOK_SECRET`,
and a verified test catalog (`STRIPE_PRO_PRICE_ID`, `STRIPE_TEAM_PRICE_ID`, and an
optional `STRIPE_INTRO_COUPON_ID`) are required. Store the catalog as Worker secret bindings so
subsequent deploys preserve it without inheriting arbitrary old plaintext vars.
The API returns 503 for missing/live Stripe keys in staging and rejects signed
webhook events unless `livemode` is explicitly false. Checkout and portal returns
use the staging site origin. Sentry uses the staging environment.

Wrangler can list deployed secret names but cannot download their values. Use the
original secret store or enter the existing values through `wrangler secret put`;
never print or commit them. Do not retain the old shadow Worker's BFF or auth
secrets during the cutover. No native email binding or cron triggers are configured
for staging yet; email operations remain unavailable until a deliberate test
delivery policy is added.

## Validation and publication

Run from the repository root:

```bash
npm run check:staging
npm run check:deploy
npm test
```

`check:staging` parses configs with the pinned Wrangler version and checks Worker
names, D1, service bindings, routes, rate namespaces, query redaction, OAuth client,
and absent email/cron bindings. `check:deploy` builds the site and bundles both
staging Workers. These checks do not verify remote secret values or OAuth settings.

Once credentials and callback acceptance have been verified, use the explicit
config paths. Capture the source commit and Worker version IDs with the release:

```bash
npx wrangler d1 migrations apply DB --remote --config workers/api/wrangler.staging.jsonc
npx wrangler deploy --config workers/api/wrangler.staging.jsonc --tag "$(git rev-parse HEAD)"
npx wrangler deploy --config site/wrangler.staging.jsonc --tag "$(git rev-parse HEAD)"
```

The API must be deployed first. The old Alchemy `shadow` stage also targets the
isolated database, service, and staging hostname, and resolves production GitHub
credentials plus `STAGING_SVELTE_BFF_SECRET`. Wrangler is the release path; avoid
alternating deployment tools because older Alchemy cannot represent every current
Wrangler observability option.

Deploy only from a clean committed checkout that passed the release gates. After
upload, read both `/health` responses and record `version.id`, `version.tag`, and
`version.timestamp`; both tags must equal the reviewed full commit SHA. Preserve
the previous version IDs for rollback. These metadata checks supplement the
authenticated acceptance flow; they do not replace it.

The subsequent observability slice passed 37 focused API tests (including actual
scheduled-handler D1 faults), 28 site public-file tests, source and test typechecks,
lint, source policy, unused exports, the site build budget, and all four Worker
deployment dry-runs. Three validated production observability queries were saved;
see [observability status](./observability.md). Runtime changes are not yet deployed.

Validation of the implementation and patched dependency graph on 2026-10-09:

- Site suite: 61 files, 355 tests passed.
- API suite: 33 files, 328 tests passed, including live-key rejection, signed
  webhook mode isolation, checkout return URLs, and staging invitation origins.
- Local public browser suite: 22 passed; three deployed-auth tests skipped because
  the suite targets a local unbound server.
- Source and test typechecks, lint, formatting, source policy, unused exports,
  immutable migration checks, and lockfile integrity checks passed.
- Site build and bundle budgets, production API dry-run, both staging dry-runs,
  and binding isolation checks passed.
- The aggregate release gate remains failing: the site has one unpatched `braces`
  advisory through Alchemy, reported against five packages in the dependency
  chain. Root and API npm audits are clean. See [dependency pins](./dependency-pins.md).

That audit result describes the earlier `72afa59` baseline. After incorporating
PR #131's Alchemy beta.78 update, the full `npm run check` passed, including all
three audits, 356 site tests, and 343 API tests. The public browser suite passed
22 tests and skipped three deployed-auth tests. All four production/staging
configurations passed deployment dry-runs. The earlier D1 recovery drill still
covers the 16-migration schema that existed at drill time.

Before promotion, exercise GitHub sign-in, Stripe test checkout, signed webhook
delivery, license issuance, session isolation, and API denial with production
credentials. The production CLI pins its API origin and verification key, so full
activation needs a separately reviewed test build with the staging endpoint/key.
Never weaken the production client's signature or issuer checks for this test.

## D1 recovery drill

On 2026-10-09, a dedicated `omg-recovery-drill-20261009` database was created with
ID `c56f7807-e19a-4380-be21-3d67dafd6f77`. All 16 canonical migrations applied.
Synthetic auth-user, customer, and license rows were added; no production data was
exported. After capturing a Time Travel bookmark, the user name was changed and
the license revoked. Restoring the bookmark returned the original user and active
Pro license. The migration count remained 16, `PRAGMA quick_check` returned `ok`,
and `PRAGMA foreign_key_check` returned no violations.

The restore CLI call took 2.48 seconds. This measures one small database restore,
not an application recovery objective or a production restore test. The drill did
not test browser sessions, Stripe reconciliation after recovery, or production
traffic coordination. The temporary database is removed after saving receipts.

To repeat: create a fresh database, use a config containing its exact ID, apply the
canonical migrations, seed synthetic records, capture `wrangler d1 time-travel
info DB --json`, change only those fixtures, restore the saved bookmark, and assert
data plus integrity. Validate the target's ID before every restore and delete.
Time Travel overwrites its target in place; never point a drill at production or
the shared staging database. See [Cloudflare's Time Travel documentation](https://developers.cloudflare.com/d1/reference/time-travel/).
