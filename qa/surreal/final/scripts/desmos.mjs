import fs from 'node:fs';
import { launch, BASE, OUT, VPS, slowScroll } from './common.mjs';
const b = await launch(); const res = {};
for (const theme of ['light', 'dark']) for (const [vn, vp] of Object.entries(VPS)) {
  const c = await b.newContext({ viewport: vp, isMobile: vn === 'mobile', hasTouch: vn === 'mobile' });
  await c.addInitScript((t) => localStorage.setItem('darkMode', String(t === 'dark')), theme);
  const p = await c.newPage(); const media = [];
  p.on('response', (r) => { if (/\/work\/desmos\//.test(r.url())) media.push(r.status() + ' ' + r.url().split('/').pop() + ' ' + (r.headers()['content-length'] || '?')); });
  await p.goto(BASE + '/'); await p.waitForTimeout(2500); await slowScroll(p, 300, 100);
  await p.evaluate(() => document.querySelector('.desmos__tile')?.scrollIntoView({ block: 'center', behavior: 'instant' }));
  const snaps = [];
  for (const t of [300, 2500, 6000]) {
    await p.waitForTimeout(t === 300 ? 300 : t === 2500 ? 2200 : 3500);
    snaps.push(await p.evaluate(() => [...document.querySelectorAll('.desmos__tile')].map((tl) => { const v = tl.querySelector('video'); const im = tl.querySelector('img'); return { video: v ? { paused: v.paused, t: +v.currentTime.toFixed(1), dur: +(v.duration || 0).toFixed(1), started: v.classList.contains('is-started'), op: getComputedStyle(v).opacity, ready: v.readyState } : null, poster: { loaded: im.complete && im.naturalWidth > 0, op: getComputedStyle(im).opacity }, frameBg: getComputedStyle(tl.querySelector('.desmos__frame')).backgroundColor }; })));
    await p.screenshot({ path: OUT + `desmos-${theme}-${vn}-${t}ms.png` });
  }
  res[`${theme} ${vn}`] = { snaps, media }; console.log(theme, vn, JSON.stringify(snaps[2][0]), media.join(' | '));
  await c.close();
}
fs.writeFileSync(OUT + 'desmos.json', JSON.stringify(res, null, 2)); await b.close();
