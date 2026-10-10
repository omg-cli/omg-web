import { betterAuth } from 'better-auth';
import { memoryAdapter } from 'better-auth/adapters/memory';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createShadowAuth, type AuthEnvironment } from './auth.server';

const PRODUCTION = 'https://getomg.xyz';
const STAGING = 'https://staging.getomg.xyz';
const PROXY_SECRET = 'synthetic-proxy-secret-0123456789abcdef';
const PROVIDER_SECRET = 'synthetic-production-github-secret';

function unavailable(): never {
  throw new Error('The D1 stub must not be called');
}

function environment(staging: boolean): AuthEnvironment {
  return {
    DB: {
      batch: unavailable,
      dump: unavailable,
      exec: unavailable,
      prepare: unavailable,
      withSession: unavailable,
    },
    BETTER_AUTH_SECRET: staging
      ? 'synthetic-staging-session-secret-4567'
      : 'synthetic-production-session-secret-0123',
    DEPLOYMENT_STAGE: staging ? 'staging' : 'production',
    OAUTH_PROXY_SECRET: PROXY_SECRET,
    GITHUB_CLIENT_ID: 'same-synthetic-client',
    GITHUB_CLIENT_SECRET: staging ? '' : PROVIDER_SECRET,
    SVELTE_BFF_SECRET: 'synthetic-bff-secret',
    LICENSING_API: { fetch: async () => Response.json({}) },
  };
}

function instance(staging: boolean, env = environment(staging)) {
  const baseURL = staging ? STAGING : PRODUCTION;
  const db = {
    auth_user: [],
    auth_session: [],
    auth_account: [],
    auth_verification: [],
    auth_organization: [],
    auth_member: [],
    auth_invitation: [],
  };
  const configured = createShadowAuth(env, new URL(baseURL));
  const auth = betterAuth({ ...configured.options, database: memoryAdapter(db) });
  return { auth, db, baseURL };
}

function mockGitHub(rejectCode = false) {
  const fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input, init);
    if (request.url === 'https://github.com/login/oauth/access_token') {
      const body = new URLSearchParams(await request.text());
      expect(body.get('client_secret')).toBe(PROVIDER_SECRET);
      expect(body.get('redirect_uri')).toBe(`${PRODUCTION}/api/auth/callback/github`);
      return rejectCode
        ? Response.json({ error: 'bad_verification_code' }, { status: 400 })
        : Response.json({
            access_token: 'synthetic-token',
            token_type: 'bearer',
            scope: 'read:user,user:email',
          });
    }
    if (request.url === 'https://api.github.com/user') {
      return Response.json({
        id: 123,
        login: 'synthetic-user',
        name: 'Synthetic User',
        email: 'synthetic@example.test',
        avatar_url: null,
      });
    }
    if (request.url === 'https://api.github.com/user/emails') {
      return Response.json([{ email: 'synthetic@example.test', verified: true, primary: true }]);
    }
    throw new Error(`Unexpected network request: ${request.url}`);
  });
  vi.stubGlobal('fetch', fetch);
  return fetch;
}

function cookies(response: Response): string {
  return response.headers
    .getSetCookie()
    .map(value => value.split(';')[0])
    .join('; ');
}

async function begin(target: ReturnType<typeof instance>) {
  const response = await target.auth.handler(
    new Request(`${target.baseURL}/api/auth/sign-in/social`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: target.baseURL },
      body: JSON.stringify({ provider: 'github', callbackURL: `${target.baseURL}/dashboard/` }),
    })
  );
  expect(response.status).toBe(200);
  const body: { url: string } = await response.json();
  return { url: new URL(body.url), cookie: cookies(response) };
}

async function callback(
  prod: ReturnType<typeof instance>,
  start: Awaited<ReturnType<typeof begin>>
) {
  const url = new URL(`${PRODUCTION}/api/auth/callback/github`);
  url.searchParams.set('code', 'synthetic-code');
  url.searchParams.set('state', start.url.searchParams.get('state') ?? '');
  return prod.auth.handler(new Request(url, { headers: { cookie: start.cookie } }));
}

function expectNoAccounts(target: ReturnType<typeof instance>) {
  expect(target.db['auth_user']).toHaveLength(0);
  expect(target.db['auth_session']).toHaveLength(0);
  expect(target.db['auth_account']).toHaveLength(0);
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('OMG OAuth proxy boundary', () => {
  it('uses the production GitHub secret and creates only staging accounts and sessions', async () => {
    const fetch = mockGitHub();
    const prod = instance(false);
    const stage = instance(true);
    const start = await begin(stage);
    expect(start.url.searchParams.get('client_id')).toBe('same-synthetic-client');
    expect(start.url.searchParams.get('redirect_uri')).toBe(
      `${PRODUCTION}/api/auth/callback/github`
    );
    expect(fetch).not.toHaveBeenCalled();
    const broker = await callback(prod, start);
    expect(broker.status).toBe(302);
    expect(broker.headers.get('set-cookie')).toBeNull();
    expectNoAccounts(prod);
    const completion = new URL(broker.headers.get('location') ?? '');
    expect(completion.origin).toBe(STAGING);
    const result = await stage.auth.handler(
      new Request(completion, { headers: { cookie: start.cookie } })
    );
    expect(result.status).toBe(302);
    expect(result.headers.get('location')).toBe(`${STAGING}/dashboard/`);
    expect(stage.db['auth_user']).toHaveLength(1);
    expect(stage.db['auth_session']).toHaveLength(1);
    expect(stage.db['auth_account']).toHaveLength(1);
    expect(cookies(result)).toContain('session_token=');
    const sessionHeaders = new Headers({ cookie: cookies(result) });
    const stagingSession = await stage.auth.api.getSession({ headers: sessionHeaders });
    expect(stagingSession?.user.email).toBe('synthetic@example.test');
    expect(await prod.auth.api.getSession({ headers: sessionHeaders })).toBeNull();
    const replay = await stage.auth.handler(
      new Request(completion, { headers: { cookie: start.cookie } })
    );
    expect(replay.headers.get('location')).toContain('state_mismatch');
    expect(stage.db['auth_session']).toHaveLength(1);
    expectNoAccounts(prod);
  });

  it('does not register production profile endpoints over HTTP or the internal API', async () => {
    mockGitHub();
    const prod = instance(false);
    const broker = await callback(prod, await begin(instance(true)));
    const profile = new URL(broker.headers.get('location') ?? '').searchParams.get('profile') ?? '';
    expect('oAuthProxyCompletion' in prod.auth.api).toBe(false);
    expect('oAuthProxy' in prod.auth.api).toBe(false);
    for (const path of [
      '/callback/github/oauth-proxy',
      '/oauth-proxy-callback',
      '/callback/github/oauth-proxy/',
      '/callback/other/oauth-proxy',
    ]) {
      const url = new URL(`${PRODUCTION}/api/auth${path}`);
      url.searchParams.set('profile', profile);
      url.searchParams.set('callbackURL', `${PRODUCTION}/dashboard/`);
      expect((await prod.auth.handler(new Request(url))).status).toBe(404);
    }
    expectNoAccounts(prod);
  });

  it.each([true, false])(
    'preserves ordinary production sign-in with proxy enabled=%s',
    async enabled => {
      mockGitHub();
      const env = environment(false);
      if (!enabled) delete env.OAUTH_PROXY_SECRET;
      const prod = instance(false, env);
      const result = await callback(prod, await begin(prod));
      expect(result.status).toBe(302);
      expect(result.headers.get('location')).toBe(`${PRODUCTION}/dashboard/`);
      expect(prod.db['auth_user']).toHaveLength(1);
      expect(prod.db['auth_session']).toHaveLength(1);
    }
  );

  it('rejects an invalid GitHub code before returning a profile or writing accounts', async () => {
    mockGitHub(true);
    const prod = instance(false);
    const stage = instance(true);
    const result = await callback(prod, await begin(stage));
    expect(result.headers.get('location')).toContain('invalid_code');
    expect(result.headers.get('location')).not.toContain('profile=');
    expectNoAccounts(prod);
    expectNoAccounts(stage);
  });

  it.each(['tampered', 'expired'])(
    'rejects a %s profile without creating a staging session',
    async kind => {
      mockGitHub();
      const prod = instance(false);
      const stage = instance(true);
      const start = await begin(stage);
      const broker = await callback(prod, start);
      const completion = new URL(broker.headers.get('location') ?? '');
      if (kind === 'tampered') completion.searchParams.set('profile', 'invalid-encrypted-profile');
      else {
        const later = Date.now() + 31_000;
        vi.spyOn(Date, 'now').mockReturnValue(later);
      }
      const result = await stage.auth.handler(
        new Request(completion, { headers: { cookie: start.cookie } })
      );
      expect(result.headers.get('location')).toContain(
        kind === 'tampered' ? 'invalid_profile' : 'payload_expired'
      );
      expectNoAccounts(stage);
      expectNoAccounts(prod);
    }
  );

  it('fails closed for staging without the proxy credential or on another hostname', () => {
    const env = environment(true);
    expect(() => createShadowAuth(env, new URL(PRODUCTION))).toThrow();
    delete env.OAUTH_PROXY_SECRET;
    expect(() => createShadowAuth(env, new URL(STAGING))).toThrow();
  });
});
