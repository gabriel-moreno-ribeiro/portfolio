/**
 * qa/scripts/r2-final.mjs - the last r2 confirmations that need their own scroll state.
 *   a) car vertical position as a % of the viewport at 10/25/50/75/100% of the section
 *   b) odometer sticky offset at 390 (top: 76px band) and whether the navbar covers it
 *   c) "Let's talk" CTA: is it inside the HIBEEX card, and its contrast in dark theme
 *   d) Cool Things carousel: how many slides are in the DOM, and the dot size
 *   e) count-up stats: value over time after the section mounts
 *   f) button.ag-panel: accessible name and focus outline
 *   g) layout shifts during a fast scroll (lazy sections growing the document)
 * Usage: node qa/scripts/r2-final.mjs <outDir> [baseUrl]
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve(process.argv[2] || 'qa/r2');
const BASE = process.argv[3] || 'http://localhost:4173';
fs.mkdirSync(OUT, { recursive: true });
const VIEWPORTS = [
  { w: 1440, h: 900, opts: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 } },
  { w: 390, h: 844, opts: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } },
];
const out = { generatedAt: new Date().toISOString(), baseUrl: BASE, viewports: {} };
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });

const WALK = `(async () => {
  const nap = (t) => new Promise((r) => setTimeout(r, t));
  const maxY = () => document.documentElement.scrollHeight - window.innerHeight;
  let y = 0;
  while (y < maxY()) { y = Math.min(y + 400, maxY()); window.scrollTo({ top: y, behavior: 'instant' }); await nap(90); }
  await nap(600);
  window.scrollTo({ top: 0, behavior: 'instant' });
  await nap(400);
  return maxY();
})()`;

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext(vp.opts);
  const page = await ctx.newPage();
  await page.addInitScript(`(() => {
    window.__qaShift = [];
    try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__qaShift.push({ ms: Math.round(e.startTime), value: +e.value.toFixed(4), sources: (e.sources || []).map((s) => s.node ? (s.node.nodeName || '') + (s.node.className ? '.' + String(s.node.className).split(' ')[0] : '') : '?').slice(0, 3) }); }).observe({ type: 'layout-shift', buffered: true }); } catch (e) { /* noop */ }
  })();`);
  await page.goto(BASE + '/', { waitUntil: 'load', timeout: 60000 });
  try { await page.waitForLoadState('networkidle', { timeout: 20000 }); } catch { /* ignore */ }
  await page.waitForTimeout(1500);

  // g) fast scroll to the bottom, no pauses: worst case for the reserved-box growth
  const fast = await page.evaluate(async () => {
    const nap = (t) => new Promise((r) => setTimeout(r, t));
    const before = (window.__qaShift || []).reduce((s, e) => s + e.value, 0);
    const maxY = () => document.documentElement.scrollHeight - window.innerHeight;
    const docStart = document.documentElement.scrollHeight;
    let y = 0;
    while (y < maxY()) { y = Math.min(y + 900, maxY()); window.scrollTo({ top: y, behavior: 'instant' }); await nap(16); }
    await nap(1200);
    const list = window.__qaShift || [];
    return {
      docStart, docEnd: document.documentElement.scrollHeight,
      clsBeforeScroll: +before.toFixed(4),
      clsTotal: +list.reduce((s, e) => s + e.value, 0).toFixed(4),
      shifts: list.length, worst: list.slice().sort((a, b) => b.value - a.value).slice(0, 4),
    };
  });

  await page.evaluate(WALK);
  await page.waitForTimeout(600);

  // a) car position through the section
  const carTrack = [];
  const geo = await page.evaluate(() => {
    const el = document.getElementById('work-experience');
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const top = Math.round(r.top + window.scrollY);
    return { top, h: Math.round(r.height), innerH: window.innerHeight, maxY: document.documentElement.scrollHeight - window.innerHeight };
  });
  if (geo) {
    for (const pct of [10, 25, 50, 75, 100]) {
      const y = Math.min(geo.maxY, Math.round(geo.top + ((geo.h - geo.innerH) * pct) / 100));
      await page.evaluate((yy) => window.scrollTo({ top: yy, behavior: 'instant' }), y);
      await page.waitForTimeout(500);
      const m = await page.evaluate(() => {
        const c = document.querySelector('.exp__sprite') || document.querySelector('.exp__poster');
        if (!c) return null;
        const r = c.getBoundingClientRect();
        const mid = r.top + r.height / 2;
        const nav = document.querySelector('.exp__odo') || [...document.querySelectorAll('*')].find((e) => /exp__odo/.test(String(e.className || '')));
        const nr = nav ? nav.getBoundingClientRect() : null;
        const navbar = document.querySelector('nav.navbar');
        const br = navbar ? navbar.getBoundingClientRect() : null;
        return {
          carMidPctOfViewport: +((mid / window.innerHeight) * 100).toFixed(1),
          carTop: Math.round(r.top), carH: Math.round(r.height),
          odoTop: nr ? Math.round(nr.top) : null, odoH: nr ? Math.round(nr.height) : null,
          navbarBottom: br ? Math.round(br.bottom) : null,
          odoUnderNavbar: nr && br ? (nr.top < br.bottom && nr.bottom > br.top) : null,
        };
      });
      carTrack.push(Object.assign({ pct, scrollY: y }, m));
    }
  }

  // c/d/e/f measured with everything mounted
  const rest = await page.evaluate(() => {
    const cta = document.querySelector('.exp__card-cta');
    const ctaInfo = cta ? (() => {
      const card = cta.closest('li,article,div');
      const li = cta.closest('li[id^=exp-]');
      const cs = getComputedStyle(cta);
      const r = cta.getBoundingClientRect();
      return {
        text: (cta.textContent || '').replace(/\s+/g, ' ').trim(), href: cta.getAttribute('href'),
        insideStopId: li ? li.id : null, cardCls: card ? String(card.className || '').slice(0, 40) : null,
        color: cs.color, bg: cs.backgroundColor, fontSize: cs.fontSize, w: Math.round(r.width), h: Math.round(r.height),
      };
    })() : null;
    const carousel = (() => {
      const root = document.querySelector('#work');
      if (!root) return null;
      const slides = root.querySelectorAll('[class*="slide"],[class*="carousel__item"],li');
      const dots = [...root.querySelectorAll('[class*="dot"]')];
      return {
        slideNodes: slides.length,
        visibleSlides: [...slides].filter((s) => s.getBoundingClientRect().width > 4).length,
        dots: dots.length,
        dotSizes: [...new Set(dots.map((d) => Math.round(d.getBoundingClientRect().width) + 'x' + Math.round(d.getBoundingClientRect().height)))],
        imgs: root.querySelectorAll('img').length,
      };
    })();
    const agPanels = [...document.querySelectorAll('button.ag-panel')].map((b) => ({
      name: (b.getAttribute('aria-label') || b.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 40),
      w: Math.round(b.getBoundingClientRect().width), h: Math.round(b.getBoundingClientRect().height),
      outline: getComputedStyle(b).outlineWidth,
    }));
    const stats = [...document.querySelectorAll('[class*="stat-tile"],[class*="numbers"] [class*="value"]')].map((e) => (e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 36)).slice(0, 10);
    return { ctaInfo, carousel, agPanels, stats };
  });

  // e) count-up over time: reload, walk to #numbers, sample
  const countUp = await (async () => {
    const p2 = await ctx.newPage();
    await p2.goto(BASE + '/', { waitUntil: 'load', timeout: 60000 });
    await p2.waitForTimeout(1200);
    const ok = await p2.evaluate(async () => {
      const nap = (t) => new Promise((r) => setTimeout(r, t));
      const maxY = () => document.documentElement.scrollHeight - window.innerHeight;
      let y = 0;
      while (y < maxY()) {
        y = Math.min(y + 300, maxY()); window.scrollTo({ top: y, behavior: 'instant' }); await nap(80);
        const n = document.getElementById('numbers');
        if (n && n.getBoundingClientRect().top < window.innerHeight * 0.4) return true;
      }
      return false;
    });
    if (!ok) { await p2.close(); return { error: '#numbers never reached' }; }
    const samples = [];
    for (const wait of [0, 300, 600, 1200, 2500]) {
      await p2.waitForTimeout(wait ? (wait - (samples.length ? [0, 300, 600, 1200, 2500][samples.length - 1] : 0)) : 0);
      samples.push({
        atMs: wait,
        values: await p2.evaluate(() => [...document.querySelectorAll('#numbers [class*="stat"]')].map((e) => (e.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 28)).filter(Boolean).slice(0, 6)),
      });
    }
    await p2.close();
    return { samples };
  })();

  out.viewports[vp.w] = { fastScroll: fast, carTrack, rest, countUp };
  await ctx.close();
}

fs.writeFileSync(path.join(OUT, 'r2-final.json'), JSON.stringify(out, null, 2));
for (const [w, v] of Object.entries(out.viewports)) {
  console.log('== vp ' + w);
  console.log('  fastScroll doc ' + v.fastScroll.docStart + '->' + v.fastScroll.docEnd + ' CLS ' + v.fastScroll.clsTotal + ' (' + v.fastScroll.shifts + ' shifts)');
  console.log('  car: ' + v.carTrack.map((c) => c.pct + '%=' + c.carMidPctOfViewport + '%vh').join(' '));
  console.log('  odo: ' + v.carTrack.map((c) => c.pct + '%:top=' + c.odoTop + (c.odoUnderNavbar ? ' UNDER-NAVBAR' : '')).join(' '));
  console.log('  cta: ' + JSON.stringify(v.rest.ctaInfo));
  console.log('  carousel: ' + JSON.stringify(v.rest.carousel));
  console.log('  agPanels: ' + JSON.stringify(v.rest.agPanels.slice(0, 3)) + ' n=' + v.rest.agPanels.length);
  console.log('  countUp: ' + JSON.stringify(v.countUp).slice(0, 500));
}
await browser.close();
