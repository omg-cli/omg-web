import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AdminLiveFeed } from './admin-live.svelte';

const first = {
  eventKey: 'a'.repeat(64),
  eventType: 'command',
  eventName: 'install',
  timestamp: '2026-08-30T12:00:00.000Z',
  version: '1.4.0',
  platform: 'linux',
  durationMs: 120,
  createdAt: '2026-08-30 12:00:00',
};
const second = { ...first, eventKey: 'b'.repeat(64), version: '1.4.1', durationMs: 220 };
const refreshedAt = '2026-08-30T12:00:01.000Z';
const response = (events: ReadonlyArray<typeof first>) =>
  Response.json({ events, count: events.length, refreshedAt });

describe('operator live polling', () => {
  let stop: (() => void) | undefined;
  let visibility = 'visible';
  let document: EventTarget;
  const fetcher = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    visibility = 'visible';
    document = new EventTarget();
    Object.defineProperty(document, 'visibilityState', { get: () => visibility });
    vi.stubGlobal('document', document);
    vi.stubGlobal('window', { location: { origin: 'https://example.test' } });
    vi.stubGlobal('fetch', fetcher);
  });
  afterEach(() => {
    stop?.();
    stop = undefined;
    vi.useRealTimers();
    vi.unstubAllGlobals();
    fetcher.mockReset();
  });

  it('keeps distinct same-second events and uses the latest representation on repeated polls', async () => {
    const feed = new AdminLiveFeed({ events: [first], refreshedAt });
    stop = feed.start();
    fetcher.mockResolvedValueOnce(response([second, { ...first, durationMs: 140 }]));
    await vi.advanceTimersByTimeAsync(5000);
    expect(feed.events).toHaveLength(2);
    expect(feed.events.find(event => event.eventKey === first.eventKey)?.durationMs).toBe(140);
    fetcher.mockResolvedValueOnce(response([second, { ...first, durationMs: 140 }]));
    await vi.advanceTimersByTimeAsync(5000);
    expect(feed.events).toHaveLength(2);
    expect(feed.state).toBe('current');
  });

  it('ignores an aborted response that finishes after a newer visibility-resume poll', async () => {
    const pending = Promise.withResolvers<Response>();
    fetcher.mockReturnValueOnce(pending.promise).mockResolvedValueOnce(response([second]));
    const feed = new AdminLiveFeed({ events: [], refreshedAt: 'initial' });
    stop = feed.start();
    await vi.advanceTimersByTimeAsync(5000);
    visibility = 'hidden';
    document.dispatchEvent(new Event('visibilitychange'));
    visibility = 'visible';
    document.dispatchEvent(new Event('visibilitychange'));
    await vi.advanceTimersByTimeAsync(0);
    expect(feed.events.map(event => event.version)).toEqual(['1.4.1']);
    pending.resolve(Response.json({ events: [first], count: 1, refreshedAt: 'stale' }));
    await vi.advanceTimersByTimeAsync(0);
    expect(feed.events.map(event => event.version)).toEqual(['1.4.1']);
    expect(feed.refreshedAt).toBe(refreshedAt);
    expect(feed.state).toBe('current');
  });

  it('resumes immediately even when an aborted request settles before the resume timer', async () => {
    const pending = Promise.withResolvers<Response>();
    fetcher.mockReturnValueOnce(pending.promise).mockResolvedValueOnce(response([second]));
    const feed = new AdminLiveFeed({ events: [], refreshedAt: 'initial' });
    stop = feed.start();
    await vi.advanceTimersByTimeAsync(5000);
    visibility = 'hidden';
    document.dispatchEvent(new Event('visibilitychange'));
    visibility = 'visible';
    document.dispatchEvent(new Event('visibilitychange'));
    pending.reject(new DOMException('Aborted', 'AbortError'));
    await vi.advanceTimersByTimeAsync(0);
    expect(feed.events.map(event => event.version)).toEqual(['1.4.1']);
    expect(feed.refreshedAt).toBe(refreshedAt);
  });

  it('does not update stopped feeds when an in-flight request finishes', async () => {
    const pending = Promise.withResolvers<Response>();
    fetcher.mockReturnValueOnce(pending.promise);
    const feed = new AdminLiveFeed({ events: [first], refreshedAt: 'initial' });
    stop = feed.start();
    await vi.advanceTimersByTimeAsync(5000);
    stop();
    pending.resolve(response([second]));
    await vi.advanceTimersByTimeAsync(0);
    expect(feed.events.map(event => event.version)).toEqual(['1.4.0']);
    expect(feed.refreshedAt).toBe('initial');
    expect(vi.getTimerCount()).toBe(0);
  });

  it('retries unavailable responses and retains only the latest 100 rows', async () => {
    const feed = new AdminLiveFeed({ events: [first], refreshedAt: 'initial' });
    stop = feed.start();
    fetcher.mockResolvedValueOnce(new Response(null, { status: 503 }));
    await vi.advanceTimersByTimeAsync(5000);
    expect(feed.state).toBe('unavailable');
    const events = Array.from({ length: 100 }, (_, index) => ({
      ...second,
      eventKey: index.toString(16).padStart(64, '0'),
      createdAt: '2026-08-30 12:00:01',
    }));
    fetcher.mockResolvedValueOnce(response(events));
    await vi.advanceTimersByTimeAsync(5000);
    expect(feed.state).toBe('current');
    expect(feed.events).toHaveLength(100);
    expect(feed.events.every(event => event.createdAt === '2026-08-30 12:00:01')).toBe(true);
  });
});
