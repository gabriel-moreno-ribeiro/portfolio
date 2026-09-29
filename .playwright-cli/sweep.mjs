// Sweep of the secondary routes: console errors, broken images, horizontal overflow,
// banned words (titles) and em dashes in visible text. Full-page shots at 1440 and 390.
import { chromium } from 'playwright';
import fs from 'node:fs';
const OUT = '.playwright-cli/sweep';
fs.mkdirSync(OUT, { recursive: true });
const routes = ['/work/hibeex', '/work/candela', '/work/medals', '/work/gsat', '/files', '/blog', '/contact', '/obrigado', '/nope-404', '/library', '/news'];
const browser = await chromium.launch();
const report = [];
for (const route of routes) {
  for (const [w, h, mobile] of [[1440, 900, false], [390, 844, true]]) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile });
    const errors = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 160)); });
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message.slice(0, 160)));
    page.on('requestfailed', (r) => { const u = r.url(); if (u.startsWith('http://localhost')) errors.push('failed: ' + u.slice(21)); });
    await page.goto('http://localhost:5173' + route, { waitUntil: 'networkidle' }).catch((e) => errors.push('goto: ' + e.message.slice(0, 80)));
    await page.waitForTimeout(1200);
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < total; y += 700) { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(100); }
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
    const info = await page.evaluate(() => {
      const text = document.body.innerText;
      const doc = document.documentElement;
      const wide = [...document.querySelectorAll('body *')].filter((e) => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && r.right > doc.clientWidth + 1 && getComputedStyle(e).position !== 'fixed';
      }).slice(0, 4).map((e) => e.className?.toString().slice(0, 50) || e.tagName);
      return {
        h1: document.querySelector('h1')?.textContent?.trim().slice(0, 50) ?? null,
        overflowX: doc.scrollWidth > doc.clientWidth ? doc.scrollWidth - doc.clientWidth : 0,
        wide: doc.scrollWidth > doc.clientWidth ? wide : [],
        broken: [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.getAttribute('src')),
        noSize: [...document.images].filter((i) => !i.getAttribute('width') || !i.getAttribute('height')).length,
        titles: (text.match(/\b(CEO|co-?founder|founder|founding)\b/gi) || []).slice(0, 6),
        dashes: (text.match(/[^\n]{0,30}—[^\n]{0,30}/g) || []).slice(0, 4),
      };
    });
    const tag = route.replace(/\W+/g, '_');
    await page.screenshot({ path: `${OUT}/${tag}-${w}.png`, fullPage: true });
    report.push({ route, w, errors: [...new Set(errors)].slice(0, 5), ...info });
    await page.close();
  }
}
await browser.close();
fs.writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 1));
for (const r of report) {
  const bad = r.errors.length || r.overflowX || r.broken.length || r.titles.length || r.dashes.length;
  console.log(`${bad ? 'XX' : 'ok'} ${r.route} ${r.w} h1=${JSON.stringify(r.h1)} noSize=${r.noSize}` + (bad ? ' ' + JSON.stringify({ e: r.errors, ox: r.overflowX, wide: r.wide, broken: r.broken, titles: r.titles, dashes: r.dashes }) : ''));
}
