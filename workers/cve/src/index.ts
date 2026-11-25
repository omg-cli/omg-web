import { Schema } from 'effect';
import { applySecurityHeaders } from '../../../shared/security-headers.ts';
import {
  advisoryOrigin,
  cursorPattern,
  cveId,
  recentPage,
  recentPath,
  recordDetails,
} from './advisories.ts';
import { advisoryJson, UpstreamError } from './sources.ts';
import { dashboardSnapshot, isIntakeEvent, streamPath, type TailEvent } from './stream.ts';
import { archive, detail, home, message, renderLive } from './views.ts';

export { AdvisoryStream } from './stream.ts';

interface CacheStorage {
  open(name: string): Promise<Cache>;
}

interface DashboardEnvironment {
  ASSETS: { fetch(request: Request): Promise<Response> };
  ADVISORY_STREAM: {
    getByName(name: string): { fetch(request: Request): Promise<Response> };
  };
}

interface DashboardContext {
  waitUntil(promise: Promise<void>): void;
}

declare const caches: CacheStorage;

const assetPaths = new Set([
  '/dashboard.css',
  '/dashboard.js',
  '/logo.svg',
  '/archivo.woff2',
  '/plex-mono.woff2',
]);
const notFound = 404;

function respond(body: BodyInit | null, status = 200, headers = new Headers()) {
  applySecurityHeaders(headers);
  const policy = headers.get('Content-Security-Policy') ?? '';
  headers.set(
    'Content-Security-Policy',
    policy.replace("connect-src 'self'", "connect-src 'self' wss://cve.getomg.dev")
  );
  headers.set('Cache-Control', 'no-store');
  return new Response(body, { status, headers });
}

function html(body: string, status = 200) {
  return respond(body, status, new Headers({ 'Content-Type': 'text/html; charset=utf-8' }));
}

async function loadPublic<A, I>(
  path: string,
  schema: Schema.Schema<A, I>,
  context: DashboardContext,
  cacheFirstPage = false
) {
  const url = new URL(path, advisoryOrigin);
  const key = new Request(url);
  const cache = cacheFirstPage ? await caches.open('omg-cve-v1').catch(() => null) : null;
  const cached = await cache?.match(key).catch(() => undefined);
  if (cached) {
    return Schema.decodeUnknownSync(schema)(await cached.json());
  }

  const data = await advisoryJson(path, schema);
  if (cache) {
    const entry = Response.json(data, { headers: { 'Cache-Control': 'public, max-age=30' } });
    context.waitUntil(cache.put(key, entry).catch(() => undefined));
  }
  return data;
}

function stream(environment: DashboardEnvironment) {
  return environment.ADVISORY_STREAM.getByName('public-dashboard');
}

async function readSnapshot(environment: DashboardEnvironment) {
  try {
    const response = await stream(environment).fetch(new Request(streamPath + '/snapshot'));
    if (!response.ok) return null;
    return Schema.decodeUnknownSync(Schema.NullOr(dashboardSnapshot))(await response.json());
  } catch {
    return null;
  }
}

async function dashboard(environment: DashboardEnvironment, fragments: boolean) {
  const state = await readSnapshot(environment);
  const now = Date.now();
  const status = state?.status || state?.recent ? 200 : 503;
  return html(fragments ? renderLive(state, now) : home(state, now), status);
}

async function browse(url: URL, context: DashboardContext) {
  const cursor = url.searchParams.get('cursor');
  if (
    [...url.searchParams.keys()].some(key => key !== 'cursor') ||
    url.searchParams.getAll('cursor').length > 1 ||
    (cursor !== null && !cursorPattern.test(cursor))
  ) {
    return html(
      message('Invalid archive link', 'Open the archive to start a new browsing session.'),
      400
    );
  }
  try {
    const page = await loadPublic(recentPath(cursor), recentPage, context, cursor === null);
    return html(archive(page, cursor === null, Date.now()));
  } catch (error) {
    if (error instanceof UpstreamError && error.status === 400) {
      return html(
        message('Archive link expired', 'Open the archive to start a new browsing session.'),
        400
      );
    }
    return html(
      message('Archive unavailable', 'The advisory service could not load this page.'),
      503
    );
  }
}

async function record(id: string, environment: DashboardEnvironment, context: DashboardContext) {
  try {
    const [data, snapshot] = await Promise.all([
      loadPublic(`/v1/cves/${id}`, recordDetails, context),
      readSnapshot(environment),
    ]);
    if (data.provenance.id !== id || (data.kev && data.kev.cveID !== id)) {
      throw new Error('Advisory ID mismatch');
    }
    return html(
      detail(
        data,
        snapshot?.zeroDays.entries.find(item => item.id === id),
        Date.now()
      )
    );
  } catch (error) {
    if (error instanceof UpstreamError && error.status === notFound) {
      return html(
        message('CVE not found', 'The advisory service returned no stored record for this ID.'),
        notFound
      );
    }
    return html(
      message('CVE unavailable', 'The advisory service could not load this record.'),
      503
    );
  }
}

async function route(
  request: Request,
  environment: DashboardEnvironment,
  context: DashboardContext
) {
  const url = new URL(request.url);
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return respond(null, 405, new Headers({ Allow: 'GET, HEAD' }));
  }

  if (assetPaths.has(url.pathname)) {
    const response = await environment.ASSETS.fetch(request);
    const headers = new Headers(response.headers);
    applySecurityHeaders(headers);
    return new Response(response.body, { status: response.status, headers });
  }

  if (url.pathname === '/live') {
    if (request.method !== 'GET' || request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
      return respond(null, 426);
    }
    if (request.headers.get('Origin') !== url.origin) return respond(null, 403);
    return stream(environment).fetch(new Request(streamPath + '/subscribe', request));
  }
  if (url.pathname === '/live/sections') return dashboard(environment, true);
  if (url.pathname === '/') return dashboard(environment, false);
  if (url.pathname === '/archive') return browse(url, context);
  if (url.pathname === '/lookup') {
    const id = url.searchParams.get('id')?.trim().toUpperCase() ?? '';
    if (!cveId.test(id)) {
      return html(message('Enter a CVE ID', 'Use the format CVE-2026-12345.'), 400);
    }
    return respond(null, 303, new Headers({ Location: `/cves/${id}` }));
  }

  const id = url.pathname.slice('/cves/'.length);
  if (url.pathname.startsWith('/cves/') && cveId.test(id)) return record(id, environment, context);
  return html(message('Page not found', 'Open the dashboard or browse recent CVEs.'), notFound);
}

export default {
  async tail(events: readonly TailEvent[], environment: DashboardEnvironment) {
    if (!events.some(isIntakeEvent)) return;
    const response = await stream(environment).fetch(
      new Request(streamPath + '/refresh', { method: 'POST' })
    );
    if (!response.ok) throw new Error('Could not queue advisory dashboard update');
  },
  async fetch(request: Request, environment: DashboardEnvironment, context: DashboardContext) {
    const response = await route(request, environment, context);
    if (request.method !== 'HEAD') return response;
    await response.body?.cancel();
    return new Response(null, response);
  },
};
