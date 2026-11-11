import { expect, test } from '@playwright/test';

test('security headers cover dynamic and prerendered pages for GET and HEAD', async ({
  request,
}) => {
  for (const path of ['/', '/docs/installation/', '/guides/node-npm-pnpm/']) {
    for (const method of ['GET', 'HEAD']) {
      const response = await request.fetch(path, { method });
      expect(response.status(), `${method} ${path}`).toBe(200);
      const headers = response.headers();
      expect(headers['content-security-policy'], path).toContain("frame-ancestors 'none'");
      expect(headers['strict-transport-security'], path).toBe(
        'max-age=31536000; includeSubDomains; preload'
      );
      expect(headers['x-content-type-options'], path).toBe('nosniff');
      expect(headers['x-frame-options'], path).toBe('DENY');
      expect(headers['referrer-policy'], path).toBe('strict-origin-when-cross-origin');
      expect(headers['permissions-policy'], path).toBe('geolocation=(), microphone=(), camera=()');
      expect(headers['cross-origin-opener-policy'], path).toBe('same-origin');
    }
  }
});

test('desktop header links align vertically with the brand and account actions', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1118, height: 960 });
  await page.goto('/');
  const centerY = async (selector: string) => {
    const box = await page.locator(selector).first().boundingBox();
    expect(box, `${selector} should be visible`).not.toBeNull();
    return box!.y + box!.height / 2;
  };
  const brandCenter = await centerY('.brand');
  const accountCenter = await centerY('.account-link');
  for (const link of await page.locator('.primary-links a').all()) {
    const box = await link.boundingBox();
    expect(box).not.toBeNull();
    const linkCenter = box!.y + box!.height / 2;
    expect(Math.abs(linkCenter - brandCenter)).toBeLessThanOrEqual(2);
    expect(Math.abs(linkCenter - accountCenter)).toBeLessThanOrEqual(2);
  }
});

test('preserves a mobile menu opened before hydration', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  const scripts = Promise.withResolvers<void>();
  await page.route('**/*', async route => {
    if (route.request().resourceType() === 'script') await scripts.promise;
    await route.continue();
  });
  await page.goto('/', { waitUntil: 'commit' });
  const menu = page.locator('.mobile-menu');
  await menu.locator('summary').click();
  await expect(menu).toHaveAttribute('open', '');
  scripts.resolve();
  await page.waitForLoadState('networkidle');
  await expect(menu).toHaveAttribute('open', '');
  await menu.getByRole('link', { name: 'Runtimes', exact: true }).click();
  await expect(page).toHaveURL(/\/runtimes\/$/);
});

test('mobile navigation reaches a runtime guide and updates canonical metadata', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await page.goto('/');
  await page.getByText('Menu', { exact: true }).click();
  const menu = page.locator('.mobile-menu');
  await expect(menu.getByRole('link', { name: 'Docs', exact: true })).toBeVisible();
  await menu.getByRole('link', { name: 'Runtimes', exact: true }).click();
  await expect(page).toHaveURL(/\/runtimes\/$/);
  await page.getByRole('link', { name: /Manage Node.js versions with OMG/ }).click();
  await expect(page).toHaveURL(/\/runtimes\/node\/$/);
  await expect(page.locator('h1')).toHaveText('Manage Node.js versions with OMG');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://getomg.dev/runtimes/node/'
  );
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    'content',
    'https://getomg.dev/runtimes/node/'
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('node-mobile.png') });
  await page
    .getByRole('link', { name: 'Use Node.js, npm, and pnpm with OMG', exact: true })
    .click();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    'href',
    'https://getomg.dev/guides/node-npm-pnpm/'
  );
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    'content',
    'Use Node.js, npm, and pnpm with OMG - OMG'
  );
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 320, height: 568 } });
  test('keeps the menu keyboard-operable and the guide readable', async ({ page }) => {
    await page.goto('/');
    const menu = page.locator('.mobile-menu');
    await menu.locator('summary').focus();
    await menu.locator('summary').press('Enter');
    await expect(menu.getByRole('link', { name: 'Runtimes', exact: true })).toBeVisible();
    await menu.getByRole('link', { name: 'Runtimes', exact: true }).focus();
    await page.keyboard.press('Enter');
    await page.getByRole('link', { name: /Manage Node.js versions with OMG/ }).click();
    await expect(page.locator('h1')).toHaveText('Manage Node.js versions with OMG');
    await expect(page.getByText('omg use node lts', { exact: false }).first()).toBeVisible();
  });
});

test('public sitemap, raw HTML and Markdown agree on published guides', async ({ request }) => {
  const sitemap = await request.get('/sitemap.xml');
  const xml = await sitemap.text();
  const urls = [...xml.matchAll(/<loc>https:\/\/getomg\.dev([^<]*)<\/loc>/g)].map(
    match => match[1]!
  );
  expect(urls).toContain('/runtimes/node/');
  expect(urls).toContain('/compare/omg-vs-mise/');
  for (const path of urls.filter(candidate => /^\/(runtimes|guides|compare)\//.test(candidate))) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    const html = await response.text();
    expect(html.match(/<h1\b/g), path).toHaveLength(1);
    expect(html.match(/rel="canonical"/g), path).toHaveLength(1);
    expect(html, path).toContain(`href="https://getomg.dev${path}"`);
    expect(html, path).toContain('name="twitter:card"');
    expect(html, path).not.toContain('content="noindex');
  }
  const markdown = await request.get('/markdown/runtimes/node/');
  expect(markdown.status()).toBe(200);
  expect(markdown.headers()['content-type']).toContain('text/markdown');
  expect(await markdown.text()).toContain('omg use node lts');
  expect(markdown.headers()['x-robots-tag']).toContain('noindex');
  expect(markdown.headers()['content-signal']).toContain('ai-train=no');
  const llms = await request.get('/llms.txt');
  expect(llms.status()).toBe(200);
  expect(llms.headers()['content-type']).toContain('text/plain');
  expect(llms.headers()['x-robots-tag']).toContain('noindex');
  expect(await llms.text()).toContain('/markdown/runtimes/node/');
  const missing = await request.get('/runtimes/not-a-runtime/');
  expect(missing.status()).toBe(404);
  expect((await request.get('/guides/node/')).status()).toBe(404);
});

test('command explorer changes examples and their documentation destination', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/', { waitUntil: 'networkidle' });
  const choices = page.getByRole('group', { name: 'Choose a command example' });
  await expect(page.locator('.command code')).toHaveText('omg search ripgrep --no-aur');
  const runtime = choices.getByRole('button', { name: 'Runtimes', exact: true });
  await runtime.focus();
  await runtime.press('Enter');
  await expect(runtime).toHaveAttribute('aria-pressed', 'true');
  await expect(choices.getByRole('button', { name: 'Packages', exact: true })).toHaveAttribute(
    'aria-pressed',
    'false'
  );
  await expect(page.locator('.command code')).toHaveText('omg use node 22.0.0');
  await expect(page.locator('.terminal-guide')).toHaveAttribute('href', '/docs/runtimes/');
  await choices.getByRole('button', { name: 'Environments', exact: true }).click();
  await expect(page.locator('.command code')).toHaveText('omg env check');
  await expect(page.locator('.terminal-guide')).toHaveAttribute('href', '/docs/cli/');
  await page.locator('.terminal-guide').click();
  await expect(page).toHaveURL(/\/docs\/cli\/$/);
});

test('dark mode follows the system and remembers a manual choice across pages', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(20, 23, 18)');
  await page.getByRole('button', { name: 'Switch to light mode' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(250, 251, 248)');
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page
    .getByRole('navigation', { name: 'Primary navigation' })
    .getByRole('link', { name: 'Docs', exact: true })
    .click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('theme switching works when browser storage is blocked', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('Blocked', 'SecurityError');
      },
    });
  });
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('terminal types, reveals Arch output, pauses, and replays', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.clock.install({ time: new Date('2026-11-11T18:00:00Z') });
  await page.clock.pauseAt(new Date('2026-11-11T18:00:01Z'));
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Replay terminal demo' }).click();
  await expect(page.locator('.command code')).toHaveText('');
  await page.clock.runFor(600);
  const partial = await page.locator('.command code').innerText();
  expect(partial.length).toBeGreaterThan(0);
  expect(partial.length).toBeLessThan('omg search ripgrep --no-aur'.length);
  await page.getByRole('button', { name: 'Pause terminal demo' }).click();
  await page.clock.runFor(2_000);
  await expect(page.locator('.command code')).toHaveText(partial);
  await page.getByRole('button', { name: 'Resume terminal demo' }).click();
  await page.clock.runFor(5_000);
  await expect(page.locator('.terminal-output')).toContainText('ripgrep 15.2.0-1');
  await expect(page.locator('.terminal-output')).toContainText('Official');
  await expect(page.getByText('Arch Linux · x86_64', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Replay terminal demo' }).click();
  await expect(page.locator('.command code')).toHaveText('');
});

test('reduced motion shows the complete terminal transcript without typing', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/', { waitUntil: 'networkidle' });
  await expect(page.locator('.command code')).toHaveText('omg search ripgrep --no-aur');
  await expect(page.locator('.terminal-output')).toContainText('ripgrep 15.2.0-1');
  await expect(page.getByRole('button', { name: 'Pause terminal demo' })).toHaveCount(0);
  await page
    .getByRole('group', { name: 'Choose a command example' })
    .getByRole('button', { name: 'Environments', exact: true })
    .click();
  await expect(page.locator('.terminal-output')).toContainText('Environment is in sync');
});

test('dark mode remains reachable from the compact mobile menu', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 700 });
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  await page.goto('/', { waitUntil: 'networkidle' });
  await page.locator('.mobile-menu summary').click();
  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(20, 23, 18)');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test.describe('dark mode without JavaScript', () => {
  test.use({
    javaScriptEnabled: false,
    colorScheme: 'dark',
    viewport: { width: 320, height: 700 },
  });
  test('keeps the complete Arch demo readable', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(20, 23, 18)');
    await expect(page.locator('.command code')).toHaveText('omg search ripgrep --no-aur');
    await expect(page.locator('.terminal-output')).toContainText('ripgrep 15.2.0-1');
    await expect(page.getByRole('button', { name: 'Replay terminal demo' })).toBeDisabled();
  });
});

test('theme control works on a directly loaded prerendered documentation page', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/docs/', { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Switch to light mode' }).click();
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(250, 251, 248)');
});
