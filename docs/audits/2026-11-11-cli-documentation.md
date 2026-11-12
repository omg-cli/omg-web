# OMG website documentation source audit

This report preserves findings at the original baseline. The implementation status below records the subsequent changes on `codex/docs-audit-upgrade`.

Audit date: 2026-11-11. Read-only audit; no CLI files, worktree state, refs, or dependencies were modified. No builds or package mutations were run.

## Exact baselines

- Web HEAD: `42eea87b6b4b1a13671ad66f79a52f832d2d824d`.
- CLI locally recorded `origin/main`: `f2413f80ae56978e708cc2f5628b74ddc5fa5f7c`. No fetch performed; this is a local remote-tracking snapshot, not proof of GitHub's current live head.
- CLI current committed HEAD: `fd3ca5ad0b2def1ae328abb4cb448befebe82412`, eight commits ahead of origin/main.
- CLI dirty files observed and preserved: `scripts/check-line-coverage.py`, `scripts/test_line_coverage.py`, `src/config/settings.rs`, `src/package_managers/aur/client.rs`. Evidence about these two Rust files must use `git show <ref>:<path>` when assigning release/main behavior.
- Latest GitHub release reported by `gh release view`: `v0.1.224`, published `2026-09-23T18:43:27Z`, URL https://github.com/omg-cli/omg/releases/tag/v0.1.224 . Local tag resolves to `f0d8cb5d8a95dbbc6cae50460178702ac0263ebb`.
- Handbook pins `c43c8ff10701be2cf6a17a39d030fd7180db9308`, reviewed 2026-09-22, in `site/src/lib/docs/topics.ts:24`. This commit is absent locally, but `gh api repos/omg-cli/omg/commits/<sha>` confirms it exists remotely with date `2026-09-22T22:48:53Z`. Do not treat the pin as invalid merely because it is absent from this local clone.
- GitHub release discovery is not proof that the installer's production release marker currently selects that release, or that every binary executes on every target. Asset existence and source behavior were verified; installed artifact execution was not.

## Executive finding

The existing material is substantial and often carefully qualified. All main command families have at least an index entry; eight handbook pages and seventeen learning pages exist. The central problem is version attribution and insufficient deep operational coverage, not wholesale absence or staleness inferred from review dates. Several changes already shipped in 0.1.224 are still described as future/main-only, and newer local AUR hardening must not be silently promoted to released behavior.

## Prioritized corrections with evidence

### P1: Promote already shipped 0.1.224 functionality to the release baseline

Website evidence:

- `site/src/lib/docs/content/installation.ts:78` and `:105` tell Debian 13 / Ubuntu 26.04 users a compatible APT 7 archive is not published yet.
- `site/src/lib/docs/content/security.ts:40`, `:61`, `:110`, `:157`, `:163`, `:168` divide daemon-free audits, audit exit gates, required signer identity, and broader SBOM support into old release versus newer checkout.
- `site/src/lib/docs/content/cli.ts:344` onward, `site/src/lib/docs/content/workflows.ts:153`, `site/src/lib/docs/content/installation.ts:265`, and `site/src/lib/docs/content/architecture.ts:254` contain related release/main distinctions.

Source/release proof:

- `gh release view v0.1.224 --json assets` lists `omg-v0.1.224-x86_64-linux-debian-trixie.tar.gz` and `.sha256`, alongside Arch, Debian, Ubuntu, Fedora, and Apple Silicon macOS pairs.
- At tag v0.1.224, `src/cli/security.rs:119-131` already tries the daemon then falls back to the native manager/scanner.
- At tag v0.1.224, `src/cli/args.rs:1074-1094` defines `audit scan --fail-on-findings` and `audit sbom --inventory-only`; `:1118` requires certificate identity for SLSA signature verification.
- At tag v0.1.224, `src/core/security/sbom.rs:238-240` calls shared inventory generation; `src/core/security/sbom_shared.rs:52-58` defines Arch, Debian, Ubuntu, Fedora identities and refuses other distributions.
- At tag v0.1.224, `src/cli/container.rs:373` defaults to a relative Dockerfile path and `:616` emits a build command without the bad trailing dot. `cli.ts:512` and `:524` should describe the current release first and relegate old-release workarounds to migration notes.

Action: a shared release-baseline record should state 0.1.224 explicitly, and current docs should make ordinary behavior immediately usable. Preserve historical caveats only in clearly marked older-version notes. Do not replace all old version numbers blindly.

### P1: Fix contradictory Node pin precedence

Website `site/src/lib/docs/content/runtimes.ts:103` says `.node-version, .nvmrc, package.json, then .tool-versions`. The Node learning guide says `.tool-versions` before package.json, which matches the shell hook.

At release/main `src/hooks/mod.rs:22-54`, VERSION_FILES puts `.node-version`, `.nvmrc`, `.tool-versions`, then `package.json`. `:418-423` uses `entry(...).or_insert`, so later package.json fields do not overwrite the earlier pin. `:453-488` processes directories nearest first, then mise layers. Correct the handbook row and diagram wording. Distinguish hook detection from any provider-specific resolver if they differ; a single generic priority statement must not erase separate entry points.

### P1: Correct environment inventory scope

Website `site/src/lib/learn/content/reproducible-dev-environments.ts:13` says the published CLI captures seven runtimes. At v0.1.224 and origin/main, `src/core/env/fingerprint.rs:41-54` iterates `SUPPORTED_RUNTIMES` and chains every registry tool name, including installed/probed entries; the collection is not a fixed seven-runtime subset. The limits about package names rather than package versions, and no application dependency graph, remain valuable. Update runtime/tool coverage without implying that absent or unsuccessfully probed entries are captured.

### P1: Keep unreleased AUR guarantees separate

The web config example/table (`configuration.ts:86`, `:106`) and yay comparison (`omg-vs-yay.ts:50`) describe persistent artifact reuse. Release224 and origin/main still default `cache_builds=true` (`git show origin/main:src/config/settings.rs`, lines 238-256). Current committed HEAD changes it to false and adds `security_profile=standard|hardened`; HEAD `docs/aur.md:73-77` says persistent/shared output, source, and compiler-cache reuse is disabled, and describes an optional hardened admission profile.

These are CURRENT LOCAL COMMITTED HEAD behavior, not origin/main/released224. The settings/client working files are also dirty. A docs refresh targeting current development must label this branch/commit explicitly and read committed bytes. A release guide should retain released guarantees and add an explicitly unreleased note. Do not publish the hardened profile as an available 0.1.224 command setting.

### P2: Add a real environment-variable and path contract

`site/src/lib/docs/content/configuration.ts:218` onward lists only a small subset. Missing user controls include `OMG_CACHE_DIR`, `OMG_TELEMETRY`, `OMG_NO_UPDATE_CHECK`, dashboard credential handling, and relevant distinction between installer/runtime variables.

Proof: `src/core/paths.rs:289-295` implements OMG_CACHE_DIR; `src/core/telemetry.rs:78` checks OMG_TELEMETRY; `src/cli/update_notice.rs:112` checks presence of OMG_NO_UPDATE_CHECK. `src/core/paths.rs:54-82` ignores caller-controlled storage/config/socket variables when root. `configuration.ts:69` currently says overrides apply on every platform without stating the root exception; `:64` only partially describes it. Document privileges, defaults, scope, relative/empty behavior, and which values are credentials. Do not expose internal testing-only overrides as supported user configuration.

### P2: Document version-specific exit statuses for agents and CI

The CLI page correctly warns that JSON is per command; this should become a compact command contract: can it mutate, prompt, use network, emit parseable output, and fail on findings/drift?

Verified example: v0.1.224 `src/cli/config.rs:250-256` prints validation issues and returns success. Origin/main `src/cli/config.rs:250-255` now bails on issues. The current source docs `docs/configuration.md:29` still say validation always succeeds when reporting issues, so copying upstream prose is not enough. `audit scan` is report-only by default; opt into --fail-on-findings. `doctor --turbo` primes sudo rather than performing ordinary health checking (`src/cli/args.rs:371-384`). Explain these directly in CI examples.

### P2: Add current container installer checksum option

The source parser has `container init --installer-digest URL=SHA256`, repeatable, at origin/main `src/cli/args.rs:1054-1059`; `src/cli/container.rs:581-598` validates exactly 64 hexadecimal characters and rejects duplicate URLs. It is absent from curated `cli.ts:523-524` and the nested-options table. This is a main-only addition relative to 0.1.224. A detailed containers page should state that init generates a file and can resolve remote digests unless checksums are supplied.

### P2: Replace misleading Python provider detail

`site/src/lib/learn/content/python.ts:13` says the published release queries GitHub python-build-standalone releases to select matching binaries. At v0.1.224 `src/runtimes/python.rs:53-69` uses a validated Astral catalog; `src/runtimes/python/catalog.rs:25-26` points into uv's catalog. GitHub release discovery remains a historical exact-version fallback (`python.rs:299-302`). On main the catalog moved to uv-python-managed (`catalog.rs:26`). Describe the provider/trust model accurately and avoid making the low-level endpoint the main user story. This audit did not execute historical release Python downloads, so it does not claim that the old catalog endpoint works today.

### P2: Qualify history recovery and shell behavior

`troubleshooting.ts:199` says corrupt history is quarantined automatically without explaining the operation. In current source `src/core/history.rs:881` tests that reads fail and retain malformed bytes; the write/append path quarantines (`:334`). A user running `history` should not be promised a preserved .corrupt file has already appeared.

`runtimes.ts:146` warns reviewed Bash/Zsh hooks can undo venv activation. Main commit history includes shell-state preservation changes; current hook output tracks `_OMG_PATH_PREFIX` and `_OMG_PATH_BASE` (`src/hooks/mod.rs:237-280`). Recheck actual emitted shell templates before propagating this as current-main guidance; explicit .venv/bin/python remains safe. No shell integration fixture was run during this read-only audit, so this is a follow-up verification requirement, not a proven claim that every shell now preserves every environment.

## Eight-handbook coverage matrix

Status means depth and accuracy after source spot checks, not exhaustive correctness certification.

| Module          | Existing useful coverage                                                        | Material gap/correction                                                                                                                | Upstream/source anchors                                          |
| --------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| installation    | backend matrix, paired binaries, verified installer, source features, uninstall | released224 APT7 availability; current release first; exact prerequisites and service ownership                                        | install.sh; docs/installation.md; release224 assets              |
| cli             | index of all main command families, many nested flags                           | generated per-command reference; missing standalone ec/tc/oc/uc rows; audit flags, main-only installer-digest, exit behavior           | src/cli/args.rs; src/cli/mod.rs; docs/cli.md                     |
| configuration   | paths, practical AUR settings, policy, version files                            | full accepted settings schema; allow_network/TTL/optional directories; root exceptions; CLI-vs-TOML keys; versioned exits              | src/config/settings.rs; src/cli/config.rs; src/core/paths.rs     |
| runtimes        | fourteen runtimes, pins, storage, verification, examples                        | Node precedence; provider/platform matrix; individual lifecycle guides for nine other runtimes; Rust components/targets and pin limits | src/runtimes/*; src/hooks/mod.rs; docs/runtimes.md               |
| workflows       | daily package/runtime/team/CI/security tasks                                    | released224 gate examples; complete CI workflow/cache/credentials; supported backend caveats near each workflow                        | docs/workflows.md; docs/team.md; docs/environment-portability.md |
| security        | grades, policy, signature limits, SBOM, audit integrity, telemetry              | current release baseline; explicit finding gates; AUR lifecycle/threat limits and versioned hardened profile; evidence retention       | src/core/security/*; docs/security.md; docs/aur.md               |
| troubleshooting | daemon, hooks, packages, caches, rollback                                       | read-vs-write history corruption; bounded diagnostics before clearing state; runtime integrity errors and provider outages             | src/core/history.rs; docs/troubleshooting.md; docs/cache.md      |
| architecture    | search/runtime flows, caches, IPC, daemon workers                               | current release baseline; pin actual protocol contracts; links to ownership/service and diagnostics; avoid universal guarantees        | `src/daemon/*`; `src/ipc/*`; docs/architecture.md; docs/ipc.md   |

## Seventeen-learning-module coverage matrix

| Module                        | Assessment / actionable follow-up                                                                                                                                                                                                                              |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| bun                           | Good staged install/pin/dependency boundary narrative. Recheck exact asset/digest wording; link a versioned source and provider support matrix.                                                                                                                |
| go                            | Good pins and go.mod minimum/toolchain distinction; old version numbers are examples, not evidence of an error. Add current LTS/supported-version guidance only from checked provider data.                                                                    |
| node                          | Hook priority correctly puts .tool-versions before package.json; reconcile handbook. Current-symlink PATH wording differs from concrete pin paths; explain actual entry point.                                                                                 |
| python                        | Correct venv/application boundary; wrong primary catalog description; Linux paths should link platform-aware storage; verify current hook preservation before repeating old venv warning.                                                                      |
| rust                          | Good direct manifests, component pins, mutation lock guidance. Document component/target behavior, supported hosts, uninstall limitations; do not generalize tool-registry verification to every provider.                                                     |
| node-npm-pnpm                 | Good owner/lockfile boundaries. Explain installation prerequisite for pnpm and exact packageManager/lockfile precedence; cross-link complete task guide.                                                                                                       |
| task-runner                   | Good ecosystem priorities, required task, forwarding, .omg.toml distinction. Add watch/parallel conflict semantics, --using/--yes, noninteractive ambiguity failure and supported mise subset.                                                                 |
| reproducible-dev-environments | Important accurate inventory limits and Gist caveats; fixed seven-runtime claim contradicts released224 iteration of all runtimes plus registry tools. Onboarding should install committed pins rather than a floating lts when claiming a pinned environment. |
| migrate-from-asdf             | Reversible manual migration is good. Explicitly document unsupported plugin/backends and asdf special version syntax before describing compatibility.                                                                                                          |
| migrate-from-nvm              | Reversible workflow and path checks are good. Tie aliases and global npm packages to installed Node and prove current hook behavior.                                                                                                                           |
| migrate-from-yay              | Useful command map and dry runs. Clarify recursive remove is not blanket behavioral equivalence; local/main/release AUR safety guarantees must be separated.                                                                                                   |
| omg-vs-asdf                   | Broad position is clearly stated. External competitor claims need current primary-source verification; this audit checked OMG source only.                                                                                                                     |
| omg-vs-mise                   | Appropriately acknowledges deeper mise scope and compatibility subset. Link a substantive OMG mise compatibility page instead of only general runtime/task material. Competitor claims not reverified in this audit.                                           |
| omg-vs-nvm                    | Useful scope/shell tradeoffs. Automatic activation requires installed matching versions; avoid wording that implies the hook installs missing runtimes. Competitor claims not reverified.                                                                      |
| omg-vs-pyenv                  | Useful venv and custom-build boundary. Same current-hook verification needed as Python handbook; competitor/plugin claims not reverified.                                                                                                                      |
| omg-vs-volta                  | Strong narrow migration framing and engines-vs-volta caveat. Source label still references 223; replace with pinned reviewed release source and state unsupported npm/yarn/global-tool guarantees.                                                             |
| omg-vs-yay                    | Substantive security comparison; persistent cache statement is correct for released224/origin-main but differs from local committed HEAD; cannot advertise latest local hardening without label. Claims about yay behavior not independently reverified.       |

## Missing major documentation domains

The CLI source repository has dedicated material for these, while the website only provides short rows/paragraphs or lacks a topic. Prioritize task-oriented pages, not one page per every Rust module.

1. Getting started / first successful task, terminology/glossary, platform/backend capability matrix. Sources: docs/getting-started.md, quickstart.md, glossary.md, packages.md, package-search.md.
2. Complete packages/AUR guide: supported package sources, recipe review, dependencies, isolation/network opt-ins, attended gates, update modes, partial upgrade caveats, local archive admission and rollback constraints. Sources: docs/packages.md, aur.md, migration/from-yay.md and src/cli/packages/*.
3. Dedicated shell integration with per-shell setup, duplicate-entry avoidance, pin resolution, missing versions, prompt counters and noninteractive behavior. Sources: docs/shell-integration.md, src/hooks/mod.rs and emitted shell assets.
4. Daemon operation, service ownership, user vs root storage, stale sockets, restart/update pairing, launchd/systemd examples and direct fallback limits. Sources: docs/daemon.md, ipc.md, src/daemon/*.
5. Environment portability and team workflows: lock schema, capture/check exact scope, Gist visibility, sync vs install, portable manifest mappings, snapshots vs history, and availability across backends. Sources: docs/environment-portability.md, team.md, src/core/env/*.
6. Task runner and mise compatibility reference: precedence, args, watch, parallel, required tooling, config/file trust, supported environment/task semantics and explicit unsupported features. Sources: docs/task-runner.md, mise-compatibility.md, `src/config/mise_*.rs`, `src/core/task_runner/*`.
7. Containers and CI: Docker/Podman prerequisite, file generation, installer digest pinning, mounts/env visibility, reproducible CI setup with parsed outputs and exits. Sources: docs/containers.md, integrations.md, src/cli/container.rs, src/cli/ci.rs.
8. Cache/history/snapshots/recovery: separate disposable derived state from installed runtimes, owner data, audit evidence; platform rollback limits; exact restore behavior. Sources: docs/cache.md, history.md, src/core/history.rs and src/cli/snapshot.rs.
9. Tools registry: install/search/remove/update, exact inventory, download trust, executable exposure and conflicts. Source: src/runtimes/tool_registry.rs, src/cli/tool.rs. Current CLI lists tools but there is no substantial tools workflow.
10. Updates and privacy: release pairing, package-managed vs direct installs, update notice opt-out/cache/timing and functional requests vs telemetry. Sources: docs/update-notices.md, src/cli/update_notice.rs, src/core/telemetry.rs.
11. Enterprise/account limits: fleet/report actual evidence sources, token transport, unavailable metrics/enforcement, accepted export formats vs certification. Source: docs/enterprise.md, src/cli/fleet.rs, enterprise.rs, team.rs. Existing warning against compliance certification is good but thin.
12. Remaining runtime lifecycle/provider guides (Ruby, Java, Deno, Pi, Zig, .NET, Erlang, PHP, Swift) with checksum provenance and host constraints. A table of example versions does not fully document these managers.

Do not expose repository engineering operations (QEMU/CI/security-audit plans) as end-user CLI docs merely to claim source-doc parity. Contributor/architecture docs can have a separate clearly named scope.

## Agent-friendly completion criteria

- One machine-readable docs manifest with canonical URL, markdown URL, title, scope, release version, reviewed source SHA, source paths, backend/platform availability and last reviewed date.
- Separate released versus development claims; version source references must point to immutable GitHub commit/tag URLs, not generic website pages bearing source-file titles.
- Per-command input/output contract: positional args, flags/defaults, exit behavior, JSON support/shape, network/credential needs, mutations, interactive gates and backend limits. The current global --json warning is a good base.
- Dedicated stable anchors for commands and options, cross-links for prerequisites and failure recovery, short tested commands with expected output/result.
- A reviewable source inventory (command tree, runtime names, registry tools, settings/variables) and coverage check; avoid scraping implementation prose as authoritative generated docs.
- CI check for required command and option coverage, valid internal links and canonical Markdown parity; release refresh should compare source facts and flag unresolved drift, never merely update a date.
- Website reader/agent entry points should link both the concise guide and deep reference. Existing curated typed content can support this without a framework migration.

## Limitations and unchecked areas

This is source/document inspection with targeted git-tag comparisons and GitHub metadata reads. It is not execution certification, a security audit, a complete parser-by-parser flag proof, or a competitor research audit. No full Rust build, test suite, downloaded binary execution, live system mutation, daemon startup, shell-profile edit or Cloudflare operation was performed. Provider download URLs and every supported backend were not exercised. All 25 authored modules were inventoried/read or selectively searched, with deeper checks focused on high-impact behavior. Source docs were spot-checked and can themselves lag implementation. Current CLI dirty bytes were never treated as a release baseline. No fetch was performed.

## Proposed per-topic pin/update strategy

Use a single released baseline SHA `f0d8cb5d8a95dbbc6cae50460178702ac0263ebb` (v0.1.224) for the eight main public topics, with an audit date reflecting the actual review. A reviewed source path is an evidence link, not a promise that every sentence in that upstream Markdown is authoritative. Keep supplemental implementation references in the topic metadata or manifest. If adding development notes, separately pin `f2413f80ae56978e708cc2f5628b74ddc5fa5f7c` and label the behavior unreleased. The locally recorded origin/main may lag remote GitHub; no fetch was performed. Do not silently use local committed HEAD/dirty files as the public release contract.

| Topic           | Primary reviewed Markdown path | Additional implementation evidence to pin                                                         | Update guidance                                                                                                                            |
| --------------- | ------------------------------ | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| installation    | docs/installation.md           | install.sh, src/cli/self_update.rs, Cargo.toml, .github/workflows/release.yml plus release assets | v224 platform pairs and APT7 archives; preserve explicit architecture/backend constraints; verify live marker separately                   |
| cli             | docs/cli.md                    | src/cli/args.rs, src/cli/mod.rs, per-command handlers                                             | release-derived command inventory and options; main-only --installer-digest gets separate source/label                                     |
| configuration   | docs/configuration.md          | src/config/settings.rs, src/cli/config.rs, src/core/paths.rs, src/core/security/policy.rs         | release settings/defaults with CLI-key mapping; release validate exit-success caveat; main validate failure in development note            |
| runtimes        | docs/runtimes.md               | src/runtimes/mod.rs, individual managers and common.rs, src/hooks/mod.rs                          | correct hook precedence and provider contracts; only claim actual release platform coverage                                                |
| workflows       | docs/workflows.md              | src/cli/env.rs, src/core/env/fingerprint.rs, src/cli/ci.rs, src/core/task_runner.rs               | current release audit gates and environment inventory scope; no floating install in a claimed pinned onboarding example                    |
| security        | docs/security.md               | src/cli/security.rs, src/core/security/scan.rs, sbom_shared.rs, policy.rs, audit_log.rs           | release direct audits, optional finding gate, inventory-only and required identity; local AUR hardened profile stays out of release claims |
| troubleshooting | docs/troubleshooting.md        | src/core/history.rs, src/cli/doctor.rs, src/core/paths.rs, src/daemon/*                           | explain exact read/write recovery; release-aware diagnostic exits; retain valuable preservation guidance                                   |
| architecture    | docs/architecture.md           | `src/daemon/*`, `src/ipc/*`, src/hooks/mod.rs, src/core/paths.rs                                  | source-pin protocol/cache/path claims, link user-facing operational guides; no broad audit/security certification                          |

For new deep guides, source paths follow the domain list above and should be individually pinned to the same release. Specialized source docs which only exist on main can guide research; independently verify which behavior exists at the released baseline. Source-link labels should identify the source actually linked; several learning source labels name Rust files but href only points at a generic website guide.

## Measured inventory and classification

A text-level inventory of clap enum declarations (not executing a binary) found the same command shape at v224, origin/main and HEAD: **53 top-level variants** and **88 nested variants across 18 nested enums**, 19 command enums total. These totals include parents, hidden shell helper commands, prompt-counter commands, aliases represented by attributes, and feature-gated Account; they are not 141 independent user-facing commands. Flag-level differences still exist. Existing web content has **61 handbook sections across eight topics** and **71 learning sections across seventeen modules**, measured from authored heading entries.

Nested variant counts: hooks 4, workspace 8, config 6, privacy 4, env 6, tool 6, team 11, team roles 1, golden path 3, container 10, account 3, audit 11, snapshot 4, CI 3, migrate 2, fleet 1, enterprise 4, enterprise policy 1.

Candidate **public user/reference docs**: getting-started, quickstart, glossary, installation, cli, packages, package-search, aur, shell-integration, runtimes, task-runner, mise-compatibility, configuration, workflows, environment-portability, team, containers, integrations, daemon, cache, history, troubleshooting, security, update-notices, enterprise, tui, faq, cheatsheet, migration/from-yay, performance-tips (only measured/qualified advice), changelog. These should be curated for overlap rather than automatically creating one URL per file.

Candidate **public contributor/technical docs**, with explicit audience: architecture, under-the-hood, ipc, documentation-style, selected contribution/release explanations when relevant. These should not dominate ordinary onboarding/search.

**Internal engineering / operations, excluded from end-user completeness**: `docs/plans/*`, `docs/operations/*`, verification and audit receipts, native line-coverage procedures, QEMU test/image/debug docs, local CI runner/build comparison, benchmark evidence files, Cloudflare CI architecture and credit/billing research, release-readiness/operations checklists, QA-loop policies, security audit proposals, sqlite-WAL reset probe, resource-collector internals. Some may be useful to contributors in the source repository; absence from the user handbook is not a documentation coverage bug.

## Implementation and export-regression verification appendix

The shared website now assembles 43 documentation entries: eight handbook topics, eighteen authored SveltePress Markdown guides (nine operational guides and nine additional runtime/provider guides), and seventeen learning pages. All fourteen native providers have a dedicated runtime guide. The operational additions cover getting started, packages/AUR, shell integration, daemon operation, environment portability, tasks/mise compatibility, containers, tools, and updates. This materially closes the initial coverage gaps; the original matrix above records the pre-change audit rather than claiming those gaps remain unchanged.

New `site/src/lib/docs/documentation.server.test.ts` exercises the real `documentationEntries()` output and Markdown. Seventeen tests verify the full catalog/runtime/domain inventory, unique reader/export URLs and canonical metadata, release-source pins, section/content preservation, all seven typed block variants, native Markdown source evidence, and the high-impact release/pin/inventory/provider/CI/recovery facts corrected by the audit. No production assembly functions or snapshots were mocked or reimplemented.

This regression suite verifies published documentation content, not downloaded CLI execution, host-specific provider availability, or every CLI flag/exit behavior in an executable release. External competitor claims still require their own current primary-source review before substantive updates.

## Remaining deeper coverage

The new task guides address the largest end-user gaps. Dedicated enterprise/fleet credential and reporting workflows, a deeper cache/history/snapshot recovery guide, and contributor operations remain separate follow-up scope. The handbook covers their current command families and core limits; the site does not claim a complete executable contract for every parsed option. A platform execution matrix and renewed primary-source review of competitor comparisons remain unperformed.
