import '../src/cloudflare-test.d.ts';
import { env } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';
import { fetchWorker } from './test-utils';

describe('staging deployment boundary', () => {
  it.each(['sk_live_example', 'rk_live_example', '', 'sk_test_'])(
    'rejects unsafe Stripe configuration before database work: %s',
    async key => {
      let databaseAccessed = false;
      const response = await fetchWorker(
        new Request('https://staging-api.getomg.xyz/api/install-ping', { method: 'POST' }),
        {
          ...env,
          DEPLOYMENT_STAGE: 'staging',
          STRIPE_SECRET_KEY: key,
          get DB() {
            databaseAccessed = true;
            throw new Error('Database must not be reached');
          },
        }
      );
      expect(response.status).toBe(503);
      expect(databaseAccessed).toBe(false);
      expect(response.headers.get('Cache-Control')).toContain('no-store');
    }
  );

  it.each(['sk_test_example', 'rk_test_example'])(
    'serves staging health and preflight only with a test key: %s',
    async key => {
      for (const method of ['GET', 'OPTIONS']) {
        const response = await fetchWorker(
          new Request('https://staging-api.getomg.xyz/health', {
            method,
            headers: { Origin: 'https://attacker.example' },
          }),
          { ...env, DEPLOYMENT_STAGE: 'staging', STRIPE_SECRET_KEY: key }
        );
        expect(response.status).toBe(200);
        expect(response.headers.get('Access-Control-Allow-Origin')).toBe(
          'https://staging.getomg.xyz'
        );
      }
    }
  );

  it('fails closed for an unrecognized deployment stage', async () => {
    const response = await fetchWorker(new Request('https://example.test/health'), {
      ...env,
      DEPLOYMENT_STAGE: 'stagign',
      STRIPE_SECRET_KEY: 'sk_test_example',
    });
    expect(response.status).toBe(503);
  });

  it('preserves production behavior without a new environment variable', async () => {
    const response = await fetchWorker(new Request('https://omg-api.latham.cloud/health'), env);
    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://getomg.xyz');
  });
});
