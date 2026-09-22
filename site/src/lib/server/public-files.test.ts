import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { DOCS_TOPICS } from '../docs/topics';
import { LEARNING_PAGES } from '../learn/catalog';
import {
  healthResponse,
  robotsResponse,
  sitemapResponse,
  withPublicHtmlCache,
  withSiteHeaders,
} from './public-files';

/** A successful public HTML response, the shape the cache policy inspects. */
const htmlResponse = () =>
  new Response('page', { headers: { 'content-type': 'text/html; charset=utf-8' } });

const EDGE_CACHE_POLICY =
  'public, max-age=0, must-revalidate, s-maxage=600, stale-while-revalidate=86400';

describe('public file endpoints', () => {
  it.each([
    ['install.sh', '334d1e2e9cc43300ba3036752fc90c43e83778c6a22a738c04000305e7aaa069'],
    ['install.ps1', '842141cc4cc23318b24437d363bb696e69194c1fbf719f677c007f616b3b13e7'],
    [
      '.well-known/omg-license-ed25519-v1.pem',
      '8bf0749afe4761500cb47a370cef66f1ab4c88415a1298c4481ead53ac4bc13c',
    ],
    ['logo-globe.png', 'f7354655b916e7c6449f34900849e74d330b7be2f3f7cb39710252853616836c'],
  ])('retains the reviewed public artifact %s', async (path, expectedHash) => {
    const bytes = await readFile(new URL(`../../../static/${path}`, import.meta.url));
    expect(createHash('sha256').update(bytes).digest('hex')).toBe(expectedHash);
  });

  it.each([
    ['icon-192.png', 192],
    ['icon-512.png', 512],
  ])('publishes a square %s application icon', async (fileName, expectedSize) => {
    const bytes = await readFile(new URL(`../../../static/icons/${fileName}`, import.meta.url));

    expect(bytes.subarray(1, 4).toString('ascii')).toBe('PNG');
    expect(bytes.readUInt32BE(16)).toBe(expectedSize);
    expect(bytes.readUInt32BE(20)).toBe(expectedSize);
  });

  it('preserves the production robots policy', async () => {
    const response = robotsResponse();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('text/plain; charset=utf-8');
    expect(response.headers.get('cache-control')).toBe('public, max-age=86400, s-maxage=604800');
    await expect(response.text()).resolves.toBe(`# OMG Package Manager - robots.txt
# https://getomg.xyz
# Content signals follow the Cloudflare robots.txt convention: search access is
# allowed while model training on this documentation is not.

User-agent: *
Content-Signal: search=yes, ai-train=no
Disallow: /api/
Disallow: /dashboard/
Disallow: /admin/

Sitemap: https://getomg.xyz/sitemap.xml
`);
  });

  it('publishes the canonical public pages and every curated docs topic', async () => {
    const response = sitemapResponse();
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/xml; charset=utf-8');
    // A sitemap is a discovery file; a noindex header on it must not come back.
    expect(response.headers.has('x-robots-tag')).toBe(false);
    expect(body.match(/<url>/g)).toHaveLength(9 + DOCS_TOPICS.length + LEARNING_PAGES.length);
    expect(body).toContain('<loc>https://getomg.xyz/security/</loc>');
    expect(body).toContain('<loc>https://getomg.xyz/</loc>');
    expect(body).toContain('<loc>https://getomg.xyz/docs/</loc>');
    expect(body).toContain('<loc>https://getomg.xyz/privacy/</loc>');
    expect(body).toContain('<loc>https://getomg.xyz/terms/</loc>');
    for (const topic of DOCS_TOPICS) {
      expect(body).toContain(`<loc>https://getomg.xyz/docs/${topic.slug}/</loc>`);
    }
    expect(body.match(/<lastmod>/g)).toHaveLength(LEARNING_PAGES.length + DOCS_TOPICS.length + 2);
    expect(body).toContain('<lastmod>2026-09-21</lastmod>');
    expect(body).not.toContain('<changefreq>');
    expect(body).not.toContain('<priority>');
  });

  it('reports health without a fabricated timestamp', async () => {
    const response = healthResponse();

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('x-robots-tag')).toBe('noindex');
    await expect(response.text()).resolves.toBe(
      JSON.stringify({ runtime: 'sveltekit-alchemy', status: 'ok' })
    );
  });

  it('adds the shared security policy and keeps shadow stages out of search', () => {
    const response = withSiteHeaders(new Response('ok'), 'shadow');

    const contentSecurityPolicy = response.headers.get('content-security-policy');
    expect(contentSecurityPolicy).toContain("frame-ancestors 'none'");
    expect(contentSecurityPolicy).toContain("connect-src 'self' https://cloudflareinsights.com");
    expect(contentSecurityPolicy).toContain("form-action 'self'");
    expect(contentSecurityPolicy).not.toContain('omg-api.latham.cloud');
    expect(contentSecurityPolicy).not.toContain('api.github.com');
    expect(contentSecurityPolicy).not.toContain('https://github.com');
    expect(contentSecurityPolicy).not.toContain('accounts.google.com');
    expect(contentSecurityPolicy).not.toMatch(/script-src[^;]*'unsafe-inline'/u);
    expect(response.headers.get('strict-transport-security')).toBe(
      'max-age=31536000; includeSubDomains; preload'
    );
    expect(response.headers.get('vary')).toBe('Accept-Encoding');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(response.headers.get('x-frame-options')).toBe('DENY');
    expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow');
  });

  it('preserves the nonce policy generated during Svelte rendering', () => {
    const renderedPolicy = "default-src 'self'; script-src 'self' 'nonce-request-local'";
    const response = withSiteHeaders(
      new Response('ok', { headers: { 'Content-Security-Policy': renderedPolicy } }),
      'shadow'
    );

    expect(response.headers.get('content-security-policy')).toBe(renderedPolicy);
    expect(response.headers.get('x-frame-options')).toBe('DENY');
  });

  it('does not add a shadow robots policy to the production stage', () => {
    const response = withSiteHeaders(new Response('ok', { headers: { Vary: 'Origin' } }), 'prod');

    expect(response.headers.get('vary')).toBe('Origin, Accept-Encoding');
    expect(response.headers.has('x-robots-tag')).toBe(false);
  });

  it.each(['GET', 'HEAD'])('gives a successful %s docs page the edge cache policy', method => {
    const securedResponse = withSiteHeaders(htmlResponse(), 'shadow');
    const response = withPublicHtmlCache(securedResponse, method, '/docs/cli/');

    expect(response.headers.get('cache-control')).toBe(EDGE_CACHE_POLICY);
    expect(response.headers.get('x-robots-tag')).toBe('noindex, nofollow');
  });

  it.each(['GET', 'HEAD', 'POST'])('caches the homepage only for read %s requests', method => {
    const response = withPublicHtmlCache(htmlResponse(), method, '/');

    expect(response.headers.get('cache-control')).toBe(
      method === 'POST' ? null : EDGE_CACHE_POLICY
    );
  });

  it.each([
    { method: 'GET', pathname: '/admin/', status: 200 },
    { method: 'GET', pathname: '/dashboard/analytics/', status: 200 },
    { method: 'GET', pathname: '/login/', status: 200 },
    { method: 'GET', pathname: '/api/auth/session', status: 200 },
    { method: 'GET', pathname: '/markdown/guides/node-npm-pnpm', status: 200 },
    { method: 'GET', pathname: '/health', status: 200 },
    { method: 'POST', pathname: '/docs/', status: 200 },
    { method: 'GET', pathname: '/docs/', status: 404 },
    { method: 'GET', pathname: '/docs/cli/', status: 500 },
  ])('never caches $method $pathname with status $status', ({ method, pathname, status }) => {
    const response = withPublicHtmlCache(
      new Response('x', { status, headers: { 'content-type': 'text/html' } }),
      method,
      pathname
    );

    expect(response.headers.has('cache-control')).toBe(false);
  });

  it('leaves a non-HTML response untouched', () => {
    const response = withPublicHtmlCache(Response.json({ ok: true }), 'GET', '/some-json-endpoint');

    expect(response.headers.has('cache-control')).toBe(false);
  });
});
