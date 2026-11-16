// check 9: with the tab hidden, count rAF calls / canvas draws / media / animations
import fs from 'node:fs';
import { launch, BASE, OUT, VPS, slowScroll } from './common.mjs';
const browser = await launch(); const res = {};
for (const path of ['/', '/work/hibeex']) {
  const ctx = await browser.newContext({ viewport: VPS.desktop });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    window.__raf = 0; window.__rafCb = new Map();
    const raf = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (cb) => raf((t) => { window.__raf++; return cb(t); });
    window.__gl = 0;
    for (const P of [WebGLRenderingContext.prototype, window.WebGL2RenderingContext?.prototype].filter(Boolean)) for (const f of ['drawArrays', 'drawElements', 'drawArraysInstanced', 'drawElementsInstanced']) { const o = P[f]; if (!o) continue; P[f] = function (...a) { window.__gl++; return o.apply(this, a); }; }
    window.__c2d = 0;
    for (const f of ['fillRect', 'drawImage', 'stroke', 'fill', 'clearRect']) { const o = CanvasRenderingContext2D.prototype[f]; CanvasRenderingContext2D.prototype[f] = function (...a) { window.__c2d++; return o.apply(this, a); }; }
  });
  await page.goto(BASE + path, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(3000);
  // visit sections so loops are active (globe, dioramas, spotify, desmos)
  const maxY = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  const marks = [];
  for (const sel of path === '/' ? ['#globe', '#graph', '#work', '#medals', '#skills', 'footer'] : ['.how', '.diorama', 'footer']) {
    const ok = await page.evaluate((s) => { const e = document.querySelector(s); if (!e) return false; e.scrollIntoView({ block: 'center', behavior: 'instant' }); return true; }, sel);
    if (ok) { marks.push(sel); await page.waitForTimeout(1200); }
  }
  const snap = () => page.evaluate(() => ({ raf: window.__raf, gl: window.__gl, c2d: window.__c2d, anims: document.getAnimations().filter((a) => a.playState === 'running').length, vids: [...document.querySelectorAll('video')].filter((v) => !v.paused).length, vis: document.visibilityState, perf: performance.now() }));
  const visible = [await snap()]; await page.waitForTimeout(3000); visible.push(await snap());
  const cdp = await ctx.newCDPSession(page);
  // Real hidden: open a 2nd page and bring it to front (headless emulation of visibilityState) + CDP lifecycle fallback
  await cdp.send('Page.enable');
  let method = 'Emulation.setFocusEmulationEnabled+Page.setWebLifecycleState(frozen)?';
  // Preferred: override visibility like a hidden tab so app listeners fire
  await page.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
  await page.waitForTimeout(800);
  const h0 = await snap(); await page.waitForTimeout(4000); const h1 = await snap();
  // Also page.evaluate-based counts in the hidden window of what's still scheduling
  const real = { rafPerSec: (h1.raf - h0.raf) / 4, glDrawsPerSec: (h1.gl - h0.gl) / 4, c2dPerSec: (h1.c2d - h0.c2d) / 4, anims: h1.anims, vids: h1.vids };
  const vis = { rafPerSec: (visible[1].raf - visible[0].raf) / 3, glDrawsPerSec: (visible[1].gl - visible[0].gl) / 3, c2dPerSec: (visible[1].c2d - visible[0].c2d) / 3, anims: visible[1].anims, vids: visible[1].vids };
  // restore + confirm resume
  await page.evaluate(() => { delete document.visibilityState; delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
  res[path] = { sectionsVisited: marks, visibleBaseline: vis, hiddenEmulated: real };
  console.log(path, JSON.stringify(res[path]));
  await ctx.close();
}
await browser.close();
fs.writeFileSync(OUT + 'hidden-tab.json', JSON.stringify(res, null, 2));
