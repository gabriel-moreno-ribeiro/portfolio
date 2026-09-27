// Repeat timings: Home/End (snap) and ruler age click (browseTo), plus titles seen during an age click.
import { chromium } from 'playwright';
import fs from 'node:fs';
const b = await chromium.launch({ args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=swiftshader'] });
const out = {};
for (const [w, h] of [[1440, 900], [390, 844]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  const p = await ctx.newPage();
  await p.goto('http://localhost:5173/library', { waitUntil: 'load' });
  await p.waitForSelector('.library--ready', { timeout: 60000 });
  await p.waitForTimeout(3000);
  const r = { end: [], home: [], ageClick: [], fps: null };
  r.cornerEls = await p.evaluate(() => document.elementsFromPoint(3, 3).map(e => e.tagName + '.' + (e.className?.toString() || '').slice(0, 40)));
  r.cornerDot = await p.evaluate(() => [...document.querySelectorAll('body *')].filter(e => { const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return b.left <= 2 && b.top <= 2 && b.width > 0 && b.width < 40 && b.height < 40 && cs.display !== 'none' && cs.visibility !== 'hidden' && +cs.opacity > 0; }).map(e => e.tagName + '.' + (e.className?.toString() || '') + ' ' + getComputedStyle(e).backgroundColor));
  // in-page title watcher with rAF timestamps
  await p.evaluate(() => {
    window.__seen = [];
    const mo = new MutationObserver(() => { const t = document.querySelector('.library__caption-body:last-child .library__title')?.textContent; const l = window.__seen[window.__seen.length - 1]; if (t && (!l || l.t !== t)) window.__seen.push({ t, at: performance.now() }); });
    mo.observe(document.querySelector('.library__caption'), { childList: true, subtree: true, characterData: true });
  });
  const press = async (key) => { await p.evaluate(() => { document.activeElement?.blur(); window.__seen = []; window.__t0 = performance.now(); }); await p.keyboard.press(key); await p.waitForTimeout(1500); return p.evaluate(() => window.__seen.length ? Math.round(window.__seen[0].at - window.__t0) : null); };
  for (let i = 0; i < 5; i++) { r.end.push(await press('End')); r.home.push(await press('Home')); }
  const ages = p.locator('.library__ages button.library__age');
  for (const [from, to] of [[0, 6], [6, 1], [1, 10]]) {
    await p.evaluate(() => { window.__seen = []; window.__t0 = performance.now(); });
    await ages.nth(to).click();
    await p.waitForTimeout(6000);
    r.ageClick.push(await p.evaluate((lbl) => ({ to: lbl, firstChangeMs: window.__seen.length ? Math.round(window.__seen[0].at - window.__t0) : null, lastChangeMs: window.__seen.length ? Math.round(window.__seen.at(-1).at - window.__t0) : null, titlesSeen: window.__seen.length, final: window.__seen.at(-1)?.t }), await ages.nth(to).getAttribute('aria-label')));
  }
  // rough fps during idle
  r.fpsIdle = await p.evaluate(() => new Promise(res => { let n = 0; const s = performance.now(); const f = () => { n++; if (performance.now() - s < 2000) requestAnimationFrame(f); else res(Math.round(n / 2)); }; requestAnimationFrame(f); }));
  out[w] = r;
  console.log(w, JSON.stringify(r));
  await ctx.close();
}
fs.writeFileSync('C:/portfolio-gabriel/qa/libnews/library-timing.json', JSON.stringify(out, null, 2));
await b.close();
