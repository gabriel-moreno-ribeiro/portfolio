// Baseline screenshots + DOM metrics for the surreal audit. Run: node qa/surreal/scripts/shoot.mjs
import { chromium } from 'playwright';
import fs from 'node:fs';
const BASE = 'http://localhost:5173';
const OUT = new URL('../baseline/', import.meta.url).pathname;
const VPS = { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } };
const ROUTES = process.argv[2] === 'inner'
  ? { work: '/work/' + (process.argv[3] || 'hibeex'), story: '/story', blog: '/blog' }
  : { home: '/' };
const metrics = {};
const browser = await chromium.launch();
for (const [vpName, viewport] of Object.entries(VPS)) for (const theme of ['light', 'dark']) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, isMobile: vpName === 'mobile', hasTouch: vpName === 'mobile' });
  await ctx.addInitScript(t => { try { localStorage.setItem('darkMode', String(t === 'dark')); } catch {} }, theme);
  for (const [name, path] of Object.entries(ROUTES)) {
    const page = await ctx.newPage();
    const errors = [];
    page.on('console', m => m.type() === 'error' && errors.push(m.text().slice(0, 200)));
    page.on('pageerror', e => errors.push('pageerror: ' + String(e).slice(0, 200)));
    await page.goto(BASE + path, { waitUntil: 'load' });
    await page.waitForTimeout(3500);
    const key = `${name}-${vpName}-${theme}`;
    let i = 0, y = 0;
    for (;;) {
      await page.waitForTimeout(1300);
      if (name === 'home' || i < 6) await page.screenshot({ path: `${OUT}${key}-${String(i).padStart(2, '0')}.png` });
      const h = await page.evaluate(() => document.documentElement.scrollHeight);
      if (y + viewport.height >= h || i > 40) break;
      y += viewport.height - (name === 'home' ? 60 : 0); i++;
      await page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), y);
    }
    metrics[key] = await page.evaluate(() => {
      const vis = el => { const r = el.getBoundingClientRect(); const s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
      const sel = el => (el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (typeof el.className === 'string' && el.className ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''));
      const de = document.documentElement;
      const small = [...document.querySelectorAll('a,button,[role=button],input,select,textarea,[tabindex]:not([tabindex="-1"])')].filter(vis)
        .map(el => { const r = el.getBoundingClientRect(); return { s: sel(el), w: Math.round(r.width), h: Math.round(r.height), t: (el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 30) }; })
        .filter(x => x.w < 24 || x.h < 24);
      const under44 = [...document.querySelectorAll('a,button,[role=button]')].filter(vis).filter(el => { const r = el.getBoundingClientRect(); return r.width < 44 || r.height < 44; }).length;
      const overflow = [...document.querySelectorAll('body *')].filter(vis).filter(el => { const r = el.getBoundingClientRect(); return r.right > de.clientWidth + 1 && getComputedStyle(el).position !== 'fixed'; }).slice(0, 8).map(sel);
      return {
        scrollHeight: de.scrollHeight, hScroll: de.scrollWidth > de.clientWidth, scrollWidth: de.scrollWidth, overflow,
        headings: [...document.querySelectorAll('h1,h2,h3,h4')].filter(vis).map(h => h.tagName + ': ' + h.textContent.trim().slice(0, 50)),
        imgsNoDims: [...document.querySelectorAll('img')].filter(i => !i.getAttribute('width') || !i.getAttribute('height')).map(i => (i.getAttribute('src') || '').slice(-50)).slice(0, 15),
        imgsNoAlt: [...document.querySelectorAll('img:not([alt])')].length,
        imgs: document.querySelectorAll('img').length, canvases: document.querySelectorAll('canvas').length,
        smallTargets: small.slice(0, 25), under44,
        unnamed: [...document.querySelectorAll('a,button')].filter(vis).filter(el => !(el.textContent || '').trim() && !el.getAttribute('aria-label') && !el.getAttribute('title') && !el.querySelector('img[alt]:not([alt=""]),svg title')).map(sel).slice(0, 10),
        landmarks: ['header', 'nav', 'main', 'footer'].map(t => t + ':' + document.querySelectorAll(t).length).join(' '),
        runningAnimations: document.getAnimations().filter(a => a.playState === 'running').length,
        fonts: [...new Set([...document.querySelectorAll('h1,h2,h3,p,a,button,span,li')].filter(vis).map(e => getComputedStyle(e).fontFamily.split(',')[0].replace(/"/g, '')))],
        smallText: [...document.querySelectorAll('p,span,a,li,button,small,figcaption,dt,dd,time')].filter(vis).filter(e => e.childElementCount === 0 && (e.textContent || '').trim() && parseFloat(getComputedStyle(e).fontSize) < 12).map(e => sel(e) + ' ' + getComputedStyle(e).fontSize).slice(0, 15),
      };
    });
    metrics[key].errors = [...new Set(errors)].slice(0, 10);
    metrics[key].shots = i + 1;
    await page.close();
  }
  await ctx.close();
}
await browser.close();
const f = `${OUT}metrics-${Object.keys(ROUTES)[0] === 'home' ? 'home' : 'inner'}.json`;
fs.writeFileSync(f, JSON.stringify(metrics, null, 1));
console.log('wrote', f, Object.entries(metrics).map(([k, v]) => `${k}:${v.shots} shots h=${v.scrollHeight} err=${v.errors.length}`).join('\n'));
