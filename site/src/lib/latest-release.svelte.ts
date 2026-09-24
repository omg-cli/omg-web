import { Effect, Schema } from 'effect';

const Version = Schema.String.check(Schema.isPattern(/^v\d+\.\d+\.\d+$/u));

/** Read the site's R2-backed release marker after hydration. */
export class LatestReleaseView {
  #version = $state<string | null>(null);

  get version(): string | null {
    return this.#version;
  }

  load(): void {
    Effect.runFork(
      Effect.tryPromise({
        try: async () => {
          const response = await fetch('/api/latest-release');
          if (!response.ok) throw new Error('Release marker unavailable');
          return response.text();
        },
        catch: cause => cause,
      }).pipe(
        Effect.flatMap(value => Schema.decodeUnknownEffect(Version)(value)),
        Effect.match({
          onFailure: () => {
            this.#version = null;
          },
          onSuccess: version => {
            this.#version = version;
          },
        })
      )
    );
  }
}
