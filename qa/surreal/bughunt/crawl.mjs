// Crawl every route: console errors, failed requests, overflow, meta, links.
import { chromium, webkit, firefox } from 'playwright';
const engine = { chromium, webkit, firefox }[process.env.ENGINE || 'chromium'];
const BASE = 'http://localhost:5173';
const routes = process.env.R ? process.env.R.split(',') : ['/', '/work/hibeex', '/work/candela', '/library', '/news', '/blog', '/blog/drake-equation', '/files', '/one-pager', '/contact', '/obrigado', '/thank-you', '/privacy', '/terms', '/story'];
const widths = (process.env.W || '1440').split(',').map(Number);
const dark = process.env.DARK === '1';
const b = await engine.launch(process.env.ENGINE && process.env.ENGINE !== 'chromium' ? {} : { args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const allLinks = new Map();
for (const w of widths) for (const r of routes) {
  const ctx = await b.newContext({ viewport: { width: w, height: 900 } });
  if (dark) await ctx.addInitScript(() => localStorage.setItem('darkMode', 'true'));
  const p = await ctx.newPage();
  const errs = [], failed = [];
  p.on('console', m => { if (['error', 'warning'].includes(m.type())) errs.push(m.type() + ': ' + m.text().slice(0, 200)); });
  p.on('pageerror', e => errs.push('pageerror: ' + e.message.slice(0, 200)));
  p.on('requestfailed', q => failed.push('FAIL ' + q.url() + ' ' + q.failure()?.errorText));
  p.on('response', s => { if (s.status() >= 400) failed.push(s.status() + ' ' + s.url()); });
  await p.goto(BASE + r, { waitUntil: 'load' }).catch(e => errs.push('goto ' + e.message));
  await p.waitForTimeout(2500);
  if (process.env.SCROLL) { const h = await p.evaluate(() => document.documentElement.scrollHeight); for (let y = 0; y < h + 3000; y += 600) { await p.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), y); await p.waitForTimeout(250); } await p.waitForTimeout(1500); }
  const info = await p.evaluate(() => {
    const m = n => document.querySelector(`meta[name="${n}"],meta[property="${n}"]`)?.content;
    const over = document.documentElement.scrollWidth - innerWidth;
    const wide = over > 0 ? [...document.querySelectorAll('body *')].filter(e => { const r = e.getBoundingClientRect(); return r.right > innerWidth + 1 && r.width > 0 && getComputedStyle(e).position !== 'fixed'; }).slice(0, 5).map(e => e.tagName + '.' + String(e.className).slice(0, 40) + ' r=' + Math.round(e.getBoundingClientRect().right)) : [];
    const links = [...document.querySelectorAll('a[href]')].map(a => ({ href: a.getAttribute('href'), text: (a.innerText || a.getAttribute('aria-label') || '').trim().slice(0, 40), target: a.target, rel: a.rel }));
    const imgsNoAlt = [...document.querySelectorAll('img:not([alt])')].map(i => i.src.slice(-50));
    const btnNoName = [...document.querySelectorAll('button,a[href],[role=button]')].filter(e => !(e.innerText.trim() || e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') || e.title || e.querySelector('img[alt]:not([alt=""]),svg title'))).map(e => e.outerHTML.slice(0, 100));
    const h1 = [...document.querySelectorAll('h1')].map(h => h.innerText.slice(0, 40));
    return { title: document.title, desc: m('description'), canon: document.querySelector('link[rel=canonical]')?.href, og: m('og:image'), ogt: m('og:title'), robots: m('robots'), over, wide, links, imgsNoAlt, btnNoName, h1, mains: document.querySelectorAll('main').length };
  });
  for (const l of info.links) { if (!allLinks.has(l.href)) allLinks.set(l.href, { ...l, from: r }); }
  console.log(JSON.stringify({ w, r, title: info.title, desc: info.desc?.slice(0, 60), canon: info.canon, og: info.og, ogt: info.ogt, robots: info.robots, h1: info.h1, mains: info.mains, over: info.over, wide: info.wide, imgsNoAlt: info.imgsNoAlt, btnNoName: info.btnNoName.slice(0, 4), errs: [...new Set(errs)].slice(0, 8), failed: [...new Set(failed)].slice(0, 8) }));
  await ctx.close();
}
if (process.env.LINKS) {
  const res = [];
  for (const [href, l] of allLinks) {
    if (/^(mailto|tel|javascript):/.test(href)) { res.push({ href, from: l.from }); continue; }
    const ext = /^https?:/.test(href) && !href.startsWith(BASE);
    if (ext) { if (l.target === '_blank' && !/noopener|noreferrer/.test(l.rel)) res.push({ href, issue: 'blank-no-noopener', from: l.from }); continue; }
    const url = new URL(href, BASE + l.from);
    const r = await fetch(url.origin + url.pathname).catch(e => ({ status: 'ERR' }));
    const ct = r.headers?.get?.('content-type') || '';
    // SPA fallback: html for asset paths = missing file
    const isAsset = /\.[a-z0-9]{2,5}$/i.test(url.pathname) && !url.pathname.endsWith('.html');
    if (r.status !== 200 || (isAsset && ct.includes('text/html'))) res.push({ href, status: r.status, ct, from: l.from });
    else res.push({ href, ok: 1, from: l.from });
  }
  console.log('LINKS', JSON.stringify(res, null, 0));
}
await b.close();
