import '../src/cloudflare-test.d.ts';
import { env } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';
import { fetchWorker } from './test-utils';

const SECRET = 'private-rate-limit-test-secret';

function request(path: string, userId: string, secret = SECRET): Request {
  return new Request(`http://localhost/api/internal/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Call': 'service-binding',
      'X-Admin-Secret': secret,
    },
    body: JSON.stringify({ organizationId: 'organization', userId, filter: 'all', page: 1 }),
  });
}

describe.each([
  ['organization-usage', 'internal_organization_usage'],
  ['organization-audit', 'internal_organization_audit'],
])('private %s rate limiting', (path, scope) => {
  it('isolates schema-validated actors before tenant lookup', async () => {
    const keys: string[] = [];
    const environment = {
      ...env,
      SVELTE_BFF_SECRET: SECRET,
      API_RATE_LIMITER: {
        limit: async ({ key }: RateLimitOptions) => {
          keys.push(key);
          return { success: true };
        },
      },
    };
    for (const user of ['actor-a', 'actor-b', 'actor-a']) {
      const response = await fetchWorker(request(path, user), environment);
      expect(response.status).toBe(404);
      expect(await response.json()).toEqual({ error: 'Organization not found' });
    }
    expect(keys).toHaveLength(3);
    expect(keys[0]).not.toBe(keys[1]);
    expect(keys[2]).toBe(keys[0]);
    expect(keys.every(key => key.startsWith(`${scope}:principal:`))).toBe(true);
    expect(keys.join()).not.toContain('actor-');
  });

  it('rejects an invalid secret using only the public IP budget', async () => {
    const keys: string[] = [];
    const response = await fetchWorker(request(path, 'forged-actor', 'wrong-secret'), {
      ...env,
      SVELTE_BFF_SECRET: SECRET,
      API_RATE_LIMITER: {
        limit: async ({ key }: RateLimitOptions) => {
          keys.push(key);
          return { success: true };
        },
      },
    });
    expect(response.status).toBe(404);
    expect(keys).toEqual([`${scope}:unknown`]);
  });

  it('rejects invalid trusted bodies without a principal budget', async () => {
    const keys: string[] = [];
    const response = await fetchWorker(request(path, ''), {
      ...env,
      SVELTE_BFF_SECRET: SECRET,
      API_RATE_LIMITER: {
        limit: async ({ key }: RateLimitOptions) => {
          keys.push(key);
          return { success: true };
        },
      },
    });
    expect(response.status).toBe(400);
    expect(keys).toEqual([]);
  });

  it.each(['missing', 'failed', 'exhausted'])('fails closed when %s', async state => {
    const limiter =
      state === 'missing'
        ? undefined
        : {
            limit: async () => {
              if (state === 'failed') throw new Error('rate limiter unavailable');
              return { success: false };
            },
          };
    const response = await fetchWorker(request(path, 'actor'), {
      ...env,
      SVELTE_BFF_SECRET: SECRET,
      API_RATE_LIMITER: limiter,
    });
    expect(response.status).toBe(state === 'exhausted' ? 429 : 503);
    if (state === 'exhausted') expect(response.headers.get('Retry-After')).toBe('60');
  });
});
