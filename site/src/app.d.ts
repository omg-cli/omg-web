import type { WebsiteEnv } from '../alchemy.run';

declare global {
  namespace App {
    interface Platform {
      env: WebsiteEnv;
      ctx?: { waitUntil(task: Promise<unknown>): void };
      caches?: Pick<CacheStorage, 'open'>;
    }
  }
}
