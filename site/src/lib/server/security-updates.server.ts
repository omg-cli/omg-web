import { Effect, Logger, Schema } from 'effect';
import {
  isSecurityUpdate,
  securityCategory,
  SecurityFeedSchema,
  type SecurityFeed,
  type SecurityUpdate,
} from '../security-updates';
import { SECURITY_SNAPSHOT } from '../security-snapshot';

const CommitSchema = Schema.Struct({
  sha: Schema.String.check(Schema.isPattern(/^[a-f0-9]{40}$/u)),
  commit: Schema.Struct({
    message: Schema.String,
    committer: Schema.Struct({
      date: Schema.String.check(Schema.makeFilter(value => Number.isFinite(Date.parse(value)))),
    }),
  }),
});
const decodeCommits = Schema.decodeUnknownSync(Schema.Array(CommitSchema));
// PR #399 is merged. Follow main rather than treating its retained branch as
// evidence of an open review. New security commits on main appear automatically.
const SOURCES = [
  { repository: 'omg', ref: 'main', branch: 'main' },
  { repository: 'omg-web', ref: 'main', branch: 'main' },
] as const;
let cached: SecurityFeed = SECURITY_SNAPSHOT;
let expiresAt = 0;
let pending: Promise<SecurityFeed> | undefined;

async function refresh(fetcher: typeof fetch, previousFeed: SecurityFeed): Promise<SecurityFeed> {
  const results = await Promise.allSettled(
    SOURCES.map(async source => {
      const response = await fetcher(
        `https://api.github.com/repos/omg-cli/${source.repository}/commits?sha=${encodeURIComponent(source.ref)}&per_page=100`,
        {
          headers: {
            Accept: 'application/vnd.github+json',
            'User-Agent': 'OMG-security-updates',
            'X-GitHub-Api-Version': '2022-11-28',
          },
          signal: AbortSignal.timeout(8000),
        }
      );
      if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
      return decodeCommits(await response.json())
        .filter(commit => isSecurityUpdate(commit.commit.message.split('\n')[0] ?? ''))
        .map(commit => {
          const [title = '', ...body] = commit.commit.message.split('\n');
          const previous = previousFeed.updates.find(
            update => update.sha === commit.sha && update.repository === source.repository
          );
          return {
            sha: commit.sha,
            repository: source.repository,
            title: title.replace(/^[a-z]+(?:\([^)]*\))?:\s*/iu, ''),
            detail: previous?.detail || body.join('\n').trim().slice(0, 1800),
            date: new Date(commit.commit.committer.date).toISOString(),
            branch: source.branch,
            category: securityCategory(source.repository, title),
          } satisfies SecurityUpdate;
        });
    })
  );
  const updates = new Map<string, SecurityUpdate>();
  for (const result of results) {
    if (result.status === 'fulfilled')
      for (const update of result.value) {
        const key = `${update.repository}:${update.sha}`;
        if (!updates.has(key)) updates.set(key, update);
      }
  }
  // Preserve previously published entries through API outages and history pagination.
  for (const update of previousFeed.updates) {
    const key = `${update.repository}:${update.sha}`;
    if (!updates.has(key) || update.branch === 'main') updates.set(key, update);
  }
  const stale = results.some(result => result.status === 'rejected');
  return {
    updates: [...updates.values()]
      .toSorted((a, b) => Date.parse(b.date) - Date.parse(a.date))
      .slice(0, 150),
    syncedAt: stale ? previousFeed.syncedAt : new Date().toISOString(),
    stale,
  };
}

interface FeedCacheRuntime {
  readonly origin: string;
  readonly cache: Pick<Cache, 'match' | 'put'> | Promise<Pick<Cache, 'match' | 'put'>>;
  readonly ctx: { waitUntil(task: Promise<unknown>): void };
}

const decodeCachedFeed = Schema.decodeUnknownSync(
  Schema.Struct({ feed: SecurityFeedSchema, refreshAfter: Schema.Number })
);

function reportCacheFailure(event: string): void {
  Effect.runSync(
    Effect.logWarning({ event }).pipe(Effect.provide(Logger.layer([Logger.consoleJson])))
  );
}

async function edgeFeed(fetcher: typeof fetch, runtime: FeedCacheRuntime): Promise<SecurityFeed> {
  const key = `${new URL(runtime.origin).origin}/__omg-cache/security-feed/v1`;
  let previous: SecurityFeed = SECURITY_SNAPSHOT;
  try {
    const response = await (await runtime.cache).match(key);
    if (response) {
      const entry = decodeCachedFeed(await response.json());
      previous = entry.feed;
      if (Date.now() < entry.refreshAfter) return previous;
    }
  } catch {
    reportCacheFailure('security_feed.cache_read_failed');
  }
  runtime.ctx.waitUntil(
    (async () => {
      try {
        const feed = await refresh(fetcher, previous);
        await (
          await runtime.cache
        ).put(
          key,
          Response.json(
            { feed, refreshAfter: Date.now() + (feed.stale ? 60_000 : 300_000) },
            { headers: { 'Cache-Control': 'public, max-age=86400' } }
          )
        );
      } catch {
        reportCacheFailure('security_feed.cache_refresh_failed');
      }
    })()
  );
  return { ...previous, stale: true };
}

export async function securityFeed(
  fetcher: typeof fetch,
  runtime?: FeedCacheRuntime
): Promise<SecurityFeed> {
  if (runtime) return edgeFeed(fetcher, runtime);
  if (Date.now() < expiresAt) return cached;
  if (pending) return pending;
  pending = refresh(fetcher, cached).then(feed => {
    cached = feed;
    expiresAt = Date.now() + 300_000;
    return feed;
  });
  try {
    return await pending;
  } finally {
    pending = undefined;
  }
}
