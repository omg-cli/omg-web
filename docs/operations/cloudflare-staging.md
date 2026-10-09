# Isolated Cloudflare staging

Deployed 2026-10-09 from `2204a63c19c0f82a40485e3b10d3f6eccebef52c` after both
GitHub CI jobs passed (run `37962598220`). The isolated staging site and API are
live. The production site received the OAuth broker bootstrap and version
metadata; its existing GitHub, session, and BFF secrets were preserved. A new
dedicated proxy secret was added. The production API remains at its PR #131 release.

Staging was subsequently updated to `5925bce7461f133bf317ac12d6a79eaa410510b9`
after both CI jobs passed (run `37966895191`). This includes the exhausted-webhook
claim fix. The production application versions were unchanged by this follow-up.

The user clarified that paid licenses are for future higher tiers. Current source
sets `BILLING_ENABLED=false` for staging and no longer requires Stripe to publish
the current application. Disabled billing rejects checkout, portal, webhook, Stripe
admin and marketing-offer routes before provider/database work. The paid-tier code
and tests remain intact. Until this candidate is deployed, the existing staging
API still returns its historical readiness 503. Paid purchase and CLI license
activation are deferred, not claimed as tested.

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

Remote settings confirm the former shadow site now binds staging D1 and
`omg-saas-staging`. Its old GitHub secret was deleted, and its auth/BFF secrets
were replaced with newly generated staging values. Both staging Workers have
query redaction enabled. The bootstrap D1 checks found no auth users, sessions,
or licenses, with 17 applied migrations. The later real OAuth acceptance created
one staging user, one GitHub account, and one session, as recorded below.

## Deployment receipts

| Worker                         | Version                                | Source tag                                 |
| ------------------------------ | -------------------------------------- | ------------------------------------------ |
| Production site / OAuth broker | `65974306-855b-4aa7-9c40-eadb911eeb00` | `2204a63c19c0f82a40485e3b10d3f6eccebef52c` |
| Staging site                   | `c5b0c90b-b1cd-42be-8240-fb1323362681` | `5925bce7461f133bf317ac12d6a79eaa410510b9` |
| Staging API                    | `5848e9b5-f5d3-43a9-a7c0-d106f149cf32` | `5925bce7461f133bf317ac12d6a79eaa410510b9` |

Both sites' live `/health` responses match these IDs and source tags. The staging
API's version/tag is verified through Cloudflare's version API because its
readiness guard also rejects `/health` until Stripe test configuration exists.
Secret updates create new versions with empty tags; the staging Workers were
deployed again after secret provisioning to restore a verifiable source tag.

Three deployed browser auth checks pass on each site: protected-route redirects,
login rendering, and invalid-credential rejection. Both sites' OAuth initiation
returns production client `Ov23lim96hwzllDXL6Dm` and the existing production
callback. A staging browser reaches GitHub's **OMG getomg.xyz Production** app.
Real GitHub sign-in through that app passed on 2026-10-09 at 19:20 UTC: the browser
reached the authenticated staging dashboard with verified email. Read-only D1
counts changed from 0/0/0 to 1/1/1 for staging users/accounts/sessions; production
remained 3/3/152. The production browser showed the login page before the test and
remained signed out afterward. This verifies actual provider completion, staging
account creation, and session separation. The staging account-details panel is
unavailable while its API lacks Stripe test configuration; purchase, token issuance,
and successful CLI linking remain pending. Both production proxy completion routes
return 404 in live HTTP checks. Staging traces are visible in Workers Observability.

The production site's prior version is `7eba263d-bdf8-4d5c-a58e-020c90c3731b`;
the unchanged production API version is `053e114a-a351-48e0-bb60-bc0fa2e55f37`.
Never roll staging back to its pre-isolation shadow version: that version binds
production D1 and the production API. Roll forward with isolated bindings instead.

The immediate preceding isolated staging versions are site
`402c52c1-4b9d-4e43-988b-dbc8fe48fece` and API
`4290ddd1-4e1e-4a04-975a-793bdcd20145`, both tagged `2204a63`. These precede only
the retry follow-up, unlike the unsafe pre-isolation shadow version. The new
staging deployments serve 100% of traffic. Three deployed authorization checks
pass after the update; the API still returns its expected readiness 503.

## Credentials and behavior

Reuse production's GitHub OAuth application through Better Auth's OAuth Proxy.
Staging sends GitHub to the existing production callback at
`https://getomg.xyz/api/auth/callback/github`. The production Worker exchanges the
code with its existing deployed secret and redirects an encrypted profile to
staging. Only staging creates the resulting account and session in its own D1.
No staging callback registration or second GitHub app is required by this flow.

The existing shadow Worker's live client ID was rechecked on 2026-10-09:
`Ov23liHbO8Uyd3LI0bU4`, which differs from production's `Ov23lim96hwzllDXL6Dm`.
Its former `GITHUB_CLIENT_SECRET` belonged to another client. Staging auth now
ignores that binding entirely; the obsolete binding was deleted during cutover. Keep
the existing production secret on the production Worker.

A dedicated random `OAUTH_PROXY_SECRET` of 32 bytes was generated and installed
on the two site Workers using Wrangler secret input. Never
print or commit it. Production enables the broker only when this secret exists;
staging refuses to initialize authentication without it or on another hostname.
Use Better Auth `1.7.7` on both Workers in the coordinated cutover. Restart any
sign-in begun during the version transition.

The standard proxy plugin grants participating deployments shared identity
authority. OMG removes **all proxy completion endpoint registrations from
production**, including the deprecated endpoint, while retaining the GitHub
code-exchange hooks. Consequently production can return profiles to staging but
cannot create a production session from a proxy profile. Completion endpoints
exist only in the staging configuration. This is an application customization of
the documented plugin interface, not an upstream broker-only option. Re-run the
auth boundary tests on every Better Auth upgrade. Protect the proxy secret as an
authentication credential for staging; it also decrypts proxied GitHub tokens.

The profile lifetime is 30 seconds, OAuth state is consumed once, and cookies use
separate host-scoped session secrets. Query redaction must remain enabled because
the callback carries encrypted credentials. Local tests use the real Better Auth
handlers and OMG configuration, separate memory databases, and synthetic GitHub
responses; they do not establish live GitHub or D1 acceptance.

Independent staging values are provisioned for `BETTER_AUTH_SECRET`, `SVELTE_BFF_SECRET`,
`JWT_SECRET`, `JWT_PRIVATE_KEY` (Ed25519 PKCS#8), and `ADMIN_API_SECRET`. Both staged
Workers share their staging BFF secret. The site and production use separate,
host-scoped sessions and separate D1 data. A shared OAuth app still shares GitHub
client credential trust; it is not a separate GitHub authorization boundary.

For a future billing-enabled API, a Stripe test key, a test endpoint's `STRIPE_WEBHOOK_SECRET`,
and a verified test catalog (`STRIPE_PRO_PRICE_ID`, `STRIPE_TEAM_PRICE_ID`, and an
optional `STRIPE_INTRO_COUPON_ID`) are required. Store the catalog as Worker secret bindings so
subsequent deploys preserve it without inheriting arbitrary old plaintext vars.
The billing-enabled API returns 503 for missing/live Stripe keys in staging and rejects signed
webhook events unless `livemode` is explicitly false. Checkout and portal returns
use the staging site origin. Sentry uses the staging environment.

Wrangler can list deployed secret names but cannot download their values. The
user has confirmed Wrangler is the only known credential location. Keep deployed
production secrets in place and generate the new staging credentials; do not
request another original-secret store. Stripe test access remains unverified and
the connected Stripe app requires reauthentication. Do not retain the old shadow Worker's BFF or auth
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

Use the [staging release command](./staging-release.md) for subsequent publication.
It verifies the exact-source CI run, bindings, required secret names, and migration
ledger before any upload. Readiness-only mode is the default; publication requires
`--deploy` and a second new receipt directory outside the repository:

```bash
npm run release:staging -- --ci-run RUN_ID --output /absolute/path/to/new-readiness
npm run release:staging -- --ci-run RUN_ID --output /absolute/path/to/new-release --deploy
```

The command deploys the API first using the explicit staging Wrangler configs,
then deploys the site and records both source tags and Worker version IDs. It does
not apply migrations; missing migrations require a separately reviewed migration
step before readiness can pass. The old Alchemy `shadow` stage also targets the
isolated database, service, and staging hostname, and resolves the production GitHub
client ID, `OAUTH_PROXY_SECRET`, and `STAGING_SVELTE_BFF_SECRET` without requiring
the production GitHub secret. Wrangler is the release path; avoid
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
see [observability status](./observability.md). Site and staging runtime changes
are deployed; the production API code remains unpublished. Production issue
detection and four notification automations were enabled separately through the
settings API without changing code deployments or bindings.

After incorporating PR #131, GitHub CI passed both checks for `cf3f725`
(run `37961070002`). Its full `npm run check` included all three audits,
356 site tests, 343 API tests, and all four deployment dry-runs. The local public
browser suite passed 22 tests and skipped three deployed-auth tests against the
unbound local server. The earlier D1 recovery drill covers the 16-migration schema
that existed at drill time. OAuth proxy validation is recorded separately below.

With the OAuth broker implementation and Better Auth `1.7.7`, the complete local
`npm run check` passes: 364 site tests, 343 API tests, all three audits, typechecks,
source policy, lint/formatting, build budgets, and all four deployment dry-runs.
The public browser suite again passes 22 tests with three deployed-auth skips.
The eight focused auth tests additionally verify that the staging cookie works
against staging and is rejected by production. These are local results; the
coordinated broker deployment and real GitHub sign-in are now complete. Stripe
test purchase, token issuance, and successful CLI linking remain pending as
described in the receipts above.

For the current rollout, verify GitHub sign-in, authenticated account data, session
isolation, disabled billing, health/version identity and operational behavior.
Before a future paid-tier promotion, additionally exercise Stripe test checkout,
signed webhook delivery, license issuance and API denial with production
credentials. The production CLI pins its API origin and verification key, so full
activation needs a separately reviewed test build with the staging endpoint/key.
Never weaken the production client's signature or issuer checks for this test.
The dedicated development build is prepared from OMG source `205b1493` plus an
uncommitted staging-only origin/key/contract patch, which is absent from OMG PR 891. Its 17 license tests, endpoint contract test, and two account tests pass.
The binary SHA-256 is
`1195084d4806546ba0d58c513323881d649875c7fd73bef8e157f18da45ac9f1`.
A synthetic stdin token correctly reaches staging's readiness 503, exits 1 with
valid account-link guidance, and persists no license. This is failure-path
verification, not a successful account link or production release.

## D1 recovery drill

The repeatable [current-schema drill](./d1-recovery-drill.md) passed on 2026-10-09
from clean source `e8a7970`, using disposable database
`df06ec5d-5571-4746-b4c4-bb9f9c652295` (`omg-recovery-drill-20261009-d06b18de`).
All 17 migrations applied. Eight checks covered the ledger, SQLite integrity,
foreign keys, auth-session relationship, customer/license/machine entitlement,
webhook processing lease, reconciliation fence, and removal of a post-bookmark
row. Every deliberate mutation was observed before restore and all original
checks passed afterward. The restore call took 2.41 seconds. Cleanup succeeded,
and the Cloudflare inventory confirms no drill database remains.

This extends the database-level evidence to migration 026. It does not establish
browser sign-in, Stripe reconciliation, or CLI acceptance after recovery. Restored
session revocations and external billing changes still need incident-specific
handling before reopening writes. The tool records exact migration hashes,
bookmarks, source state, and command receipts outside the checkout.

### Earlier baseline drill

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
