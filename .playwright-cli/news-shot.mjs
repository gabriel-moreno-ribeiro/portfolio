// Screenshot /news: featured block and the WOW card, desktop and mobile
import { chromium } from 'playwright';
const out = new URL('./news/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');
import fs from 'node:fs';
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const errors = [];
for (const [w, h] of [[1440, 900], [390, 844]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h } });
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`${w}: ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`${w}: ${e.message}`));
  await page.goto('http://localhost:5173/news', { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${out}top-${w}.png` });
  const card = page.locator('.news__card--solo, .news__card').first();
  await card.scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  await card.screenshot({ path: `${out}wow-${w}.png` });
  const info = await page.evaluate(() => [...document.querySelectorAll('.news__photo img')].map((i) => ({
    src: i.getAttribute('src'), ok: i.complete && i.naturalWidth > 0, nat: `${i.naturalWidth}x${i.naturalHeight}`,
    box: `${Math.round(i.getBoundingClientRect().width)}x${Math.round(i.getBoundingClientRect().height)}`,
  })));
  console.log(w, JSON.stringify(info));
  await page.close();
}
console.log('errors', JSON.stringify(errors));
await browser.close();
