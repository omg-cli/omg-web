# Staging release command

Use the authenticated local GitHub CLI and Wrangler installation. The command
does not read deployed secret values or require copying them into GitHub Actions.
Run it from a clean checkout whose exact commit passed both CI jobs. The output
directory must be new and outside the repository, with an existing parent.

```bash
# Read-only readiness check; no deployment without --deploy.
npm run release:staging -- --ci-run RUN_ID --output /absolute/path/to/new-receipts

# After the readiness check passes, use a second new receipt directory.
npm run release:staging -- --ci-run RUN_ID --output /absolute/path/to/new-release --deploy
```

CI explicitly checks out and verifies the source commit in both jobs. The release
command checks the run's repository, source SHA, workflow, completed status, and
successful `check`, `e2e-anonymous`, and source-verification steps. A run from before
the source-verification step was added is not accepted. Current `main` must be an
ancestor of the candidate; merge any newer changes and rerun CI before publishing.

Before publishing, the command verifies the two fixed staging Worker targets,
their remote D1/service/rate bindings, the production GitHub OAuth client ID, the
absence of a staging GitHub secret and email binding, required secret names, and
the complete migration ledger. Secret presence does not prove credential validity;
post-deploy health and the separate authenticated acceptance flow cover different
parts of readiness. Missing Stripe test configuration is a release failure. There
is no flag that treats the bootstrap 503 as acceptance.

With `--deploy`, it installs all three dependency trees from their lockfiles using
the pinned npm version, rebuilds the site, runs all four deployment dry-runs, and
rechecks source and remote state. It then deploys the API followed by the site,
tags both with the full source SHA, and verifies each live health response against
the newly active version. It records previous deployment/version IDs before any
upload and writes new IDs as each Worker is published. A split-traffic deployment
is rejected and requires separate review.

`receipt.json` distinguishes `preflight-passed`, `publishing`, `deployed`, and
`failed`. The readiness-only result never claims a deployment. A failure after
publishing the API can leave a partial release; inspect `failedDuring` and the
per-Worker `before`/`after` records. No automatic rollback is attempted because
Worker rollback does not restore database writes. Remote-state checks detect
observed drift but are not a distributed deployment lock. Keep one operator
responsible for the release window.

This command only publishes staging. Production promotion still requires the
actual GitHub sign-in, Stripe test purchase/webhook, and CLI account-link acceptance
for the candidate, followed by a reviewed production deployment. It does not apply
database migrations or bypass those acceptance steps. See the
[current staging state](./cloudflare-staging.md) and
[D1 recovery drill](./d1-recovery-drill.md).

References: [GitHub checkout behavior for pull requests](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#pull_request),
[Cloudflare versions and deployments](https://developers.cloudflare.com/workers/versions-and-deployments/),
and [rollback limitations](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/).
