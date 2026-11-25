import postgres from 'postgres';
import {
  fetchPackagePage,
  GitHubAdvisoryError,
  type PackageFeed,
  type PackageKind,
  type PackageWindow,
  type parsePackagePage,
} from './package-advisories.ts';

const kinds: readonly PackageKind[] = ['reviewed', 'malware'];
const bootstrap = 7 * 24 * 60 * 60_000;
const overlap = 10 * 60_000;
const pageBudget = 4;

interface Checkpoint extends PackageWindow {
  revision: number;
  complete: boolean;
  retryAt: Date | null;
}

async function readCheckpoint(sql: postgres.Sql, kind: PackageKind, now: Date) {
  await sql`
    INSERT INTO public.cve_package_advisory_source (kind, window_from, window_until)
    VALUES (${kind}, ${new Date(now.getTime() - bootstrap)}, ${now})
    ON CONFLICT (kind) DO NOTHING
  `;
  const [saved] = await sql<Checkpoint[]>`
    SELECT window_from AS "from", window_until AS until, cursor, revision, complete,
           retry_at AS "retryAt"
      FROM public.cve_package_advisory_source WHERE kind = ${kind}
  `;
  if (!saved) throw new Error('Package advisory checkpoint is missing');
  return saved;
}

async function storePage(
  transaction: postgres.TransactionSql,
  advisories: ReturnType<typeof parsePackagePage>,
  observed: Date
) {
  if (advisories.length === 0) return;
  await transaction`
    WITH page AS (
      SELECT DISTINCT ON (id) *
        FROM jsonb_to_recordset(${JSON.stringify(advisories)}::text::jsonb) AS wire(
          id text, "cveId" text, kind text, "advisoryUrl" text, "publishedAt" timestamptz,
          "updatedAt" timestamptz, "withdrawnAt" timestamptz, packages jsonb
        )
       ORDER BY id, "updatedAt" DESC
    )
    INSERT INTO public.cve_package_advisory AS existing (
      id, cve_id, kind, advisory_url, published_at, updated_at, withdrawn_at, observed_at, packages
    )
    SELECT id, "cveId", kind, "advisoryUrl", "publishedAt", "updatedAt", "withdrawnAt",
           ${observed}, packages
      FROM page ORDER BY id
    ON CONFLICT (id) DO UPDATE SET
      cve_id = excluded.cve_id, kind = excluded.kind, published_at = excluded.published_at,
      updated_at = excluded.updated_at, withdrawn_at = excluded.withdrawn_at,
      packages = excluded.packages
    WHERE excluded.updated_at >= existing.updated_at
      AND (existing.cve_id, existing.kind, existing.published_at, existing.updated_at,
           existing.withdrawn_at, existing.packages) IS DISTINCT FROM
          (excluded.cve_id, excluded.kind, excluded.published_at, excluded.updated_at,
           excluded.withdrawn_at, excluded.packages)
  `;
}

async function savePage(
  sql: postgres.Sql,
  kind: PackageKind,
  before: Checkpoint,
  period: PackageWindow,
  page: Awaited<ReturnType<typeof fetchPackagePage>>
) {
  return sql.begin(async transaction => {
    await transaction`SET LOCAL statement_timeout = '8s'`;
    await transaction`SET LOCAL lock_timeout = '1s'`;
    const observed = new Date();
    const complete = page.cursor === null;
    const [saved] = await transaction<Checkpoint[]>`
      UPDATE public.cve_package_advisory_source
         SET window_from = ${period.from}, window_until = ${period.until}, cursor = ${page.cursor},
             revision = revision + 1, checked_at = ${observed}, retry_at = NULL,
             complete = ${complete},
             successful_at = CASE WHEN ${complete} THEN ${observed}::timestamptz ELSE successful_at END
       WHERE kind = ${kind} AND revision = ${before.revision}
       RETURNING window_from AS "from", window_until AS until, cursor, revision, complete,
                 retry_at AS "retryAt"
    `;
    if (saved) await storePage(transaction, page.advisories, observed);
    return saved;
  });
}

async function recordFailure(
  sql: postgres.Sql,
  kind: PackageKind,
  before: Checkpoint,
  upstream: GitHubAdvisoryError | null
) {
  const keepCursor = upstream?.status !== 422;
  await sql`
    UPDATE public.cve_package_advisory_source
       SET revision = revision + 1, checked_at = ${new Date()}, retry_at = ${upstream?.retryAt ?? null},
           cursor = CASE WHEN ${keepCursor} THEN cursor ELSE NULL END
     WHERE kind = ${kind} AND revision = ${before.revision}
  `;
}

async function collectKind(sql: postgres.Sql, kind: PackageKind) {
  const now = new Date();
  let before = await readCheckpoint(sql, kind, now);
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
      const saved = await savePage(sql, kind, before, period, data);
      if (!saved || saved.complete) return;
      before = saved;
      period = saved;
    } catch (error) {
      const upstream = error instanceof GitHubAdvisoryError ? error : null;
      const reason =
        upstream?.status ??
        (error instanceof postgres.PostgresError
          ? error.code
          : error instanceof Error
            ? error.name
            : 'unknown');
      console.warn('package_advisory_check_failed', kind, stage, reason);
      await recordFailure(sql, kind, before, upstream);
      return;
    }
  }
}

export async function collectPackageAdvisories(sql: postgres.Sql): Promise<void> {
  for (const kind of kinds) await collectKind(sql, kind);
}

export async function packageFeed(sql: postgres.Sql): Promise<PackageFeed> {
  const [sources, recent] = await Promise.all([
    sql<PackageFeed['sources'][number][]>`
      SELECT s.kind,
             to_char(s.checked_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "checkedAt",
             (s.complete AND s.successful_at = s.checked_at) AS complete,
             (SELECT count(*)::int FROM public.cve_package_advisory a
               WHERE a.kind = s.kind AND a.withdrawn_at IS NULL) AS total
        FROM public.cve_package_advisory_source s
       WHERE s.checked_at IS NOT NULL
       ORDER BY s.kind
    `,
    sql<PackageFeed['recent'][number][]>`
      SELECT a.id, a.cve_id AS "cveId", a.kind, a.advisory_url AS "advisoryUrl",
             to_char(a.published_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "publishedAt",
             to_char(a.observed_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') AS "observedAt",
             jsonb_path_query_array(a.packages, '$[0 to 7]') AS packages
        FROM (VALUES ('reviewed'), ('malware')) AS feeds(kind)
        CROSS JOIN LATERAL (
          SELECT * FROM public.cve_package_advisory
           WHERE kind = feeds.kind AND withdrawn_at IS NULL
           ORDER BY published_at DESC, id DESC
           LIMIT 4
        ) a
       ORDER BY a.published_at DESC, a.id DESC
    `,
  ]);
  return { sources, recent };
}
