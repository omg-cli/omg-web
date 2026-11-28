import { Schema } from 'effect';
import { cveId } from './advisories.ts';
import { readLimitedText } from './sources.ts';

const githubApi = 'https://api.github.com/advisories';
const githubAdvisory = 'https://github.com/advisories/';
const ghsaId = Schema.String.pipe(Schema.pattern(/^GHSA-[a-z0-9]{4}(?:-[a-z0-9]{4}){2}$/u));
const cveAlias = Schema.NullOr(Schema.String.pipe(Schema.pattern(cveId)));
const timestamp = Schema.String.pipe(
  Schema.pattern(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?Z$/u),
  Schema.filter(value => Number.isFinite(Date.parse(value)))
);
const ecosystem = Schema.String.pipe(Schema.minLength(1), Schema.maxLength(64));
const name = Schema.String.pipe(Schema.minLength(1), Schema.maxLength(512));
const range = Schema.String.pipe(Schema.maxLength(4096));
const fixed = Schema.NullOr(Schema.String.pipe(Schema.maxLength(512)));
const kind = Schema.Literal('reviewed', 'malware');
export type PackageKind = typeof kind.Type;

const affected = Schema.Struct({ ecosystem, name, range, fixed });
const publicAdvisory = Schema.Struct({
  id: Schema.String.pipe(Schema.pattern(/^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/u)),
  cveId: cveAlias,
  kind,
  advisoryUrl: Schema.Union(
    Schema.String.pipe(Schema.startsWith(githubAdvisory)),
    Schema.String.pipe(Schema.startsWith('https://osv.dev/vulnerability/'))
  ),
  publishedAt: timestamp,
  observedAt: timestamp,
  packages: Schema.Array(affected),
});
export const packageFeedSchema = Schema.Struct({
  sources: Schema.Array(
    Schema.Struct({
      kind,
      checkedAt: timestamp,
      complete: Schema.Boolean,
      total: Schema.Number,
      provider: Schema.optional(Schema.Literal('OSV')),
    })
  ),
  recent: Schema.Array(publicAdvisory),
});
export type PackageFeed = typeof packageFeedSchema.Type;

export function mergePackageFeeds(github: PackageFeed, osv: PackageFeed): PackageFeed {
  const byId = new Map(osv.recent.map(advisory => [advisory.id, advisory]));
  for (const advisory of github.recent) byId.set(advisory.id, advisory);
  const ordered = [...byId.values()].toSorted(
    (left, right) =>
      right.publishedAt.localeCompare(left.publishedAt) || left.id.localeCompare(right.id)
  );
  return {
    sources: [...github.sources, ...osv.sources],
    recent: (['malware', 'reviewed'] as const).flatMap(feedKind =>
      ordered.filter(advisory => advisory.kind === feedKind).slice(0, 4)
    ),
  };
}

const upstreamPage = Schema.Array(
  Schema.Struct({
    ghsa_id: ghsaId,
    cve_id: cveAlias,
    type: kind,
    html_url: Schema.String,
    published_at: timestamp,
    updated_at: timestamp,
    withdrawn_at: Schema.NullOr(timestamp),
    vulnerabilities: Schema.Array(
      Schema.Struct({
        package: Schema.Struct({ ecosystem, name }),
        vulnerable_version_range: range,
        first_patched_version: fixed,
      })
    ).pipe(Schema.maxItems(4096)),
  })
).pipe(Schema.maxItems(50));

export function parsePackagePage(input: string, expected: PackageKind) {
  return Schema.decodeUnknownSync(upstreamPage)(JSON.parse(input)).map(row => {
    const advisoryUrl = githubAdvisory + row.ghsa_id;
    if (row.type !== expected || row.html_url !== advisoryUrl) {
      throw new Error('GitHub advisory identity mismatch');
    }
    return {
      id: row.ghsa_id,
      cveId: row.cve_id,
      kind: row.type,
      advisoryUrl,
      publishedAt: row.published_at,
      updatedAt: row.updated_at,
      withdrawnAt: row.withdrawn_at,
      packages: row.vulnerabilities.map(vulnerability => ({
        ecosystem: vulnerability.package.ecosystem,
        name: vulnerability.package.name,
        range: vulnerability.vulnerable_version_range,
        fixed: vulnerability.first_patched_version,
      })),
    };
  });
}

export interface PackageWindow {
  from: Date;
  until: Date;
  cursor: string | null;
}

export class GitHubAdvisoryError extends Error {
  readonly status: number;
  readonly retryAt: Date | null;

  constructor(status: number, retryAt: Date | null) {
    super(`GitHub advisories returned ${status}`);
    this.status = status;
    this.retryAt = retryAt;
  }
}

function githubDate(value: Date) {
  return value.toISOString().replace(/\.\d{3}Z$/u, 'Z');
}

function githubCursor(link: string | null, request: URL) {
  const match = link?.match(/<([^>]+)>;\s*rel="next"/u);
  if (!match?.[1]) return null;
  const next = new URL(match[1]);
  const cursor = next.searchParams.get('after');
  next.searchParams.delete('after');
  request.searchParams.delete('after');
  next.searchParams.sort();
  request.searchParams.sort();
  if (next.href !== request.href || !cursor || !/^[A-Za-z0-9_+/=-]{1,512}$/u.test(cursor)) {
    throw new Error('Invalid GitHub advisory continuation');
  }
  return cursor;
}

function rateLimitRetry(response: Response) {
  const retryAfter = response.headers.get('Retry-After');
  const remaining = response.headers.get('X-RateLimit-Remaining');
  if (response.status !== 429 && !(response.status === 403 && (retryAfter || remaining === '0'))) {
    return null;
  }
  const reset = Number(response.headers.get('X-RateLimit-Reset')) * 1000;
  const requested = Number(retryAfter) * 1000;
  const now = Date.now();
  return new Date(Math.max(now + 60_000, reset || 0, now + (requested || 0)));
}

export async function fetchPackagePage(feedKind: PackageKind, window: PackageWindow) {
  const url = new URL(githubApi);
  url.search = new URLSearchParams({
    type: feedKind,
    modified: `${githubDate(window.from)}..${githubDate(window.until)}`,
    sort: 'updated',
    direction: 'asc',
    per_page: '50',
  }).toString();
  if (window.cursor) url.searchParams.set('after', window.cursor);
  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'OMG-Advisory-Intake',
      'X-GitHub-Api-Version': '2026-03-10',
    },
    redirect: 'manual',
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new GitHubAdvisoryError(response.status, rateLimitRetry(response));
  const cursor = githubCursor(response.headers.get('Link'), url);
  if (cursor !== null && cursor === window.cursor) {
    throw new Error('GitHub advisory cursor did not advance');
  }
  const json = await readLimitedText(response, 4 * 1024 * 1024);
  return { advisories: parsePackagePage(json, feedKind), cursor };
}
