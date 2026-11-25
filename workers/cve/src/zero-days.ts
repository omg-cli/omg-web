import { Schema } from 'effect';
import { cveId, recordDetails } from './advisories.ts';
import { advisoryJson, UpstreamError } from './sources.ts';

export const projectZero = 'https://projectzero.google/0day.html';

const cveIdentity = Schema.String.pipe(Schema.pattern(cveId));
const observation = Schema.NullOr(Schema.String);
const zeroDay = Schema.Struct({
  id: cveIdentity,
  product: Schema.String,
  patched: observation,
  evidence: Schema.String.pipe(Schema.startsWith('https://')),
  source: Schema.Literal('Project Zero', 'Vendor disclosure'),
  observedAt: Schema.optional(observation),
});
export const zeroDayView = Schema.Struct({
  entries: Schema.Array(zeroDay),
  checkedAt: observation,
  current: Schema.Boolean,
  seen: Schema.optional(Schema.Array(Schema.Struct({ id: cveIdentity, observedAt: observation }))),
});
export type ZeroDay = typeof zeroDay.Type;
export type ZeroDayView = typeof zeroDayView.Type;

const spreadsheet =
  'https://docs.google.com/spreadsheets/d/1lkNJ0uQwbeC1ZTRrxdtuPLCIl7mlUreoKfSIgajnSyY/gviz/tq';
const maxRows = 16;
const maxBytes = 64 * 1024;
const header = '"CVE","Vendor","Product","Date Patched"';

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

interface Candidate extends ZeroDay {
  order: string;
}

function isoDay(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(value)) return null;
  const date = Date.parse(value + 'T00:00:00Z');
  return Number.isFinite(date) && new Date(date).toISOString().slice(0, 10) === value
    ? value
    : null;
}

const csvRow = /^"((?:[^"]|"")*)","((?:[^"]|"")*)","((?:[^"]|"")*)","((?:[^"]|"")*)"$/u;

export function readTracker(csv: string): Candidate[] {
  const [first, ...lines] = csv
    .replace(/^\uFEFF/u, '')
    .trimEnd()
    .split(/\r?\n/u);
  if (first !== header) throw new Error('Project Zero export changed');
  return lines.flatMap(line => {
    const match = csvRow.exec(line);
    if (!match) throw new Error('Invalid Project Zero row');
    const [, value = '', vendor = '', product = '', patched = ''] = match;
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
    tq: 'select A,B,C,G',
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
      if (done) return readTracker(csv + decoder.decode());
      bytes += value.byteLength;
      if (bytes > maxBytes) throw new Error('Project Zero export too large');
      csv += decoder.decode(value, { stream: true });
    }
  } finally {
    await reader.cancel().catch(() => undefined);
    reader.releaseLock();
  }
}

export async function checkZeroDays(previous: ZeroDayView | null, now: Date): Promise<ZeroDayView> {
  try {
    const year = now.getUTCFullYear();
    const sheets = await Promise.allSettled([rowsFor(year), rowsFor(year - 1)]);
    const tracker = sheets.flatMap(sheet => (sheet.status === 'fulfilled' ? sheet.value : []));
    if (sheets.every(sheet => sheet.status === 'rejected')) throw new Error('Tracker unavailable');
    const current = sheets.every(sheet => sheet.status === 'fulfilled');
    const candidates = new Map(tracker.map(row => [row.id, row]));
    for (const item of vendorDisclosures) {
      if (!candidates.has(item.id))
        candidates.set(item.id, { ...item, order: item.patched ?? item.id.slice(4, 8) });
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
      .map(({ id, product, patched, evidence, source, observedAt }) => ({
        id,
        product,
        patched,
        evidence,
        source,
        observedAt: observedAt ?? null,
      }));
    if (!current) {
      const merged = new Map(fresh.map(entry => [entry.id, entry]));
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
