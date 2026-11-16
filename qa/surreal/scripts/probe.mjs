// Probes: globe poster vs canvas, desmos posters, animations running off-viewport, reduced-motion state.
import { chromium } from 'playwright';
const b = await chromium.launch();
for (const reduced of [false, true]) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: reduced ? 'reduce' : 'no-preference' });
  const p = await ctx.newPage();
  await p.goto('http://localhost:5173/', { waitUntil: 'load' });
  await p.waitForTimeout(3000);
  const hero = await p.evaluate(() => document.querySelector('h1')?.parentElement?.innerText.slice(0, 120));
  const h = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h + 2000; y += 700) { await p.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), y); await p.waitForTimeout(500); }
  const anims = await p.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').map(a => {
    const t = a.effect?.target; const r = t?.getBoundingClientRect?.();
    return (a.animationName || a.transitionProperty || 'waapi') + ' @ ' + (t?.className?.toString?.().slice(0, 40)) + ' inView=' + (r ? r.bottom > 0 && r.top < innerHeight : '?');
  }));
  await p.evaluate(() => document.querySelector('#background')?.scrollIntoView({ behavior: 'instant' }));
  await p.waitForTimeout(2500);
  const globe = await p.evaluate(() => { const g = s => { const e = document.querySelector(s); if (!e) return null; const c = getComputedStyle(e); const r = e.getBoundingClientRect(); return { op: c.opacity, vis: c.visibility, w: Math.round(r.width), h: Math.round(r.height), src: e.currentSrc || undefined, complete: e.complete, nat: e.naturalWidth }; }; return { poster: g('.globe-poster'), canvas: g('.globe-canvas') }; });
  if (!reduced) await p.screenshot({ path: 'qa/surreal/baseline/probe-globe.png' });
  await p.evaluate(() => document.querySelector('.desmos__poster')?.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await p.waitForTimeout(6000);
  const desmos = await p.evaluate(() => [...document.querySelectorAll('.desmos__poster')].map(e => ({ src: e.currentSrc.slice(-40), op: getComputedStyle(e).opacity, nat: e.naturalWidth })).concat([...document.querySelectorAll('.desmos video, [class*=desmos] video')].map(v => ({ video: v.currentSrc.slice(-40), paused: v.paused, t: v.currentTime, dur: v.duration }))));
  await p.screenshot({ path: `qa/surreal/baseline/probe-desmos${reduced ? '-reduced' : ''}.png` });
  console.log(JSON.stringify({ reduced, hero, anims, globe, desmos }, null, 1));
  await ctx.close();
}
await b.close();
