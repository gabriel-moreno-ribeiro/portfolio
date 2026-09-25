/**
 * qa/scripts/r2-extras.mjs - round-2 additions. Everything here answers a question
 * the r1 scripts cannot, all of it about the r1 fixes.
 *
 * Usage: node qa/scripts/r2-extras.mjs <outDir> [baseUrl]
 *
 * a) deep link <base>/#contact : does Contact mount and land on screen?
 * b) rail clicks from scrollY 0 : click "Experience" then "Contact"; is the target
 *    actually on screen after the smooth scroll settles (lazy section had to mount)?
 * c) 3D gating : count requests matching three / react-three / robot.glb in three
 *    phases - (1) load + 8s idle, (2) slow scroll through Experience and back,
 *    (3) pointermove over the hero. Also: does the page ever request d20.glb / studio.hdr?
 * d) car first frame : ms from navigation start until the poster <img> is loaded and
 *    on screen, and until the sprite canvas takes over (poster gets .is-hidden).
 * e) CPU 4x on Experience with long-animation-frame script attribution: the 5 longest
 *    frames with scripts[].sourceURL / invoker / invokerType, so a chunk download of
 *    another section is not blamed on the section under test.
 * f) sticker : when does it mount, and is the rendered pixel the bee or a black blob?
 * g) LazySection mount state after a full slow scroll: every section id must resolve
 *    to mounted content, not the reserved box.
 * h) hero paint : elements at computed opacity 0 in the hero at first frame, LCP element.
 *
 * Writes r2-extras.json plus sticker-{w}.png crops.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve(process.argv[2] || 'qa/r2');
const BASE = process.argv[3] || process.env.QA_BASE_URL || 'http://localhost:4173';
fs.mkdirSync(OUT, { recursive: true });
const ONLY = (process.env.QA_ONLY || '').split(',').filter(Boolean);
const want = (k) => ONLY.length === 0 || ONLY.includes(k);

const VIEWPORTS = [
  { w: 1440, h: 900, opts: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 } },
  { w: 390, h: 844, opts: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } },
];
const SECTION_IDS = ['main-content', 'background', 'work', 'research', 'skills', 'work-experience', 'contact'];
const THREE_RE = /(three|react-three|robot\.glb|d20\.glb|studio\.hdr)/i;

const report = { generatedAt: new Date().toISOString(), baseUrl: BASE, outDir: OUT, notes: [] };
const W = () => fs.writeFileSync(path.join(OUT, 'r2-extras.json'), JSON.stringify(report, null, 2));

const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });

// Records every request URL so gating questions are answered by the network, not by the DOM.
function netLog(page, bag) {
  page.on('request', (r) => bag.push({ url: r.url(), type: r.resourceType(), t: Date.now() }));
}

async function settle(page, ms = 1200) {
  try { await page.waitForLoadState('networkidle', { timeout: 20000 }); } catch { /* ignore */ }
  await page.waitForTimeout(ms);
}

async function slowScroll(page, step = 300, delay = 110) {
  return page.evaluate(async ({ step, delay }) => {
    const nap = (t) => new Promise((r) => setTimeout(r, t));
    const maxY = () => document.documentElement.scrollHeight - window.innerHeight;
    let y = 0, n = 0;
    while (y < maxY() && n < 600) { y = Math.min(y + step, maxY()); window.scrollTo({ top: y, behavior: 'instant' }); n++; await nap(delay); }
    return { steps: n, finalY: Math.round(window.scrollY), docHeight: document.documentElement.scrollHeight };
  }, { step, delay });
}

const mountState = (ids) => `(() => {
  const ids = ${JSON.stringify(ids)};
  return ids.map((id) => {
    const el = document.getElementById(id);
    if (!el) return { id, found: false };
    const r = el.getBoundingClientRect();
    // the reserved box is a bare <div id=..> with only a min-height and no children
    const reserved = el.tagName === 'DIV' && !el.className && el.children.length <= 1 && (el.textContent || '').trim().length === 0;
    return {
      id, found: true, tag: el.tagName.toLowerCase(), cls: String(el.className || '').slice(0, 40),
      top: Math.round(r.top + window.scrollY), h: Math.round(r.height),
      textChars: (el.textContent || '').replace(/\\s+/g, '').length,
      imgs: el.querySelectorAll('img').length, canvases: el.querySelectorAll('canvas').length,
      looksReserved: reserved,
    };
  });
})()`;

// ------------------------------------------------------------------ a) deep link
if (want('deeplink')) {
  report.deepLink = [];
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext(vp.opts);
    const page = await ctx.newPage();
    const net = []; netLog(page, net);
    await page.goto(BASE + '/#contact', { waitUntil: 'load', timeout: 60000 });
    await settle(page, 2500);
    const r = await page.evaluate(() => {
      const el = document.getElementById('contact');
      if (!el) return { found: false, scrollY: Math.round(window.scrollY) };
      const b = el.getBoundingClientRect();
      const form = el.querySelector('form') || el.querySelector('input,textarea');
      const h = el.querySelector('h1,h2,h3');
      return {
        found: true, scrollY: Math.round(window.scrollY),
        rectTop: Math.round(b.top), rectH: Math.round(b.height), innerH: window.innerHeight,
        inViewport: b.top < window.innerHeight && b.bottom > 0,
        topWithin: Math.abs(b.top) < 140,
        heading: h ? (h.textContent || '').trim().slice(0, 50) : null,
        hasForm: !!form, textChars: (el.textContent || '').replace(/\s+/g, '').length,
        maxScroll: document.documentElement.scrollHeight - window.innerHeight,
      };
    });
    const mounts = await page.evaluate(mountState(SECTION_IDS));
    r.viewport = vp.w; r.unmountedSections = mounts.filter((m) => m.looksReserved).map((m) => m.id);
    r.threeRequests = net.filter((n) => THREE_RE.test(n.url)).map((n) => n.url.split('/').pop());
    await page.screenshot({ path: path.join(OUT, `deeplink-contact-${vp.w}.png`), animations: 'allow' });
    report.deepLink.push(r);
    await ctx.close();
  }
  W(); console.log('>> deeplink done');
}

// ------------------------------------------------------------------ b) rail clicks
if (want('rail')) {
  report.railClicks = [];
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext(vp.opts);
    const page = await ctx.newPage();
    await page.goto(BASE + '/', { waitUntil: 'load', timeout: 60000 });
    await settle(page, 2000);
    const railVisible = await page.evaluate(() => {
      const nav = document.querySelector('nav.section-rail');
      if (!nav) return { present: false };
      const cs = getComputedStyle(nav); const r = nav.getBoundingClientRect();
      return { present: true, display: cs.display, visibility: cs.visibility, opacity: cs.opacity, w: Math.round(r.width), h: Math.round(r.height), items: nav.querySelectorAll('button').length };
    });
    const out = { viewport: vp.w, rail: railVisible, clicks: [] };
    for (const label of ['Experience', 'Contact']) {
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await page.waitForTimeout(700);
      const clicked = await page.evaluate((lbl) => {
        const btns = [...document.querySelectorAll('nav.section-rail button')];
        const b = btns.find((x) => (x.textContent || '').trim() === lbl);
        if (!b) return { ok: false, labels: btns.map((x) => (x.textContent || '').trim()) };
        b.click();
        return { ok: true };
      }, label);
      // the rail uses a smooth scroll; poll until scrollY stops moving
      let last = -1, stableFor = 0, waited = 0;
      while (waited < 12000 && stableFor < 3) {
        await page.waitForTimeout(250); waited += 250;
        const y = await page.evaluate(() => Math.round(window.scrollY));
        if (y === last) stableFor++; else { stableFor = 0; last = y; }
      }
      const id = label === 'Experience' ? 'work-experience' : 'contact';
      const landed = await page.evaluate((sid) => {
        const el = document.getElementById(sid);
        if (!el) return { found: false, scrollY: Math.round(window.scrollY) };
        const b = el.getBoundingClientRect();
        const first = el.querySelector('h1,h2,h3,li,p');
        const fb = first ? first.getBoundingClientRect() : null;
        return {
          found: true, scrollY: Math.round(window.scrollY), innerH: window.innerHeight,
          rectTop: Math.round(b.top), rectBottom: Math.round(b.bottom), rectH: Math.round(b.height),
          onScreen: b.top < window.innerHeight - 40 && b.bottom > 40,
          topNearViewportTop: b.top > -80 && b.top < 200,
          textChars: (el.textContent || '').replace(/\s+/g, '').length,
          firstContentOnScreen: fb ? (fb.top < window.innerHeight && fb.bottom > 0) : null,
          firstContentLabel: first ? first.tagName.toLowerCase() + ':' + (first.textContent || '').trim().slice(0, 32) : null,
          maxScroll: document.documentElement.scrollHeight - window.innerHeight,
        };
      }, id);
      out.clicks.push(Object.assign({ label, target: id, settleMs: waited }, clicked, landed));
      await page.screenshot({ path: path.join(OUT, `rail-${label.toLowerCase()}-${vp.w}.png`), animations: 'allow' });
    }
    report.railClicks.push(out);
    await ctx.close();
  }
  W(); console.log('>> rail done');
}

// ------------------------------------------------------------------ c) 3D gating
if (want('gating')) {
  report.gating = [];
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext(vp.opts);
    const page = await ctx.newPage();
    const net = []; netLog(page, net);
    const t0 = Date.now();
    await page.goto(BASE + '/', { waitUntil: 'load', timeout: 60000 });
    await settle(page, 1500);
    await page.waitForTimeout(8000); // idle: nothing must arrive on a timer
    const idle = net.filter((n) => THREE_RE.test(n.url)).map((n) => ({ f: n.url.split('/').pop(), ms: n.t - t0 }));
    const markA = net.length;

    const scrolled = await slowScroll(page);
    await page.waitForTimeout(1500);
    const duringScroll = net.slice(markA).filter((n) => THREE_RE.test(n.url)).map((n) => ({ f: n.url.split('/').pop(), ms: n.t - t0 }));
    const mountsAfterScroll = await page.evaluate(mountState(SECTION_IDS));
    const markB = net.length;

    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(1200);
    // a real pointer move over the hero
    await page.mouse.move(vp.w / 2, 300);
    await page.mouse.move(vp.w / 2 + 40, 340);
    await page.waitForTimeout(6000);
    const afterPointer = net.slice(markB).filter((n) => THREE_RE.test(n.url)).map((n) => ({ f: n.url.split('/').pop(), ms: n.t - t0 }));
    const canvasAfter = await page.evaluate(() => ({
      canvases: document.querySelectorAll('canvas').length,
      heroCanvas: !!document.querySelector('.hero-robot canvas'),
      posterHidden: (() => { const p = document.querySelector('.hero-robot__poster'); return p ? p.getAttribute('data-hidden') : null; })(),
    }));
    report.gating.push({
      viewport: vp.w, scrolled,
      phase1_loadPlus8sIdle: { count: idle.length, files: idle },
      phase2_scrollExperience: { count: duringScroll.length, files: duringScroll },
      phase3_afterPointermoveOnHero: { count: afterPointer.length, files: afterPointer.slice(0, 12) },
      canvasAfterPointer: canvasAfter,
      unmountedAfterFullScroll: mountsAfterScroll.filter((m) => m.looksReserved).map((m) => m.id),
      mountsAfterFullScroll: mountsAfterScroll,
      totalRequests: net.length,
      d20orHdrEverRequested: net.filter((n) => /d20\.glb|studio\.hdr/i.test(n.url)).map((n) => n.url),
    });
    await ctx.close();
  }
  W(); console.log('>> gating done');
}

// ------------------------------------------------------------------ d) car first frame
if (want('car')) {
  report.carFirstFrame = [];
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext(vp.opts);
    const page = await ctx.newPage();
    await page.addInitScript(`window.__qaNav = performance.now();`);
    await page.goto(BASE + '/', { waitUntil: 'load', timeout: 60000 });
    await settle(page, 800);
    // walk down to the Experience section the way a reader would
    const geo = await page.evaluate(async () => {
      const nap = (t) => new Promise((r) => setTimeout(r, t));
      const maxY = () => document.documentElement.scrollHeight - window.innerHeight;
      let y = 0;
      const exists = () => document.getElementById('work-experience');
      while (y < maxY()) {
        y = Math.min(y + 400, maxY()); window.scrollTo({ top: y, behavior: 'instant' }); await nap(90);
        const el = exists();
        if (el && el.querySelector('.exp__poster')) break;
      }
      const el = exists();
      const top = el ? Math.round(el.getBoundingClientRect().top + window.scrollY) : null;
      window.scrollTo({ top: top == null ? y : top, behavior: 'instant' });
      return { parkedAt: Math.round(window.scrollY), sectionTop: top };
    });
    const t = await page.evaluate(() => new Promise((resolve) => {
      const t0 = performance.now();
      const started = window.__qaNav || 0;
      let posterMs = null, spriteMs = null;
      const tick = () => {
        const p = document.querySelector('.exp__poster');
        const c = document.querySelector('.exp__sprite');
        if (p && posterMs == null) {
          const r = p.getBoundingClientRect();
          const onScreen = r.top < window.innerHeight && r.bottom > 0 && r.width > 4;
          if (p.complete && p.naturalWidth > 0 && onScreen && !p.classList.contains('is-hidden')) posterMs = Math.round(performance.now() - started);
        }
        if (p && spriteMs == null && p.classList.contains('is-hidden')) spriteMs = Math.round(performance.now() - started);
        if ((posterMs != null && spriteMs != null) || performance.now() - t0 > 15000) {
          const p2 = document.querySelector('.exp__poster');
          const c2 = document.querySelector('.exp__sprite');
          resolve({
            posterVisibleMsSinceNav: posterMs, spriteTakeoverMsSinceNav: spriteMs,
            waitedMs: Math.round(performance.now() - t0),
            posterPresent: !!p2, posterComplete: p2 ? p2.complete : null, posterNatural: p2 ? p2.naturalWidth + 'x' + p2.naturalHeight : null,
            posterSrc: p2 ? p2.getAttribute('src') : null,
            posterHidden: p2 ? p2.classList.contains('is-hidden') : null,
            canvasBitmap: c2 ? c2.width + 'x' + c2.height : null,
            canvasCssW: c2 ? Math.round(c2.getBoundingClientRect().width) : null,
          });
          return;
        }
        requestAnimationFrame(tick);
      };
      tick();
    }));
    report.carFirstFrame.push(Object.assign({ viewport: vp.w }, geo, t));
    await page.screenshot({ path: path.join(OUT, `car-firstframe-${vp.w}.png`), animations: 'allow' });
    await ctx.close();
  }
  W(); console.log('>> car done');
}

// ------------------------------------------------------------------ e) CPU 4x attributed
if (want('cpu')) {
  report.cpuAttributed = [];
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext(vp.opts);
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    const net = []; netLog(page, net);
    await page.goto(BASE + '/', { waitUntil: 'load', timeout: 60000 });
    await settle(page, 1500);
    // park just above the section so its chunk is already mounted, then throttle
    const geo = await page.evaluate(async () => {
      const nap = (t) => new Promise((r) => setTimeout(r, t));
      const maxY = () => document.documentElement.scrollHeight - window.innerHeight;
      let y = 0;
      while (y < maxY()) {
        y = Math.min(y + 400, maxY()); window.scrollTo({ top: y, behavior: 'instant' }); await nap(80);
        const el = document.getElementById('work-experience');
        if (el && el.querySelector('li[id^=exp-]')) break;
      }
      const el = document.getElementById('work-experience');
      const r = el.getBoundingClientRect();
      const top = Math.round(r.top + window.scrollY);
      return { sectionTop: top, sectionHeight: Math.round(r.height), innerHeight: window.innerHeight, docMaxScroll: maxY(), scrollStart: top, scrollEnd: Math.min(maxY(), top + Math.round(r.height) - window.innerHeight) };
    });
    await page.waitForTimeout(1200);
    const netMark = net.length;
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await page.waitForTimeout(500);
    const obsType = await page.evaluate(() => {
      window.__qa2 = [];
      const sup = PerformanceObserver.supportedEntryTypes || [];
      const type = sup.includes('long-animation-frame') ? 'long-animation-frame' : sup.includes('longtask') ? 'longtask' : null;
      if (!type) return null;
      window.__qa2obs = new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          const j = typeof e.toJSON === 'function' ? e.toJSON() : {};
          window.__qa2.push({
            start: Math.round(e.startTime), duration: Math.round(e.duration),
            blocking: Math.round(e.blockingDuration || 0),
            renderStart: j.renderStart ? Math.round(j.renderStart) : null,
            styleAndLayoutStart: j.styleAndLayoutStart ? Math.round(j.styleAndLayoutStart) : null,
            scripts: (j.scripts || []).map((s) => ({
              dur: Math.round(s.duration || 0), name: s.name || null, invoker: s.invoker || null,
              invokerType: s.invokerType || null, sourceURL: s.sourceURL || null,
              sourceFunctionName: s.sourceFunctionName || null, sourceCharPosition: s.sourceCharPosition ?? null,
              forcedStyleAndLayoutDuration: Math.round(s.forcedStyleAndLayoutDuration || 0),
              pauseDuration: Math.round(s.pauseDuration || 0),
            })).sort((a, b) => b.dur - a.dur).slice(0, 6),
          });
        }
      });
      window.__qa2obs.observe({ type, buffered: false });
      window.__qaT0 = performance.now();
      window.__qaRaf = []; let last = performance.now();
      window.__qaRafOn = true;
      const tick = (t) => { window.__qaRaf.push(Math.round(t - last)); last = t; if (window.__qaRafOn) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
      return type;
    });
    await page.evaluate(async ({ start, end }) => {
      const nap = (t) => new Promise((r) => setTimeout(r, t));
      window.scrollTo({ top: start, behavior: 'instant' }); await nap(300);
      for (let i = 1; i <= 40; i++) { window.scrollTo({ top: Math.round(start + ((end - start) * i) / 40), behavior: 'instant' }); await nap(100); }
    }, { start: geo.scrollStart, end: geo.scrollEnd });
    const data = await page.evaluate(() => {
      window.__qaRafOn = false;
      if (window.__qa2obs) { try { window.__qa2obs.disconnect(); } catch { /* noop */ } }
      const raf = window.__qaRaf || []; const s = raf.slice().sort((a, b) => a - b);
      return {
        long: window.__qa2 || [], durationMs: Math.round(performance.now() - window.__qaT0),
        rafFrames: raf.length, rafOver50: raf.filter((d) => d > 50).length,
        rafMax: raf.length ? Math.max.apply(null, raf) : 0,
        rafMedian: raf.length ? s[Math.floor(raf.length / 2)] : 0, rafP95: raf.length ? s[Math.floor(raf.length * 0.95)] : 0,
      };
    });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
    const sorted = data.long.slice().sort((a, b) => b.duration - a.duration);
    report.cpuAttributed.push({
      viewport: vp.w, entryType: obsType, geometry: geo, note: 'section pre-mounted before throttling (its chunk is already parsed)',
      observedWindowMs: data.durationMs,
      framesOver50ms: data.long.filter((e) => e.duration > 50).length,
      framesOver100ms: data.long.filter((e) => e.duration > 100).length,
      longestMs: sorted.length ? sorted[0].duration : 0,
      totalBlockingMs: data.long.reduce((s2, e) => s2 + Math.max(0, e.duration - 50), 0),
      top5: sorted.slice(0, 5),
      rafStats: { frames: data.rafFrames, framesOver50ms: data.rafOver50, maxFrameMs: data.rafMax, medianFrameMs: data.rafMedian, p95FrameMs: data.rafP95, effectiveFps: data.durationMs ? Math.round((data.rafFrames / data.durationMs) * 1000) : null },
      requestsDuringThrottledScroll: net.slice(netMark).map((n) => n.url.split('/').pop()).slice(0, 25),
    });
    await ctx.close();
  }
  W(); console.log('>> cpu attributed done');
}

// ------------------------------------------------------------------ f) sticker
if (want('sticker')) {
  report.sticker = [];
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext(vp.opts);
    const page = await ctx.newPage();
    const net = []; netLog(page, net);
    const t0 = Date.now();
    await page.goto(BASE + '/', { waitUntil: 'load', timeout: 60000 });
    await settle(page, 1000);
    const noInteraction = await page.evaluate(() => ({ present: !!document.querySelector('.sticker-image'), stage: !!document.querySelector('.sticker-stage') }));
    await page.waitForTimeout(7500); // the 6s fallback
    const after6s = await page.evaluate(() => {
      const img = document.querySelector('.sticker-image');
      if (!img) return { present: false };
      const r = img.getBoundingClientRect();
      const cs = getComputedStyle(img);
      const outer = document.querySelector('.sticker-stage');
      const or = outer ? outer.getBoundingClientRect() : null;
      return {
        present: true, complete: img.complete, natural: img.naturalWidth + 'x' + img.naturalHeight,
        src: img.getAttribute('src'), attrW: img.getAttribute('width'), attrH: img.getAttribute('height'),
        renderedW: Math.round(r.width), renderedH: Math.round(r.height),
        filter: cs.filter, opacity: cs.opacity, mixBlendMode: cs.mixBlendMode,
        onScreen: r.top < window.innerHeight && r.bottom > 0 && r.width > 4,
        stageRect: or ? { top: Math.round(or.top), left: Math.round(or.left), w: Math.round(or.width), h: Math.round(or.height) } : null,
      };
    });
    const r2 = { viewport: vp.w, mountedBeforeInteraction: noInteraction, after6sIdle: after6s, msToFirstStickerRequest: null };
    const sreq = net.find((n) => /sticker|hibeex/i.test(n.url) && /\.(png|webp|avif|jpg)/i.test(n.url));
    if (sreq) { r2.msToFirstStickerRequest = sreq.t - t0; r2.stickerAsset = sreq.url.split('/').pop(); }
    // pixel check: is it the bee (colourful, several hues) or a black blob?
    if (after6s.present && after6s.onScreen) {
      const el = await page.$('.sticker-image');
      try { await el.screenshot({ path: path.join(OUT, `sticker-${vp.w}.png`), animations: 'allow' }); r2.crop = `sticker-${vp.w}.png`; } catch (e) { report.notes.push('sticker crop ' + vp.w + ': ' + e.message); }
      r2.pixels = await page.evaluate(async () => {
        const img = document.querySelector('.sticker-image');
        const c = document.createElement('canvas');
        c.width = 64; c.height = 64;
        const g = c.getContext('2d');
        try { g.drawImage(img, 0, 0, 64, 64); } catch (e) { return { error: String(e.message) }; }
        let d;
        try { d = g.getImageData(0, 0, 64, 64).data; } catch (e) { return { error: 'tainted: ' + e.message }; }
        let opaque = 0, dark = 0, sat = 0, sumR = 0, sumG = 0, sumB = 0;
        for (let i = 0; i < d.length; i += 4) {
          if (d[i + 3] < 24) continue;
          opaque++; sumR += d[i]; sumG += d[i + 1]; sumB += d[i + 2];
          const mx = Math.max(d[i], d[i + 1], d[i + 2]), mn = Math.min(d[i], d[i + 1], d[i + 2]);
          if (mx < 48) dark++;
          if (mx - mn > 40) sat++;
        }
        return opaque ? {
          opaquePx: opaque, darkFraction: +(dark / opaque).toFixed(3), saturatedFraction: +(sat / opaque).toFixed(3),
          meanRGB: [Math.round(sumR / opaque), Math.round(sumG / opaque), Math.round(sumB / opaque)],
        } : { opaquePx: 0 };
      });
    }
    report.sticker.push(r2);
    await ctx.close();
  }
  W(); console.log('>> sticker done');
}

// ------------------------------------------------------------------ h) hero first paint
if (want('hero')) {
  report.heroPaint = [];
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext(vp.opts);
    const page = await ctx.newPage();
    await page.addInitScript(`(() => {
      window.__qaLCP = [];
      try {
        new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__qaLCP.push({ ms: Math.round(e.startTime), size: e.size, tag: e.element ? e.element.tagName.toLowerCase() : null, cls: e.element ? String(e.element.className || '').slice(0, 40) : null, url: e.url || null }); }).observe({ type: 'largest-contentful-paint', buffered: true });
      } catch (e) { /* noop */ }
      try {
        new PerformanceObserver((l) => { window.__qaFCP = window.__qaFCP || []; for (const e of l.getEntries()) window.__qaFCP.push({ name: e.name, ms: Math.round(e.startTime) }); }).observe({ type: 'paint', buffered: true });
      } catch (e) { /* noop */ }
    })();`);
    await page.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    // snapshot the hero while the entrance animation is still running
    await page.waitForTimeout(80);
    const early = await page.evaluate(() => {
      const hero = document.querySelector('.hero-section');
      if (!hero) return { found: false };
      const zero = [];
      for (const el of hero.querySelectorAll('*')) {
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) continue;
        if (parseFloat(cs.opacity) < 0.05) zero.push({ label: el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ')[0] : ''), opacity: cs.opacity, transform: cs.transform.slice(0, 40), w: Math.round(r.width), h: Math.round(r.height) });
      }
      const h1 = document.querySelector('.hero-section h1');
      const desc = document.querySelector('.hero-section p');
      const cs1 = h1 ? getComputedStyle(h1) : null;
      return {
        found: true, heroH: Math.round(hero.getBoundingClientRect().height),
        elementsAtOpacityZero: zero.slice(0, 15), countAtOpacityZero: zero.length,
        h1: h1 ? { opacity: cs1.opacity, transform: cs1.transform.slice(0, 48), text: (h1.textContent || '').trim().slice(0, 40) } : null,
        descOpacity: desc ? getComputedStyle(desc).opacity : null,
      };
    });
    await settle(page, 2500);
    const metrics = await page.evaluate(() => ({ lcp: window.__qaLCP || [], fcp: window.__qaFCP || [] }));
    const slideshow = await page.evaluate(() => {
      const el = document.querySelector('.hero-slideshow');
      if (!el) return { present: false };
      return { present: true, imgs: [...el.querySelectorAll('img')].map((i) => ({ src: (i.currentSrc || i.src || '').split('/').pop(), natural: i.naturalWidth + 'x' + i.naturalHeight, loading: i.getAttribute('loading') })) };
    });
    const moments = await page.evaluate(() => {
      const el = document.querySelector('#moments');
      if (!el) return { present: false };
      const imgs = [...el.querySelectorAll('img')];
      return { present: true, total: imgs.length, eager: imgs.filter((i) => i.getAttribute('loading') !== 'lazy').length, lazy: imgs.filter((i) => i.getAttribute('loading') === 'lazy').length };
    });
    report.heroPaint.push({ viewport: vp.w, at80ms: early, lcpCandidates: (metrics.lcp || []).slice(-4), fcp: metrics.fcp, slideshow, moments });
    await ctx.close();
  }
  W(); console.log('>> hero done');
}

await browser.close();
W();
console.log('r2-extras written to ' + path.join(OUT, 'r2-extras.json'));
