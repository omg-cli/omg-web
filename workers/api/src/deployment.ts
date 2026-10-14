import { ACCOUNT_ORIGIN } from '../../../shared/public-site';
import type { Env } from './api';

/** Token issuers follow the configured environment, never the request host. */
export function deploymentApiOrigin(env: Pick<Env, 'DEPLOYMENT_STAGE'>): string {
  return env.DEPLOYMENT_STAGE === 'staging'
    ? 'https://staging-api.getomg.xyz'
    : 'https://omg-api.latham.cloud';
}

/** Return a configured origin, never a caller-controlled Host or Origin header. */
export function deploymentAccountOrigin(env: Pick<Env, 'DEPLOYMENT_STAGE'>): string {
  return env.DEPLOYMENT_STAGE === 'staging'
    ? `https://staging.${new URL(ACCOUNT_ORIGIN).hostname}`
    : ACCOUNT_ORIGIN;
}

export function billingIsEnabled(env: Pick<Env, 'BILLING_ENABLED'>): boolean {
  return env.BILLING_ENABLED !== 'false';
}

/** Disabled billing never reaches Stripe; enabled staging only accepts test credentials. */
export function deploymentIsReady(
  env: Pick<Env, 'DEPLOYMENT_STAGE' | 'STRIPE_SECRET_KEY' | 'BILLING_ENABLED'>
): boolean {
  if (
    env.BILLING_ENABLED !== undefined &&
    env.BILLING_ENABLED !== 'true' &&
    env.BILLING_ENABLED !== 'false'
  )
    return false;
  if (env.DEPLOYMENT_STAGE === undefined || env.DEPLOYMENT_STAGE === 'prod') return true;
  return (
    env.DEPLOYMENT_STAGE === 'staging' &&
    (!billingIsEnabled(env) || /^(?:sk|rk)_test_\S+$/u.test(env.STRIPE_SECRET_KEY ?? ''))
  );
}
