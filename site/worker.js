import generatedWorker from './.svelte-kit/cloudflare/_worker.js';
import { websiteFetch } from './src/lib/server/website-response.ts';

export default {
  fetch(request, env, context) {
    return websiteFetch(
      request,
      cacheableRequest => generatedWorker.fetch(cacheableRequest, env, context),
      env.DEPLOYMENT_STAGE
    );
  },
};
