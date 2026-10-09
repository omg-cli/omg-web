import { error } from '@sveltejs/kit';
import { oAuthProxy } from 'better-auth/plugins/oauth-proxy';
import { ACCOUNT_ORIGIN } from '../../../../shared/public-site';
import type { WebsiteEnv } from '../../../alchemy.run';

type ProxyEnvironment = Partial<Pick<WebsiteEnv, 'DEPLOYMENT_STAGE' | 'OAUTH_PROXY_SECRET'>>;
const STAGING_ORIGIN = `https://staging.${new URL(ACCOUNT_ORIGIN).hostname}`;

export function oauthProxyConfiguration(env: ProxyEnvironment, requestUrl: URL) {
  const staging = env.DEPLOYMENT_STAGE === 'staging';
  const secret = env.OAUTH_PROXY_SECRET;
  if (staging && (requestUrl.origin !== STAGING_ORIGIN || !secret)) {
    error(503, 'Authentication service unavailable');
  }
  if (!secret) {
    return { plugins: [], trustedOrigins: [requestUrl.origin], callbackOrigin: requestUrl.origin };
  }
  const plugin = oAuthProxy({
    productionURL: ACCOUNT_ORIGIN,
    currentURL: staging ? STAGING_ORIGIN : ACCOUNT_ORIGIN,
    secret,
    maxAge: 30,
  });
  return {
    // Production exchanges GitHub codes but must never accept proxy profiles as sessions.
    // Remove endpoint registration itself, including the deprecated completion endpoint.
    plugins: [{ ...plugin, endpoints: staging ? plugin.endpoints : {} }],
    trustedOrigins: staging ? [STAGING_ORIGIN] : [requestUrl.origin, STAGING_ORIGIN],
    callbackOrigin: staging ? ACCOUNT_ORIGIN : requestUrl.origin,
  };
}
