import {
  advisoryOrigin,
  freshAt,
  lagMinutes,
  sampleMetrics,
  type FeedStatus,
  type RecentPage,
  type RecordDetails,
  type Revision,
} from './advisories.ts';

const project = 'https://github.com/omg-cli/omg';
const projectSecurity = `${project}/blob/main/docs/security.md`;
const canonical = 'https://cve.getomg.dev';
const siteSecurity = 'https://getomg.dev/security/';
const kevCatalog = 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog';
const release = `${project}/releases/tag/v0.1.226`;
const releaseSbom = `${project}/releases/download/v0.1.226/omg-v0.1.226.cdx.json`;
const number = new Intl.NumberFormat('en-US');
const date = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});
const clock = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'UTC',
});
const shortDate = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});

const feeds = [
  [
    'cve',
    'CVE Program',
    'New CVE records, revisions and rejections',
    'https://github.com/CVEProject/cvelistV5',
  ],
  [
    'arch',
    'Arch Linux Security Tracker',
    'Distribution advisories and fixed package versions',
    'https://security.archlinux.org/',
  ],
  ['kev', 'CISA KEV', 'Known exploited vulnerabilities', kevCatalog],
];

const zeroDays = [
  {
    id: 'CVE-2026-102764',
    product: 'BeyondTrust Remote Support',
    advisory: 'https://www.beyondtrust.com/blog/entry/bt26-05',
  },
  {
    id: 'CVE-2026-88772',
    product: 'Citrix NetScaler',
    advisory:
      'https://support.citrix.com/external/article/CTX697096/citrix-netscaler-adc-and-citrix-netscaler-gateway-security-bulletin.html',
  },
  {
    id: 'CVE-2026-22769',
    product: 'Dell RecoverPoint for VMs',
    advisory: 'https://www.dell.com/support/kbdoc/en-us/000426773/dsa-2026-079',
  },
];

const checks = [
  [
    'Arch Linux',
    'Arch Linux Security Tracker',
    'Prepared ALPM transaction, including dependencies and replacements. AUR, local packages and unmapped repositories can be Unknown.',
  ],
  [
    'Debian / Ubuntu',
    'OSV with distribution package identities',
    'Prepared APT versions. Packages or dependencies without an authenticated source mapping can be Unknown.',
  ],
  [
    'Fedora',
    'DNF updateinfo',
    'Prepared RPM transaction. The installed-package advisory interface leaves gaps for newly proposed packages.',
  ],
  [
    'Homebrew',
    'Native transaction review',
    'The complete transaction cannot be frozen for advisory review. OMG requires explicit Unknown-coverage consent.',
  ],
  [
    'npm, Cargo, Go, Python',
    'OSV by exact registry identity and version',
    'Resolved public direct and transitive dependencies. Private, unresolved or unsupported sources can leave coverage gaps. Pi uses the managed npm checks.',
  ],
  [
    'Managed runtimes',
    'Vendor disclosures and exact version mappings',
    'OMG reviews managed versions before installation or activation. OS, architecture, vendor and bundled components affect coverage.',
  ],
];

const vendors = [
  [
    'Node.js',
    'Node.js Security Working Group',
    'https://github.com/nodejs/security-wg/tree/main/vuln/core',
  ],
  [
    'Python',
    'Python Software Foundation and CVE Program',
    'https://github.com/psf/advisory-database',
  ],
  ['Go', 'Go vulnerability database via OSV', 'https://vuln.go.dev/'],
  ['Rust', 'RustSec toolchain advisories', 'https://github.com/RustSec/advisory-db/tree/main/rust'],
  [
    'Ruby',
    'RubySec interpreter advisories',
    'https://github.com/rubysec/ruby-advisory-db/tree/master/rubies/ruby',
  ],
  ['Java', 'Adoptium Temurin VDR', 'https://github.com/adoptium/temurin-vdr-generator'],
  ['Bun', 'Bun publisher advisories', 'https://github.com/oven-sh/bun/security/advisories'],
  ['Deno', 'Deno publisher advisories', 'https://github.com/denoland/deno/security/advisories'],
  ['Zig', 'Zig publisher advisories', 'https://github.com/ziglang/zig/security/advisories'],
  [
    '.NET',
    'Microsoft SDK release metadata and CVEs',
    'https://github.com/dotnet/core/tree/main/release-notes',
  ],
  [
    'Erlang',
    'OTP publisher advisories and component versions',
    'https://github.com/erlang/otp/security/advisories',
  ],
  ['PHP', 'PHP publisher advisories', 'https://github.com/php/php-src/security/advisories'],
  ['Swift', 'Swift publisher advisories', 'https://github.com/swiftlang/swift/security/advisories'],
];

function escape(text: string) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function time(value: string | null, compact = false) {
  if (value === null) return '—';
  const day = compact ? shortDate.format(Date.parse(value)) : date.format(Date.parse(value));
  const hour = clock.format(Date.parse(value));
  return `<time datetime="${value}">${day} <span class="time-hour">${hour} UTC</span></time>`;
}

function duration(minutes: number | null) {
  if (minutes === null) return '—';
  if (minutes < 1) return `${Math.floor(minutes * 60)}s`;
  if (minutes < 60) return `${minutes.toFixed(1)} min`;
  if (minutes < 1_440) return `${(minutes / 60).toFixed(1)} hr`;
  return `${(minutes / 1_440).toFixed(1)} days`;
}

function layout(title: string, path: string, body: string, refresh = false) {
  const description =
    'Track the advisories OMG ingests, how quickly revisions arrive, and what OMG checks before a package or runtime is installed.';
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="theme-color" content="#101615">
<title>${escape(title)} · OMG Security</title>
<meta name="description" content="${description}">
<link rel="canonical" href="${canonical}${path}">
<link rel="stylesheet" href="/dashboard.css">
${refresh ? '<script src="/dashboard.js" defer></script>' : ''}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="topbar"><div class="shell topbar-inner">
<a class="brand" href="/" aria-label="OMG Security dashboard"><span>OMG</span><span class="brand-divider"></span><span>Security</span></a>
<nav aria-label="Security dashboard">
<a href="/#intake">Intake</a><a href="/#exploitation">Zero-days</a><a href="/#coverage">Install checks</a><a href="/#audit">Audit evidence</a>
</nav></div></header>
<main class="shell" id="main">${body}</main>
<footer class="shell footer"><a class="footer-home" href="https://getomg.dev/">OMG package manager</a><div><a href="${siteSecurity}">Project security</a><a href="${advisoryOrigin}/v1/status">Advisory API</a><a href="${project}/security/policy">Report a vulnerability</a><a href="${project}">GitHub</a></div></footer>
</body></html>`;
}

function lookup() {
  return `<form action="/lookup" class="lookup"><label for="cve-search">Look up a CVE</label>
<div><input id="cve-search" name="id" type="search" maxlength="28" placeholder="CVE-2026-12345" required spellcheck="false" autocomplete="off"><button type="submit">Find CVE</button></div></form>`;
}

function sourceState(feed: FeedStatus['feeds'][number] | undefined, now: number) {
  if (!feed) return 'Unavailable';
  if (feed.error) return 'Check failed';
  if (!feed.checked_at) return 'Unavailable';
  if (!feed.fresh || !freshAt(feed.checked_at, now)) return 'Stale';
  return feed.complete ? 'Current' : 'Partial';
}

function sources(status: FeedStatus | null, now: number) {
  return `<aside class="panel sources" aria-labelledby="sources-title">
<div class="panel-heading"><div><h2 id="sources-title">Scheduled feeds</h2><p>Cloudflare checks these feeds every 5 minutes.</p></div></div>
<ul>${feeds
    .map(([key, label, summary, url]) => {
      const feed = status?.feeds.find(item => item.source === key);
      const state = sourceState(feed, now);
      return `<li><div class="feed-top"><a href="${url}">${label} <span aria-hidden="true">↗</span></a><span class="status-label ${state === 'Current' ? 'ok' : 'warn'}">${state}</span></div>
<p>${summary}</p><div class="feed-time">Checked ${time(feed?.checked_at ?? null, true)}</div></li>`;
    })
    .join('')}</ul>
<a class="text-link api-link" href="${advisoryOrigin}/v1/status">Feed status JSON <span aria-hidden="true">↗</span></a>
</aside>`;
}

function metricsCard(label: string, value: string, note: string) {
  return `<div class="metric"><dt>${label}</dt><dd>${value}</dd><p>${note}</p></div>`;
}

function intakeChart(page: RecentPage, metrics: ReturnType<typeof sampleMetrics>) {
  const { buckets, oldest, chartHours, chartStart, bucketWidth } = metrics;
  const max = Math.max(1, ...buckets.map(bucket => bucket.published + bucket.revised));
  return `<div class="chart" aria-label="Counts by publisher timestamp in ${bucketWidth / 60_000}-minute bins">
<div class="chart-bins">${buckets
    .map((bucket, index) => {
      const from = chartStart + index * bucketWidth;
      const until = from + bucketWidth;
      const older = page.next_cursor !== null && until <= oldest;
      const description = older
        ? `${clock.format(from)} to ${clock.format(until)} UTC · Outside sample`
        : `${clock.format(from)} to ${clock.format(until)} UTC · ${bucket.published} initial publications · ${bucket.revised} other revisions`;
      return `<div class="bin${older ? ' outside' : ''}" aria-label="${description}" role="img" title="${description}"><div class="bin-revised" style="height:${(bucket.revised / max) * 100}%"></div><div class="bin-published" style="height:${(bucket.published / max) * 100}%"></div></div>`;
    })
    .join('')}</div>
<div class="chart-axis" aria-hidden="true"><span>${chartHours}h ago</span><span>${clock.format(chartStart + 3 * bucketWidth)}</span><span>${clock.format(chartStart + 6 * bucketWidth)}</span><span>${clock.format(chartStart + 9 * bucketWidth)}</span><span>Latest</span></div>
<div class="chart-key"><span>Initial publication</span><span>Other revision</span>${page.next_cursor !== null && oldest > chartStart ? '<span>Outside sample</span>' : ''}</div>
</div>`;
}

function labels(record: Revision) {
  if (record.state === 'REJECTED') return 'Rejected';
  if (record.state === 'PUBLISHED') {
    return record.modified_at === record.published_at ? 'New' : 'Revised';
  }
  return 'Other';
}

function liveView(status: FeedStatus | null, page: RecentPage | null, now: number) {
  const cve = status?.feeds.find(item => item.source === 'cve');
  const cveState = sourceState(cve, now);
  const complete = page?.complete && freshAt(page.checked_at, now) && cveState === 'Current';
  const archiveStatus = status?.baseline.archive_verified
    ? status.bootstrap_complete && status.baseline.caught_up
      ? 'Publisher archive verified'
      : 'Archive verified · delta catch-up pending'
    : 'Publisher verification pending';
  const sample = page ? sampleMetrics(page) : null;
  const sampleNote = sample
    ? `${number.format(sample.measured)} measured revisions`
    : 'Time from publisher revision to receipt';
  const publicationCount = sample
    ? `${sample.lowerBound || !complete ? '≥' : ''}${number.format(sample.newlyPublished)}`
    : '—';

  return `<div id="live-view">
<section class="hero" aria-labelledby="title">
<div class="hero-top"><span class="eyebrow">Advisory intake &amp; package checks</span><span class="status-label hero-status ${complete ? 'ok' : 'warn'}">${complete ? 'CVE feed current' : `CVE feed ${cveState === 'Current' ? 'partial' : cveState.toLowerCase()}`}</span></div>
<h1 id="title">Security coverage</h1>
<p class="lede">See which advisories OMG receives, how quickly they arrive, and what OMG checks before installing packages or runtimes.</p>
<div class="hero-meta"><span>Last CVE check <strong>${time(cve?.checked_at ?? page?.checked_at ?? null)}</strong></span><a class="text-link" href="/" aria-label="Refresh the dashboard">Refresh <span aria-hidden="true">↻</span></a></div>
</section>
<dl class="metrics">
${metricsCard('Archive records imported', status ? number.format(status.baseline.imported) : '—', status ? archiveStatus : 'Archive status unavailable')}
${metricsCard('New CVEs · 24h', publicationCount, sample?.lowerBound || (sample && !complete) ? 'Minimum from latest revisions' : 'Publication timestamps')}
${metricsCard('Median intake lag', duration(sample?.median ?? null), sampleNote)}
${metricsCard('95th-percentile lag', duration(sample?.p95 ?? null), sampleNote)}
</dl>
<div class="overview" id="intake">
<section class="panel activity" aria-labelledby="activity-title">
<div class="panel-heading"><div><h2 id="activity-title">CVE intake activity</h2><p>${page && sample ? `Publisher activity over the last ${sample.chartHours}h in the latest ${page.records.length} stored revisions.` : 'Publisher activity in the recent CVE feed.'}</p></div><span class="tag">UTC</span></div>
${page && sample ? intakeChart(page, sample) : '<p class="notice">The recent CVE feed is unavailable.</p>'}
</section>
${sources(status, now)}
</div>
</div>
<section class="section" id="recent">
<div class="section-heading"><div><h2>Recent CVE records</h2><p>Newest by publisher revision time. Each row shows when OMG received that revision.</p></div><a class="button subtle" href="/archive">Browse 30-day archive <span aria-hidden="true">→</span></a></div>
${lookup()}
<div id="current-revisions">
${page ? table(page.records.slice(0, 12)) : '<p class="notice">Recent CVE records could not be loaded. The feed will retry on the next refresh.</p>'}
</div></section>`;
}

function table(records: readonly Revision[]) {
  if (!records.length)
    return '<p class="notice">The advisory service returned no CVE revisions in this window.</p>';
  return `<div class="table-wrap"><table aria-label="Stored CVE revisions">
<thead><tr><th scope="col">CVE ID</th><th scope="col">Revision</th><th scope="col">Publisher time</th><th scope="col">Received by OMG</th><th scope="col">Lag</th></tr></thead>
<tbody>${records
    .map(record => {
      const state = labels(record);
      return `<tr><th scope="row"><a href="/cves/${record.id}">${record.id}</a></th><td><span class="record-label ${state.toLowerCase()}">${state}</span></td>
<td>${time(record.modified_at, true)}</td><td>${time(record.fetched_at, true)}</td><td class="lag">${duration(lagMinutes(record))}</td></tr>`;
    })
    .join('')}</tbody></table></div>`;
}

function exploitation() {
  return `<section class="section" id="exploitation">
<div class="section-heading"><div><h2>Documented zero-days</h2><p>These CVEs are in the OMG archive and were publicly documented as exploited before a fix was available.</p></div><a class="button subtle" href="${kevCatalog}">CISA KEV catalog <span aria-hidden="true">↗</span></a></div>
<ul class="evidence-list">${zeroDays
    .map(
      ({ id, product, advisory }) =>
        `<li><a href="/cves/${id}">${id}</a><span>${product}</span><a class="text-link" href="${advisory}">Vendor advisory <span aria-hidden="true">↗</span></a></li>`
    )
    .join('')}</ul>
<p class="section-note">These are selected public examples. CISA KEV listings document known exploitation and can include vulnerabilities exploited after a fix was available. OMG checks the CISA feed every five minutes and shows its listing date on individual CVE records. Public feeds cover vulnerabilities after disclosure.</p>
</section>`;
}

function auditEvidence() {
  return `<section class="section" id="audit">
<div class="section-heading"><div><h2>Evidence behind OMG audits</h2><p>Audit commands check installed inventory. Install reviews check the proposed transaction before it can proceed.</p></div></div>
<div class="coverage-grid">
<article><h3><code>omg audit scan</code></h3><p>Matches installed versions against Arch Security Tracker on Arch, OSV on Debian and Ubuntu, and DNF advisories on Fedora. The CLI reports coverage gaps when evidence is incomplete.</p><a class="text-link" href="${projectSecurity}#vulnerability-scanning">Audit inputs and behavior ↗</a></article>
<article><h3><code>omg audit sbom</code></h3><p>Exports a CycloneDX inventory with vulnerability matches on supported systems. An inventory-only run records the omission of advisory matching.</p><a class="text-link" href="${projectSecurity}#sbom-generation">Inventory format and coverage ↗</a></article>
<article><h3>OMG release verification</h3><p>OMG publishes archive checksums, a source dependency SBOM and signed build provenance. See the artifacts from v0.1.226.</p><a class="text-link" href="${release}">Release artifacts ↗</a> <a class="text-link" href="${releaseSbom}">CycloneDX SBOM ↗</a></article>
</div>
<p class="section-note">Every stored CVE detail links to the original publisher record and displays the SHA-256 of the payload OMG stores. Archive verification reconciles CVE Program records with publisher Git identities.</p>
</section>`;
}

function coverage() {
  return `<section class="section" id="coverage">
<div class="section-heading"><div><h2>What OMG checks before installation</h2><p>Coverage depends on the backend and the exact versions in the proposed operation.</p></div><a class="button subtle" href="${projectSecurity}">Security documentation <span aria-hidden="true">↗</span></a></div>
<div class="coverage-grid">${checks.map(([name, input, scope]) => `<article><h3>${name}</h3><p class="source-name">${input}</p><p>${scope}</p></article>`).join('')}</div>
<div class="review">
<h3>When OMG finds an issue</h3>
<p>A disclosed vulnerability or Unknown coverage requires explicit acceptance in a foreground terminal when policy allows it. The review binds the proposed versions, artifacts, policy, and caller. Unattended installs cannot use <code>--yes</code> to accept risk. Source, signature, and integrity requirements still apply.</p>
<p>Arch policies can require advisory evidence or a fresh snapshot before commit. Native signature verification and runtime artifact checks depend on the selected backend, provider and build.</p>
</div>
</section>
${auditEvidence()}
<section class="section" id="monitoring">
<div class="section-heading"><div><h2>Other advisory inputs</h2><p>Runtime and ecosystem lookups use exact versions where an upstream source supports them.</p></div></div>
<div class="other-sources">
<div><h3><a href="https://osv.dev/">OSV <span aria-hidden="true">↗</span></a></h3><p>Queried for supported package identities and versions during reviews.</p></div>
<div><h3><a href="https://www.first.org/epss/">FIRST EPSS <span aria-hidden="true">↗</span></a></h3><p>On-demand exploitation probability for stored CVEs. EPSS and KEV inform prioritization. Package applicability comes from the advisory match.</p></div>
</div>
<details class="vendors"><summary>Vendor sources for 13 managed runtimes</summary>
<p>GitHub-dependent feeds are scheduled for refresh every 30 minutes. Other vendor evidence is checked on demand. Source freshness and version coverage vary.</p>
<ul>${vendors.map(([runtime, publisher, url]) => `<li><span>${runtime}</span><a href="${url}">${publisher} <span aria-hidden="true">↗</span></a></li>`).join('')}</ul>
<a class="text-link" href="${project}/tree/main/services/advisories#runtime-and-pi-coding-harness-assessments">Runtime source mappings and limits <span aria-hidden="true">↗</span></a>
</details>
</section>
<section class="section methodology" id="methodology">
<h2>How intake is measured</h2>
<p>Intake lag is the time between the CVE Program’s modification timestamp and OMG’s receipt of that revision. The median and 95th percentile use up to 100 latest stored revisions with valid, ordered timestamps. Historical imports can increase intake lag. The 24-hour publication count uses publication dates in that same sample. A <strong>≥</strong> indicates the sample or feed is incomplete.</p>
<p>The dashboard refreshes every minute while visible. The CVE Program can publish changes between Cloudflare checks. Records in the archive represent the latest stored revision of each CVE. Install decisions use version and source evidence for the specific operation.</p>
</section>`;
}

export function home(status: FeedStatus | null, page: RecentPage | null, now: number) {
  return layout(
    'Security coverage',
    '/',
    `${liveView(status, page, now)}${exploitation()}${coverage()}`,
    true
  );
}

export function archive(page: RecentPage, firstPage: boolean, now: number) {
  const next = page.next_cursor === null ? null : new URLSearchParams({ cursor: page.next_cursor });
  const fresh = page.complete && freshAt(page.checked_at, now);
  return layout(
    'CVE archive',
    '/archive',
    `<section class="subpage"><a class="text-link" href="/">← Dashboard</a>
<h1>CVE archive</h1><p class="lede">Latest stored revisions in the 30-day window ending ${time(page.as_of)}. Look up an exact ID for older records.</p>
${lookup()}${fresh ? '' : '<p class="notice">Recent CVE coverage is partial or stale. Additional revisions may be missing.</p>'}
${table(page.records)}
<div class="pagination">${firstPage ? '' : '<a class="button subtle" href="/archive">Back to newest</a>'}${next ? `<a class="button" href="/archive?${escape(next.toString())}">Older revisions →</a>` : ''}</div></section>`
  );
}

export function detail(data: RecordDetails, now: number) {
  const { provenance: record, kev, kev_complete: kevComplete, kev_checked_at: kevCheckedAt } = data;
  const documented = zeroDays.find(item => item.id === record.id);
  const kevCurrent = kevComplete && freshAt(kevCheckedAt ?? null, now);
  const state =
    record.state === 'PUBLISHED'
      ? 'Published'
      : record.state === 'REJECTED'
        ? 'Rejected'
        : 'Other state';
  return layout(
    record.id,
    `/cves/${record.id}`,
    `<section class="subpage"><a class="text-link" href="/archive">← CVE archive</a>
<h1>${record.id}</h1><p class="lede">Stored CVE Program record · ${state}</p>
<dl class="metrics detail-metrics">${metricsCard('Publisher date', time(record.published_at), '')}${metricsCard('Publisher revision', time(record.modified_at), '')}
${metricsCard('Received by OMG', time(record.fetched_at), '')}${metricsCard('Intake lag', duration(lagMinutes(record)), '')}</dl>
<div class="record-evidence">
<div><h2>Exploitation evidence</h2>
${documented ? `<p>Documented zero-day affecting ${documented.product}. <a class="text-link" href="${documented.advisory}">Vendor advisory ↗</a></p>` : ''}
<p>${kev ? `Listed by CISA KEV on <time datetime="${kev.dateAdded}">${kev.dateAdded}</time>.` : kevCurrent ? 'No listing in the current CISA KEV snapshot.' : 'CISA KEV listing status is unavailable.'} ${kev && !kevCurrent ? 'The CISA snapshot is partial or stale.' : ''} <a class="text-link" href="${kevCatalog}">CISA catalog ↗</a></p>
${kevCheckedAt ? `<p>Catalog checked ${time(kevCheckedAt, true)}</p>` : ''}</div>
<div><h2>Stored revision SHA-256</h2><p><code>${record.payload_sha256}</code></p></div>
</div>
<div class="detail-links"><a class="button" href="https://www.cve.org/CVERecord?id=${record.id}">Publisher record ↗</a>
<a class="button subtle" href="${advisoryOrigin}/v1/cves/${record.id}">OMG stored record JSON ↗</a>
<a class="button subtle" href="${advisoryOrigin}/v1/epss/${record.id}">EPSS JSON ↗</a></div>
<p class="record-note">Use the publisher record to check affected products and versions. OMG uses source and version evidence for each install decision.</p>${lookup()}</section>`
  );
}

export function message(title: string, description: string) {
  return layout(
    title,
    '/',
    `<section class="subpage"><a class="text-link" href="/">← Dashboard</a><h1>${escape(title)}</h1><p class="lede">${escape(description)}</p>
<a class="button subtle" href="/archive">Browse the CVE archive</a>${lookup()}</section>`
  );
}
