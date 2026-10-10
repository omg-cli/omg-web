import '../src/cloudflare-test.d.ts';
import { env } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';
import { fetchWorker } from './test-utils';

describe('staging deployment boundary', () => {
  it('serves versioned staging health without Stripe when billing is explicitly disabled', async () => {
    const version = {
      id: 'disabled-version',
      tag: 'disabled-source',
      timestamp: '2026-10-09T20:00:00Z',
    };
    const environment = {
      ...env,
      DEPLOYMENT_STAGE: 'staging',
      BILLING_ENABLED: 'false',
      CF_VERSION_METADATA: version,
    };
    Reflect.deleteProperty(environment, 'STRIPE_SECRET_KEY');
    const response = await fetchWorker(
      new Request('https://staging-api.getomg.xyz/health'),
      environment
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      status: 'ok',
      version,
      features: { billing: 'disabled' },
    });
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://staging.getomg.xyz');
    expect(response.headers.get('Cache-Control')).toContain('no-store');
  });

  it.each([
    ['POST', '/api/billing/checkout'],
    ['GET', '/api/billing/checkout-session'],
    ['POST', '/api/billing/portal'],
    ['POST', '/api/stripe/webhook'],
    ['POST', '/api/admin/stripe/sync'],
    ['GET', '/api/admin/stripe/metrics'],
    ['POST', '/api/internal/marketing-offer'],
  ])(
    'disabled billing denies %s %s before any provider or database access',
    async (method, path) => {
      const response = await fetchWorker(
        new Request(`https://staging-api.getomg.xyz${path}`, { method }),
        {
          ...env,
          DEPLOYMENT_STAGE: 'staging',
          BILLING_ENABLED: 'false',
          get STRIPE_SECRET_KEY() {
            throw new Error('Stripe must not be reached');
          },
          get DB() {
            throw new Error('Database must not be reached');
          },
        }
      );
      expect(response.status).toBe(404);
      expect(await response.json()).toMatchObject({ error: 'Billing is not enabled' });
      expect(response.headers.get('Cache-Control')).toContain('no-store');
    }
  );

  it.each(['', 'False', 'yes'])('rejects invalid billing flags: %s', async flag => {
    const response = await fetchWorker(new Request('https://staging-api.getomg.xyz/health'), {
      ...env,
      DEPLOYMENT_STAGE: 'staging',
      BILLING_ENABLED: flag,
      STRIPE_SECRET_KEY: 'sk_test_example',
    });
    expect(response.status).toBe(503);
  });

  it('serves database-backed install totals with billing disabled and no Stripe key', async () => {
    const environment = { ...env, DEPLOYMENT_STAGE: 'staging', BILLING_ENABLED: 'false' };
    Reflect.deleteProperty(environment, 'STRIPE_SECRET_KEY');
    const response = await fetchWorker(
      new Request('https://staging-api.getomg.xyz/api/badge/installs'),
      environment
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      schemaVersion: 1,
      label: 'installs',
      message: '0',
    });
  });

  it('keeps the legacy staging default closed without a Stripe test key', async () => {
    const response = await fetchWorker(new Request('https://staging-api.getomg.xyz/health'), {
      ...env,
      DEPLOYMENT_STAGE: 'staging',
      STRIPE_SECRET_KEY: '',
    });
    expect(response.status).toBe(503);
  });

  it('reports the real deployment identity in uncached health responses', async () => {
    const version = {
      id: 'worker-version-id',
      tag: '72afa59d5b329c58802bedd0ee369a4b026cdf23',
      timestamp: '2026-10-09T16:00:00Z',
    };
    const response = await fetchWorker(new Request('https://example.test/health'), {
      ...env,
      CF_VERSION_METADATA: version,
    });
    expect(await response.text()).toContain(JSON.stringify(version));
    expect(response.headers.get('Cache-Control')).toContain('no-store');
  });

  it.each(['sk_live_example', 'rk_live_example', '', 'sk_test_'])(
    'rejects unsafe Stripe configuration before database work: %s',
    async key => {
      let databaseAccessed = false;
      const response = await fetchWorker(
        new Request('https://staging-api.getomg.xyz/api/install-ping', { method: 'POST' }),
        {
          ...env,
          DEPLOYMENT_STAGE: 'staging',
          BILLING_ENABLED: 'true',
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
      BILLING_ENABLED: 'false',
      STRIPE_SECRET_KEY: 'sk_test_example',
    });
    expect(response.status).toBe(503);
  });

  it('preserves production behavior without a new environment variable', async () => {
    const response = await fetchWorker(new Request('https://omg-api.latham.cloud/health'), env);
    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://getomg.xyz');
    expect(await response.text()).toContain('"version":null');
  });
});
