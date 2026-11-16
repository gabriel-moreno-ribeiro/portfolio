// check 6: prefers-reduced-motion
import fs from 'node:fs';
import { launch, BASE, OUT, VPS, slowScroll, shotFull } from './common.mjs';
const browser = await launch();
const res = {};
for (const [vn, vp] of Object.entries(VPS)) for (const path of ['/', '/work/hibeex']) {
  const ctx = await browser.newContext({ viewport: vp, reducedMotion: 'reduce', isMobile: vn === 'mobile', hasTouch: vn === 'mobile' });
  const page = await ctx.newPage();
  const key = `${vn} ${path}`; const errs = []; page.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
  page.on('console', (m) => m.type() === 'error' && errs.push(m.text().slice(0, 200)));
  await page.goto(BASE + path, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(3000);
  await shotFull(page, OUT + `rm-${vn}-${path === '/' ? 'home' : 'hibeex'}-top.png`);
  await slowScroll(page, 300, 120);
  const probe = await page.evaluate(() => {
    const vis = (e) => { const r = e.getBoundingClientRect(); const s = getComputedStyle(e); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none'; };
    const pinned = [...document.querySelectorAll('*')].filter((e) => { const s = getComputedStyle(e); return s.position === 'sticky' && e.getBoundingClientRect().height > innerHeight * 0.6; }).map((e) => e.tagName.toLowerCase() + '.' + String(e.className).split(' ')[0] + ' h=' + Math.round(e.getBoundingClientRect().height));
    const gsapPin = [...document.querySelectorAll('.pin-spacer')].map((e) => e.className + ' h=' + Math.round(e.getBoundingClientRect().height));
    const graph = document.querySelector('#graph');
    const anims = document.getAnimations().filter((a) => a.playState === 'running').map((a) => (a.effect?.target?.className?.toString?.() || a.effect?.target?.tagName || '?').slice(0, 40) + ':' + (a.animationName || a.constructor.name));
    const lowOpacity = [...document.querySelectorAll('h1,h2,h3,p,li,figure,section')].filter(vis).filter((e) => parseFloat(getComputedStyle(e).opacity) < 0.95).slice(0, 10).map((e) => e.tagName.toLowerCase() + '.' + String(e.className).split(' ')[0] + ' op=' + getComputedStyle(e).opacity);
    const videos = [...document.querySelectorAll('video')].map((v) => ({ src: (v.currentSrc || v.src || '').slice(-40), paused: v.paused, autoplay: v.autoplay, op: getComputedStyle(v).opacity, vis: vis(v) }));
    const posters = [...document.querySelectorAll('[class*=desmos] img, .desmos img')].map((i) => ({ src: i.src.slice(-40), vis: vis(i), loaded: i.complete && i.naturalWidth > 0 }));
    const counters = [...document.querySelectorAll('[class*=ranked] *, .stat *')].filter((e) => e.childElementCount === 0 && /^[\d.,]+[+%kKmM]*$/.test(e.textContent.trim())).map((e) => e.textContent.trim()).slice(0, 12);
    const canv = [...document.querySelectorAll('canvas')].filter(vis).length;
    return { pinnedSticky: pinned, gsapPin, graphClass: graph?.className, graphHeight: graph && Math.round(graph.getBoundingClientRect().height), runningCssAnimations: anims.length, anims: anims.slice(0, 15), lowOpacity, videos, posters, counters, visibleCanvases: canv, scrollH: document.documentElement.scrollHeight, hscroll: document.documentElement.scrollWidth > document.documentElement.clientWidth };
  });
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' })); await page.waitForTimeout(800);
  await shotFull(page, OUT + `rm-${vn}-${path === '/' ? 'home' : 'hibeex'}-scrolled.png`);
  res[key] = { ...probe, errs };
  console.log(key, JSON.stringify(probe, null, 1).slice(0, 1800));
  await ctx.close();
}
await browser.close();
fs.writeFileSync(OUT + 'reduced-motion.json', JSON.stringify(res, null, 2));
