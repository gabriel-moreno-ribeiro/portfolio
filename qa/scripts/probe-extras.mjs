/**
 * qa/scripts/probe-extras.mjs - targeted follow-ups that the generic capture
 * cannot answer:
 *   1. does each <canvas> actually paint? (region stddev in the full-page PNG
 *      vs a viewport screenshot taken at that canvas's own scroll position)
 *   2. the count-up stats: what value is on screen over time, normal vs reduce
 *   3. the mobile sticky CTA bar: how much of the viewport it occludes
 *
 * Usage: node qa/scripts/probe-extras.mjs <outDir> [baseUrl]
 * Ex.:   node qa/scripts/probe-extras.mjs qa/baseline http://localhost:5173
 */
import { chromium } from 'playwright';
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve(process.argv[2] || 'qa/baseline');
const BASE = process.argv[3] || process.env.QA_BASE_URL || 'http://localhost:5173';
fs.mkdirSync(path.join(OUT, 'crops'), { recursive: true });

async function regionStats(file, left, top, w, h) {
  const m = await sharp(file).metadata();
  const L = Math.max(0, Math.min(left, m.width - 2));
  const T = Math.max(0, Math.min(top, m.height - 2));
  const W = Math.min(w, m.width - L);
  const H = Math.min(h, m.height - T);
  if (W < 4 || H < 4) return null;
  const buf = await sharp(file).extract({ left: L, top: T, width: W, height: H }).greyscale().raw().toBuffer();
  let s = 0;
  for (let i = 0; i < buf.length; i++) s += buf[i];
  const mean = s / buf.length;
  let v = 0;
  for (let i = 0; i < buf.length; i++) v += (buf[i] - mean) ** 2;
  const hist = new Array(256).fill(0);
  for (let i = 0; i < buf.length; i++) hist[buf[i]]++;
  let mode = 0;
  for (let i = 1; i < 256; i++) if (hist[i] > hist[mode]) mode = i;
  let ink = 0;
  for (let i = 0; i < buf.length; i++) if (Math.abs(buf[i] - mode) > 12) ink++;
  return { region: { left: L, top: T, w: W, h: H }, mean: +mean.toFixed(1), std: +Math.sqrt(v / buf.length).toFixed(2), inkFraction: +(ink / buf.length).toFixed(4) };
}

const slowScroll = async (page) => page.evaluate(async () => {
  const nap = (ms) => new Promise((r) => setTimeout(r, ms));
  const maxY = () => document.documentElement.scrollHeight - window.innerHeight;
  let y = 0;
  while (y < maxY()) { y = Math.min(y + 300, maxY()); window.scrollTo({ top: y, behavior: 'instant' }); await nap(120); }
});

const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const result = { generatedAt: new Date().toISOString(), baseUrl: BASE };

// ---------- 1. canvases: full-page PNG vs in-viewport render ----------
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(3000);
  await slowScroll(page);
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(1000);
  const rects = await page.evaluate(() => [...document.querySelectorAll('canvas')].map((cv, i) => {
    const r = cv.getBoundingClientRect();
    return { i, cls: cv.className || '(none)', parent: String(cv.parentElement.className || cv.parentElement.tagName), pageTop: Math.round(r.top + window.scrollY), left: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height) };
  }));
  const rows = [];
  for (const r of rects) {
    if (r.w < 4 || r.h < 4) { rows.push({ ...r, note: 'zero-sized' }); continue; }
    const inFull = await regionStats(path.join(OUT, 'home-1440-scrolled.png'), r.left, r.pageTop, r.w, r.h);
    // now put the canvas in the middle of the viewport and shoot only the viewport
    const target = Math.max(0, Math.round(r.pageTop + r.h / 2 - 450));
    await page.evaluate((t) => window.scrollTo({ top: t, behavior: 'instant' }), target);
    await page.waitForTimeout(2000);
    const vpFile = path.join(OUT, 'crops', 'canvas' + r.i + '-inviewport.png');
    await page.screenshot({ path: vpFile });
    const box = await page.evaluate((i) => { const cv = document.querySelectorAll('canvas')[i]; const b = cv.getBoundingClientRect(); return { left: Math.round(b.left), top: Math.round(b.top), w: Math.round(b.width), h: Math.round(b.height) }; }, r.i);
    const inVp = await regionStats(vpFile, box.left, box.top, box.w, box.h);
    rows.push({ ...r, inFullPagePng: inFull, inViewportPng: inVp, paintsInViewport: inVp ? inVp.std > 6 : null, paintsInFullPage: inFull ? inFull.std > 6 : null });
  }
  result.canvases = rows;
  await ctx.close();
}

// ---------- 2. count-up stats over time ----------
{
  const read = async (reduced) => {
    const ctx = await browser.newContext(reduced ? { viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' } : { viewport: { width: 1440, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(BASE + '/', { waitUntil: 'load', timeout: 60000 });
    await page.waitForTimeout(2500);
    const geo = await page.evaluate(() => {
      const el = [...document.querySelectorAll('*')].find((e) => /By the Numbers/i.test(e.textContent || '') && e.children.length && e.getBoundingClientRect().height > 60 && e.getBoundingClientRect().height < 600);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: Math.round(r.top + window.scrollY), h: Math.round(r.height) };
    });
    if (!geo) { await ctx.close(); return { error: 'By the Numbers block not found' }; }
    await page.evaluate((t) => window.scrollTo({ top: t, behavior: 'instant' }), Math.max(0, geo.top - 300));
    const samples = [];
    for (const wait of [0, 200, 500, 1000, 2000, 3500]) {
      await page.waitForTimeout(wait === 0 ? 50 : wait - (samples.length ? 0 : 0));
      samples.push({ afterMs: wait, text: await page.evaluate((t) => { const el = document.elementsFromPoint(10, 10) && null; const n = [...document.querySelectorAll('*')].find((e) => /By the Numbers/i.test(e.textContent || '') && e.getBoundingClientRect().height > 60 && e.getBoundingClientRect().height < 600); return n ? (n.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 220) : null; }, 0) });
    }
    await ctx.close();
    return { geometry: geo, samples };
  };
  result.countUpStats = { normal: await read(false), reducedMotion: await read(true) };
}

// ---------- 3. mobile sticky CTA occlusion ----------
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(2500);
  await slowScroll(page);
  await page.waitForTimeout(1200);
  result.mobileStickyOverlays = await page.evaluate(() => {
    const vw = window.innerWidth, vh = window.innerHeight;
    return [...document.querySelectorAll('body *')].filter((el) => {
      const cs = getComputedStyle(el);
      if (cs.position !== 'fixed' && cs.position !== 'sticky') return false;
      const r = el.getBoundingClientRect();
      return r.width > 60 && r.height > 20 && r.bottom > vh * 0.6;
    }).map((el) => {
      const r = el.getBoundingClientRect();
      return {
        label: el.id ? '#' + el.id : el.tagName.toLowerCase() + '.' + String(el.className || '').trim().split(/\s+/)[0],
        position: getComputedStyle(el).position,
        rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
        viewportSharePct: +((r.width * r.height) / (vw * vh) * 100).toFixed(1),
        text: (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60),
      };
    }).slice(0, 8);
  });
  await ctx.close();
}

await browser.close();
fs.writeFileSync(path.join(OUT, 'probe-extras.json'), JSON.stringify(result, null, 2));
console.log('--- canvases (1440) ---');
for (const c of result.canvases) {
  console.log('  canvas' + c.i + ' ' + String(c.parent).slice(0, 22).padEnd(23) + c.w + 'x' + c.h + ' @y' + c.pageTop
    + '  fullPage std=' + (c.inFullPagePng ? c.inFullPagePng.std : 'n/a')
    + '  inViewport std=' + (c.inViewportPng ? c.inViewportPng.std : 'n/a')
    + '  paints(fullPage/viewport)=' + c.paintsInFullPage + '/' + c.paintsInViewport);
}
console.log('--- count-up ---');
for (const [k, v] of Object.entries(result.countUpStats)) {
  console.log('  ' + k + ': ' + (v.error || JSON.stringify(v.samples.map((s) => s.afterMs + 'ms:' + s.text), null, 1)));
}
console.log('--- mobile sticky overlays ---');
console.log(JSON.stringify(result.mobileStickyOverlays, null, 1));
