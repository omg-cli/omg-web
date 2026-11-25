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
import type { DashboardSnapshot } from './stream.ts';
import type { PackageFeed } from './package-advisories.ts';
import {
  projectZero,
  watchedPublishers,
  type ExploitationReport,
  type ZeroDay,
  type ZeroDayView,
} from './zero-days.ts';
import { chromeSite, type VendorSignal } from './vendor-signals.ts';

const project = 'https://github.com/omg-cli/omg';
const projectSecurity = `${project}/blob/main/docs/security.md`;
const canonical = 'https://cve.getomg.dev';
const siteSecurity = 'https://getomg.dev/security/';
const kevCatalog = 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog';
const githubAdvisories = 'https://github.com/advisories';
const publisherDirectory = new Map([
  ['Chrome Releases', { url: chromeSite, cadence: 1 }],
  ['Microsoft MSRC', { url: 'https://msrc.microsoft.com/update-guide/', cadence: 2 }],
  ['ENISA EUVD', { url: 'https://euvd.enisa.europa.eu/', cadence: 10 }],
]);
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
] as const;

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

function calendarDay(value: string, prefix = '') {
  return `<time datetime="${escape(value.slice(0, 10))}">${prefix}${shortDate.format(Date.parse(value))}</time>`;
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
<meta name="theme-color" content="#090909">
<title>${escape(title)} · OMG Security</title>
<meta name="description" content="${description}">
<link rel="canonical" href="${canonical}${path}">
<link rel="preload" href="/archivo.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/dashboard.css">
${refresh ? '<script src="/dashboard.js" defer></script>' : ''}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="topbar"><div class="shell topbar-inner">
<a class="brand" href="https://getomg.dev/" aria-label="OMG Package Manager home"><img src="/logo.svg" width="110" height="33" alt="OMG"></a>
<nav aria-label="Security dashboard">
<a href="/" aria-current="${path === '/' ? 'page' : 'false'}">Advisories</a><a href="/#exploitation">Zero-days</a><a href="/#coverage">Install checks</a><a href="/#audit">Audits</a>
</nav><a class="site-link" href="${siteSecurity}">OMG Security</a></div></header>
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

function checkState(checkedAt: string | null, complete: boolean, now: number, cadence: number) {
  if (!checkedAt) return 'Awaiting check';
  const age = now - Date.parse(checkedAt);
  if (age < 0 || age > (2 * cadence + 2) * 60_000) return 'Stale';
  return complete ? 'Current' : 'Partial';
}

function sourceRow(
  label: string,
  url: string,
  description: string,
  state: string,
  checkedAt: string | null
) {
  return `<li><div class="feed-top"><a href="${escape(url)}">${escape(label)} <span aria-hidden="true">↗</span></a><span class="status-label ${state === 'Current' ? 'ok' : 'warn'}">${state}</span></div><p>${description}</p><div class="feed-time">Checked ${time(checkedAt, true)}</div></li>`;
}

function sources(status: FeedStatus | null, evidence: ZeroDayView | null, now: number) {
  const publishers = watchedPublishers(evidence);
  return `<aside id="feed-status" class="sources" aria-labelledby="sources-title" data-live-region>
<div class="panel-heading"><div><h2 id="sources-title">Source status</h2><p>Feed checks run independently. Open pages receive changes as OMG commits them.</p></div></div>
<ul>${feeds
    .map(([key, label, summary, url]) => {
      const feed = status?.feeds.find(item => item.source === key);
      return sourceRow(label, url, summary, sourceState(feed, now), feed?.checked_at ?? null);
    })
    .join('')}
${sourceRow('Google Project Zero', projectZero, 'Documented zero-days · 1 min checks', checkState(evidence?.checkedAt ?? null, evidence?.current ?? false, now, 1), evidence?.checkedAt ?? null)}
${publishers
  .map(publisher => {
    const input = publisherDirectory.get(publisher.provider);
    if (!input) return '';
    const description = `${number.format(publisher.signals)} CVE IDs · ${number.format(publisher.knownExploited)} exploited · ${input.cadence} min checks`;
    return sourceRow(
      publisher.provider,
      input.url,
      description,
      checkState(publisher.checkedAt, publisher.complete, now, input.cadence),
      publisher.checkedAt
    );
  })
  .join('')}
${
  evidence?.packages?.sources
    .map(source => {
      const cadence = source.provider === 'OSV' ? 5 : 15;
      const label = `${source.provider ?? 'GitHub'} ${source.kind === 'malware' ? 'package malware' : 'package advisories'}`;
      return sourceRow(
        label,
        source.provider === 'OSV' ? 'https://google.github.io/osv.dev/data/' : githubAdvisories,
        `${number.format(source.total)} advisories stored · ${cadence} min checks`,
        checkState(source.checkedAt, source.complete, now, cadence),
        source.checkedAt
      );
    })
    .join('') ?? ''
}
</ul>
<a class="text-link api-link" href="${advisoryOrigin}/v1/status">Feed status JSON <span aria-hidden="true">↗</span></a>
</aside>`;
}

function metricsCard(label: string, value: string, note: string) {
  return `<div class="metric"><dt>${label}</dt><dd>${value}${note ? `<span>${note}</span>` : ''}</dd></div>`;
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

export function renderLive(snapshot: DashboardSnapshot | null, now: number) {
  const status = snapshot?.status ?? null;
  const page = snapshot?.recent ?? null;
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

  return `<div id="live-view" data-version="${escape(snapshot?.version ?? '')}">
<section class="hero" id="intake" aria-labelledby="title">
<div class="hero-copy">
<h1 id="title">Vulnerability<br><span>intake.</span></h1>
<p class="lede">Follow advisories as OMG receives them. See when zero-days are documented and what the CLI checks before installation.</p>
<div class="hero-actions"><a class="button" href="#recent">Browse CVEs</a><a class="button subtle" href="#package-advisories">Package advisories</a></div>
<div class="hero-meta"><span id="stream-status" role="status" hidden></span><span id="cve-status" data-live-region><span class="status-label hero-status ${complete ? 'ok' : 'warn'}">${complete ? 'CVE feed current' : `CVE feed ${cveState === 'Current' ? 'partial' : cveState.toLowerCase()}`}</span><span class="last-check">Last checked ${time(cve?.checked_at ?? page?.checked_at ?? null, true)}</span></span></div>
</div>
<section class="activity" id="intake-chart" aria-labelledby="activity-title" data-live-region>
<div class="panel-heading"><div><h2 id="activity-title">CVE intake activity</h2><p>${page && sample ? `Latest ${page.records.length} revisions across ${sample.chartHours}h` : 'Publisher activity in the recent CVE feed'}</p></div><span class="tag">UTC</span></div>
${page && sample ? intakeChart(page, sample) : '<p class="notice">The recent CVE feed is unavailable.</p>'}
<dl class="chart-metrics">${metricsCard('Median intake lag', duration(sample?.median ?? null), sampleNote)}
${metricsCard('95th-percentile lag', duration(sample?.p95 ?? null), sampleNote)}</dl>
</section></section>
<dl class="metrics overview-metrics" id="intake-totals" data-live-region>
${metricsCard('Archive records imported', status ? number.format(status.baseline.imported) : '—', status ? archiveStatus : 'Archive status unavailable')}
${metricsCard('New CVEs · 24h', publicationCount, sample?.lowerBound || (sample && !complete) ? 'Minimum from latest revisions' : 'Publication timestamps')}
</dl>
<div class="monitor-layout">${exploitation(snapshot?.zeroDays ?? null)}${sources(status, snapshot?.zeroDays ?? null, now)}</div>
${packageAdvisories(snapshot?.zeroDays.packages)}
<section class="section" id="recent">
<div class="section-heading"><div><h2>Recent CVE records</h2><p>Newest by publisher revision time. Each row shows when OMG received that revision.</p></div><a class="button subtle" href="/archive">Browse 30-day archive <span aria-hidden="true">→</span></a></div>
${lookup()}
<div id="current-revisions" data-live-region>
${page ? table(page.records.slice(0, 12)) : '<p class="notice">Recent CVE records are unavailable.</p>'}
</div></section></div>`;
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

function zeroDayRows(entries: readonly ZeroDay[]) {
  return `<ul class="evidence-list">${entries
    .map(
      ({ id, product, patched, observedAt, evidence, source, archived }) =>
        `<li><div><a href="${archived === false ? escape(evidence) : `/cves/${escape(id)}`}">${escape(id)}</a><span>${escape(product || 'Product in CVE record')}${archived === false ? ' · CVE record pending' : ''}</span></div><div><a class="text-link" href="${escape(evidence)}">${source}</a>${observedAt ? `<time datetime="${escape(observedAt)}">Added ${shortDate.format(Date.parse(observedAt))}</time>` : patched ? `<time datetime="${escape(patched)}">Patched ${shortDate.format(Date.parse(patched + 'T00:00:00Z'))}</time>` : ''}</div></li>`
    )
    .join('')}</ul>`;
}

function exploitation(feed: ZeroDayView | null) {
  const entries = feed?.entries ?? [];
  const reports = watchedPublishers(feed).flatMap(publisher =>
    (publisher.recentExploitation ?? [])
      .slice(0, 3)
      .map(report => ({ ...report, provider: publisher.provider }))
  );
  return `<section id="exploitation" class="zero-days" data-live-region>
<div class="section-heading"><div><h2>Documented zero-days</h2><p>Public evidence of exploitation before a fix, including reports awaiting a published CVE record.</p></div></div>
${feed?.current ? '' : `<p class="notice">${entries.length ? 'Showing the last confirmed entries. The evidence source is temporarily unavailable.' : 'Zero-day evidence is unavailable.'}</p>`}
${entries.length ? zeroDayRows(entries.slice(0, 5)) : feed?.current ? '<p class="notice">There are no matching records from these sources yet.</p>' : ''}
${entries.length > 5 ? `<details id="more-zero-days" class="more-evidence"><summary>Show ${entries.length - 5} more documented zero-days</summary>${zeroDayRows(entries.slice(5))}</details>` : ''}
<p class="section-note">Evidence comes from <a href="${projectZero}">Google Project Zero</a> and verified vendor disclosures. <a href="${kevCatalog}">CISA KEV</a> tracks known exploitation, including cases after a fix.</p>
${feed?.checkedAt ? `<p class="feed-time">Evidence checked ${time(feed.checkedAt, true)}</p>` : ''}
${
  reports.length
    ? `<div class="publisher-watch"><h3>Reported exploitation</h3><p class="section-note">Publisher and catalog reports of exploitation. Dates reflect what each source reports.</p><ul class="evidence-list">${reports
        .map(
          ({ id, advisoryUrl, published, archived, provider, exploitedSince }) =>
            `<li><div>${archived ? `<a href="/cves/${escape(id)}">${escape(id)}</a>` : `<a href="${escape(advisoryUrl)}">${escape(id)}</a><span>CVE record pending</span>`}</div><div><a class="text-link" href="${escape(advisoryUrl)}">${escape(provider)}</a>${exploitedSince ? calendarDay(exploitedSince, 'Exploited since ') : calendarDay(published)}</div></li>`
        )
        .join('')}</ul></div>`
    : ''
}
</section>`;
}

function packageAdvisories(feed: PackageFeed | undefined) {
  const lists = [
    ['malware', 'Package malware'],
    ['reviewed', 'Package vulnerabilities'],
  ] as const;
  return `<section class="section" id="package-advisories" data-live-region>
<div class="section-heading"><div><h2>Package advisories</h2><p>Registry version ranges for recently reported vulnerabilities and malware, including reports without a CVE.</p></div></div>
<div class="package-advisory-grid">${lists
    .map(([kind, title]) => {
      const rows = feed?.recent.filter(row => row.kind === kind) ?? [];
      return `<div><h3>${title}</h3>${
        rows.length
          ? `<ul class="evidence-list">${rows
              .map(({ id, cveId, advisoryUrl, publishedAt, packages }) => {
                const first = packages[0];
                return `<li><div><a href="${escape(advisoryUrl)}">${first ? escape(first.name) : escape(id)}</a><span>${first ? `${escape(first.ecosystem)} · ${escape(first.range || 'View affected versions')}${first.fixed ? ` · Fixed in ${escape(first.fixed)}` : ''}${packages.length > 1 ? ' · More ranges in advisory' : ''}` : 'See publisher advisory'}</span></div><div><a class="text-link" href="${escape(advisoryUrl)}">${escape(cveId ?? id)}</a>${time(publishedAt)}</div></li>`;
              })
              .join('')}</ul>`
          : '<p class="notice">No recent records loaded for this feed.</p>'
      }</div>`;
    })
    .join('')}</div>
<p class="section-note">Package data from <a href="https://google.github.io/osv.dev/data/">OSV and its upstream sources</a> and <a href="https://github.com/github/advisory-database#license">GitHub Advisory Database under CC BY 4.0</a>.</p>
</section>`;
}

function evidenceDetails(evidence: ZeroDay) {
  const dateLabel = (day: string) => shortDate.format(Date.parse(day + 'T00:00:00Z'));
  const details = [
    evidence.discovered ? `Discovered ${dateLabel(evidence.discovered)}` : '',
    evidence.patched ? `Patched ${dateLabel(evidence.patched)}` : '',
    evidence.euvd ? 'Listed as exploited by ENISA EUVD' : '',
    evidence.epss != null && evidence.epssDate
      ? `EPSS ${(evidence.epss * 100).toFixed(1)}% on ${escape(evidence.epssDate)}`
      : '',
  ].filter(Boolean);
  return `<p>Documented zero-day affecting ${escape(evidence.product || 'the product in the CVE record')}. <a class="text-link" href="${escape(evidence.evidence)}">${evidence.source}</a></p>
${details.length ? `<ul class="evidence-facts">${details.map(item => `<li>${item}</li>`).join('')}</ul>` : ''}
${evidence.vendorAdvisory ? `<p><a class="text-link" href="${escape(evidence.vendorAdvisory)}">Vendor advisory</a></p>` : ''}`;
}

function publisherReports(signals: readonly VendorSignal[]) {
  if (!signals.length) return '';
  return `<div class="publisher-reports"><h2>Publisher and catalog reports</h2><ul class="evidence-facts">${signals.map(signal => `<li><a class="text-link" href="${escape(signal.advisoryUrl)}">${escape(signal.provider)} advisory</a> · ${signal.exploited ? 'Reported exploited in the wild' : 'Vendor disclosure'} · Advisory published ${signal.provider === 'ENISA EUVD' ? calendarDay(signal.published) : time(signal.published, true)} · ${signal.exploitedSince ? calendarDay(signal.exploitedSince, 'Exploited since ') : signal.exploited && signal.exploitationReceived ? `Exploitation first recorded by OMG ${time(signal.exploitationReceived, true)}` : `Received by OMG ${time(signal.received, true)}`}</li>`).join('')}</ul></div>`;
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
<p>The dashboard updates when the advisory service completes intake. Upstream publishers set their own schedules, and OMG’s scheduled checks pick up their published changes. The archive shows the latest stored revision of each CVE.</p>
</section>`;
}

export function home(snapshot: DashboardSnapshot | null, now: number) {
  return layout('Vulnerability intake', '/', `${renderLive(snapshot, now)}${coverage()}`, true);
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

export function detail(data: RecordDetails, evidence: ExploitationReport, now: number) {
  const { provenance: record, kev, kev_complete: kevComplete, kev_checked_at: kevCheckedAt } = data;
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
${evidence.zeroDay ? evidenceDetails(evidence.zeroDay) : ''}
<p>${kev ? `Listed by CISA KEV on <time datetime="${kev.dateAdded}">${kev.dateAdded}</time>.` : kevCurrent ? 'No listing in the current CISA KEV snapshot.' : 'CISA KEV listing status is unavailable.'} ${kev && !kevCurrent ? 'The CISA snapshot is partial or stale.' : ''} <a class="text-link" href="${kevCatalog}">CISA catalog ↗</a></p>
${kevCheckedAt ? `<p>Catalog checked ${time(kevCheckedAt, true)}</p>` : ''}</div>
<div><h2>Stored revision SHA-256</h2><p><code>${record.payload_sha256}</code></p></div>
</div>
${publisherReports(evidence.vendor)}
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
