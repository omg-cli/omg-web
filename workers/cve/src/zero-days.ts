import { Schema } from 'effect';
import { cveId, recordDetails } from './advisories.ts';
import { advisoryJson, UpstreamError } from './sources.ts';
import { vendorFeedStatus, vendorSignal } from './vendor-signals.ts';

export const projectZero = 'https://projectzero.google/0day.html';

const cveIdentity = Schema.String.pipe(Schema.pattern(cveId));
const observation = Schema.NullOr(Schema.String);
export const zeroDay = Schema.Struct({
  id: cveIdentity,
  product: Schema.String,
  patched: observation,
  evidence: Schema.String.pipe(Schema.startsWith('https://')),
  source: Schema.Literal('Project Zero', 'Vendor disclosure'),
  observedAt: Schema.optional(observation),
  vendor: Schema.optional(observation),
  discovered: Schema.optional(observation),
  vendorAdvisory: Schema.optional(observation),
  kevAdded: Schema.optional(observation),
  epss: Schema.optional(Schema.NullOr(Schema.Number)),
  epssDate: Schema.optional(observation),
  euvd: Schema.optional(Schema.Boolean),
});
export const zeroDayView = Schema.Struct({
  entries: Schema.Array(zeroDay),
  checkedAt: observation,
  current: Schema.Boolean,
  seen: Schema.optional(Schema.Array(Schema.Struct({ id: cveIdentity, observedAt: observation }))),
  publisher: Schema.optional(Schema.NullOr(vendorFeedStatus)),
});
export const exploitationReport = Schema.Struct({
  zeroDay: Schema.NullOr(zeroDay),
  vendor: Schema.Array(vendorSignal),
});
export type ExploitationReport = typeof exploitationReport.Type;
export type ZeroDay = typeof zeroDay.Type;
export type ZeroDayView = typeof zeroDayView.Type;

const spreadsheet =
  'https://docs.google.com/spreadsheets/d/1lkNJ0uQwbeC1ZTRrxdtuPLCIl7mlUreoKfSIgajnSyY/gviz/tq';
const maxRows = 16;
const maxBytes = 64 * 1024;
const header = '"CVE","Vendor","Product","Date Discovered","Date Patched","Advisory"';

const vendorDisclosures: readonly ZeroDay[] = [
  {
    id: 'CVE-2026-102764',
    product: 'BeyondTrust Remote Support',
    patched: null,
    evidence: 'https://www.beyondtrust.com/blog/entry/bt26-05',
    source: 'Vendor disclosure',
  },
  {
    id: 'CVE-2026-88772',
    product: 'Citrix NetScaler',
    patched: null,
    evidence:
      'https://support.citrix.com/external/article/CTX697096/citrix-netscaler-adc-and-citrix-netscaler-gateway-security-bulletin.html',
    source: 'Vendor disclosure',
  },
  {
    id: 'CVE-2026-22769',
    product: 'Dell RecoverPoint for VMs',
    patched: '2026-02-17',
    evidence: 'https://www.dell.com/support/kbdoc/en-us/000426773/dsa-2026-079',
    source: 'Vendor disclosure',
  },
];

export interface Candidate extends ZeroDay {
  order: string;
  year?: number;
}

interface EvidenceFeed {
  source: ZeroDay['source'];
  rows: readonly Candidate[];
  coverageYears: readonly number[];
  complete: boolean;
}

function isoDay(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) return null;
  const date = Date.parse(value + 'T00:00:00Z');
  return Number.isFinite(date) && new Date(date).toISOString().slice(0, 10) === value
    ? value
    : null;
}

const csvRow =
  /^"((?:[^"]|"")*)","((?:[^"]|"")*)","((?:[^"]|"")*)","((?:[^"]|"")*)","((?:[^"]|"")*)","((?:[^"]|"")*)"$/u;
const advisoryHosts = new Set([
  'access.redhat.com',
  'chromereleases.googleblog.com',
  'helpx.adobe.com',
  'msrc.microsoft.com',
  'support.apple.com',
  'www.mozilla.org',
  'www.samsungmobile.com',
]);

function vendorUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' &&
      !url.username &&
      !url.password &&
      advisoryHosts.has(url.hostname)
      ? url.href
      : null;
  } catch {
    return null;
  }
}

export function readTracker(csv: string): Candidate[] {
  const [first, ...lines] = csv
    .replace(/^\uFEFF/u, '')
    .trimEnd()
    .split(/\r?\n/u);
  if (first !== header) throw new Error('Project Zero export changed');
  return lines.flatMap(line => {
    const match = csvRow.exec(line);
    if (!match) throw new Error('Invalid Project Zero row');
    const [, value = '', vendor = '', product = '', discovered = '', patched = '', advisory = ''] =
      match;
    const id = value.trim();
    if (!cveId.test(id)) return [];
    const name = [vendor, product]
      .map(cell => cell.replaceAll('""', '"').trim())
      .filter(Boolean)
      .join(' ');
    const day = isoDay(patched.trim());
    return [
      {
        id,
        product: name.slice(0, 160),
        patched: day,
        vendor: vendor.replaceAll('""', '"').trim().slice(0, 120) || null,
        discovered: isoDay(discovered.trim()),
        vendorAdvisory: vendorUrl(advisory),
        order: day ?? '',
        evidence: projectZero,
        source: 'Project Zero',
      },
    ];
  });
}

async function rowsFor(year: number) {
  const url = new URL(spreadsheet);
  url.search = new URLSearchParams({
    tqx: 'out:csv',
    sheet: String(year),
    tq: 'select A,B,C,F,G,H',
  }).toString();
  const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(4_000) });
  if (
    !response.ok ||
    !response.headers.get('content-type')?.startsWith('text/csv') ||
    !response.body
  ) {
    throw new Error('Project Zero export unavailable');
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let csv = '';
  let bytes = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) return readTracker(csv + decoder.decode()).map(entry => ({ ...entry, year }));
      bytes += value.byteLength;
      if (bytes > maxBytes) throw new Error('Project Zero export too large');
      csv += decoder.decode(value, { stream: true });
    }
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}

export async function loadEvidence(now: Date): Promise<readonly EvidenceFeed[]> {
  const year = now.getUTCFullYear();
  const years = [year, year - 1];
  const sheets = await Promise.allSettled(years.map(rowsFor));
  const coverageYears = years.flatMap((value, index) =>
    sheets[index]?.status === 'fulfilled' ? [value] : []
  );
  const tracker = sheets.flatMap(sheet => (sheet.status === 'fulfilled' ? sheet.value : []));
  return [
    {
      source: 'Project Zero',
      rows: tracker,
      coverageYears,
      complete: coverageYears.length === years.length,
    },
    {
      source: 'Vendor disclosure',
      rows: vendorDisclosures.map(entry => ({
        ...entry,
        order: entry.patched ?? entry.id.slice(4, 8),
      })),
      coverageYears: [],
      complete: true,
    },
  ];
}

export async function checkZeroDays(previous: ZeroDayView | null, now: Date): Promise<ZeroDayView> {
  try {
    const feeds = await loadEvidence(now);
    const current = feeds.every(feed => feed.complete);
    const candidates = new Map<string, Candidate>();
    for (const feed of feeds) {
      for (const item of feed.rows) {
        if (!candidates.has(item.id)) candidates.set(item.id, item);
      }
    }

    const previousSeen = new Map(previous?.seen?.map(({ id, observedAt }) => [id, observedAt]));
    const observedNow = now.toISOString();
    const ordered = Array.from(candidates.values(), candidate => {
      const observedAt = previousSeen.has(candidate.id)
        ? (previousSeen.get(candidate.id) ?? null)
        : previous?.seen
          ? observedNow
          : null;
      return { ...candidate, observedAt, order: observedAt ?? candidate.order };
    }).toSorted((a, b) => b.order.localeCompare(a.order) || b.id.localeCompare(a.id));
    const shortlist = ordered.slice(0, maxRows);
    for (const item of vendorDisclosures) {
      const match = ordered.find(candidate => candidate.id === item.id);
      if (match && !shortlist.some(entry => entry.id === match.id)) shortlist.push(match);
    }
    const entries: Candidate[] = [];
    for (let offset = 0; offset < shortlist.length; offset += 4) {
      const batch = shortlist.slice(offset, offset + 4);
      const matches = await Promise.all(
        batch.map(async candidate => {
          try {
            const data = await advisoryJson(`/v1/cves/${candidate.id}`, recordDetails, true);
            if (data.provenance.id !== candidate.id || data.provenance.state !== 'PUBLISHED')
              return null;
            return {
              ...candidate,
              order:
                candidate.observedAt ?? candidate.patched ?? data.provenance.published_at ?? '',
            };
          } catch (error) {
            if (error instanceof UpstreamError && error.status === 404) return null;
            throw error;
          }
        })
      );
      for (const entry of matches) if (entry) entries.push(entry);
    }
    const fresh = entries
      .toSorted((a, b) => b.order.localeCompare(a.order))
      .map(
        ({
          id,
          product,
          patched,
          evidence,
          source,
          observedAt,
          vendor,
          discovered,
          vendorAdvisory,
        }) => ({
          id,
          product,
          patched,
          evidence,
          source,
          observedAt: observedAt ?? null,
          vendor,
          discovered,
          vendorAdvisory,
        })
      );
    if (!current) {
      const merged = new Map<string, ZeroDay>(fresh.map(entry => [entry.id, entry]));
      for (const entry of previous?.entries ?? []) {
        if (!merged.has(entry.id))
          merged.set(entry.id, { ...entry, observedAt: entry.observedAt ?? null });
      }
      return {
        ...previous,
        entries: Array.from(merged.values()).slice(0, 32),
        checkedAt: previous?.checkedAt ?? null,
        current,
      };
    }
    return {
      entries: fresh,
      checkedAt: observedNow,
      current,
      seen: ordered.map(({ id, observedAt }) => ({ id, observedAt })),
    };
  } catch {
    return {
      ...previous,
      entries: previous?.entries ?? [],
      checkedAt: previous?.checkedAt ?? null,
      current: false,
    };
  }
}
