import type { WebsiteEnv } from '../alchemy.run';

declare global {
  namespace App {
    interface PageData {
      documentationNavigation?: readonly {
        readonly href: string;
        readonly label: string;
        readonly title: string;
        readonly section: string;
      }[];
    }
    interface Platform {
      env: WebsiteEnv;
      ctx?: { waitUntil(task: Promise<unknown>): void };
      caches?: Pick<CacheStorage, 'open'>;
    }
  }
}
