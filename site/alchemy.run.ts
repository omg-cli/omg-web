import * as Alchemy from 'alchemy';
import * as Cloudflare from 'alchemy/Cloudflare';
import * as Config from 'effect/Config';
import * as Effect from 'effect/Effect';
import * as Redacted from 'effect/Redacted';

export const ShadowAuthSecret = Alchemy.Random('ShadowAuthSecret');

const PLATFORM_DATABASE_ID = 'fee8ddab-fb4a-4be4-b8d2-8abb7c2db188';
const STAGING_DATABASE_ID = '0f059202-7042-4588-a89f-ce0ae3f6deba';
const SITE_HOSTNAME = 'getomg.dev';
const WWW_SITE_HOSTNAME = 'www.getomg.dev';

export const Website = Cloudflare.Website.SvelteKit(
  'Website',
  Effect.gen(function* () {
    const stage = yield* Alchemy.Stage;
    const authSecret = yield* ShadowAuthSecret;

    return {
      adapter: {
        fallback: 'plaintext' as const,
        notFoundHandling: '404-page' as const,
      },
      assets: {
        runWorkerFirst: true,
      },
      cache: {
        enabled: false,
      },
      domain:
        stage === 'prod'
          ? {
              name: SITE_HOSTNAME,
              // Preserve account sessions and the existing OAuth callback during migration.
              aliases: ['getomg.xyz', 'www.getomg.xyz'],
              redirects: [WWW_SITE_HOSTNAME],
            }
          : { name: 'staging.getomg.xyz' },
      env: {
        CF_VERSION_METADATA: Cloudflare.Workers.VersionMetadata(),
        AUTH_RATE_LIMITER: Cloudflare.RateLimit('AUTH_RATE_LIMITER', {
          namespaceId: stage === 'prod' ? 2001 : 4001,
          simple: { limit: 10, period: 60 },
        }),
        ADMIN_LIVE_RATE_LIMITER: Cloudflare.RateLimit('ADMIN_LIVE_RATE_LIMITER', {
          namespaceId: stage === 'prod' ? 2002 : 4002,
          simple: { limit: 30, period: 60 },
        }),
        BETTER_AUTH_SECRET: authSecret.text,
        DEPLOYMENT_STAGE: stage === 'prod' ? 'production' : 'staging',
        GITHUB_CLIENT_ID: Config.String('GITHUB_CLIENT_ID'),
        GITHUB_CLIENT_SECRET:
          stage === 'prod'
            ? Config.Redacted('GITHUB_CLIENT_SECRET')
            : Config.succeed(Redacted.make('')),
        OAUTH_PROXY_SECRET: Config.Redacted('OAUTH_PROXY_SECRET').pipe(
          Config.withDefault(Redacted.make(''))
        ),
        SVELTE_BFF_SECRET: Config.Redacted('SVELTE_BFF_SECRET'),
      },
      memo: {
        include: [
          'src/**',
          'static/**',
          '../shared/**',
          'alchemy.run.ts',
          'package-lock.json',
          'package.json',
          'tsconfig.json',
          'vite.config.ts',
        ],
      },
      observability: {
        enabled: true,
        issues: { enabled: stage === 'prod' },
        redactQueryString: true,
        logs: {
          enabled: true,
          headSamplingRate: 1,
          invocationLogs: true,
          persist: true,
        },
        traces: {
          enabled: true,
          headSamplingRate: 0.01,
          persist: true,
        },
      },
      workersDev: false,
    };
  })
);

interface LicensingApiBinding {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}

export type WebsiteEnv = Cloudflare.InferEnv<typeof Website> & {
  readonly DB: Cloudflare.GetBindingType<Cloudflare.D1.Database>;
  readonly LICENSING_API: LicensingApiBinding;
};

export default Alchemy.Stack(
  'OmgSvelteSite',
  {
    providers: Cloudflare.providers(),
    state: Cloudflare.state(),
  },
  Effect.gen(function* () {
    const stage = yield* Alchemy.Stage;
    const site = yield* Website;
    yield* site.bind('DB', {
      bindings: [
        {
          type: 'd1',
          name: 'DB',
          databaseId: stage === 'prod' ? PLATFORM_DATABASE_ID : STAGING_DATABASE_ID,
        },
      ],
    });
    yield* site.bind('LICENSING_API', {
      bindings: [
        {
          type: 'service',
          name: 'LICENSING_API',
          service: stage === 'prod' ? 'omg-saas' : 'omg-saas-staging',
        },
      ],
    });
    return { url: site.url };
  })
);
