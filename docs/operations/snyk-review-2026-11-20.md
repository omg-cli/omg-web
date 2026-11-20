# Snyk website remediation - 2026-11-20

Scope: the supplied November 20 report for `omg-cli/omg-web`, with 23 findings: two critical, three high, one medium and 17 low. The original inventory was also retrieved through the authenticated Snyk REST API. This work is separate from the CLI repository report.

## Dependency fixes

- Upgrade Better Auth from 1.7.7 to 1.7.26, above the advisory's 1.7.16 fixed floor. [Advisory](https://github.com/better-auth/better-auth/security/advisories/GHSA-4wq4-2ppv-q3hg).
- Replace registry `gray-matter` with the tracked `site/vendor/yaml-frontmatter` adapter. The installed docs package consumes its `content` and `data` fields. The adapter accepts YAML mappings, rejects executable language selectors and unknown tags, and forbids alias expansion. The executable parser is absent from the installed graph. [Advisory](https://security.snyk.io/vuln/SNYK-JS-GRAYMATTER-20532010).

## Code and fixture changes

- Keep the invitation key's public domain-separation label distinct from the separately supplied deployment secret. Its bytes stay stable so existing invitation references continue to decrypt; no credential rotation is implied by this naming clarification.
- Make local dispatch explicit in `headSafeFetch`. Production invokes the generated Worker handler; development dispatches a same-origin relative path and rejects redirects.
- Use one fixed absolute cache key for public GitHub stats. Incoming hostnames, queries, Range and conditional headers cannot change shared JSON responses. Cloudflare keeps cache namespaces separate per Worker.
- Generate test credentials and the Ed25519 signing key at test runtime. Assertions still exercise authorization, webhook signatures, OAuth isolation and signed licenses.
- Exercise release health polling over HTTPS using an ephemeral localhost certificate. Only the fixture client trusts that certificate; production TLS verification stays enabled.
- Compare a canonical installer through bounded stdin instead of accepting a file path argument. Example: `node tools/check-installer-sync.mjs --stdin < /path/to/omg/install.sh`.
- Restrict the historical Stripe audit PoC to loopback. It rejects credentials, remote hosts, paths, queries and fragments in its selected base URL, uses a fixed loopback connection, and returns redirects without following them. Its main guard allows transport validation without running the audit's D1 mutations. Historical finding evidence is retained in Git history.

No ignore file, excluded source directory or severity threshold was added to achieve the clean scan.

## Original finding ledger

Locations refer to the original scan revision; line numbers move as fixes are applied.

| Severity | Snyk key                               | Original location                                                           | Remediation                                                   |
| -------- | -------------------------------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------- |
| critical | `SNYK-JS-BETTERAUTH-22193072`          | `site/package.json`                                                         | Upgrade to patched Better Auth.                               |
| critical | `SNYK-JS-GRAYMATTER-20532010`          | `site/package.json`                                                         | Remove executable parser; use YAML-only adapter.              |
| high     | `4dc4750a-36a9-4c34-ae2a-ac85c27a7ef7` | `site/src/lib/server/organization-invitation-token.server.ts:6`             | Clarify public key-derivation domain label.                   |
| high     | `992dbd9c-9346-4666-ab74-2e52dec607af` | `site/src/lib/server/head-safe-fetch.ts:18`                                 | Use explicit local handler dispatch.                          |
| high     | `494bb4b2-f2cb-4d42-8f59-396e53845b10` | `workers/api/src/handlers/github-proxy.ts:62`                               | Use fixed public cache URL without caller headers.            |
| medium   | `908aeee6-9d49-4039-8c2e-b0e84b35aa96` | `piolium/findings/p10-008-stripe-customer-created-email-autolink/poc.py:49` | Confine audit transport to loopback; refuse URL redirects.    |
| low      | `0af50181-8b0c-48bd-97cf-911f8d0e5ea1` | `site/src/lib/server/oauth-proxy.server.test.ts:8`                          | Generate fixture secrets or signing key at test runtime.      |
| low      | `21425b33-eb05-4c68-932e-84ff81bbf59a` | `site/src/lib/server/oauth-proxy.server.test.ts:28`                         | Generate fixture secrets or signing key at test runtime.      |
| low      | `507f0b16-f456-4757-9733-1d8f40596f0f` | `site/src/lib/server/oauth-proxy.server.test.ts:62`                         | Generate fixture secrets or signing key at test runtime.      |
| low      | `a13edab0-3205-4123-8bfc-aedf2cbffc03` | `workers/api/tests/auth-and-guard.test.ts:710`                              | Generate fixture secrets or signing key at test runtime.      |
| low      | `1ffbb4e4-f677-4e4a-ac8c-1b0d36485519` | `workers/api/tests/better-auth-organization-seat.test.ts:7`                 | Generate fixture secrets or signing key at test runtime.      |
| low      | `83d6e503-6d79-4d2d-b2b1-a64e0028d6c3` | `workers/api/tests/better-auth-organization-seat.test.ts:15`                | Generate fixture secrets or signing key at test runtime.      |
| low      | `fcbd19db-fdde-4dc9-9b27-6b5ebe881654` | `workers/api/tests/deployment.test.ts:70`                                   | Generate fixture secrets or signing key at test runtime.      |
| low      | `323e1acc-1660-42c7-8bb8-f1f3acf46084` | `workers/api/tests/deployment.test.ts:160`                                  | Generate fixture secrets or signing key at test runtime.      |
| low      | `4037946b-41d4-4b92-a318-821016a255e9` | `workers/api/tests/marketing-offer.test.ts:15`                              | Generate fixture secrets or signing key at test runtime.      |
| low      | `5df00ab5-eefa-4240-a578-c0093c2f9535` | `workers/api/tests/organization-invitation-email.test.ts:19`                | Generate fixture secrets or signing key at test runtime.      |
| low      | `23179a56-77f5-4401-bf9b-701f4e339627` | `workers/api/tests/stripe-webhook-inbox.test.ts:13`                         | Generate fixture secrets or signing key at test runtime.      |
| low      | `b76caca2-fa72-46b9-b504-e704fe8f0492` | `workers/api/tests/stripe-webhook-inbox.test.ts:243`                        | Generate fixture secrets or signing key at test runtime.      |
| low      | `a4645360-2fa5-4894-9be0-180c1aa98c91` | `workers/api/tests/stripe-webhook-inbox.test.ts:267`                        | Generate fixture secrets or signing key at test runtime.      |
| low      | `a59f9182-41ca-4db5-941e-3826c72c5d60` | `workers/api/tests/validate-license.test.ts:254`                            | Generate fixture secrets or signing key at test runtime.      |
| low      | `49de9f90-acd6-4ed0-bcda-3c198dc881e6` | `workers/api/tests/validate-license.test.ts:62`                             | Generate fixture secrets or signing key at test runtime.      |
| low      | `9086b71d-8d0f-4870-ae90-1e860c1c2b99` | `tools/release/health.test.mjs:14`                                          | Run real TLS fixture with a dedicated certificate trust root. |
| low      | `f063c94c-3337-46e6-bacc-3002fd28726b` | `tools/check-installer-sync.mjs:14`                                         | Accept bounded installer contents on stdin.                   |

## Verification

Snyk CLI 1.1309.0 completed fresh local scans. The dependency scan passed all three projects with zero vulnerabilities. The Code scan returned zero issues across all severity levels. The regression checks passed: 446 site tests, 425 API tests, 22 release tests and 15 docs-tool tests. The public browser suite passed 45 tests; three deployed-authentication tests were skipped because that local suite has no deployed environment. The complete root check passed, including types, formatting, lint, dependency audits, source policies, build budgets and four Wrangler deployment dry runs.

These local results do not automatically replace the connected Snyk main-branch snapshot or establish a production deployment. The repository integration must scan the published commit before its dashboard can show the new state.

The final Code scan included ignored findings and returned zero issues with exit code 0. Its source revision and report hashes are recorded in [the verification receipt](./snyk-review-2026-11-20.json). No findings were suppressed.

## Scope correction and toolchain follow-up

The dependency scan above omitted `--dev`. Its zero-vulnerability result covered the default dependency graph and did not establish that development tooling was clear. A later `snyk test --all-projects --dev` found six unique Undici advisories repeated across three projects (18 security findings) and 54 license-policy findings. The code scan remained clear with ignored findings included.

The Undici follow-up pins 7.30.2 for root/API Miniflare and 8.12.4 for the site's Effect Node platform. The first development-inclusive rescan after those pins reported no security advisories; 54 license-policy findings remained. Those license findings must remain visible until the repository owner selects a license-policy disposition or the dependencies are replaced.

The completed development-inclusive verification is in [the follow-up receipt](./snyk-development-scan-2026-11-20.json): zero security advisories, zero code issues, and 54 unapproved license-policy findings. The fourth package manifest scans successfully from its lockfile without its own node_modules directory. License approval is still pending.
