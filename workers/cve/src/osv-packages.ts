import { Schema } from 'effect';
import { batchInChunks, chunkArray, type D1Bound, type D1Executor } from './d1.ts';
import { cveId } from './advisories.ts';
import { packageFeedSchema, type PackageFeed } from './package-advisories.ts';
import { readLimitedText } from './sources.ts';

const packagesArray = packageFeedSchema.fields.recent.value.fields.packages;

const origin = 'https://osv-vulnerabilities.storage.googleapis.com/';
const evidenceUrl = 'https://osv.dev/vulnerability/';
const ecosystems = ['npm', 'PyPI', '[EMPTY]'] as const;
const manifestBytes = 32 * 1024;
const monitoredRecords = 200;
const batchSize = 6;
const idPattern = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/u;
const timestampPattern = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})(?:\.(\d{1,9}))?Z$/u;

const fieldValue = Schema.String.pipe(Schema.minLength(1), Schema.maxLength(512));
const ecosystemName = Schema.String.pipe(Schema.minLength(1), Schema.maxLength(64));
const event = Schema.Struct({
  introduced: Schema.optional(fieldValue),
  fixed: Schema.optional(fieldValue),
  last_affected: Schema.optional(fieldValue),
  limit: Schema.optional(fieldValue),
});
const rangeInput = Schema.Struct({
  type: Schema.String,
  events: Schema.Array(event).pipe(Schema.maxItems(256)),
});
const advisory = Schema.Struct({
  id: Schema.String.pipe(Schema.pattern(idPattern)),
  aliases: Schema.optional(Schema.Array(Schema.String).pipe(Schema.maxItems(100))),
  modified: Schema.String,
  published: Schema.optional(Schema.String),
  withdrawn: Schema.optional(Schema.String),
  affected: Schema.optional(
    Schema.Array(
      Schema.Struct({
        package: Schema.optional(Schema.Struct({ ecosystem: ecosystemName, name: fieldValue })),
        ranges: Schema.optional(Schema.Array(rangeInput).pipe(Schema.maxItems(128))),
        versions: Schema.optional(Schema.Array(fieldValue).pipe(Schema.maxItems(4096))),
      })
    ).pipe(Schema.maxItems(256))
  ),
});

interface Revision {
  id: string;
  modified: string;
}

type Ecosystem = (typeof ecosystems)[number];
type Package = PackageFeed['recent'][number]['packages'][number];

function sourceTime(value: string) {
  const parts = timestampPattern.exec(value);
  const millis = Date.parse(value);
  if (
    !parts?.[1] ||
    !Number.isFinite(millis) ||
    new Date(millis).toISOString().slice(0, 19) !== parts[1]
  ) {
    throw new Error('Invalid OSV revision timestamp');
  }
  return `${parts[1]}.${(parts[2] ?? '').padEnd(9, '0')}Z`;
}

export function parseOsvManifest(body: string, partial: boolean): Revision[] {
  const lines = body.split(/\r?\n/u);
  if (partial && !body.endsWith('\n')) lines.pop();
  const revisions = new Map<string, Revision>();
  let previous: string | undefined;
  for (const line of lines) {
    if (line === '') continue;
    const [rawTime, id, extra] = line.split(',');
    if (!rawTime || !id || extra !== undefined || !idPattern.test(id)) {
      throw new Error('Invalid OSV manifest row');
    }
    const modified = sourceTime(rawTime);
    if (previous && previous < modified) throw new Error('Unordered OSV manifest');
    previous = modified;
    if (!revisions.has(id)) revisions.set(id, { id, modified });
  }
  return [...revisions.values()];
}

function packageRanges(events: readonly (typeof event.Type)[]) {
  const ranges: Pick<Package, 'range' | 'fixed'>[] = [];
  let start: string | undefined;
  for (const entry of events) {
    if (entry.introduced !== undefined) start = entry.introduced;
    const end = entry.fixed ?? entry.last_affected ?? entry.limit;
    if (end !== undefined && start !== undefined) {
      const lower = start !== '0' ? `>= ${start}, ` : '';
      const upper = entry.last_affected !== undefined ? '<=' : '<';
      ranges.push({ range: `${lower}${upper} ${end}`, fixed: entry.fixed ?? null });
      start = undefined;
    }
  }
  if (start && start !== '0') ranges.push({ range: `>= ${start}`, fixed: null });
  return ranges;
}

function packagesFrom(record: typeof advisory.Type): Package[] {
  const packages: Package[] = [];
  for (const item of record.affected ?? []) {
    if (!item.package) continue;
    const coordinate = item.package;
    const ranges = (item.ranges ?? [])
      .filter(candidate => candidate.type === 'SEMVER' || candidate.type === 'ECOSYSTEM')
      .flatMap(candidate => packageRanges(candidate.events));
    for (const range of ranges) packages.push({ ...coordinate, ...range });
    const versions = item.versions ?? [];
    for (let at = 0; at < versions.length; at += 7) {
      packages.push({
        ...coordinate,
        range: versions.slice(at, at + 7).join(', '),
        fixed: null,
      });
    }
    if (!ranges.length && !versions.length)
      packages.push({ ...coordinate, range: '', fixed: null });
  }
  return packages;
}

export function parseOsvPackage(body: string, expected: string) {
  const record = Schema.decodeUnknownSync(advisory)(JSON.parse(body));
  if (record.id !== expected) throw new Error('OSV advisory identity mismatch');
  const kind: PackageFeed['recent'][number]['kind'] = record.id.startsWith('MAL-')
    ? 'malware'
    : 'reviewed';
  const aliases = record.aliases ?? [];
  return {
    id: record.id,
    cveId: cveId.test(record.id) ? record.id : (aliases.find(alias => cveId.test(alias)) ?? null),
    kind,
    advisoryUrl: evidenceUrl + encodeURIComponent(record.id),
    modified: sourceTime(record.modified),
    published: record.published ? sourceTime(record.published) : null,
    withdrawn: record.withdrawn ? sourceTime(record.withdrawn) : null,
    packages: packagesFrom(record),
  };
}

function resource(ecosystem: Ecosystem, file: string) {
  return origin + encodeURIComponent(ecosystem) + '/' + file;
}

async function readManifest(ecosystem: Ecosystem) {
  const response = await fetch(resource(ecosystem, 'modified_id.csv'), {
    headers: { Range: `bytes=0-${manifestBytes - 1}` },
    signal: AbortSignal.timeout(6_000),
    redirect: 'manual',
  });
  if (response.status !== 200 && response.status !== 206) throw new Error('OSV manifest failed');
  const range = /^bytes 0-(\d+)\/(\d+)$/u.exec(response.headers.get('Content-Range') ?? '');
  if (response.status === 206 && (!range?.[1] || !range[2] || Number(range[1]) >= manifestBytes)) {
    throw new Error('Invalid OSV manifest range');
  }
  const partial = Boolean(range?.[1] && range[2] && Number(range[1]) + 1 < Number(range[2]));
  const entries = parseOsvManifest(await readLimitedText(response, manifestBytes), partial);
  if (!entries.length) throw new Error('OSV manifest is empty');
  return entries;
}

async function readRecord(ecosystem: Ecosystem, revision: Revision) {
  const response = await fetch(resource(ecosystem, encodeURIComponent(revision.id) + '.json'), {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(6_000),
    redirect: 'manual',
  });
  if (!response.ok) throw new Error('OSV package advisory failed');
  const record = parseOsvPackage(await readLimitedText(response, 512 * 1024), revision.id);
  if (record.modified < revision.modified) throw new Error('OSV file predates its manifest');
  return record;
}

async function saveRecords(
  db: D1Executor,
  ecosystem: Ecosystem,
  captured: Date,
  complete: boolean,
  records: readonly ReturnType<typeof parseOsvPackage>[]
) {
  const capturedIso = captured.toISOString();
  const statements: D1Bound[] = records.map(record =>
    db
      .prepare(
        `INSERT INTO cve_osv_package_advisory (
           id, cve_id, kind, advisory_url, published_at, revision, withdrawn_at, observed_at, packages_json, package_count
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT (id) DO UPDATE SET
           cve_id = excluded.cve_id,
           kind = excluded.kind,
           published_at = excluded.published_at,
           revision = excluded.revision,
           withdrawn_at = excluded.withdrawn_at,
           packages_json = excluded.packages_json,
           package_count = excluded.package_count
         WHERE excluded.revision > cve_osv_package_advisory.revision`
      )
      .bind(
        record.id,
        record.cveId,
        record.kind,
        record.advisoryUrl,
        record.published,
        record.modified,
        record.withdrawn,
        capturedIso,
        JSON.stringify(record.packages),
        record.packages.length
      )
  );
  statements.push(
    db
      .prepare(
        `INSERT INTO cve_osv_package_source (ecosystem, checked_at, successful_at, complete)
         VALUES (?, ?, ?, ?)
         ON CONFLICT (ecosystem) DO UPDATE SET
           checked_at = excluded.checked_at,
           successful_at = COALESCE(excluded.successful_at, cve_osv_package_source.successful_at),
           complete = excluded.complete
         WHERE excluded.checked_at >= cve_osv_package_source.checked_at`
      )
      .bind(ecosystem, capturedIso, complete ? capturedIso : null, complete ? 1 : 0)
  );
  await batchInChunks(db, statements);
}

async function collectEcosystem(db: D1Executor, ecosystem: Ecosystem) {
  const captured = new Date();
  try {
    const revisions = await readManifest(ecosystem);
    const knownOnly = ecosystem === '[EMPTY]';
    const candidates = knownOnly ? revisions : revisions.slice(0, monitoredRecords);
    const storedById = new Map<string, string>();
    const chunks = chunkArray(candidates, 60);
    const pages = await Promise.all(
      chunks.map(chunk => {
        const placeholders = chunk.map(() => '?').join(',');
        return db
          .prepare(
            `SELECT id, revision FROM cve_osv_package_advisory WHERE id IN (${placeholders})`
          )
          .bind(...chunk.map(item => item.id))
          .all<{ id: string; revision: string }>();
      })
    );
    for (const page of pages) {
      for (const row of page.results) storedById.set(row.id, row.revision);
    }
    const pending = candidates
      .filter(candidate => {
        const stored = storedById.get(candidate.id);
        if (knownOnly && stored === undefined) return false;
        return stored === undefined || candidate.modified > stored;
      })
      .toSorted((left, right) => {
        if (left.modified !== right.modified) return right.modified < left.modified ? -1 : 1;
        return left.id < right.id ? -1 : left.id > right.id ? 1 : 0;
      })
      .slice(0, batchSize + 1);

    const results = await Promise.allSettled(
      pending.slice(0, batchSize).map(revision => readRecord(ecosystem, revision))
    );
    const records = results.flatMap(result =>
      result.status === 'fulfilled' ? [result.value] : []
    );
    await saveRecords(db, ecosystem, captured, records.length === pending.length, records);
    if (records.length < results.length) console.warn('osv_package_documents_failed', ecosystem);
  } catch (error) {
    await saveRecords(db, ecosystem, captured, false, []);
    throw error;
  }
}

export async function collectOsvPackages(db: D1Executor) {
  const results = await Promise.allSettled(
    ecosystems.map(ecosystem => collectEcosystem(db, ecosystem))
  );
  if (results.some(result => result.status === 'rejected')) {
    throw new Error('OSV package collection incomplete');
  }
}

interface RecentOsvRow {
  id: string;
  cveId: string | null;
  kind: PackageFeed['recent'][number]['kind'];
  advisoryUrl: string;
  publishedAt: string;
  observedAt: string;
  packagesJson: string;
}

export async function osvPackageFeed(db: D1Executor) {
  const [statusRow, reviewedCount, malwareCount, reviewedRows, malwareRows] = await Promise.all([
    db
      .prepare(
        `SELECT MIN(checked_at) AS checkedAt,
                COUNT(*) AS sourceCount,
                MIN(complete) AS allComplete
           FROM cve_osv_package_source`
      )
      .bind()
      .first<{ checkedAt: string | null; sourceCount: number; allComplete: number | null }>(),
    db
      .prepare(
        `SELECT COUNT(*) AS total
           FROM cve_osv_package_advisory a
          WHERE a.kind = 'reviewed' AND a.withdrawn_at IS NULL AND a.published_at IS NOT NULL
            AND a.package_count > 0
            AND NOT EXISTS (SELECT 1 FROM cve_package_advisory ghsa
                             WHERE ghsa.id = a.id AND ghsa.withdrawn_at IS NOT NULL)`
      )
      .bind()
      .first<{ total: number }>(),
    db
      .prepare(
        `SELECT COUNT(*) AS total
           FROM cve_osv_package_advisory a
          WHERE a.kind = 'malware' AND a.withdrawn_at IS NULL AND a.published_at IS NOT NULL
            AND a.package_count > 0
            AND NOT EXISTS (SELECT 1 FROM cve_package_advisory ghsa
                             WHERE ghsa.id = a.id AND ghsa.withdrawn_at IS NOT NULL)`
      )
      .bind()
      .first<{ total: number }>(),
    db
      .prepare(
        `SELECT a.id, a.cve_id AS cveId, a.kind, a.advisory_url AS advisoryUrl,
                a.published_at AS publishedAt, a.observed_at AS observedAt,
                a.packages_json AS packagesJson
           FROM cve_osv_package_advisory a
          WHERE a.kind = 'reviewed' AND a.withdrawn_at IS NULL AND a.published_at IS NOT NULL
            AND a.package_count > 0
            AND NOT EXISTS (SELECT 1 FROM cve_package_advisory ghsa
                             WHERE ghsa.id = a.id AND ghsa.withdrawn_at IS NOT NULL)
          ORDER BY a.published_at DESC, a.id DESC
          LIMIT 4`
      )
      .bind()
      .all<RecentOsvRow>(),
    db
      .prepare(
        `SELECT a.id, a.cve_id AS cveId, a.kind, a.advisory_url AS advisoryUrl,
                a.published_at AS publishedAt, a.observed_at AS observedAt,
                a.packages_json AS packagesJson
           FROM cve_osv_package_advisory a
          WHERE a.kind = 'malware' AND a.withdrawn_at IS NULL AND a.published_at IS NOT NULL
            AND a.package_count > 0
            AND NOT EXISTS (SELECT 1 FROM cve_package_advisory ghsa
                             WHERE ghsa.id = a.id AND ghsa.withdrawn_at IS NOT NULL)
          ORDER BY a.published_at DESC, a.id DESC
          LIMIT 4`
      )
      .bind()
      .all<RecentOsvRow>(),
  ]);

  const sources: (PackageFeed['sources'][number] & { provider: 'OSV' })[] = statusRow?.checkedAt
    ? [
        {
          kind: 'malware',
          provider: 'OSV',
          checkedAt: statusRow.checkedAt,
          complete: statusRow.sourceCount === 3 && statusRow.allComplete === 1,
          total: Number(malwareCount?.total ?? 0),
        },
        {
          kind: 'reviewed',
          provider: 'OSV',
          checkedAt: statusRow.checkedAt,
          complete: statusRow.sourceCount === 3 && statusRow.allComplete === 1,
          total: Number(reviewedCount?.total ?? 0),
        },
      ]
    : [];

  const recent: PackageFeed['recent'][number][] = [...reviewedRows.results, ...malwareRows.results]
    .toSorted((left, right) => {
      if (left.publishedAt !== right.publishedAt) {
        return right.publishedAt < left.publishedAt ? -1 : 1;
      }
      return right.id < left.id ? -1 : right.id > left.id ? 1 : 0;
    })
    .map(row => ({
      id: row.id,
      cveId: row.cveId,
      kind: row.kind,
      advisoryUrl: row.advisoryUrl,
      publishedAt: row.publishedAt,
      observedAt: row.observedAt,
      packages: Schema.decodeUnknownSync(packagesArray)(JSON.parse(row.packagesJson)).slice(0, 8),
    }));

  return { sources, recent };
}
