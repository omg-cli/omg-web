# Dashboard D1 batching

The signed-in Overview, Analytics, and Machines pages all load the private
`GET /api/dashboard` response through the site's existing API service binding.
A production baseline on October 9, 2026 measured three navigations per page in
one existing desktop session. Median time to first byte was 1,405 ms, 1,352 ms,
and 1,306 ms respectively. All nine loads returned HTTP 200 and displayed the
expected authenticated content. This is a warm-asset, single-session baseline;
it is not a population percentile or fresh OAuth exchange measurement.

In that measurement window, the deployed API logged 11 successful dashboard
requests with a median wall time of 810 ms and CPU time of 22–43 ms. Two extra
overview requests were excluded from the browser baseline because their auth
assertion used an accessibility diff; replacement full-snapshot checks passed.
Production API Smart Placement was already enabled.

## Candidate behavior

The handler first validates the session, reads the server-owned admin flag,
and validates the customer's license. It then sends 12 independent detail
queries in one D1 batch. The percentile-rank query runs afterward because it
depends on the decoded usage aggregate. This reduces the post-license reads
from 13 database calls to two, with the same 14 SQL statements, bindings,
row decoders, response fields, and tenant filters as the sequential handler.

The batch includes machines, usage, achievements, subscription and invoice
history, package/runtime dimensions, and global statistics. Future paid-tier
fields remain part of the contract. A failed or incomplete batch returns an
error rather than a partial dashboard response. Authorization and missing-license
rejections happen before the batch.

[D1 executes batched statements sequentially within one transaction](https://developers.cloudflare.com/d1/worker-api/d1-database/#batch),
reducing network round trips. The dependent rank query is outside that
transaction; this change does not claim a single snapshot across the entire
dashboard response. It adds no database schema, service, or subscription.

## Verification and promotion

Focused local D1 tests exercise a populated account alongside another tenant,
active/inactive machines, usage/streaks/ranking, subscription and invoice fields,
empty usage, unauthorized and missing-license requests, storage failure,
incomplete batches, and malformed rows. The populated case observes one detail
batch containing 12 statements. The existing response decoder validates the
complete payload.

Hosted performance improvement is not yet accepted. Before production promotion:

1. Require exact-commit CI and the existing staging release preflight.
2. Deploy the candidate to staging and verify source/version identity.
3. Exercise the shared GitHub OAuth app, account pages, and session isolation.
4. Compare before/after authenticated navigation and API timings with the same
   data and measurement conditions. Record failed requests as failures.
5. Review the measured result and retain the previous API version for rollback.

The production timing baseline is a prioritization signal. Staging with a
different data population cannot establish a precise production speedup.
