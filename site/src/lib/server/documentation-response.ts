import review from '../docs/source-review.json';
import { LEARNING_PAGES, learningHref } from '../learn/catalog';

const documents = new Set([
  '/docs/',
  ...review.topics.map(topic => `/docs/${topic.slug}/`),
  ...review.guides.map(guide => guide.href),
  ...LEARNING_PAGES.map(learningHref),
]);

// Wildcards alone select HTML, including the default Accept sent by curl.
function prefersMarkdown(accept: string): boolean {
  const quality = new Map<string, number>();
  for (const item of accept.toLowerCase().split(',')) {
    const [type, ...parameters] = item.trim().split(/\s*;\s*/u);
    if (!type || !['text/markdown', 'text/html', 'text/*', '*/*'].includes(type)) continue;
    const weight = parameters.find(parameter => parameter.startsWith('q='));
    const q = weight === undefined ? 1 : Number(weight.slice(2));
    if (Number.isFinite(q) && q >= 0 && q <= 1)
      quality.set(type, Math.max(quality.get(type) ?? 0, q));
  }
  const markdown = quality.get('text/markdown') ?? 0;
  const html = quality.get('text/html') ?? quality.get('text/*') ?? quality.get('*/*') ?? 0;
  return markdown > 0 && (markdown > html || (markdown === html && !quality.has('text/html')));
}

/** Select the representation before the adapter consults its URL-keyed cache. */
export async function documentationResponse(
  request: Request,
  original: () => Promise<Response>,
  readExport: (request: Request) => Promise<Response>
): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'HEAD') return original();
  const url = new URL(request.url);
  const alias = /\.md\/?$/u.test(url.pathname);
  const raw = url.pathname.startsWith('/markdown/');
  const path = raw
    ? url.pathname.slice('/markdown'.length)
    : alias
      ? url.pathname.replace(/(?:\/index)?\.md\/?$/u, '/')
      : url.pathname;
  if (!documents.has(path) || (raw && path === '/docs/')) return original();
  const exportUrl = new URL(path === '/docs/' ? '/llms.txt' : `/markdown${path}`, url);
  const section = path === '/docs/' ? null : url.searchParams.get('section');
  if (section !== null) exportUrl.searchParams.set('section', section);
  else if (path !== '/docs/' && url.searchParams.has('sections'))
    exportUrl.searchParams.set('sections', '');
  const alternate = path === '/docs/' ? '/docs/index.md' : exportUrl.pathname + exportUrl.search;
  const negotiated = !raw && !alias && prefersMarkdown(request.headers.get('Accept') ?? '');
  const response =
    alias || negotiated
      ? await readExport(new Request(exportUrl, { method: request.method }))
      : await original();
  const headers = new Headers(response.headers);
  if (!raw && !alias) {
    headers.append('Vary', 'Accept');
    // Cloudflare does not generally key its shared HTTP cache on Vary: Accept.
    headers.set('Cloudflare-CDN-Cache-Control', 'no-store');
    if (negotiated) headers.set('Cache-Control', 'private, no-store');
  }
  if (!response.ok) {
    if (response.status >= 400) headers.set('Cache-Control', 'private, no-store');
    return new Response(request.method === 'HEAD' ? null : response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }
  const indexLink = '</llms.txt>; rel="describedby"; type="text/plain"';
  if (!headers.get('Link')?.includes(indexLink)) headers.append('Link', indexLink);
  if (raw || alias || negotiated) {
    const canonical = section === null ? path : `${path}#${encodeURIComponent(section)}`;
    const canonicalLink = `<${canonical}>; rel="canonical"`;
    if (!headers.get('Link')?.includes(canonicalLink)) headers.append('Link', canonicalLink);
    headers.set('Content-Location', alternate);
    if (path === '/docs/') headers.set('Content-Type', 'text/markdown; charset=utf-8');
  } else {
    headers.append('Link', `<${alternate}>; rel="alternate"; type="text/markdown"`);
  }
  return new Response(request.method === 'HEAD' ? null : response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
