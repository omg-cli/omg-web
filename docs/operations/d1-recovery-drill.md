# Disposable D1 recovery drill

Run this explicit remote operation from the repository root using the authenticated
Wrangler installation. Provide a new directory outside the checkout; the parent
directory must already exist. It creates a new database, applies the current
canonical migrations, restores a bookmark, verifies synthetic records, and deletes
the database. It cannot target an existing database by argument.

```bash
npm run drill:d1-recovery -- --remote --output /absolute/path/to/new-drill-receipts
```

The account is pinned to OMG's Cloudflare account. The generated name contains a
date and random suffix. Before restore and deletion, the tool verifies the remote
database name and ID against its creation result and rejects production, staging,
and the retained old shadow database IDs. It never exports production data or
reads application secrets. The output directory retains the config and receipts;
do not reuse its deleted database binding as a deployment configuration.

The drill checks the complete migration ledger, SQLite integrity, foreign keys,
an auth session joined to its user, the customer/license/machine entitlement
relationship, a webhook processing lease, and the migration-026 reconciliation
fence. It verifies that deliberate mutations are observable, then compares the
restored checks to their pre-mutation state. A row created after the bookmark must
disappear. Synthetic session and license strings are never issued to an application.

`receipt.json` records source revision and dirty state, migration hashes, database
ID, restore and undo bookmarks, restore duration, checks, and cleanup outcome.
Inspect both `success` and `cleanup`; a successful restore with failed cleanup is
not a completed drill. An unknown creation outcome requires checking the exact
generated name before cleanup. Never rerun a restore against a shared database to
repair a drill failure.

These checks verify database recovery, not browser session acceptance, Stripe
provider reconciliation, or CLI activation. Time Travel rewinds local webhook and
reconciliation state without rewinding Stripe. Before reopening writes after an
actual incident, reconcile affected subscriptions with current Stripe state and
review received, processing, failed, and dead inbox rows. Restored session rows
may also revive sessions revoked after the bookmark. Decide whether to invalidate
sessions based on the incident; do not infer successful sign-in from a row count.

The measured duration covers the CLI restore call for this small synthetic
database. It excludes detection, traffic coordination, provider reconciliation,
and application acceptance, and is not a production recovery-time objective.

See [Time Travel behavior and limits](https://developers.cloudflare.com/d1/reference/time-travel/)
and the [staging recovery receipts](./cloudflare-staging.md#d1-recovery-drill).
