import { Schema } from 'effect';
import { feedStatus, recentPage, recentPath } from './advisories.ts';
import { advisoryJson } from './sources.ts';
import { checkZeroDays, zeroDayView } from './zero-days.ts';
export const dashboardSnapshot = Schema.Struct({
  version: Schema.String,
  status: Schema.NullOr(feedStatus),
  recent: Schema.NullOr(recentPage),
  zeroDays: zeroDayView,
});
export type DashboardSnapshot = typeof dashboardSnapshot.Type;

export const streamPath = 'https://dashboard-stream.internal';
const key = 'dashboard-v4';
const emptyZeroDays = { entries: [], checkedAt: null, current: false };
export const archiveOrigin = 'https://enrichment.internal';

export interface EvidenceBinding {
  EVIDENCE_ARCHIVE?: { fetch(request: Request): Promise<Response> };
}

interface StreamStorage {
  get<A>(name: string): Promise<A | undefined>;
  put<A>(name: string, value: A): Promise<void>;
  getAlarm(): Promise<number | null>;
  setAlarm(time: number): Promise<void>;
}

interface StreamState {
  storage: StreamStorage;
  acceptWebSocket(socket: WebSocket): void;
  getWebSockets(): WebSocket[];
}

declare const WebSocketPair: new () => { 0: WebSocket; 1: WebSocket };

export interface TailEvent {
  scriptName?: string | null;
  outcome: string;
  logs?: readonly { message: readonly (string | number)[] }[];
  event:
    | null
    | { cron: string }
    | {
        request: { method: string; url: string };
        response?: { status: number };
      }
    | { scheduledTime: number };
}

const publishingRoutes = new Set([
  '/internal/ingest',
  '/internal/cve-refresh',
  '/internal/baseline',
  '/internal/baseline/verify',
]);

export function isIntakeEvent(trace: TailEvent) {
  if (trace.scriptName === 'omg-cve-enrichment') {
    return (
      trace.outcome === 'ok' &&
      Boolean(trace.logs?.some(log => log.message[0] === 'vendor_intake_changed'))
    );
  }
  if (trace.scriptName !== 'omg-advisories') return false;
  const event = trace.event;
  if (event === null || 'cron' in event || 'scheduledTime' in event) return true;
  return (
    trace.outcome === 'ok' &&
    'request' in event &&
    event.request.method === 'POST' &&
    event.response?.status === 200 &&
    publishingRoutes.has(new URL(event.request.url).pathname)
  );
}

export class AdvisoryStream {
  private readonly state: StreamState;
  private readonly environment: EvidenceBinding;
  private refreshing: Promise<void> | null = null;
  private pending = false;

  constructor(state: StreamState, environment: EvidenceBinding) {
    this.state = state;
    this.environment = environment;
  }

  async fetch(request: Request): Promise<Response> {
    const path = new URL(request.url).pathname;
    if (path === '/refresh' && request.method === 'POST') {
      if ((await this.state.storage.getAlarm()) === null) {
        await this.state.storage.setAlarm(Date.now());
      }
      return new Response(null, { status: 202 });
    }

    if (path !== '/snapshot' && path !== '/subscribe') return new Response(null, { status: 404 });
    let snapshot = await this.state.storage.get<DashboardSnapshot>(key);
    if (path === '/snapshot' && !snapshot) {
      await this.refresh();
      snapshot = await this.state.storage.get<DashboardSnapshot>(key);
    }
    if (path === '/snapshot') return Response.json(snapshot ?? null);

    if (this.state.getWebSockets().length >= 2000) return new Response(null, { status: 503 });
    const pair = new WebSocketPair();
    this.state.acceptWebSocket(pair[1]);
    if (snapshot) pair[1].send(snapshot.version);
    const upgrade: ResponseInit & { webSocket: WebSocket } = { status: 101, webSocket: pair[0] };
    return new Response(null, upgrade);
  }

  async alarm() {
    await this.refresh();
  }

  webSocketMessage(socket: WebSocket) {
    socket.close(1008, 'Read only');
  }

  private async refresh() {
    if (this.refreshing) {
      this.pending = true;
      return this.refreshing;
    }
    this.refreshing = this.update();
    try {
      await this.refreshing;
    } finally {
      this.refreshing = null;
      if (this.pending) {
        this.pending = false;
        await this.state.storage.setAlarm(Date.now());
      }
    }
  }

  private async update() {
    const previous =
      (await this.state.storage.get<DashboardSnapshot>(key)) ??
      (await this.state.storage.get<DashboardSnapshot>('dashboard-v3'));
    const [feeds, records] = await Promise.allSettled([
      advisoryJson('/v1/status', feedStatus, true),
      advisoryJson(recentPath(null), recentPage, true),
    ]);
    const status = feeds.status === 'fulfilled' ? feeds.value : null;
    const recent = records.status === 'fulfilled' ? records.value : null;
    const oldZeroDays = previous?.zeroDays ?? emptyZeroDays;
    const snapshot: DashboardSnapshot = {
      version: crypto.randomUUID(),
      status,
      recent: recent ?? (previous?.recent ? { ...previous.recent, complete: false } : null),
      zeroDays: oldZeroDays,
    };
    await this.publish(snapshot);

    const zeroDays = await this.syncEvidence(oldZeroDays);
    if (JSON.stringify(zeroDays) !== JSON.stringify(oldZeroDays)) {
      await this.publish({ ...snapshot, version: crypto.randomUUID(), zeroDays });
    }
  }

  private async syncEvidence(previous: typeof zeroDayView.Type) {
    if (!this.environment.EVIDENCE_ARCHIVE) return checkZeroDays(previous, new Date());
    try {
      const response = await this.environment.EVIDENCE_ARCHIVE.fetch(
        new Request(archiveOrigin + '/sync', { method: 'POST' })
      );
      if (!response.ok) return { ...previous, current: false };
      return Schema.decodeUnknownSync(zeroDayView)(await response.json());
    } catch {
      return { ...previous, current: false };
    }
  }

  private async publish(snapshot: DashboardSnapshot) {
    await this.state.storage.put(key, snapshot);
    for (const socket of this.state.getWebSockets()) {
      try {
        socket.send(snapshot.version);
      } catch {
        try {
          socket.close(1011, 'Reconnect for updates');
        } catch {
          // A disconnected socket will be dropped by the runtime.
        }
      }
    }
  }
}
