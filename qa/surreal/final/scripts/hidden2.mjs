// attribute rAF callers while document.hidden is emulated, per scroll position on the Home
import fs from 'node:fs';
import { launch, BASE, OUT, VPS, slowScroll } from './common.mjs';
const b = await launch(); const out = {};
const c = await b.newContext({ viewport: VPS.desktop }); const p = await c.newPage();
await p.addInitScript(() => {
  window.__stacks = {}; window.__on = false; window.__raf = 0;
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (cb) => { if (window.__on) { const s = (new Error().stack || '').split('\n').slice(2, 4).map((l) => l.trim().replace(/https?:\/\/[^/]+/, '').replace(/:\d+:\d+\)?$/, '')).join(' < '); window.__stacks[s] = (window.__stacks[s] || 0) + 1; } return raf((t) => { window.__raf++; return cb(t); }); };
});
await p.goto(BASE + '/'); await p.waitForTimeout(3000); await slowScroll(p, 300, 100);
for (const sel of ['#root', '#background', '#graph', '#work', '#research', '#skills', '#work-experience', '#contact']) {
  await p.evaluate((s) => { const e = document.querySelector(s); e && e.scrollIntoView({ block: 'center', behavior: 'instant' }); }, sel);
  await p.waitForTimeout(1500);
  await p.evaluate(() => { window.__stacks = {}; window.__on = true; window.__raf = 0; Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
  await p.waitForTimeout(1000); await p.evaluate(() => { window.__stacks = {}; window.__raf = 0; }); await p.waitForTimeout(3000);
  const r = await p.evaluate(() => ({ raf: window.__raf, stacks: window.__stacks, anims: document.getAnimations().filter((a) => a.playState === 'running').map((a) => (a.effect?.target?.className?.toString?.() || a.effect?.target?.tagName || '?').slice(0, 50) + ' ' + (a.animationName || a.constructor.name)), vids: [...document.querySelectorAll('video')].filter((v) => !v.paused).length }));
  await p.evaluate(() => { window.__on = false; delete document.visibilityState; delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
  out[sel] = { rafPerSec: +(r.raf / 3).toFixed(1), top: Object.entries(r.stacks).sort((a, b) => b[1] - a[1]).slice(0, 4), anims: r.anims, vids: r.vids };
  console.log(sel, JSON.stringify(out[sel]));
}
fs.writeFileSync(OUT + 'hidden-tab-attribution.json', JSON.stringify(out, null, 2)); await b.close();
