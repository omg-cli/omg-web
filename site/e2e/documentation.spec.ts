import { expect, test } from '@playwright/test';
import { Schema } from 'effect';

const decodeManifest = Schema.decodeUnknownSync(
  Schema.Struct({
    releaseBaseline: Schema.String,
    pages: Schema.Array(
      Schema.Struct({
        href: Schema.String,
        markdownHref: Schema.String,
        title: Schema.String,
        sections: Schema.Array(Schema.Struct({ id: Schema.String, title: Schema.String })),
      })
    ),
  })
);
const decodeSearch = Schema.decodeUnknownSync(
  Schema.Struct({
    total: Schema.Number,
    results: Schema.Array(Schema.Struct({ href: Schema.String, heading: Schema.String })),
  })
);

test('every manifest page has matching readable HTML, Markdown and section anchors', async ({
  request,
}) => {
  const response = await request.get('/docs/manifest.json');
  expect(response.status()).toBe(200);
  const manifest = decodeManifest(await response.json());
  expect(manifest.releaseBaseline).toBe('v0.1.224');
  expect(manifest.pages).toHaveLength(43);
  const index = await (await request.get('/llms.txt')).text();
  const full = await (await request.get('/llms-full.txt')).text();
  const sitemap = await (await request.get('/sitemap.xml')).text();
  const htmlPages = new Map<string, string>();
  const links = new Set<string>();
  for (const entry of manifest.pages) {
    const path = new URL(entry.href).pathname;
    const htmlResponse = await request.get(path);
    expect(htmlResponse.status(), path).toBe(200);
    const html = await htmlResponse.text();
    htmlPages.set(path, html);
    for (const match of html.matchAll(/<a\s[^>]*href="([^"]+)"/gu)) {
      const href = match[1];
      if (href?.startsWith('/') || href?.startsWith('#')) {
        const url = new URL(href.replaceAll('&amp;', '&'), entry.href);
        if (/^\/(docs|runtimes|guides|compare)(?:\/|$)/u.test(url.pathname))
          links.add(url.pathname + url.hash);
      }
    }
    const markdownPath = new URL(entry.markdownHref).pathname;
    const markdownResponse = await request.get(markdownPath);
    expect(markdownResponse.status(), markdownPath).toBe(200);
    expect(markdownResponse.headers()['content-type']).toContain('text/markdown');
    expect(markdownResponse.headers()['x-robots-tag']).toContain('noindex');
    const markdown = await markdownResponse.text();
    expect(markdown).toContain(`# ${entry.title}\n`);
    expect(markdown).toContain(`Canonical: ${entry.href}`);
    expect(full).toContain(markdown.trim());
    expect(index).toContain(entry.markdownHref);
    expect(sitemap).toContain(`<loc>${entry.href}</loc>`);
    for (const section of entry.sections)
      expect(html, `${path}#${section.id}`).toContain(`id="${section.id}"`);
  }
  for (const link of links) {
    const url = new URL(link, 'https://getomg.dev');
    let html = htmlPages.get(url.pathname);
    if (html === undefined) {
      const linkedPage = await request.get(url.pathname);
      expect(linkedPage.status(), link).toBe(200);
      html = await linkedPage.text();
      htmlPages.set(url.pathname, html);
    }
    if (url.hash) expect(html, link).toContain(`id="${decodeURIComponent(url.hash.slice(1))}"`);
  }
  expect(manifest.pages.every(entry => !/\/(admin|dashboard|api)\//u.test(entry.href))).toBe(true);
});

test('the docs MCP client can initialize and follow a curated section permalink', async ({
  request,
}) => {
  const headers = { accept: 'application/json, text/event-stream' };
  const init = await request.post('/mcp', {
    headers,
    data: {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-11-25',
        capabilities: {},
        clientInfo: { name: 'omg-docs-test', version: '1' },
      },
    },
  });
  expect(init.status()).toBe(200);
  expect(await init.text()).toContain('"name":"OMG documentation"');
  const path = '/guides/reproducible-dev-environments/';
  const section = 'capture-and-check';
  const result = await request.post('/mcp', {
    headers,
    data: {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: { name: 'read_page', arguments: { path, section } },
    },
  });
  expect(result.status()).toBe(200);
  expect(await result.text()).toContain('omg env check');
  const alias = path.slice(0, -1) + '.md';
  const index = await request.get(alias + '?sections');
  expect(index.headers()['content-type']).toContain('application/json');
  expect(await index.text()).toContain(alias + '?section=' + section);
  const passage = await request.get(alias + '?section=' + section);
  expect(await passage.text()).toContain(path + '#' + section);
});

test('search returns useful section URLs, bounds inputs and preserves private cache policy', async ({
  request,
}) => {
  const response = await request.get('/docs/search.json?q=fail-on-findings');
  expect(response.headers()['cache-control']).toBe('no-store');
  const results = decodeSearch(await response.json());
  expect(results.results.some(result => result.href.startsWith('/docs/security/#'))).toBe(true);
  expect((await request.get(`/docs/search.json?q=${'a'.repeat(161)}`)).status()).toBe(400);
  const page = await request.get('/docs/search/?q=daemon');
  expect(page.headers()['cache-control']).toBe('no-store');
  for (const path of ['/markdown/docs/unknown/', '/markdown/runtimes/unknown/'])
    expect((await request.get(path)).status()).toBe(404);
  const head = await request.head('/markdown/docs/getting-started/');
  expect(head.headers()['content-type']).toContain('text/markdown');
  expect((await head.body()).length).toBe(0);
});

test('native documentation navigation, outline and search work without JavaScript', async ({
  browser,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 320, height: 720 },
  });
  const page = await context.newPage();
  await page.goto('/docs/getting-started/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Start using OMG');
  await expect(page.getByRole('button', { name: 'Copy page', exact: true })).toBeHidden();
  await expect(page.getByRole('link', { name: 'Read as Markdown' })).toBeVisible();
  await page.locator('.mobile-topics summary').click();
  await page
    .locator('.mobile-topics')
    .getByRole('link', { name: 'Project tasks', exact: true })
    .click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Run project tasks');
  await page.locator('.page-outline summary').click();
  await page
    .locator('.page-outline')
    .getByRole('link', { name: 'Use watch or parallel mode' })
    .click();
  await expect(page).toHaveURL(/#use-watch-or-parallel-mode$/);
  await page.locator('.docs-sidebar input[name=q]').fill('fail-on-findings');
  await page.locator('.docs-sidebar').getByRole('button', { name: 'Search', exact: true }).click();
  await expect(page.locator('.search-results a').first()).toBeVisible();
  await expect(page.locator('.search-results')).toContainText('Security');
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true);
  await context.close();
});

test('copy controls use the visible code and full canonical Markdown, with a recovery state', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/docs/tasks/');
  const firstCode = page.locator('.docs-code').first();
  const expectedCode = await firstCode.locator('pre code').textContent();
  await firstCode.getByRole('button', { name: 'Copy code' }).click();
  await expect(firstCode.getByRole('status')).toHaveText('Code copied.');
  expect((await page.evaluate(() => navigator.clipboard.readText())).replaceAll('\r\n', '\n')).toBe(
    expectedCode
  );
  await page.getByRole('button', { name: 'Copy page', exact: true }).click();
  await expect(page.locator('.page-actions').getByRole('status')).toHaveText(
    'Page copied as Markdown.'
  );
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    'Release baseline: v0.1.224'
  );
  await page.evaluate(() =>
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: () => Promise.reject(new Error('denied')) },
      configurable: true,
    })
  );
  await firstCode.getByRole('button', { name: 'Copy code' }).click();
  await expect(firstCode.getByRole('status')).toHaveText(
    'Copy unavailable. Select the code to copy it.'
  );
  await expect(firstCode.getByRole('button', { name: 'Copy code' })).toBeEnabled();
});

test('the docs index copies prompt-free examples and exposes agent resources without JavaScript', async ({
  page,
  context,
  browser,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/docs/');
  const firstGroup = page.locator('#quick-start .docs-code').first();
  await expect(page.locator('#agents pre code').first()).toHaveText(
    new URL('/mcp', page.url()).href
  );
  await firstGroup.getByRole('button', { name: 'Copy code' }).click();
  await expect(firstGroup.getByRole('status')).toHaveText('Code copied.');
  expect((await page.evaluate(() => navigator.clipboard.readText())).replaceAll('\r\n', '\n')).toBe(
    'omg search ripgrep'
  );
  const withoutJavaScript = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
  });
  const reader = await withoutJavaScript.newPage();
  await reader.goto('/docs/');
  expect((await reader.getByRole('searchbox').boundingBox())?.y).toBeLessThan(250);
  const tasks = reader.getByRole('navigation', { name: 'Common documentation tasks' });
  for (const link of await tasks.getByRole('link').all()) await expect(link).toBeInViewport();
  await tasks.getByRole('link', { name: 'Use docs with an agent' }).click();
  await expect(reader).toHaveURL(/#agents$/u);
  await expect(reader.getByRole('heading', { name: 'Use docs with an agent' })).toBeInViewport();
  await expect(reader.locator('#install pre code')).toHaveText(
    'curl -fsSL https://getomg.dev/install.sh | bash'
  );
  expect(
    await reader.locator('#install pre').evaluate(pre => pre.scrollWidth <= pre.clientWidth)
  ).toBe(true);
  await expect(reader.locator('#install button')).toBeHidden();
  const agents = reader.locator('#agents');
  // The prerendered page carries its public origin. A development render uses the request origin.
  const endpoint = new URL(await agents.locator('pre code').first().innerText());
  expect(['https://getomg.dev', new URL(reader.url()).origin]).toContain(endpoint.origin);
  expect(endpoint.pathname).toBe('/mcp');
  await agents.locator('summary').click();
  await expect(agents.locator('pre code').nth(1)).toHaveText(
    `curl -H 'Accept: text/markdown' ${endpoint.origin}/docs/environments/`
  );
  for (const href of [
    '/llms.txt',
    '/docs/manifest.json',
    '/docs/search.json?q=env+check',
    '/llms-full.txt',
  ]) {
    await expect(agents.locator(`a[href="${href}"]`)).toBeVisible();
  }
  await reader.getByRole('searchbox').fill('omg env check');
  await reader.getByRole('searchbox').press('Enter');
  await expect(reader).toHaveURL(/\/docs\/search\/\?q=omg\+env\+check/u);
  await expect(reader.locator('main')).toContainText('drift');
  await withoutJavaScript.close();
});

test('phone readers can change sections while reading and use a direct heading link', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/docs/cli/#environments');
  const outline = page.locator('.page-outline');
  await expect(outline.locator('summary')).toBeInViewport();
  await outline.locator('summary').click();
  await outline.getByRole('link', { name: 'Package management' }).click();
  await expect(page).toHaveURL(/#packages$/u);
  await expect(outline).not.toHaveAttribute('open', '');
  const link = page.getByRole('link', { name: 'Link to Package management' });
  await expect(link).toBeInViewport();
  await expect(link).toHaveAttribute('href', '#packages');
  await page.goto('/docs/getting-started/#select-a-runtime');
  await expect(page.getByRole('link', { name: 'Link to Select a runtime' })).toHaveAttribute(
    'href',
    '#select-a-runtime'
  );
});

test('the environment guide renders shell commands and lockfiles as inline code', async ({
  page,
}) => {
  await page.goto('/guides/reproducible-dev-environments/#capture-and-check');
  const sentence = page.locator('#capture-and-check p').filter({ hasText: 'with the live system' });
  await expect(sentence.locator('code')).toHaveText(['omg env check', 'omg.lock']);
  await expect(sentence).toContainText(
    'Run omg env check to compare omg.lock with the live system'
  );
});

for (const theme of ['light', 'dark']) {
  for (const width of [1440, 320]) {
    test(`docs stay readable in ${theme} at ${width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript(value => localStorage.setItem('omg-theme', value), theme);
      await page.goto('/docs/getting-started/');
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
        .toBe(true);
      await page.screenshot({
        fullPage: true,
        path: testInfo.outputPath(`docs-${theme}-${width}.png`),
      });
      if (width < 1152) {
        await page.locator('.page-outline summary').click();
        for (const link of await page.locator('.page-outline a').all()) {
          const box = await link.boundingBox();
          expect(box?.height).toBeGreaterThanOrEqual(44);
        }
      } else {
        await expect(page.locator('.rail-outline a').first()).toBeVisible();
      }
      await page.screenshot({
        fullPage: true,
        path: testInfo.outputPath(`outline-${theme}-${width}.png`),
      });
      await page.goto('/docs/search/?q=env+capture');
      await expect(page.locator('.search-results a').first()).toBeVisible();
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
        .toBe(true);
      await page.screenshot({
        fullPage: true,
        path: testInfo.outputPath(`search-${theme}-${width}.png`),
      });
    });
  }
}
