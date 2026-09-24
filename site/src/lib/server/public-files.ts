import { SITE_ORIGIN } from '../../../../shared/public-site';
import { applySecurityHeaders } from '../../../../shared/security-headers';
import { DOCS_TOPICS, docsTopicHref } from '../docs/topics';
import { LEARNING_PAGES, learningHref } from '../learn/catalog';
import { RELEASE_NOTES } from '../release-notes';

const SHADOW_ROBOTS_POLICY = 'noindex, nofollow';
/**
 * Public HTML keeps a client side revalidation rule while allowing a shared cache
 * to answer crawlers and repeat visitors from the edge: ten minutes of freshness,
 * then a day of stale-while-revalidate. Private and non-HTML surfaces opt out.
 */
const PUBLIC_HTML_CACHE_POLICY =
  'public, max-age=0, must-revalidate, s-maxage=600, stale-while-revalidate=86400';
const NON_CACHEABLE_PATH = /^\/(?:api|admin|dashboard|login|signup|markdown|health)(?:\/|$)/u;

const STATIC_PAGE_PATHS = [
  '/',
  '/docs/',
  '/updates/',
  '/security/',
  '/privacy/',
  '/terms/',
  '/runtimes/',
  '/guides/',
  '/compare/',
] as const;
const DOCS_REVIEWED_AT = DOCS_TOPICS.reduce(
  (latest, topic) => (topic.source.reviewedAt > latest ? topic.source.reviewedAt : latest),
  DOCS_TOPICS[0].source.reviewedAt
);
/** The newest published release date, used as the release index's lastmod. */
const LATEST_RELEASE_AT = RELEASE_NOTES.at(0)?.date;

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function sitemapEntry(path: string, modified?: string): string {
  return `  <url>
    <loc>${escapeXml(`${SITE_ORIGIN}${path}`)}</loc>${modified ? `\n    <lastmod>${escapeXml(modified)}</lastmod>` : ''}
  </url>`;
}

function appendVary(headers: Headers, value: string): void {
  const current = headers.get('Vary');
  const values = current?.split(',').map(item => item.trim().toLowerCase()) ?? [];
  if (!values.includes(value.toLowerCase())) {
    headers.set('Vary', current ? `${current}, ${value}` : value);
  }
}

export function withSiteHeaders(response: Response, deploymentStage: string | undefined): Response {
  const headers = new Headers(response.headers);
  const renderedContentSecurityPolicy = headers.get('Content-Security-Policy');
  applySecurityHeaders(headers);
  if (renderedContentSecurityPolicy !== null) {
    headers.set('Content-Security-Policy', renderedContentSecurityPolicy);
  }
  appendVary(headers, 'Accept-Encoding');
  const contentType = headers.get('Content-Type') ?? '';
  const isXmlSitemap = contentType.includes('application/xml');
  if (deploymentStage !== 'prod' && !isXmlSitemap) {
    headers.set('X-Robots-Tag', SHADOW_ROBOTS_POLICY);
  }

  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  });
}

/**
 * Apply a bounded edge cache policy to successful public HTML responses.
 *
 * Client caches still revalidate (`max-age=0, must-revalidate`), so a visitor
 * always receives a checked copy, while a shared cache may serve the rendered
 * page for up to ten minutes and keep serving stale copies for a day while it
 * revalidates. Private surfaces, mutations, non-HTML responses, and shadow
 * endpoints are never touched, so an authenticated or API response cannot be
 * cached by this rule.
 */
export function withPublicHtmlCache(
  response: Response,
  method: string,
  pathname: string
): Response {
  const isRead = method === 'GET' || method === 'HEAD';
  const isSuccessful = response.status >= 200 && response.status < 300;
  const isHtml = (response.headers.get('content-type') ?? '').includes('text/html');
  if (!isRead || !isSuccessful || !isHtml || NON_CACHEABLE_PATH.test(pathname)) {
    return response;
  }

  const headers = new Headers(response.headers);
  headers.set('Cache-Control', PUBLIC_HTML_CACHE_POLICY);
  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  });
}

export function robotsResponse(): Response {
  const body = `# OMG Package Manager - robots.txt
# ${SITE_ORIGIN}
# Content signals follow the Cloudflare robots.txt convention: search access is
# allowed while model training on this documentation is not.

User-agent: *
Content-Signal: search=yes, ai-train=no
Disallow: /api/
Disallow: /dashboard/
Disallow: /admin/

Sitemap: ${SITE_ORIGIN}/sitemap.xml
`;

  return new Response(body, {
    headers: {
      'Cache-Control': 'public, max-age=86400, s-maxage=604800',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}

export function sitemapResponse(): Response {
  const entries = [
    ...STATIC_PAGE_PATHS.map(path =>
      sitemapEntry(
        path,
        path === '/docs/' ? DOCS_REVIEWED_AT : path === '/updates/' ? LATEST_RELEASE_AT : undefined
      )
    ),
    ...DOCS_TOPICS.map(topic => sitemapEntry(docsTopicHref(topic.slug), topic.source.reviewedAt)),
    ...LEARNING_PAGES.map(page => sitemapEntry(learningHref(page), page.modified)),
  ].join('\n');
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`;

  // No X-Robots-Tag here: the sitemap is a discovery file, and a noindex header
  // on it was an untested variable in the Search Console fetch failure.
  return new Response(body, {
    headers: {
      'Cache-Control': 'public, max-age=0, must-revalidate, s-maxage=300',
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}

export function healthResponse(): Response {
  return Response.json(
    {
      runtime: 'sveltekit-alchemy',
      status: 'ok',
    },
    {
      headers: {
        'Cache-Control': 'no-store',
        // A JSON health probe has no search value; keep it out of indexes without
        // blocking the crawler that already requested it.
        'X-Robots-Tag': 'noindex',
      },
    }
  );
}
