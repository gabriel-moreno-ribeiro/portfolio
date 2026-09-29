import { chromium } from 'playwright';
import fs from 'node:fs';
fs.mkdirSync('.playwright-cli/pages', { recursive: true });
const browser = await chromium.launch();
for (const [route, tag] of [['/library', 'library'], ['/news', 'news']]) {
  for (const [w, h, mobile] of [[1440, 900, false], [390, 844, true]]) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: mobile ? 2 : 1 });
    await page.goto('http://localhost:5173' + route, { waitUntil: 'networkidle' });
    await page.mouse.move(w / 2, h / 2); await page.waitForTimeout(2500);
    await page.screenshot({ path: `.playwright-cli/pages/${tag}-${w}-top.png` });
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < total; y += 600) { await page.evaluate(v => window.scrollTo(0, v), y); await page.waitForTimeout(120); }
    await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(600);
    await page.screenshot({ path: `.playwright-cli/pages/${tag}-${w}-full.png`, fullPage: true });
    const info = await page.evaluate(() => ({ h: document.documentElement.scrollHeight, canvases: document.querySelectorAll('canvas').length, h1: document.querySelector('h1')?.textContent?.trim(), h2s: [...document.querySelectorAll('h2')].map(e => e.textContent.trim().slice(0, 40)).slice(0, 8), imgs: document.images.length, iframes: document.querySelectorAll('iframe').length }));
    console.log(tag, w, JSON.stringify(info));
    await page.close();
  }
}
await browser.close();
