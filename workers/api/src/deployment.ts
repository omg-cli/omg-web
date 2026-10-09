import { ACCOUNT_ORIGIN } from '../../../shared/public-site';
import type { Env } from './api';

/** Return a configured origin, never a caller-controlled Host or Origin header. */
export function deploymentAccountOrigin(env: Pick<Env, 'DEPLOYMENT_STAGE'>): string {
  return env.DEPLOYMENT_STAGE === 'staging'
    ? `https://staging.${new URL(ACCOUNT_ORIGIN).hostname}`
    : ACCOUNT_ORIGIN;
}

/** A staging Worker must never make requests with a live Stripe credential. */
export function deploymentIsReady(
  env: Pick<Env, 'DEPLOYMENT_STAGE' | 'STRIPE_SECRET_KEY'>
): boolean {
  if (env.DEPLOYMENT_STAGE === undefined || env.DEPLOYMENT_STAGE === 'prod') return true;
  return (
    env.DEPLOYMENT_STAGE === 'staging' && /^(?:sk|rk)_test_\S+$/u.test(env.STRIPE_SECRET_KEY ?? '')
  );
}
