import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
await page.waitForTimeout(1000);
await page.locator('.find-my-work').scrollIntoViewIfNeeded();
await page.mouse.move(10, 10);
await page.waitForTimeout(500);
const first = page.locator('.media-carousel').first();
const before = await first.locator('.carousel-thumb.is-active').getAttribute('aria-label');
await page.waitForTimeout(7500);
const after = await first.locator('.media-carousel, .carousel-thumb.is-active').first().getAttribute('aria-label');
// hidden tab: no advance
await page.evaluate(() => { Object.defineProperty(document, 'hidden', { value: true, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); });
const t0 = await first.locator('.carousel-thumb.is-active').getAttribute('aria-label');
await page.waitForTimeout(7500);
const t1 = await first.locator('.carousel-thumb.is-active').getAttribute('aria-label');
console.log(JSON.stringify({ advanced: { before, after }, hiddenTab: { t0, t1, frozen: t0 === t1 } }));
await browser.close();
