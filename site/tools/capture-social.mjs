import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { chromium } from '@playwright/test';

const { values } = parseArgs({
  options: {
    url: { type: 'string', default: 'http://127.0.0.1:4173' },
    output: { type: 'string' },
  },
});
if (!values.output?.endsWith('.png')) throw new Error('Supply --output with a new .png filename.');
const url = new URL('/', values.url);
if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Use an HTTP website URL.');
const output = resolve(values.output);
await mkdir(dirname(output), { recursive: true });
const browser = await chromium.launch({ args: ['--disable-dev-shm-usage'] });
try {
  const context = await browser.newContext({
    viewport: { width: 1600, height: 840 },
    deviceScaleFactor: 0.75,
    colorScheme: 'dark',
    reducedMotion: 'no-preference',
  });
  const page = await context.newPage();
  await page.addInitScript(() => localStorage.setItem('omg-theme', 'dark'));
  const response = await page.goto(url.href, { waitUntil: 'networkidle' });
  if (response?.status() !== 200) throw new Error('Homepage did not return HTTP 200.');
  await page.evaluate(() => document.fonts.ready);
  await page.locator('.command-workbench .next-prompt').waitFor({ state: 'visible' });
  // Frame the completed homepage demo; the next section otherwise straddles the image edge.
  await page.addStyleTag({ content: '.runtime-strip { visibility: hidden; }' });
  await page.screenshot({ path: output, animations: 'disabled', caret: 'hide' });
  const png = await readFile(output);
  if (png.readUInt32BE(16) !== 1200 || png.readUInt32BE(20) !== 630)
    throw new Error('Unexpected social snapshot dimensions.');
  await writeFile(resolve(dirname(output), 'omg-og.png'), png);
  await writeFile(
    resolve(dirname(output), 'omg-og.svg'),
    `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-labelledby="title description"><title id="title">OMG homepage</title><desc id="description">Homepage snapshot of https://getomg.dev/ showing package and runtime management.</desc><image width="1200" height="630" href="data:image/png;base64,${png.toString('base64')}"/></svg>\n`
  );
  process.stdout.write(`Captured 1200×630 homepage preview: ${output}\n`);
} finally {
  await browser.close();
}
