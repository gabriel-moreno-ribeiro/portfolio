// QA for /news: 1440 and 390, light and dark, top and full page.
// Logs page height, iframes on load and after a full scroll, images, console errors.
// usage: node qa/dev-news/shots.mjs [prefix]
import { chromium } from 'playwright';
const prefix = process.argv[2] || 'after';
const b = await chromium.launch();
const out = [];
for (const [w, h] of [[1440, 900], [390, 844]]) {
  for (const theme of ['light', 'dark']) {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: w < 500, hasTouch: w < 500 });
    await ctx.addInitScript(`localStorage.setItem('darkMode', ${theme === 'dark'})`);
    const p = await ctx.newPage();
    const errs = [];
    p.on('pageerror', (e) => errs.push(e.message.slice(0, 160)));
    p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 160)); });
    await p.goto('http://localhost:5173/news', { waitUntil: 'load' });
    await p.waitForTimeout(1500);
    const iframesOnLoad = await p.evaluate(() => document.querySelectorAll('iframe').length);
    const tag = `${prefix}-${w}-${theme}`;
    await p.screenshot({ path: `qa/dev-news/${tag}-top.png` });
    // walk the page so every Reveal fires before the full-page shot
    const H = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < H; y += h / 2) { await p.evaluate((y) => window.scrollTo(0, y), y); await p.waitForTimeout(120); }
    await p.waitForTimeout(900);
    await p.evaluate(() => window.scrollTo(0, 0));
    await p.waitForTimeout(400);
    await p.screenshot({ path: `qa/dev-news/${tag}-full.png`, fullPage: true });
    const info = await p.evaluate(() => ({
      height: document.documentElement.scrollHeight,
      iframesAfterScroll: document.querySelectorAll('iframe').length,
      imgs: [...document.querySelectorAll('.news img')].map((i) => ({ src: i.getAttribute('src'), ok: i.complete && i.naturalWidth > 0, lazy: i.loading })),
      hScroll: document.documentElement.scrollWidth > window.innerWidth,
      dashes: /[–—]/.test(document.querySelector('.news')?.innerText || ''),
    }));
    out.push({ tag, iframesOnLoad, ...info, errs });
    await ctx.close();
  }
}
await b.close();
console.log(JSON.stringify(out, null, 1));
