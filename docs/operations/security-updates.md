# Public security updates

The `/security/` page reads public GitHub commit metadata. It does not run code
audits, scan repositories or require a GitHub token.

## Publishing an update

Use `security: ...` or `fix(security): ...` for security commits. Put the
user-facing explanation in the commit body: what changed and why it helps.
The feed also recognizes hardening, privilege, checksum, provenance and
attestation titles. Ordinary merge commits are excluded. Commit bodies are
displayed as escaped plain text, with a direct link to the full commit.

The feed follows `main` in `omg-cli/omg` and `omg-cli/omg-web`.
Hardening PR #399 merged on September 14, 2026; its retained branch is no longer
polled or presented as an open review. All 16 committed fallback entries were
verified as ancestors of OMG main before their status changed to On main.
No site rebuild is needed for matching commits on main. On main means merged,
not necessarily released. Adding a future review feed requires verifying the PR
lifecycle rather than inferring review status from a branch name.
Reserve Released for verified inclusion in an installable tagged build; the current
commit feed does not infer release inclusion.

## Refresh and availability

The server checks up to 100 recent commits per source, deduplicates by repository
and SHA, and retains up to 150 entries. Main takes precedence over development.
On Cloudflare, a named Cache API entry holds only this public feed, partitioned by
request origin and schema version. Entries are fresh for five minutes and retained
for up to one day as an outage fallback. An expired entry, or the committed snapshot
on a cache miss, is returned immediately with `stale: true`. The request's
`ctx.waitUntil` keeps the refresh and cache write alive after the response. Failed
refreshes retain history and the last successful sync time and retry after one
minute. Stale responses require revalidation so an initial snapshot is not held in
the browser or outer CDN after the background refresh completes.

The cache is local to each Cloudflare data center and may be evicted; it is not a
global or permanent archive. Concurrent misses can each refresh. No request I/O
promise is shared across Worker invocations. Cache errors produce sanitized warning
events and leave the public snapshot available. Local development without Cache API
and request-context support uses the existing awaited, coalesced in-memory refresh.
Visible pages refresh every
five minutes and when a visitor returns to the tab. CDN caching can add delay;
this is periodic synchronization, not a push webhook.

Each GitHub request has an eight-second timeout. If any source is unavailable,
the page shows saved updates with the last successful sync time. A committed
snapshot provides an initial fallback on cold starts. Update `security-snapshot.ts` when retaining older
history across deployments is useful. GitHub's unauthenticated rate limits can
delay refreshes; no credentials are sent to visitors.

Activity counts describe entries in this bounded feed, not vulnerabilities,
independent audits or every security change in repository history. Dates are UTC.
