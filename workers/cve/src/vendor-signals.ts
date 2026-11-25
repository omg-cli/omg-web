import { Schema } from 'effect';
import { cveId } from './advisories.ts';
import { readLimitedText } from './sources.ts';

export const chromeProvider = 'Chrome Releases';
export const chromeSite = 'https://chromereleases.googleblog.com/';
const chromeFeed = new URL(
  'feeds/posts/default/-/Desktop%20Update/Stable%20updates?alt=json&max-results=15',
  chromeSite
);
const leaf = Schema.Struct({ $t: Schema.String });
const feed = Schema.Struct({
  feed: Schema.Struct({
    entry: Schema.Array(
      Schema.Struct({
        title: leaf,
        published: leaf,
        updated: leaf,
        content: leaf,
        link: Schema.Array(Schema.Struct({ rel: Schema.String, href: Schema.String })),
      })
    ),
  }),
});

export const vendorSignal = Schema.Struct({
  provider: Schema.String,
  advisoryUrl: Schema.String.pipe(Schema.startsWith('https://')),
  published: Schema.String,
  received: Schema.String,
  exploitationReceived: Schema.optional(Schema.NullOr(Schema.String)),
  exploitedSince: Schema.optional(Schema.NullOr(Schema.String)),
  exploited: Schema.Boolean,
});

export const publisherExploitation = Schema.Struct({
  id: Schema.String.pipe(Schema.pattern(cveId)),
  advisoryUrl: Schema.String.pipe(Schema.startsWith('https://')),
  published: Schema.String,
  archived: Schema.Boolean,
  exploitedSince: Schema.optional(Schema.NullOr(Schema.String)),
});

export const vendorFeedStatus = Schema.Struct({
  checkedAt: Schema.String,
  complete: Schema.Boolean,
  lastNewSignal: Schema.NullOr(Schema.String),
  signals: Schema.Number,
  knownExploited: Schema.Number,
  recentExploitation: Schema.optional(Schema.Array(publisherExploitation)),
});

export const publisherFeedStatus = Schema.Struct({
  ...vendorFeedStatus.fields,
  provider: Schema.String,
});

export type VendorSignal = typeof vendorSignal.Type;

interface ChromeSignal {
  cve_id: string;
  advisory_url: string;
  published: string;
  modified: string;
  exploited: boolean;
}

const publicationTitle = /^(?:Stable Channel Update|Extended Stable Update) for Desktop\b/iu;
const cveMention = /\bCVE-\d{4}-\d{4,19}\b/gu;
const exploitationStatement =
  /\bGoogle is aware (?:that|of reports that)\b[^.?!]{0,420}\bexploit(?:s|ation)?\b[^.?!]{0,380}\b(?:exists?|has been exploited|have been exploited|is being exploited) in the wild\b/giu;

function isoTime(value: string) {
  const date = Date.parse(value);
  if (!Number.isFinite(date)) throw new Error('Malformed Chrome advisory date');
  return new Date(date).toISOString();
}

function textFromHtml(html: string) {
  return html
    .replace(/<(?:br\b[^>]*|\/(?:div|p))>/giu, ' ')
    .replace(/<[^>]+>/gu, '')
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&#160;', ' ')
    .replace(/\s+/gu, ' ');
}

export function parseChrome(input: Schema.Schema.Type<typeof feed>): ChromeSignal[] {
  const {
    feed: { entry },
  } = Schema.decodeUnknownSync(feed)(input);
  const results: ChromeSignal[] = [];
  for (const advisory of entry) {
    if (!publicationTitle.test(advisory.title.$t)) continue;
    const source = advisory.link.find(link => link.rel === 'alternate');
    if (!source) continue;
    const url = new URL(source.href);
    if (
      url.origin !== new URL(chromeSite).origin ||
      !/^\/\d{4}\/\d{2}\/[a-z0-9_-]+\.html$/iu.test(url.pathname)
    )
      continue;
    const published = isoTime(advisory.published.$t);
    const modified = isoTime(advisory.updated.$t);
    const text = textFromHtml(advisory.content.$t);
    const mentions = new Set(text.match(cveMention) ?? []);
    const exploited = new Set(
      Array.from(
        text.matchAll(exploitationStatement),
        match => match[0].match(cveMention) ?? []
      ).flat()
    );
    for (const id of mentions) {
      if (cveId.test(id))
        results.push({
          cve_id: id,
          advisory_url: url.origin + url.pathname,
          published,
          modified,
          exploited: exploited.has(id),
        });
      if (results.length > 5000) throw new Error('Chrome advisory count exceeded');
    }
  }
  return results;
}

export async function fetchChrome(etag: string | null) {
  const headers = new Headers({ Accept: 'application/json' });
  if (etag) headers.set('If-None-Match', etag);
  const response = await fetch(chromeFeed, {
    headers,
    redirect: 'manual',
    signal: AbortSignal.timeout(8_000),
  });
  if (response.status === 304) return { etag, records: null };
  if (!response.ok || !response.headers.get('Content-Type')?.includes('json')) {
    throw new Error('Chrome advisory source unavailable');
  }
  const raw = await readLimitedText(response, 4 * 1024 * 1024);
  return { etag: response.headers.get('ETag'), records: parseChrome(JSON.parse(raw)) };
}
