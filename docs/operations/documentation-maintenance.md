# Documentation maintenance

The public handbook targets **OMG v0.1.224**, release commit
`f0d8cb5d8a95dbbc6cae50460178702ac0263ebb`, published 2026-09-23. The source review
was performed on 2026-11-11. These are separate dates: deployment or a successful
integrity check does not constitute another source review.

The review record is `site/src/lib/docs/source-review.json`. Schema version 2
maps the eight handbook topics and eighteen authored native Markdown guides to their primary
upstream Markdown and relevant implementation files. Shared inputs have one
source record, with a Git blob ID and SHA-256 of the bytes at the release commit.
`site/src/lib/docs/topics.ts` owns the displayed source commit, review date and primary Markdown paths; the checker requires those
fields to agree with the record. Each `guides` entry records its public `href`,
local frontmatter `metadataPath`, primary `documentationPath` and
`implementationPaths`. The checker discovers authored `+page.md` files under
`site/src/routes/docs/*/` and `site/src/routes/runtimes/*/`, parses their YAML using
the same metadata validator as the site, and requires exact inventory, release,
source pin, review date and implementation-list agreement with the manifest.
Adding, deleting or changing the provenance of a guide requires updating this
record after review; otherwise the offline check fails.

The scope is **source review, with platform execution not run**. The record names
inputs to review; it does not certify every line of every file, runtime download,
supported platform or CLI command. Release metadata and the initial source
analysis are documented in
[the CLI documentation audit](../audits/2026-11-11-cli-documentation.md).

## Offline integrity versus upstream drift

Run these commands from the repository root after installing the repository's
pinned dependencies:

```sh
npm run check:docs --prefix site
npm run test:docs-tools --prefix site
```

`check:docs` runs the existing handbook inventory check and the offline source
review check. `check:docs:source` runs only the latter. The normal site `npm test`
command runs the thirteen Node fixture tests before Vitest, so the root
`npm run test:site` and ordinary CI test path also include them. An upstream
clone is never required by these default checks.

The default check is entirely offline. It validates the record's schema, real
calendar dates, release/review chronology, unique topic and file paths, required
hashes, complete evidence references, agreement with the topic registry and
authored-guide frontmatter inventory. Native guide titles, descriptions and
other required metadata also pass the site metadata validator.
It does not contact GitHub, read a CLI checkout, compare current upstream code or
prove that stored hashes match source bytes. A green result means the record is
internally consistent; it does not mean upstream has not changed.

The existing `site/tools/check-docs-freshness.mjs` checks a different contract:
registry fields, content-module inventory and static topic-route inventory.
Its optional clone comparison checks primary Markdown paths. It does not compare
all implementation inputs or require an upstream revision to equal the reviewed
commit. Use the source-review checker for implementation drift as well.

To verify the stored bytes against an explicitly selected local clone:

```sh
node site/tools/check-upstream-review.mjs --clone /path/to/omg
node site/tools/check-upstream-review.mjs --clone /path/to/omg --revision v0.1.224
```

The clone must contain the pinned commit and release tag. The checker verifies
that the tag resolves to the recorded commit, then reads each file with
`git show <commit>:<path>`, checks that it is a blob, and compares both hashes.
The second command also confirms no recorded source files differ at that release.
No clone is inferred from a sibling directory. These commands never fetch,
checkout, reset, stage, commit or read dirty working-file contents.

For an intentional drift review, select the comparison revision explicitly:

```sh
node site/tools/check-upstream-review.mjs --clone /path/to/omg --revision origin/main
```

Changed recorded Markdown **or implementation** paths produce a nonzero exit and
list the affected topics and public guide hrefs. An implementation change
requires review even if its Markdown did not change. Unchanged recorded inputs produce a zero exit; unrecorded
files and newly introduced dependencies still need human assessment. A moved or
missing tag, missing blob or mismatched stored hash is an integrity failure to
investigate, not permission to refresh the record automatically.

The fixture tests cover missing hashes, duplicate paths, registry/date mismatch,
released blobs in a dirty checkout, changed implementation with unchanged docs,
missing release tags and the explicit-clone requirement. Guide fixtures also
cover added/missing pages, malformed YAML, missing implementation metadata,
release/implementation mismatches and guide-only implementation drift with no
Markdown changes.

## Release, main and local changes

A release tag and immutable SHA define the published contract. `origin/main` is
only the clone's locally recorded remote-tracking revision, which may lag GitHub.
`HEAD` is the clone's current committed checkout and may contain local commits
that have never been released. Uncommitted changes are a fourth state; neither
`--revision HEAD` nor the source record includes them.

Keep normal installation instructions on the released baseline. Development-only
behavior needs a separate immutable source reference and an explicit unreleased
label. Do not promote local or main behavior merely because it appears in an
upstream Markdown file. Source Markdown can lag implementation; reconcile claims
with the relevant handlers, settings, provider code and tests.

The release record does not prove that the production installer's live release
marker selects v0.1.224. Verify that separately when changing installation
instructions. If a command or platform was executed, retain the exact artifact,
command, environment and result in separate validation evidence. Do not relabel
the existing source review as execution evidence.

## Updating a review

1. Select an immutable published release and verify its metadata. Read committed
   Git objects; preserve unrelated work in the CLI checkout.
2. Run the deliberate revision comparison. Review each changed input and trace
   moved or newly relevant implementation paths. Check the affected user-facing
   examples, platform limits, options, outputs and exit behavior.
3. Correct handbook and learning content where necessary. Keep released and
   unreleased instructions distinguishable and links pinned to the claimed source.
4. Update the release metadata, topic pins, guide frontmatter and evidence record
   together only after
   review. For each evidence path, obtain the Git blob ID and SHA-256 from the
   selected immutable commit. For example:

   ```sh
   git -C /path/to/omg rev-parse f0d8cb5d8a95dbbc6cae50460178702ac0263ebb:src/cli/args.rs
   git -C /path/to/omg show f0d8cb5d8a95dbbc6cae50460178702ac0263ebb:src/cli/args.rs | sha256sum
   ```

5. Run offline integrity, explicit clone verification, content/export/link checks
   and the appropriate rendering tests. Inspect the actual changed pages and agent
   exports. Record what was source-reviewed and what was executed.

The checker deliberately has no refresh command. Do not advance a reviewed date,
release pin or stored hash solely to turn a failing check green.

## Deployment and cache freshness

This project has Wrangler configurations. Use its existing Wrangler release and
staging procedures; see [Cloudflare staging](cloudflare-staging.md). A successful
Worker deployment and a new `/health/` version prove that the Worker changed.
They do **not** prove that an HTML document, prerendered asset or Markdown export
has refreshed at every cache layer.

After deployment, verify both the deployed version and the actual corrected
content on the public URLs. Check a changed handbook page, its Markdown export
and the documentation index/manifest when affected. Use an exact changed heading,
command or release value from the new artifact as the expected result. Check
GET and HEAD response headers, canonical metadata, and staging's `noindex,
nofollow` policy on a directly loaded prerendered page. HEAD alone cannot prove
body freshness.

If a normal request still returns old content, inspect `Age`, `CF-Cache-Status`,
`Cache-Control` and the returned body before declaring completion. Compare a
revalidation request as a diagnostic, then verify ordinary requests again.
Wrangler deployment does not invalidate every public-page cache, and Wrangler
has no cache-purge command.

Use the account's established targeted URL purge controls when authorized for a
CDN-cached changed URL. Do not assume that a zone purge also clears every custom
Cache API entry or browser cache. The adapter has its own URL-keyed Cache API
layer; if stale entries persist there, use its verified invalidation/versioning
mechanism or wait for the bounded cache lifetime and check again. A cache design
change belongs in a separately reviewed release change. Preserve private-route
`no-store` protections, and never solve stale documentation by making account or
API responses public-cacheable.

Record the checked URLs, deployed version and observed changed content in the
release evidence. No new credentials, hosted service or background automation is
required for the offline review workflow.

## Verify a published correction

A new `/health` version proves which Worker is active. Separately inspect the normal canonical URL for the changed text, Markdown and manifest. Read `CF-Cache-Status`, `Age` and `Cache-Control`; a successful deployment can coexist with old cached HTML.

Use the project's Wrangler configuration for deployments. If cached canonical HTML is stale, use the established targeted URL purge for the changed pages and verify those same URLs again. A cache-busting query is diagnostic evidence only: it does not prove ordinary readers receive the correction. Do not assume a zone purge clears every adapter cache layer; verify the rendered content after invalidation or expiry.

For staging, test both GET and HEAD on a prerendered guide and a dynamic endpoint. Expect `X-Robots-Tag: noindex, nofollow` and the existing security headers. Production public HTML must retain its indexing policy; agent exports remain `noindex`. Search HTML/JSON must retain `Cache-Control: no-store`.
