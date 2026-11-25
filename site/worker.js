import generatedWorker from './.svelte-kit/cloudflare/_worker.js';
import { createPgD1 } from './src/lib/server/pg-d1.ts';
import { websiteFetch } from './src/lib/server/website-response.ts';

export default {
  async fetch(request, env, context) {
    if (env.DB_BACKEND === 'postgres' && env.HYPERDRIVE) {
      const pg = createPgD1(env.HYPERDRIVE.connectionString, {
        application: 'omg-site',
        route: new URL(request.url).pathname.slice(0, 64),
      });
      try {
        return await websiteFetch(
          request,
          cacheableRequest =>
            generatedWorker.fetch(cacheableRequest, { ...env, DB: pg.db }, context),
          env.DEPLOYMENT_STAGE
        );
      } finally {
        context.waitUntil(pg.close());
      }
    }
    return websiteFetch(
      request,
      cacheableRequest => generatedWorker.fetch(cacheableRequest, env, context),
      env.DEPLOYMENT_STAGE
    );
  },
};
