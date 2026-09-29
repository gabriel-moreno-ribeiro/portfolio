// qa/fb2-repair/showcase-headings.mjs - #work card titles sit one level below the section h2.
import { chromium } from 'playwright';
import path from 'node:path';
const OUT = path.resolve('qa/fb2-repair');
const BASE = process.argv[2] || 'http://localhost:5173';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ headless: true });
const out = {};
for (const vp of [{ w: 1280, h: 800, m: false }, { w: 390, h: 844, m: true }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: vp.m ? 2 : 1, isMobile: vp.m, hasTouch: vp.m });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'load', timeout: 60000 });
  for (let i = 0; i < 200; i++) {
    const found = await page.evaluate(() => { window.scrollBy(0, Math.round(innerHeight * 0.4)); return !!document.querySelector('#work .featured-card'); });
    await sleep(120);
    if (found) break;
  }
  await page.locator('#work').scrollIntoViewIfNeeded();
  await sleep(1200);
  out[vp.w] = await page.evaluate(() => {
    const w = document.querySelector('#work');
    return {
      outline: [...w.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) => `${h.tagName} ${h.textContent.trim()}`),
      cardTitleStyle: (() => { const h = w.querySelector('.featured-card__body > h3'); if (!h) return null; const s = getComputedStyle(h); return { fontSize: s.fontSize, fontWeight: s.fontWeight, margin: s.margin }; })(),
      cardH2Count: w.querySelectorAll('.featured-card__body > h2').length,
    };
  });
  await page.locator('#work').screenshot({ path: path.join(OUT, `work-headings-${vp.w}.png`) });
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(out, null, 2));
