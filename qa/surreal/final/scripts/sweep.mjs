// checks 3, 4, 8: console, failed requests, images w/o dims, CLS, horizontal scroll
import fs from 'node:fs';
import { launch, BASE, OUT, VPS, slowScroll } from './common.mjs';
const PAGES = ['/', '/work/hibeex', '/work/candela', '/work/gsat', '/story', '/blog'];
const res = { console: {}, cls: {}, imgs: {}, hscroll: {} };
const browser = await launch();
for (const [vn, vp] of Object.entries(VPS)) for (const path of PAGES) {
  const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: 1, isMobile: vn === 'mobile', hasTouch: vn === 'mobile' });
  const page = await ctx.newPage();
  const key = `${vn} ${path}`;
  const r = { errors: [], warnings: [], pageerrors: [], failed: [], bad: [], apiIgnored: [], bytes: 0, requests: 0 };
  page.on('console', (m) => { const t = m.text().slice(0, 300); if (m.type() === 'error') r.errors.push(t); else if (m.type() === 'warning') r.warnings.push(t); });
  page.on('pageerror', (e) => r.pageerrors.push(String(e).slice(0, 300)));
  page.on('requestfailed', (q) => { const u = q.url(); (u.includes('/api/') ? r.apiIgnored : r.failed).push(`${u} ${q.failure()?.errorText}`); });
  page.on('response', async (resp) => { r.requests++; const u = resp.url(); if (resp.status() >= 400) (u.includes('/api/') ? r.apiIgnored : r.bad).push(`${resp.status()} ${u}`); try { const l = resp.headers()['content-length']; if (l) r.bytes += +l; } catch {} });
  await page.addInitScript(() => {
    window.__cls = 0; window.__shifts = [];
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) { window.__cls += e.value; window.__shifts.push({ v: +e.value.toFixed(4), t: Math.round(e.startTime), n: (e.sources || []).map((s) => { const n = s.node; return n ? (n.tagName || '') + (n.className && typeof n.className === 'string' ? '.' + n.className.split(' ')[0] : '') : '?'; }).slice(0, 3) }); } }).observe({ type: 'layout-shift', buffered: true });
  });
  await page.goto(BASE + path, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(3000);
  await slowScroll(page, 250, 180);
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(1000);
  r.cls = await page.evaluate(() => ({ cls: +window.__cls.toFixed(4), shifts: window.__shifts.slice(0, 8) }));
  res.imgs[key] = await page.evaluate(() => [...document.querySelectorAll('img')].filter((i) => !i.getAttribute('width') || !i.getAttribute('height')).map((i) => (i.getAttribute('src') || '').slice(-70)));
  res.console[key] = r;
  await ctx.close();
}
// hscroll at 6 widths on every page
for (const w of [360, 390, 768, 1024, 1280, 1440]) for (const path of ['/', '/work/hibeex', '/story', '/blog']) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(BASE + path, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(2000);
  await slowScroll(page, 400, 100);
  res.hscroll[`${w} ${path}`] = await page.evaluate(() => {
    const de = document.documentElement; const w = de.clientWidth;
    const off = [...document.querySelectorAll('body *')].filter((e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.right > w + 1 && s.position !== 'fixed' && s.visibility !== 'hidden'; }).slice(0, 5).map((e) => e.tagName.toLowerCase() + '.' + String(e.className).split(' ')[0] + ' right=' + Math.round(e.getBoundingClientRect().right));
    return { scrollWidth: de.scrollWidth, bodyScrollWidth: document.body.scrollWidth, clientWidth: w, overflowX: de.scrollWidth > w, offenders: off };
  });
  await ctx.close();
}
await browser.close();
fs.writeFileSync(OUT + 'sweep.json', JSON.stringify(res, null, 2));
for (const [k, r] of Object.entries(res.console)) console.log(k.padEnd(28), 'err', r.errors.length, 'pageerr', r.pageerrors.length, 'warn', r.warnings.length, 'failed', r.failed.length, 'bad', r.bad.length, 'cls', r.cls.cls, 'imgsNoDims', res.imgs[k].length);
for (const [k, r] of Object.entries(res.hscroll)) if (r.overflowX) console.log('HSCROLL', k, JSON.stringify(r));
console.log('hscroll checked', Object.keys(res.hscroll).length);
