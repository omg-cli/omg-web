import generatedWorker from './.svelte-kit/cloudflare/_worker.js';
import { headSafeFetch } from './src/lib/server/head-safe-fetch.ts';

export default {
  fetch(request, env, context) {
    return headSafeFetch(request, cacheableRequest =>
      generatedWorker.fetch(cacheableRequest, env, context)
    );
  },
};
