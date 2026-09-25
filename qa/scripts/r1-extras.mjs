/**
 * qa/scripts/r1-extras.mjs - round-1 additions on top of capture/section-diff/probe-extras.
 * Usage: node qa/scripts/r1-extras.mjs <outDir> [baseUrl]
 *
 * a) Experience viewport shots at 25/50/100% of the section scroll with
 *    document.documentElement[data-theme="dark"] (art-direction review).
 * b) #skills idle cost: park the section in the viewport, wait 8s, then count how
 *    many times the PAGE schedules requestAnimationFrame over 2s (window.rAF is
 *    instrumented at document start, so a self-scheduled probe loop is not counted)
 *    and whether the physics canvas pixels still change. Also: does the page scroll
 *    from a touch drag started OUTSIDE the canvas at 390?
 * c) hidden tab: override document.hidden/visibilityState, dispatch visibilitychange,
 *    then count page-scheduled rAF, live setInterval/setTimeout fires and network
 *    requests over 5s.
 * d) hero height, normal vs prefers-reduced-motion, both viewports.
 * e) every interactive target smaller than 24x24 CSS px.
 * f) <img> without intrinsic dimensions (no width/height attrs and no CSS aspect-ratio).
 *
 * Writes r1-extras.json + experience-dark-{w}-{25,50,100}.png + skills-canvas-*.png
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve(process.argv[2] || 'qa/r1');
const BASE = process.argv[3] || process.env.QA_BASE_URL || 'http://localhost:5173';
fs.mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { w: 1440, h: 900, opts: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 } },
  { w: 390, h: 844, opts: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } },
];

// Instrument the timers/rAF the PAGE uses, at document start, so the probe can
// separate "the app is still animating" from "the probe asked for a frame".
const INIT = `(() => {
  window.__qaTick = { raf: 0, interval: 0, timeout: 0, intervalsAlive: 0, rafIgnored: 0 };
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = function (cb) {
    if (cb && cb.__qaProbe) { window.__qaTick.rafIgnored++; return raf(cb); }
    window.__qaTick.raf++;
    return raf(cb);
  };
  const si = window.setInterval.bind(window);
  window.setInterval = function (fn, ms, ...rest) {
    const wrapped = typeof fn === 'function' ? function (...a) { window.__qaTick.interval++; return fn.apply(this, a); } : fn;
    window.__qaTick.intervalsAlive++;
    return si(wrapped, ms, ...rest);
  };
  const ci = window.clearInterval.bind(window);
  window.clearInterval = function (id) { if (id != null) window.__qaTick.intervalsAlive--; return ci(id); };
  const st = window.setTimeout.bind(window);
  window.setTimeout = function (fn, ms, ...rest) {
    const wrapped = typeof fn === 'function' ? function (...a) { window.__qaTick.timeout++; return fn.apply(this, a); } : fn;
    return st(wrapped, ms, ...rest);
  };
})();`;

const J = (n, d) => fs.writeFileSync(path.join(OUT, n), JSON.stringify(d, null, 2));

async function load(page, base = BASE) {
  await page.goto(base + '/', { waitUntil: 'load', timeout: 60000 });
  try { await page.waitForLoadState('networkidle', { timeout: 25000 }); } catch { /* ignore */ }
  await page.waitForTimeout(1500);
}
const slowScroll = (page) => page.evaluate(async () => {
  const nap = (ms) => new Promise((r) => setTimeout(r, ms));
  const maxY = () => document.documentElement.scrollHeight - window.innerHeight;
  let y = 0, n = 0;
  while (y < maxY() && n < 400) { y = Math.min(y + 300, maxY()); window.scrollTo({ top: y, behavior: 'instant' }); n++; await nap(110); }
});
const geoOf = (page, sel) => page.evaluate((s) => {
  const el = document.querySelector(s);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  const top = r.top + window.scrollY;
  const maxY = document.documentElement.scrollHeight - window.innerHeight;
  return {
    top: Math.round(top), height: Math.round(r.height), innerHeight: window.innerHeight,
    scrollStart: Math.round(Math.max(0, Math.min(top, maxY))),
    scrollEnd: Math.round(Math.max(0, Math.min(top + r.height - window.innerHeight, maxY))),
  };
}, sel);

const result = { generatedAt: new Date().toISOString(), baseUrl: BASE, outDir: OUT };
const browser = await chromium.launch({
  headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'],
});

// ---------------------------------------------------- a) dark-theme Experience
result.darkThemeExperience = [];
for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext(vp.opts);
  const page = await ctx.newPage();
  await page.addInitScript(INIT);
  await load(page);
  const themeBefore = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await page.waitForTimeout(600);
  await slowScroll(page);
  await page.waitForTimeout(1200);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(800);
  // re-assert in case a theme store re-rendered over it
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  const geo = await geoOf(page, '#work-experience');
  const shots = [];
  for (const pct of [25, 50, 100]) {
    const y = Math.round(geo.scrollStart + ((geo.scrollEnd - geo.scrollStart) * pct) / 100);
    await page.evaluate((t) => window.scrollTo({ top: t, behavior: 'instant' }), y);
    await page.waitForTimeout(900);
    const f = 'experience-dark-' + vp.w + '-' + pct + '.png';
    await page.screenshot({ path: path.join(OUT, f), animations: 'allow' });
    shots.push({ pct, scrollY: y, file: f, bytes: fs.statSync(path.join(OUT, f)).size });
  }
  const themeAfter = await page.evaluate(() => ({
    attr: document.documentElement.getAttribute('data-theme'),
    bodyBg: getComputedStyle(document.body).backgroundColor,
    expBg: (() => { const e = document.querySelector('#work-experience'); return e ? getComputedStyle(e).backgroundColor : null; })(),
    expColor: (() => { const e = document.querySelector('#work-experience'); return e ? getComputedStyle(e).color : null; })(),
  }));
  result.darkThemeExperience.push({ viewport: vp.w + 'x' + vp.h, themeBefore, themeAfter, geometry: geo, shots });
  await ctx.close();
}

// ---------------------------------------------------- b) #skills idle cost
result.skillsIdle = [];
for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext(vp.opts);
  const page = await ctx.newPage();
  await page.addInitScript(INIT);
  await load(page);
  await slowScroll(page);
  await page.waitForTimeout(800);
  const geo = await geoOf(page, '#skills');
  if (!geo) { result.skillsIdle.push({ viewport: vp.w, error: '#skills not found' }); await ctx.close(); continue; }
  await page.evaluate((t) => window.scrollTo({ top: t, behavior: 'instant' }), Math.max(0, geo.top - 60));
  const enteredAt = Date.now();
  await page.waitForTimeout(8000); // 8s parked inside the section

  const idle = await page.evaluate(async () => {
    const nap = (ms) => new Promise((r) => setTimeout(r, ms));
    const t0 = performance.now();
    const before = JSON.parse(JSON.stringify(window.__qaTick));
    // probe frames, flagged so the instrumentation does not count them as page work
    let probeFrames = 0;
    let stop = false;
    const tick = () => { probeFrames++; if (!stop) requestAnimationFrame(tick); };
    tick.__qaProbe = true;
    requestAnimationFrame(tick);
    const cv = document.querySelector('#skills canvas');
    const grab = () => {
      if (!cv) return null;
      try {
        const c = document.createElement('canvas');
        c.width = 120; c.height = 60;
        c.getContext('2d').drawImage(cv, 0, 0, 120, 60);
        return c.getContext('2d').getImageData(0, 0, 120, 60).data;
      } catch (e) { return null; }
    };
    const a = grab();
    await nap(2000);
    stop = true;
    const b = grab();
    const after = JSON.parse(JSON.stringify(window.__qaTick));
    let changed = null, maxDelta = null;
    if (a && b) {
      let diff = 0, mx = 0;
      for (let i = 0; i < a.length; i += 4) { const d = Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]); if (d > 12) diff++; if (d > mx) mx = d; }
      changed = +(diff / (a.length / 4)).toFixed(4); maxDelta = mx;
    }
    return {
      windowMs: Math.round(performance.now() - t0),
      pageRafScheduledInWindow: after.raf - before.raf,
      pageIntervalFiresInWindow: after.interval - before.interval,
      pageTimeoutFiresInWindow: after.timeout - before.timeout,
      intervalsAlive: after.intervalsAlive,
      probeFramesServed: probeFrames,
      canvasFound: !!cv,
      canvasPixelChangedFraction: changed,
      canvasMaxChannelDelta: maxDelta,
      canvasCssSize: cv ? Math.round(cv.getBoundingClientRect().width) + 'x' + Math.round(cv.getBoundingClientRect().height) : null,
      reducedMotionMatch: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    };
  });

  const shotFile = 'skills-idle-' + vp.w + '.png';
  await page.screenshot({ path: path.join(OUT, shotFile) });

  // touch scroll: drag starting OUTSIDE the canvas, then INSIDE it (mobile only)
  let touch = null;
  if (vp.opts.hasTouch) {
    const pts = await page.evaluate(() => {
      const cv = document.querySelector('#skills canvas');
      const r = cv ? cv.getBoundingClientRect() : null;
      return {
        canvasRect: r ? { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } : null,
        insideX: r ? Math.round(r.x + r.width / 2) : null,
        insideY: r ? Math.round(r.y + r.height / 2) : null,
        touchAction: cv ? getComputedStyle(cv).touchAction : null,
        canvasPointerEvents: cv ? getComputedStyle(cv).pointerEvents : null,
        // a point in the section but not over the canvas (near the heading)
        outsideX: 40,
        outsideY: (() => { const s = document.querySelector('#skills'); const sr = s.getBoundingClientRect(); return Math.round(Math.max(20, Math.min(window.innerHeight - 20, sr.top + 24))); })(),
      };
    });
    const drag = async (x, y) => {
      await page.evaluate(() => window.scrollTo({ top: window.scrollY, behavior: 'instant' }));
      const before = await page.evaluate(() => Math.round(window.scrollY));
      await page.touchscreen.tap(x, y).catch(() => {});
      // synthesize a swipe with CDP touch events (Playwright has no touch drag helper)
      const cdp = await page.context().newCDPSession(page);
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
      for (let i = 1; i <= 8; i++) {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: Math.max(4, y - i * 30) }] });
        await page.waitForTimeout(30);
      }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await page.waitForTimeout(900);
      const after = await page.evaluate(() => Math.round(window.scrollY));
      await cdp.detach().catch(() => {});
      return { startX: x, startY: y, scrollYBefore: before, scrollYAfter: after, deltaY: after - before, scrolled: after !== before };
    };
    const outside = pts.outsideY != null ? await drag(pts.outsideX, pts.outsideY) : null;
    await page.evaluate((t) => window.scrollTo({ top: t, behavior: 'instant' }), Math.max(0, geo.top - 60));
    await page.waitForTimeout(400);
    const inside = pts.insideX != null ? await drag(pts.insideX, pts.insideY) : null;
    touch = { probe: pts, dragOutsideCanvas: outside, dragInsideCanvas: inside };
  }

  result.skillsIdle.push({
    viewport: vp.w + 'x' + vp.h, geometry: geo, parkedForMs: Date.now() - enteredAt,
    verdict: idle.pageRafScheduledInWindow > 0 || (idle.canvasPixelChangedFraction != null && idle.canvasPixelChangedFraction > 0.001) ? 'STILL ANIMATING' : 'idle',
    idle, touch, shot: shotFile,
  });
  await ctx.close();
}

// ---------------------------------------------------- c) hidden tab
result.hiddenTab = [];
{
  const vp = VIEWPORTS[0];
  const ctx = await browser.newContext(vp.opts);
  const page = await ctx.newPage();
  await page.addInitScript(INIT);
  const reqs = [];
  page.on('request', (r) => reqs.push({ t: Date.now(), url: r.url(), type: r.resourceType() }));
  await load(page);
  await slowScroll(page);
  await page.waitForTimeout(800);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(1200);

  const visibleBaseline = await page.evaluate(async () => {
    const nap = (ms) => new Promise((r) => setTimeout(r, ms));
    const b = JSON.parse(JSON.stringify(window.__qaTick));
    await nap(5000);
    const a = JSON.parse(JSON.stringify(window.__qaTick));
    return { rafScheduled: a.raf - b.raf, intervalFires: a.interval - b.interval, timeoutFires: a.timeout - b.timeout, intervalsAlive: a.intervalsAlive };
  });
  const reqMarkHidden = reqs.length;
  const hiddenState = await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => true });
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' });
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new Event('blur'));
    window.dispatchEvent(new Event('pagehide'));
    return { hidden: document.hidden, visibilityState: document.visibilityState };
  });
  const hiddenMeasure = await page.evaluate(async () => {
    const nap = (ms) => new Promise((r) => setTimeout(r, ms));
    const b = JSON.parse(JSON.stringify(window.__qaTick));
    await nap(5000);
    const a = JSON.parse(JSON.stringify(window.__qaTick));
    return { rafScheduled: a.raf - b.raf, intervalFires: a.interval - b.interval, timeoutFires: a.timeout - b.timeout, intervalsAlive: a.intervalsAlive };
  });
  const reqsWhileHidden = reqs.slice(reqMarkHidden);
  result.hiddenTab.push({
    viewport: vp.w + 'x' + vp.h,
    method: 'document.hidden/visibilityState overridden with a getter + visibilitychange/blur/pagehide dispatched; Chromium background throttling is NOT applied, so this measures only whether the app itself pauses',
    windowMs: 5000,
    whileVisible: visibleBaseline,
    hiddenState,
    whileHidden: hiddenMeasure,
    requestsWhileHidden: { count: reqsWhileHidden.length, byType: reqsWhileHidden.reduce((m, r) => (m[r.type] = (m[r.type] || 0) + 1, m), {}), urls: reqsWhileHidden.slice(0, 15).map((r) => r.url.replace(BASE, '').slice(0, 120)) },
    verdict: hiddenMeasure.rafScheduled > 0 ? 'rAF keeps running with the tab hidden (' + hiddenMeasure.rafScheduled + ' scheduled in 5s)' : 'rAF stops when hidden',
  });
  await ctx.close();
}

// ---------------------------------------------------- d/e/f) hero, targets, imgs
result.heroHeight = [];
result.smallTargets = [];
result.unsizedImages = [];
for (const vp of VIEWPORTS) {
  for (const reduced of [false, true]) {
    const ctx = await browser.newContext(reduced ? Object.assign({}, vp.opts, { reducedMotion: 'reduce' }) : vp.opts);
    const page = await ctx.newPage();
    await page.addInitScript(INIT);
    await load(page);
    const hero = await page.evaluate(() => {
      const pick = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { sel: s, h: Math.round(r.height), w: Math.round(r.width), top: Math.round(r.top + window.scrollY) }; };
      return {
        heroSection: pick('div.hero-section') || pick('.hero-section') || pick('header'),
        heroSlideshow: pick('div.hero-slideshow'),
        heroStatus: (() => { const e = document.querySelector('[aria-live]'); return e ? { text: (e.textContent || '').trim().slice(0, 90), live: e.getAttribute('aria-live'), cls: String(e.className || '').slice(0, 40) } : null; })(),
        canvasesInHero: (() => { const e = document.querySelector('div.hero-section'); return e ? e.querySelectorAll('canvas').length : null; })(),
        robotPoster: [...document.querySelectorAll('img[src*="robot-poster"]')].map((i) => ({ src: i.getAttribute('src'), w: Math.round(i.getBoundingClientRect().width), h: Math.round(i.getBoundingClientRect().height), hasAttrDims: i.hasAttribute('width') && i.hasAttribute('height') })),
        docHeight: document.documentElement.scrollHeight,
      };
    });
    result.heroHeight.push({ viewport: vp.w + 'x' + vp.h, reducedMotion: reduced, ...hero });

    if (!reduced) {
      await slowScroll(page);
      await page.waitForTimeout(1000);
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await page.waitForTimeout(600);
      const t = await page.evaluate(() => {
        const lab = (el) => {
          const id = el.id ? '#' + el.id : '';
          const cls = typeof el.className === 'string' && el.className.trim() ? '.' + el.className.trim().split(/\s+/).join('.') : '';
          return el.tagName.toLowerCase() + id + cls;
        };
        const sel = 'a[href],button,input:not([type=hidden]),select,textarea,[role=button],[role=link],[tabindex]:not([tabindex="-1"])';
        const small = [];
        for (const el of document.querySelectorAll(sel)) {
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          if (cs.visibility === 'hidden' || cs.display === 'none' || r.width === 0 || r.height === 0) continue;
          if (r.width < 24 || r.height < 24) {
            small.push({
              sel: lab(el).slice(0, 90), w: +r.width.toFixed(1), h: +r.height.toFixed(1),
              text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 30) || null,
              aria: el.getAttribute('aria-label') || null,
              section: (() => { let p = el; while (p && p !== document.body) { if (p.id) return '#' + p.id; p = p.parentElement; } return null; })(),
            });
          }
        }
        const imgs = [];
        for (const im of document.querySelectorAll('img')) {
          const cs = getComputedStyle(im);
          const hasAttr = im.hasAttribute('width') && im.hasAttribute('height');
          const hasAR = cs.aspectRatio && cs.aspectRatio !== 'auto';
          if (!hasAttr && !hasAR) imgs.push({ src: (im.currentSrc || im.src || '').replace(location.origin, '').slice(0, 110), w: Math.round(im.getBoundingClientRect().width), h: Math.round(im.getBoundingClientRect().height), loading: im.getAttribute('loading'), alt: im.getAttribute('alt') });
        }
        return { totalInteractive: document.querySelectorAll(sel).length, small, imgsTotal: document.querySelectorAll('img').length, unsized: imgs };
      });
      result.smallTargets.push({ viewport: vp.w + 'x' + vp.h, totalInteractive: t.totalInteractive, count: t.small.length, grouped: t.small.reduce((m, s) => { const k = s.sel.split(/[ >]/)[0]; m[k] = (m[k] || 0) + 1; return m; }, {}), items: t.small.slice(0, 40) });
      result.unsizedImages.push({ viewport: vp.w + 'x' + vp.h, imgsTotal: t.imgsTotal, count: t.unsized.length, items: t.unsized.slice(0, 30) });
    }
    await ctx.close();
  }
}

await browser.close();
J('r1-extras.json', result);
console.log('--- dark-theme experience ---');
for (const d of result.darkThemeExperience) console.log('  ' + d.viewport + ' theme ' + d.themeBefore + '->' + d.themeAfter.attr + ' bodyBg=' + d.themeAfter.bodyBg + ' expBg=' + d.themeAfter.expBg + ' shots=' + d.shots.map((s) => s.file).join(','));
console.log('--- #skills idle (8s park, 2s window) ---');
for (const s of result.skillsIdle) console.log('  ' + s.viewport + ' ' + s.verdict + ' pageRaf=' + (s.idle && s.idle.pageRafScheduledInWindow) + ' intervalFires=' + (s.idle && s.idle.pageIntervalFiresInWindow) + ' canvasChanged=' + (s.idle && s.idle.canvasPixelChangedFraction) + ' touchOutside=' + JSON.stringify(s.touch && s.touch.dragOutsideCanvas) + ' touchInside=' + JSON.stringify(s.touch && s.touch.dragInsideCanvas));
console.log('--- hidden tab ---');
console.log('  ' + JSON.stringify(result.hiddenTab[0], null, 1).slice(0, 1400));
console.log('--- hero height ---');
for (const h of result.heroHeight) console.log('  ' + h.viewport + ' reduce=' + h.reducedMotion + ' hero=' + JSON.stringify(h.heroSection) + ' canvases=' + h.canvasesInHero + ' doc=' + h.docHeight);
console.log('--- targets < 24px ---');
for (const t of result.smallTargets) console.log('  ' + t.viewport + ' ' + t.count + '/' + t.totalInteractive + ' ' + JSON.stringify(t.grouped));
console.log('--- unsized images ---');
for (const u of result.unsizedImages) console.log('  ' + u.viewport + ' ' + u.count + '/' + u.imgsTotal + ' ' + JSON.stringify(u.items.map((i) => i.src)));
