// qa/story/capture.mjs - screenshots of /story (top + full page) at 1440x900 and 390x844,
// light and dark. Usage: node qa/story/capture.mjs <before|after> [baseUrl]
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const TAG = process.argv[2] || 'before';
const BASE = process.argv[3] || 'http://localhost:5173';
const OUT = path.resolve('qa/story');
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const report = { tag: TAG, generatedAt: new Date().toISOString(), runs: [] };

for (const vp of [{ w: 1440, h: 900 }, { w: 390, h: 844 }]) {
  for (const theme of ['light', 'dark']) {
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message.slice(0, 200)));
    page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 200)); });

    await page.goto(BASE + '/story', { waitUntil: 'load', timeout: 60000 });
    try { await page.waitForLoadState('networkidle', { timeout: 15000 }); } catch { /* keep going */ }
    await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(OUT, `${TAG}-${vp.w}-${theme}-top.png`) });

    // Walk the page so every reveal has fired and lazy images have loaded.
    await page.evaluate(async () => {
      const nap = (ms) => new Promise((r) => setTimeout(r, ms));
      const maxY = () => document.documentElement.scrollHeight - window.innerHeight;
      let y = 0, steps = 0;
      while (y < maxY() && steps < 400) { y = Math.min(y + 350, maxY()); window.scrollTo({ top: y, behavior: 'instant' }); steps++; await nap(140); }
      await nap(1200);
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
    await page.waitForTimeout(4500);
    await page.screenshot({ path: path.join(OUT, `${TAG}-${vp.w}-${theme}-full.png`), fullPage: true });

    const info = await page.evaluate(() => {
      const p = document.querySelector('.story__p p, .story__p');
      const cs = p ? getComputedStyle(p) : null;
      const text = document.body.innerText;
      return {
        pageHeight: document.documentElement.scrollHeight,
        scrollWidth: document.documentElement.scrollWidth,
        bodyFontSize: cs?.fontSize, bodyLineHeight: cs?.lineHeight,
        columnWidth: p ? Math.round(p.getBoundingClientRect().width) : null,
        dashes: (text.match(/[—–]/g) || []).length,
        images: [...document.images].filter((i) => i.closest('.story')).map((i) => ({
          src: i.getAttribute('src'), w: i.getAttribute('width'), h: i.getAttribute('height'), loading: i.loading,
        })),
      };
    });
    report.runs.push({ viewport: `${vp.w}x${vp.h}`, theme, ...info, errors });
    await ctx.close();
  }
}

await browser.close();
fs.writeFileSync(path.join(OUT, `${TAG}-capture.json`), JSON.stringify(report, null, 2));
for (const r of report.runs) {
  console.log(r.viewport, r.theme, 'height', r.pageHeight, 'scrollW', r.scrollWidth, 'font', r.bodyFontSize, '/', r.bodyLineHeight,
    'col', r.columnWidth, 'dashes', r.dashes, 'errors', r.errors.length);
  for (const e of r.errors.slice(0, 4)) console.log('   ', e);
}
