import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SECURITY_SNAPSHOT } from '../security-snapshot';

function runtime(origin = 'https://getomg.xyz') {
  const entries = new Map<string, Response>();
  const tasks: Promise<unknown>[] = [];
  const cache = {
    match: vi.fn(async (key: RequestInfo | URL) => entries.get(String(key))?.clone()),
    put: vi.fn(async (key: RequestInfo | URL, response: Response) => {
      entries.set(String(key), response.clone());
    }),
  };
  return {
    origin,
    cache,
    ctx: { waitUntil: (task: Promise<unknown>) => tasks.push(task) },
    tasks,
    entries,
  };
}

describe('security feed edge cache', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-10T04:00:00Z'));
  });
  afterEach(() => vi.useRealTimers());

  it('returns the stale snapshot while upstream requests are still pending, then shares the refresh across module reloads', async () => {
    const { securityFeed } = await import('./security-updates.server');
    const state = runtime();
    const upstream = Promise.withResolvers<Response>();
    const fetcher = vi
      .fn<typeof fetch>()
      .mockImplementation(async () => (await upstream.promise).clone());
    const result = await Promise.race([
      securityFeed(fetcher, state),
      new Promise<'blocked'>(resolve => setTimeout(() => resolve('blocked'), 100)),
    ]);
    upstream.resolve(Response.json([]));
    await Promise.all(state.tasks);
    expect(result).not.toBe('blocked');
    expect(result).toEqual({ ...SECURITY_SNAPSHOT, stale: true });
    expect(fetcher).toHaveBeenCalledTimes(2);
    vi.resetModules();
    const reloaded = await import('./security-updates.server');
    const fresh = await reloaded.securityFeed(fetcher, state);
    expect(fresh.stale).toBe(false);
    expect(fetcher).toHaveBeenCalledTimes(2);
  });

  it('returns expired entries immediately and retains history and sync time during an outage', async () => {
    const { securityFeed } = await import('./security-updates.server');
    const state = runtime();
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => Response.json([]));
    await securityFeed(fetcher, state);
    await Promise.all(state.tasks);
    const fresh = await securityFeed(fetcher, state);
    vi.setSystemTime(Date.now() + 300_001);
    const upstream = Promise.withResolvers<Response>();
    fetcher.mockImplementation(async () => (await upstream.promise).clone());
    const stale = await securityFeed(fetcher, state);
    expect(stale).toEqual({ ...fresh, stale: true });
    upstream.resolve(new Response(null, { status: 403 }));
    await Promise.all(state.tasks);
    expect(await securityFeed(fetcher, state)).toEqual(stale);
    expect(fetcher).toHaveBeenCalledTimes(4);
    vi.setSystemTime(Date.now() + 60_001);
    await securityFeed(fetcher, state);
    await Promise.all(state.tasks);
    expect(fetcher).toHaveBeenCalledTimes(6);
  });

  it('isolates origins and never adds caller cookies or query parameters to the key', async () => {
    const { securityFeed } = await import('./security-updates.server');
    const state = runtime('https://getomg.xyz/security/feed.json?token=ignored');
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => Response.json([]));
    await securityFeed(fetcher, state);
    await Promise.all(state.tasks);
    await securityFeed(fetcher, { ...state, origin: 'https://staging.getomg.xyz' });
    await Promise.all(state.tasks);
    expect(fetcher).toHaveBeenCalledTimes(4);
    expect([...state.entries.keys()]).toEqual([
      'https://getomg.xyz/__omg-cache/security-feed/v1',
      'https://staging.getomg.xyz/__omg-cache/security-feed/v1',
    ]);
  });

  it('serves the fallback and completes background work when cache reads or writes fail', async () => {
    const { securityFeed } = await import('./security-updates.server');
    const state = runtime();
    state.cache.match.mockRejectedValue(new Error('cache unavailable'));
    state.cache.put.mockRejectedValue(new Error('cache unavailable'));
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => Response.json([]));
    expect(await securityFeed(fetcher, state)).toEqual({ ...SECURITY_SNAPSHOT, stale: true });
    await expect(Promise.all(state.tasks)).resolves.toBeDefined();
  });

  it('rejects malformed cached feed data and replaces it with a validated refresh', async () => {
    const { securityFeed } = await import('./security-updates.server');
    const state = runtime();
    state.entries.set(
      'https://getomg.xyz/__omg-cache/security-feed/v1',
      Response.json({ feed: {} })
    );
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => Response.json([]));
    expect(await securityFeed(fetcher, state)).toEqual({ ...SECURITY_SNAPSHOT, stale: true });
    await Promise.all(state.tasks);
    expect((await securityFeed(fetcher, state)).stale).toBe(false);
  });
});
