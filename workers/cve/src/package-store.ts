import { Schema } from 'effect';
import { batchInChunks, type D1Bound, type D1Executor } from './d1.ts';
import {
  fetchPackagePage,
  GitHubAdvisoryError,
  packageFeedSchema,
  type PackageFeed,
  type PackageKind,
  type PackageWindow,
} from './package-advisories.ts';

const packagesArray = packageFeedSchema.fields.recent.value.fields.packages;

const kinds: readonly PackageKind[] = ['reviewed', 'malware'];
const bootstrap = 7 * 24 * 60 * 60_000;
const overlap = 10 * 60_000;
const pageBudget = 4;

interface Checkpoint extends PackageWindow {
  revision: number;
  complete: boolean;
  retryAt: Date | null;
}

interface CheckpointRow {
  from: string;
  until: string;
  cursor: string | null;
  revision: number;
  complete: number;
  retryAt: string | null;
}

function toCheckpoint(row: CheckpointRow): Checkpoint {
  return {
    from: new Date(row.from),
    until: new Date(row.until),
    cursor: row.cursor,
    revision: row.revision,
    complete: row.complete === 1,
    retryAt: row.retryAt ? new Date(row.retryAt) : null,
  };
}

async function readCheckpoint(db: D1Executor, kind: PackageKind, now: Date): Promise<Checkpoint> {
  const fromIso = new Date(now.getTime() - bootstrap).toISOString();
  const nowIso = now.toISOString();
  await db
    .prepare(
      `INSERT INTO cve_package_advisory_source (kind, window_from, window_until)
       VALUES (?, ?, ?)
       ON CONFLICT (kind) DO NOTHING`
    )
    .bind(kind, fromIso, nowIso)
    .run();
  const saved = await db
    .prepare(
      `SELECT window_from AS "from", window_until AS until, cursor, revision, complete, retry_at AS retryAt
         FROM cve_package_advisory_source
        WHERE kind = ?`
    )
    .bind(kind)
    .first<CheckpointRow>();
  if (!saved) throw new Error('Package advisory checkpoint is missing');
  return toCheckpoint(saved);
}

async function savePage(
  db: D1Executor,
  kind: PackageKind,
  before: Checkpoint,
  period: PackageWindow,
  page: Awaited<ReturnType<typeof fetchPackagePage>>
): Promise<Checkpoint | null> {
  const observed = new Date().toISOString();
  const complete = page.cursor === null ? 1 : 0;
  const updated = await db
    .prepare(
      `UPDATE cve_package_advisory_source
          SET window_from = ?, window_until = ?, cursor = ?,
              revision = revision + 1, checked_at = ?, retry_at = NULL,
              complete = ?,
              successful_at = CASE WHEN ? = 1 THEN ? ELSE successful_at END
        WHERE kind = ? AND revision = ?
        RETURNING window_from AS "from", window_until AS until, cursor, revision, complete, retry_at AS retryAt`
    )
    .bind(
      period.from.toISOString(),
      period.until.toISOString(),
      page.cursor,
      observed,
      complete,
      complete,
      observed,
      kind,
      before.revision
    )
    .first<CheckpointRow>();
  if (!updated) return null;

  if (page.advisories.length > 0) {
    const distinct = new Map<string, (typeof page.advisories)[number]>();
    for (const item of page.advisories) {
      const existing = distinct.get(item.id);
      if (!existing || item.updatedAt > existing.updatedAt) {
        distinct.set(item.id, item);
      }
    }
    const statements: D1Bound[] = [...distinct.values()].map(item =>
      db
        .prepare(
          `INSERT INTO cve_package_advisory (
             id, cve_id, kind, advisory_url, published_at, updated_at, withdrawn_at, observed_at, packages_json
           ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT (id) DO UPDATE SET
             cve_id = excluded.cve_id,
             kind = excluded.kind,
             published_at = excluded.published_at,
             updated_at = excluded.updated_at,
             withdrawn_at = excluded.withdrawn_at,
             packages_json = excluded.packages_json
           WHERE excluded.updated_at >= cve_package_advisory.updated_at`
        )
        .bind(
          item.id,
          item.cveId,
          item.kind,
          item.advisoryUrl,
          item.publishedAt,
          item.updatedAt,
          item.withdrawnAt,
          observed,
          JSON.stringify(item.packages)
        )
    );
    await batchInChunks(db, statements);
  }
  return toCheckpoint(updated);
}

async function recordFailure(
  db: D1Executor,
  kind: PackageKind,
  before: Checkpoint,
  upstream: GitHubAdvisoryError | null
) {
  const keepCursor = upstream?.status !== 422 ? 1 : 0;
  await db
    .prepare(
      `UPDATE cve_package_advisory_source
          SET revision = revision + 1, checked_at = ?, retry_at = ?,
              cursor = CASE WHEN ? = 1 THEN cursor ELSE NULL END
        WHERE kind = ? AND revision = ?`
    )
    .bind(
      new Date().toISOString(),
      upstream?.retryAt?.toISOString() ?? null,
      keepCursor,
      kind,
      before.revision
    )
    .run();
}

async function collectKind(db: D1Executor, kind: PackageKind) {
  const now = new Date();
  let before = await readCheckpoint(db, kind, now);
  if (before.retryAt && before.retryAt > now) return;
  let period: PackageWindow = before.complete
    ? {
        from: new Date(before.until.getTime() - overlap),
        until: now,
        cursor: null,
      }
    : before;
  for (let page = 0; page < pageBudget; page++) {
    let stage = 'fetch';
    try {
      const data = await fetchPackagePage(kind, period);
      stage = 'commit';
      const saved = await savePage(db, kind, before, period, data);
      if (!saved || saved.complete) return;
      before = saved;
      period = saved;
    } catch (error) {
      const upstream = error instanceof GitHubAdvisoryError ? error : null;
      const reason = upstream?.status ?? (error instanceof Error ? error.name : 'unknown');
      console.warn('package_advisory_check_failed', kind, stage, reason);
      await recordFailure(db, kind, before, upstream);
      return;
    }
  }
}

export async function collectPackageAdvisories(db: D1Executor): Promise<void> {
  for (const kind of kinds) await collectKind(db, kind);
}

interface RecentPackageRow {
  id: string;
  cveId: string | null;
  kind: PackageKind;
  advisoryUrl: string;
  publishedAt: string;
  observedAt: string;
  packagesJson: string;
}

export async function packageFeed(db: D1Executor): Promise<PackageFeed> {
  const [sourcesResult, reviewedResult, malwareResult] = await Promise.all([
    db
      .prepare(
        `SELECT s.kind,
                s.checked_at AS checkedAt,
                CASE WHEN s.complete = 1 AND s.successful_at = s.checked_at THEN 1 ELSE 0 END AS complete,
                (SELECT COUNT(*) FROM cve_package_advisory a
                  WHERE a.kind = s.kind AND a.withdrawn_at IS NULL) AS total
           FROM cve_package_advisory_source s
          WHERE s.checked_at IS NOT NULL
          ORDER BY s.kind`
      )
      .bind()
      .all<{ kind: PackageKind; checkedAt: string; complete: number; total: number }>(),
    db
      .prepare(
        `SELECT id, cve_id AS cveId, kind, advisory_url AS advisoryUrl,
                published_at AS publishedAt, observed_at AS observedAt, packages_json AS packagesJson
           FROM cve_package_advisory
          WHERE kind = 'reviewed' AND withdrawn_at IS NULL
          ORDER BY published_at DESC, id DESC
          LIMIT 4`
      )
      .bind()
      .all<RecentPackageRow>(),
    db
      .prepare(
        `SELECT id, cve_id AS cveId, kind, advisory_url AS advisoryUrl,
                published_at AS publishedAt, observed_at AS observedAt, packages_json AS packagesJson
           FROM cve_package_advisory
          WHERE kind = 'malware' AND withdrawn_at IS NULL
          ORDER BY published_at DESC, id DESC
          LIMIT 4`
      )
      .bind()
      .all<RecentPackageRow>(),
  ]);

  const sources: PackageFeed['sources'][number][] = sourcesResult.results.map(row => ({
    kind: row.kind,
    checkedAt: row.checkedAt,
    complete: row.complete === 1,
    total: Number(row.total ?? 0),
  }));

  const recent: PackageFeed['recent'][number][] = [
    ...reviewedResult.results,
    ...malwareResult.results,
  ]
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
