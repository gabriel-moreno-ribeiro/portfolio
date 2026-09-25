/**
 * qa/scripts/section-diff.mjs - turns the full-page screenshots into per-section
 * measurements so "this section looks empty/partial" is a number, not an opinion.
 *
 * Usage: node qa/scripts/section-diff.mjs <outDir> [baseUrl]
 * Ex.:   node qa/scripts/section-diff.mjs qa/baseline http://localhost:5173
 *
 * Requires capture.mjs to have run first (needs home-*-top/scrolled/rm-*.png).
 * Writes sections-{w}.json, section-report.json and crops/ thumbnails.
 */
import { chromium } from 'playwright';
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve(process.argv[2] || 'qa/baseline');
const BASE = process.argv[3] || process.env.QA_BASE_URL || 'http://localhost:5173';
const CROPS = path.join(OUT, 'crops');
fs.mkdirSync(CROPS, { recursive: true });

const VIEWPORTS = [
  { w: 1440, h: 900, opts: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 } },
  { w: 390, h: 844, opts: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } },
];

async function sectionMap(browser, vp, reduced) {
  const ctx = await browser.newContext(reduced ? Object.assign({}, vp.opts, { reducedMotion: 'reduce' }) : vp.opts);
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'load', timeout: 60000 });
  try { await page.waitForLoadState('networkidle', { timeout: 25000 }); } catch { /* ignore */ }
  await page.waitForTimeout(1500);
  // slow scroll so every lazy section is mounted and measurable
  await page.evaluate(async () => {
    const nap = (ms) => new Promise((r) => setTimeout(r, ms));
    const maxY = () => document.documentElement.scrollHeight - window.innerHeight;
    let y = 0;
    while (y < maxY()) { y = Math.min(y + 300, maxY()); window.scrollTo({ top: y, behavior: 'instant' }); await nap(120); }
  });
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(1000);
  const data = await page.evaluate(() => {
    const label = (el) => (el.id ? '#' + el.id : el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/)[0] : ''));
    const root = document.querySelector('main#main-content') || document.querySelector('main') || document.body;
    const kids = [...root.children].filter((el) => {
      const cs = getComputedStyle(el);
      return cs.position !== 'fixed' && el.getBoundingClientRect().height > 8;
    });
    const secs = kids.map((el) => {
      const r = el.getBoundingClientRect();
      const heading = el.querySelector('h1,h2,h3');
      return {
        label: label(el), tag: el.tagName.toLowerCase(),
        top: Math.round(r.top + window.scrollY), height: Math.round(r.height),
        heading: heading ? (heading.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 50) : null,
        textChars: (el.textContent || '').replace(/\s+/g, '').length,
        imgs: el.querySelectorAll('img').length,
        canvases: el.querySelectorAll('canvas').length,
      };
    });
    const exp = document.querySelector('#work-experience');
    const expCols = exp ? {
      left: (() => { const e = exp.querySelector('.left-column'); if (!e) return null; const r = e.getBoundingClientRect(); return { top: Math.round(r.top + window.scrollY), left: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height), childCount: e.children.length, textChars: (e.textContent || '').replace(/\s+/g, '').length, canvases: e.querySelectorAll('canvas').length }; })(),
      right: (() => { const e = exp.querySelector('.right-column'); if (!e) return null; const r = e.getBoundingClientRect(); return { top: Math.round(r.top + window.scrollY), left: Math.round(r.left), w: Math.round(r.width), h: Math.round(r.height), childCount: e.children.length, textChars: (e.textContent || '').replace(/\s+/g, '').length }; })(),
    } : null;
    // horizontal overflow: a full-page screenshot is scrollWidth wide, so this
    // also explains any width mismatch in the PNGs
    const de = document.documentElement;
    const overflowers = [...document.querySelectorAll('body *')].filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && (r.right > window.innerWidth + 2 || r.left < -2) && getComputedStyle(el).position !== 'fixed';
    }).map((el) => ({ label: label(el), left: Math.round(el.getBoundingClientRect().left), right: Math.round(el.getBoundingClientRect().right), w: Math.round(el.getBoundingClientRect().width) }));
    return {
      docHeight: de.scrollHeight,
      viewportW: window.innerWidth, dpr: window.devicePixelRatio,
      horizontalOverflow: {
        innerWidth: window.innerWidth, docScrollWidth: de.scrollWidth, bodyScrollWidth: document.body.scrollWidth,
        overflowPx: de.scrollWidth - window.innerWidth,
        offenderCount: overflowers.length, offenders: overflowers.slice(0, 15),
      },
      sections: secs, experienceColumns: expCols,
      fixedOverlays: [...document.body.querySelectorAll('*')].filter((el) => getComputedStyle(el).position === 'fixed' && el.getBoundingClientRect().height > 20).map((el) => ({ label: label(el), h: Math.round(el.getBoundingClientRect().height), w: Math.round(el.getBoundingClientRect().width) })).slice(0, 12),
    };
  });
  await ctx.close();
  fs.writeFileSync(path.join(OUT, 'sections-' + vp.w + (reduced ? '-rm' : '') + '.json'), JSON.stringify(data, null, 2));
  return data;
}

// Per-band stats: how much visual content is actually there.
async function bandStats(file, yTop, yBot, scale) {
  const img = sharp(file);
  const meta = await img.metadata();
  const top = Math.max(0, Math.round(yTop * scale));
  const bottom = Math.min(meta.height, Math.round(yBot * scale));
  const h = bottom - top;
  if (h <= 2) return null;
  const buf = await sharp(file).extract({ left: 0, top, width: meta.width, height: h })
    .resize({ width: 240, height: Math.max(1, Math.round((h / meta.width) * 240)), fit: 'fill' })
    .greyscale().raw().toBuffer({ resolveWithObject: true });
  const px = buf.data;
  let sum = 0;
  for (let i = 0; i < px.length; i++) sum += px[i];
  const mean = sum / px.length;
  let varS = 0;
  for (let i = 0; i < px.length; i++) varS += (px[i] - mean) ** 2;
  const std = Math.sqrt(varS / px.length);
  // fraction of pixels that differ from the band's modal (background) value
  const hist = new Array(256).fill(0);
  for (let i = 0; i < px.length; i++) hist[px[i]]++;
  let mode = 0;
  for (let i = 1; i < 256; i++) if (hist[i] > hist[mode]) mode = i;
  let ink = 0;
  for (let i = 0; i < px.length; i++) if (Math.abs(px[i] - mode) > 12) ink++;
  return {
    imgHeight: meta.height, bandPx: h,
    mean: +mean.toFixed(1), std: +std.toFixed(2),
    inkFraction: +(ink / px.length).toFixed(4),
    modalGrey: mode,
    thumbW: 240, thumbH: buf.info.height,
  };
}

async function diffBands(fileA, fileB, yTop, yBot, scaleA, scaleB) {
  const mk = async (f, s) => {
    const meta = await sharp(f).metadata();
    const top = Math.max(0, Math.round(yTop * s));
    const bottom = Math.min(meta.height, Math.round(yBot * s));
    if (bottom - top <= 2) return null;
    return sharp(f).extract({ left: 0, top, width: meta.width, height: bottom - top })
      .resize({ width: 200, height: 200, fit: 'fill' }).greyscale().raw().toBuffer();
  };
  const [a, b] = await Promise.all([mk(fileA, scaleA), mk(fileB, scaleB)]);
  if (!a || !b) return null;
  let d = 0, changed = 0;
  for (let i = 0; i < a.length; i++) { const x = Math.abs(a[i] - b[i]); d += x; if (x > 16) changed++; }
  return { meanAbsDiff: +(d / a.length).toFixed(2), changedFraction: +(changed / a.length).toFixed(4) };
}

async function diffBands2(fileA, fileB, aTop, aBot, bTop, bBot, scaleA, scaleB) {
  const mk = async (f, yT, yB, sc) => {
    const meta = await sharp(f).metadata();
    const top = Math.max(0, Math.round(yT * sc));
    const bottom = Math.min(meta.height, Math.round(yB * sc));
    if (bottom - top <= 2) return null;
    return sharp(f).extract({ left: 0, top, width: meta.width, height: bottom - top })
      .resize({ width: 200, height: 200, fit: 'fill' }).greyscale().raw().toBuffer();
  };
  const [a, b] = await Promise.all([mk(fileA, aTop, aBot, scaleA), mk(fileB, bTop, bBot, scaleB)]);
  if (!a || !b) return null;
  let d = 0, changed = 0;
  for (let i = 0; i < a.length; i++) { const x = Math.abs(a[i] - b[i]); d += x; if (x > 16) changed++; }
  return { meanAbsDiff: +(d / a.length).toFixed(2), changedFraction: +(changed / a.length).toFixed(4) };
}

const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const report = { generatedAt: new Date().toISOString(), method: 'full-page PNGs sliced into per-section bands; std = greyscale stddev, inkFraction = share of pixels >12 grey levels from the band modal value (a band that renders nothing sits near std<6 / ink<0.02)', viewports: {} };

for (const vp of VIEWPORTS) {
  const map = await sectionMap(browser, vp, false);
  const mapRM = await sectionMap(browser, vp, true);
  const rmTopOf = (label) => { const m = mapRM.sections.find((x) => x.label === label); return m ? { top: m.top, height: m.height } : null; };
  const files = {
    top: path.join(OUT, 'home-' + vp.w + '-top.png'),
    scrolled: path.join(OUT, 'home-' + vp.w + '-scrolled.png'),
    rmTop: path.join(OUT, 'home-' + vp.w + '-rm-top.png'),
    rmScrolled: path.join(OUT, 'home-' + vp.w + '-rm-scrolled.png'),
  };
  // A Playwright full-page PNG is scrollWidth x scrollHeight CSS px multiplied by
  // deviceScaleFactor. Using imgWidth/viewportWidth as the scale is wrong whenever
  // the page overflows horizontally, so the DPR is used instead.
  const dpr = (vp.opts.deviceScaleFactor || 1);
  const scales = {};
  for (const [k, f] of Object.entries(files)) {
    if (!fs.existsSync(f)) { scales[k] = null; continue; }
    const m = await sharp(f).metadata();
    scales[k] = { scale: dpr, width: m.width, height: m.height, cssWidth: Math.round(m.width / dpr), cssHeight: Math.round(m.height / dpr), horizontalOverflowPx: Math.round(m.width / dpr) - vp.w };
  }
  const rows = [];
  for (const s of map.sections) {
    const row = { label: s.label, heading: s.heading, cssTop: s.top, cssHeight: s.height, textChars: s.textChars, imgs: s.imgs, canvases: s.canvases, states: {}, diffs: {} };
    // reduced-motion changes the document height, so rm bands use geometry
    // measured in a reduced-motion context instead of the normal-motion offsets
    const rmGeo = rmTopOf(s.label);
    row.rmGeometry = rmGeo;
    for (const [k, f] of Object.entries(files)) {
      if (!scales[k]) continue;
      const g = k.startsWith('rm') ? rmGeo : { top: s.top, height: s.height };
      row.states[k] = g ? await bandStats(f, g.top, g.top + g.height, scales[k].scale) : null;
    }
    row.diffs.topVsScrolled = scales.top && scales.scrolled ? await diffBands(files.top, files.scrolled, s.top, s.top + s.height, scales.top.scale, scales.scrolled.scale) : null;
    row.diffs.scrolledVsRmScrolled = scales.scrolled && scales.rmScrolled && rmGeo
      ? await diffBands2(files.scrolled, files.rmScrolled, s.top, s.top + s.height, rmGeo.top, rmGeo.top + rmGeo.height, scales.scrolled.scale, scales.rmScrolled.scale) : null;
    row.diffs.topVsRmTop = scales.top && scales.rmTop && rmGeo
      ? await diffBands2(files.top, files.rmTop, s.top, s.top + s.height, rmGeo.top, rmGeo.top + rmGeo.height, scales.top.scale, scales.rmTop.scale) : null;
    // thumbnail crop of the scrolled state for eyeballing
    if (scales.scrolled) {
      const m = scales.scrolled;
      const top = Math.max(0, Math.round(s.top * m.scale));
      const bh = Math.min(m.height - top, Math.round(s.height * m.scale));
      if (bh > 4) {
        await sharp(files.scrolled).extract({ left: 0, top, width: m.width, height: bh })
          .resize({ width: 420 }).png({ compressionLevel: 9 })
          .toFile(path.join(CROPS, vp.w + '-' + s.label.replace(/[^a-zA-Z0-9]/g, '_') + '-scrolled.png'));
      }
    }
    rows.push(row);
  }
  report.viewports[vp.w] = { docHeight: map.docHeight, docHeightReducedMotion: mapRM.docHeight, docHeightDeltaWithReduce: mapRM.docHeight - map.docHeight, dpr: map.dpr, horizontalOverflow: map.horizontalOverflow, imageInfo: scales, experienceColumns: map.experienceColumns, fixedOverlays: map.fixedOverlays, sections: rows };
}
await browser.close();
fs.writeFileSync(path.join(OUT, 'section-report.json'), JSON.stringify(report, null, 2));

for (const [w, v] of Object.entries(report.viewports)) {
  console.log('=== ' + w + ' docHeight=' + v.docHeight + ' dpr=' + v.dpr + ' imgs=' + Object.entries(v.imageInfo).map(([k, i]) => k + ':' + (i ? i.width + 'x' + i.height + '(css ' + i.cssWidth + 'x' + i.cssHeight + ', hOverflow ' + i.horizontalOverflowPx + 'px)' : 'missing')).join(' '));
  console.log('  docHeight normal=' + v.docHeight + ' reduced=' + v.docHeightReducedMotion + ' delta=' + v.docHeightDeltaWithReduce + 'px');
  console.log('  horizontalOverflow: ' + JSON.stringify(v.horizontalOverflow ? { innerWidth: v.horizontalOverflow.innerWidth, docScrollWidth: v.horizontalOverflow.docScrollWidth, overflowPx: v.horizontalOverflow.overflowPx, offenderCount: v.horizontalOverflow.offenderCount } : null));
  console.log('  offenders: ' + JSON.stringify((v.horizontalOverflow && v.horizontalOverflow.offenders || []).slice(0, 8)));
  console.log('  ' + 'section'.padEnd(26) + 'cssTop  h'.padEnd(12) + ' std(top/scr/rmT/rmS)        ink(top/scr/rmT/rmS)        diff t-vs-s / s-vs-rmS');
  for (const r of v.sections) {
    const g = (k, f) => (r.states[k] ? String(r.states[k][f]).padStart(6) : '   n/a');
    console.log('  ' + r.label.slice(0, 25).padEnd(26)
      + String(r.cssTop).padStart(5) + ' ' + String(r.cssHeight).padStart(5) + '  '
      + [g('top', 'std'), g('scrolled', 'std'), g('rmTop', 'std'), g('rmScrolled', 'std')].join('') + '  '
      + [g('top', 'inkFraction'), g('scrolled', 'inkFraction'), g('rmTop', 'inkFraction'), g('rmScrolled', 'inkFraction')].join('') + '  '
      + (r.diffs.topVsScrolled ? r.diffs.topVsScrolled.changedFraction : 'n/a') + ' / '
      + (r.diffs.scrolledVsRmScrolled ? r.diffs.scrolledVsRmScrolled.changedFraction : 'n/a'));
  }
  console.log('  experienceColumns: ' + JSON.stringify(v.experienceColumns));
}
