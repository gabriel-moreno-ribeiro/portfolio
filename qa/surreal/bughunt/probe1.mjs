import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await ctx.newPage();
const errs = []; p.on('console', m => { if (['error','warning'].includes(m.type())) errs.push(m.text().slice(0,200)); }); p.on('pageerror', e => errs.push('PE ' + e.message));
await p.goto('http://localhost:5173/', { waitUntil: 'load' }); await p.waitForTimeout(2000);
const h = await p.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < h + 3000; y += 600) { await p.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), y); await p.waitForTimeout(250); }
await p.waitForTimeout(1500);
const r = await p.evaluate(() => {
  const anchors = [...document.querySelectorAll('a[href*="#"]')].map(a => a.getAttribute('href').split('#')[1]).filter(Boolean).filter(id => !document.getElementById(id));
  const ext = [...document.querySelectorAll('a[href^="http"]')].map(a => ({ h: a.href, t: a.target, rel: a.rel, txt: (a.innerText || a.getAttribute('aria-label') || '').trim().slice(0, 30) }));
  const ids = {}; document.querySelectorAll('[id]').forEach(e => ids[e.id] = (ids[e.id] || 0) + 1);
  const dupIds = Object.entries(ids).filter(([, n]) => n > 1);
  const headings = [...document.querySelectorAll('h1,h2,h3')].map(h => h.tagName + ' ' + h.innerText.trim().slice(0, 40));
  const smallTargets = [...document.querySelectorAll('a,button,input,[role=button],[tabindex="0"]')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && (r.width < 24 || r.height < 24) && getComputedStyle(e).visibility !== 'hidden'; }).map(e => e.tagName + '.' + String(e.className).slice(0, 30) + ' ' + Math.round(e.getBoundingClientRect().width) + 'x' + Math.round(e.getBoundingClientRect().height) + ' ' + (e.innerText || e.getAttribute('aria-label') || '').slice(0, 20));
  const inputsNoLabel = [...document.querySelectorAll('input,textarea,select')].filter(i => i.type !== 'hidden' && !(i.labels?.length || i.getAttribute('aria-label') || i.getAttribute('aria-labelledby'))).map(i => i.outerHTML.slice(0, 100));
  const live = [...document.querySelectorAll('[aria-live]')].map(e => e.getAttribute('aria-live') + ' ' + String(e.className).slice(0, 30) + ' "' + e.textContent.slice(0, 30) + '"');
  return { anchors, ext, dupIds, headings, smallTargets, inputsNoLabel, live };
});
console.log(JSON.stringify(r, null, 1)); console.log('errs', errs);
await b.close();
