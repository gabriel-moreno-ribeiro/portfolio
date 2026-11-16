// WebGL / canvas draw counts: visible at the globe / skills / hero vs hidden
import fs from 'node:fs';
import { launch, BASE, OUT, VPS, slowScroll } from './common.mjs';
const b = await launch(); const c = await b.newContext({ viewport: VPS.desktop }); const p = await c.newPage(); const out = {};
await p.addInitScript(() => { window.__gl = 0; for (const P of [WebGLRenderingContext.prototype, window.WebGL2RenderingContext?.prototype].filter(Boolean)) for (const f of ['drawArrays', 'drawElements', 'drawArraysInstanced', 'drawElementsInstanced']) { const o = P[f]; if (o) P[f] = function (...a) { window.__gl++; return o.apply(this, a); }; } });
await p.goto(BASE + '/'); await p.waitForTimeout(3500); await slowScroll(p, 300, 100);
const rate = async (ms) => { const a = await p.evaluate(() => window.__gl); await p.waitForTimeout(ms); return +(((await p.evaluate(() => window.__gl)) - a) / (ms / 1000)).toFixed(1); };
for (const [n, sel] of [['hero', 'body'], ['globe', '#background'], ['skills', '#skills'], ['work', '#work'], ['contact', '#contact']]) {
  await p.evaluate((s) => s === 'body' ? scrollTo({ top: 0, behavior: 'instant' }) : document.querySelector(s)?.scrollIntoView({ block: 'center', behavior: 'instant' }), sel); await p.waitForTimeout(1500);
  const vis = await rate(2500);
  await p.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); }); await p.waitForTimeout(800);
  const hid = await rate(2500);
  await p.evaluate(() => { delete document.visibilityState; delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); }); await p.waitForTimeout(800);
  const back = await rate(2000);
  out[n] = { visibleDrawsPerSec: vis, hiddenDrawsPerSec: hid, resumedDrawsPerSec: back }; console.log(n, JSON.stringify(out[n]));
}
fs.writeFileSync(OUT + 'hidden-tab-webgl.json', JSON.stringify(out, null, 2)); await b.close();
