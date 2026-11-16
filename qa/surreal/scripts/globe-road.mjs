// Globe ↔ road: heights, console errors and screenshots of Origins and Experience.
// node qa/surreal/scripts/globe-road.mjs [--heights]
import { chromium } from 'playwright';
const only = process.argv.includes('--heights');
const out = 'qa/surreal/globe-road';
const sizes = [[1440, 900, 'desktop'], [390, 844, 'phone'], ...(only ? [[768, 1024, 'tablet']] : [])];
const GPU = ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'];
const runs = [
  { tag: 'light', theme: 'light', args: GPU },
  { tag: 'dark', theme: 'dark', args: GPU },
  { tag: 'light-softwaregl', theme: 'light' },
  { tag: 'dark-softwaregl', theme: 'dark' },
  { tag: 'light-reduced', theme: 'light', reduced: true },
  { tag: 'light-nowebgl', theme: 'light', args: ['--disable-webgl', '--disable-webgl2'] },
  { tag: 'dark-nowebgl', theme: 'dark', args: ['--disable-webgl', '--disable-webgl2'] },
];
for (const run of only ? runs.slice(0, 1) : runs) {
  const b = await chromium.launch({ args: run.args ?? [] });
  for (const [width, height, name] of sizes) {
    const ctx = await b.newContext({ viewport: { width, height }, reducedMotion: run.reduced ? 'reduce' : 'no-preference', colorScheme: run.theme });
    await ctx.addInitScript((d) => localStorage.setItem('darkMode', d), String(run.theme === 'dark'));
    const p = await ctx.newPage();
    const errors = [];
    p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    p.on('pageerror', (e) => errors.push(String(e)));
    await p.goto('http://localhost:5173/#background', { waitUntil: 'load' });
    await p.waitForTimeout(4000);
    const info = await p.evaluate(() => {
      const h = (s) => Math.round(document.querySelector(s)?.getBoundingClientRect().height ?? -1);
      const op = (s) => { const e = document.querySelector(s); return e ? getComputedStyle(e).opacity : null; };
      return { background: h('#background'), experience: h('#work-experience'), poster: op('.globe-poster'), canvas: op('.globe-canvas'), theme: document.documentElement.dataset.theme };
    });
    if (!only) {
      await p.screenshot({ path: `${out}/origins-${name}-${run.tag}.png` });
      await p.evaluate(() => document.querySelector('#work-experience')?.scrollIntoView({ behavior: 'instant' }));
      await p.waitForTimeout(1500);
      await p.screenshot({ path: `${out}/experience-${name}-${run.tag}.png` });
      await p.evaluate(() => document.querySelector('#exp-olympic-club')?.scrollIntoView({ behavior: 'instant', block: 'center' }));
      await p.waitForTimeout(1500);
      await p.screenshot({ path: `${out}/experience-stop-${name}-${run.tag}.png` });
    }
    if (!only && run.tag === 'light') {
      // Globe → road → globe, by the links.
      await p.goto('http://localhost:5173/#background', { waitUntil: 'load' });
      await p.waitForTimeout(2500);
      await p.locator('.city-timeline__dot[aria-label^="Salvador"]').click();
      await p.locator('a.city-panel__road[href$="exp-olympic-club"]').click();
      await p.waitForTimeout(2500);
      info.toRoad = await p.evaluate(() => { const e = document.querySelector('#exp-olympic-club'); return { hash: location.hash, top: Math.round(e.getBoundingClientRect().top), arrived: e.classList.contains('is-arrived'), focus: document.activeElement === e }; });
      await p.screenshot({ path: `${out}/link-globe-to-road-${name}.png` });
      await p.locator('#exp-hibeex .exp__card-city a').click();
      await p.waitForTimeout(2500);
      info.toGlobe = await p.evaluate(() => ({ hash: location.hash, top: Math.round(document.querySelector('#background').getBoundingClientRect().top), city: document.querySelector('.city-panel:not(.city-panel--sizer) .city-panel__location')?.textContent, focus: document.activeElement?.tagName }));
      await p.screenshot({ path: `${out}/link-road-to-globe-${name}.png` });
    }
    console.log(JSON.stringify({ run: run.tag, name, ...info, errors }));
    await ctx.close();
  }
  await b.close();
}
