/**
 * qa/scripts/capture.mjs - baseline/regression capture for the Home page.
 * Usage:  node qa/scripts/capture.mjs <outDir> [baseUrl]
 * Ex.:    node qa/scripts/capture.mjs qa/baseline http://localhost:5173
 *
 * Produces, per viewport W:
 *   home-{W}-top.png, home-{W}-scrolled.png
 *   experience-{W}-25.png, -50.png, -100.png   (viewport shots)
 *   home-{W}-rm-top.png, home-{W}-rm-scrolled.png  (prefers-reduced-motion: reduce)
 *   console-{W}.json, failed-requests-{W}.json, transfer-{W}.json
 *   experience-cpu4x-{W}.json
 *   keyboard.json (1440 only)
 *   capture-summary.json
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve(process.argv[2] || 'qa/baseline');
const BASE = process.argv[3] || process.env.QA_BASE_URL || 'http://localhost:5173';
fs.mkdirSync(OUT, { recursive: true });

const VIEWPORTS = [
  { w: 1440, h: 900, opts: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 } },
  { w: 390, h: 844, opts: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } },
];

// Instruments getContext so we can tell which <canvas> really has a WebGL context,
// without ever creating a new one ourselves.
const INIT = `(() => {
  const orig = HTMLCanvasElement.prototype.getContext;
  window.__qaCanvasCtx = [];
  HTMLCanvasElement.prototype.getContext = function (type, ...rest) {
    const r = orig.call(this, type, ...rest);
    if (r) window.__qaCanvasCtx.push({ el: this, type: String(type) });
    return r;
  };
})();`;

const J = (name, data) => fs.writeFileSync(path.join(OUT, name), JSON.stringify(data, null, 2));

function attachCollectors(page, phase, console_, failed_, transfer_) {
  page.on('console', (msg) => {
    const t = msg.type();
    if (t !== 'error' && t !== 'warning') return;
    const loc = msg.location() || {};
    console_.push({ phase, level: t, text: msg.text().slice(0, 1200), url: loc.url || '', line: loc.lineNumber ?? null, column: loc.columnNumber ?? null });
  });
  page.on('pageerror', (err) => {
    console_.push({ phase, level: 'error', text: 'pageerror: ' + String(err && err.message ? err.message : err).slice(0, 1200), url: '', stack: err && err.stack ? String(err.stack).split('\n').slice(0, 4).join(' | ') : '' });
  });
  page.on('requestfailed', (req) => {
    const f = req.failure();
    failed_.push({ phase, kind: 'network-error', url: req.url(), resourceType: req.resourceType(), error: f ? f.errorText : 'unknown' });
  });
  page.on('response', (res) => {
    const s = res.status();
    if (s >= 400) failed_.push({ phase, kind: 'http-status', url: res.url(), resourceType: res.request().resourceType(), status: s });
  });
  page.on('requestfinished', async (req) => {
    try {
      const sz = await req.sizes();
      const res = await req.response();
      const cl = res ? Number(res.headers()['content-length'] || 0) : 0;
      const body = sz.responseBodySize > 0 ? sz.responseBodySize : cl;
      transfer_.push({
        phase, url: req.url(), type: req.resourceType(),
        bodyBytes: body, headerBytes: sz.responseHeadersSize || 0,
        wireBytes: body + (sz.responseHeadersSize || 0),
        status: res ? res.status() : null,
      });
    } catch { /* request gone */ }
  });
}

async function gotoHome(page, notes) {
  const t0 = Date.now();
  await page.goto(BASE + '/', { waitUntil: 'load', timeout: 60000 });
  try { await page.waitForLoadState('networkidle', { timeout: 25000 }); }
  catch { notes.push('networkidle did not settle within 25s'); }
  await page.waitForTimeout(1500);
  return Date.now() - t0;
}

async function slowScrollToBottom(page, step = 300, delay = 120) {
  return page.evaluate(async ({ step, delay }) => {
    const nap = (ms) => new Promise((r) => setTimeout(r, ms));
    const maxY = () => Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) - window.innerHeight;
    let y = 0, steps = 0;
    while (y < maxY() && steps < 500) {
      y = Math.min(y + step, maxY());
      window.scrollTo({ top: y, behavior: 'instant' });
      steps++;
      await nap(delay);
    }
    window.scrollTo({ top: maxY(), behavior: 'instant' });
    return { steps, finalY: Math.round(window.scrollY), docHeight: document.documentElement.scrollHeight, innerHeight: window.innerHeight };
  }, { step, delay });
}

async function toTop(page) {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
}

async function shot(page, name, fullPage, notes) {
  const file = path.join(OUT, name);
  try {
    await page.screenshot({ path: file, fullPage, animations: 'allow' });
    return { name, ok: true, bytes: fs.statSync(file).size };
  } catch (e) {
    notes.push('screenshot ' + name + ' failed fullPage=' + fullPage + ': ' + e.message);
    try {
      await page.screenshot({ path: file, fullPage: false });
      notes.push('screenshot ' + name + ' fell back to viewport-only');
      return { name, ok: true, fallback: 'viewport', bytes: fs.statSync(file).size };
    } catch (e2) { return { name, ok: false, error: e2.message }; }
  }
}

// Locate the Professional Experience block. Prefers a <section> owning a heading
// containing "Experience"; falls back to nearest ancestor with an id, then to
// well-known selectors.
async function findExperience(page) {
  return page.evaluate(() => {
    const sel = (el) => {
      if (!el) return null;
      if (el.id) return '#' + el.id;
      const c = typeof el.className === 'string' ? el.className.trim().split(/\s+/)[0] : '';
      return el.tagName.toLowerCase() + (c ? '.' + c : '');
    };
    const heads = [...document.querySelectorAll('h1,h2,h3,h4')].filter((h) => /experience/i.test(h.textContent || ''));
    for (const h of heads) {
      const s = h.closest('section');
      if (s) return { selector: sel(s), via: 'section owning heading matching /experience/i', heading: (h.textContent || '').trim().slice(0, 80) };
    }
    for (const h of heads) {
      const s = h.closest('[id]') || h.parentElement;
      if (s) return { selector: sel(s), via: 'nearest ancestor with id (no <section> wrapper exists in the DOM)', heading: (h.textContent || '').trim().slice(0, 80) };
    }
    for (const q of ['#work-experience', '.work-experience-main-wrapper']) {
      if (document.querySelector(q)) return { selector: q, via: 'hardcoded fallback', heading: null };
    }
    return null;
  });
}

async function experienceGeometry(page, selector) {
  return page.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const top = r.top + window.scrollY;
    const maxY = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) - window.innerHeight;
    const rawEnd = top + r.height - window.innerHeight;
    return {
      sectionTop: Math.round(top), sectionHeight: Math.round(r.height),
      innerHeight: window.innerHeight, docMaxScroll: Math.round(maxY),
      scrollStart: Math.round(Math.max(0, Math.min(top, maxY))),
      scrollEnd: Math.round(Math.max(0, Math.min(rawEnd, maxY))),
    };
  }, selector);
}

async function canvasAudit(page) {
  return page.evaluate(() => {
    const all = [...document.querySelectorAll('canvas')];
    const log = window.__qaCanvasCtx || [];
    const webglEls = new Set(log.filter((e) => /webgl/i.test(e.type)).map((e) => e.el));
    const ctx2dEls = new Set(log.filter((e) => /^2d$/i.test(e.type)).map((e) => e.el));
    return {
      method: 'HTMLCanvasElement.prototype.getContext instrumented at document start; the audit never creates a context itself',
      canvasElements: all.length,
      canvasWithWebGLContext: all.filter((c) => webglEls.has(c)).length,
      canvasWith2DContext: all.filter((c) => ctx2dEls.has(c)).length,
      canvasWithNoObservedContext: all.filter((c) => !webglEls.has(c) && !ctx2dEls.has(c)).length,
      detachedWebGLCanvases: [...webglEls].filter((c) => !c.isConnected).length,
      contextTypesRequested: [...new Set(log.map((e) => e.type))],
      canvases: all.map((c) => ({
        w: c.width, h: c.height,
        cssW: Math.round(c.getBoundingClientRect().width), cssH: Math.round(c.getBoundingClientRect().height),
        cls: (typeof c.className === 'string' ? c.className : '').slice(0, 80),
        parent: c.parentElement ? (c.parentElement.id ? '#' + c.parentElement.id : c.parentElement.tagName.toLowerCase() + '.' + String(c.parentElement.className || '').trim().split(/\s+/)[0]) : null,
        ctx: webglEls.has(c) ? 'webgl' : ctx2dEls.has(c) ? '2d' : 'none-observed',
      })),
    };
  });
}

// ------------------------------------------------------------------ keyboard
async function keyboardAudit(browser, notes) {
  const ctx = await browser.newContext(VIEWPORTS[0].opts);
  const page = await ctx.newPage();
  await page.addInitScript(INIT);
  await gotoHome(page, notes);
  await toTop(page);
  await page.evaluate(() => { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); });

  const describe = () => page.evaluate(() => {
    const a = document.activeElement;
    if (!a) return null;
    const r = a.getBoundingClientRect();
    const cs = getComputedStyle(a);
    return {
      tag: a.tagName.toLowerCase(), id: a.id || null,
      cls: (typeof a.className === 'string' ? a.className : '').trim().slice(0, 70) || null,
      aria: a.getAttribute('aria-label') || null,
      href: a.getAttribute('href') || null,
      text: (a.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 45) || null,
      rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
      inViewport: r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth,
      visible: cs.visibility !== 'hidden' && cs.display !== 'none' && Number(cs.opacity) > 0.01 && r.width > 0 && r.height > 0,
      outlineStyle: cs.outlineStyle, outlineWidth: cs.outlineWidth,
      scrollY: Math.round(window.scrollY),
      section: (() => {
        let p = a;
        while (p && p !== document.body) {
          if (p.id) return '#' + p.id;
          if (p.tagName === 'SECTION' || p.tagName === 'FOOTER' || p.tagName === 'NAV') return p.tagName.toLowerCase() + '.' + String(p.className || '').trim().split(/\s+/)[0];
          p = p.parentElement;
        }
        return null;
      })(),
    };
  });

  const order = [];
  let first = null, loopedAt = null;
  for (let i = 1; i <= 80; i++) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(60);
    const d = await describe();
    order.push(Object.assign({ tab: i }, d));
    const key = d ? [d.tag, d.id, d.cls, d.text, d.href].join('|') : 'null';
    if (i === 1) first = key;
    else if (key === first) { loopedAt = i; break; }
    if (d && d.tag === 'body' && i > 1) { loopedAt = i; break; }
  }

  const probe = () => page.evaluate(() => ({
    dialogs: document.querySelectorAll('[role=dialog]').length,
    terminalish: document.querySelectorAll('[class*=terminal i],[id*=terminal i]').length,
    bodyChildren: document.body.children.length,
    visibleOverlay: [...document.querySelectorAll('[role=dialog],[class*=terminal i],[class*=modal i],[class*=window i]')]
      .filter((e) => { const r = e.getBoundingClientRect(); return r.width > 40 && r.height > 40 && getComputedStyle(e).visibility !== 'hidden'; })
      .map((e) => ({ tag: e.tagName.toLowerCase(), id: e.id || null, cls: String(e.className || '').slice(0, 70), w: Math.round(e.getBoundingClientRect().width), h: Math.round(e.getBoundingClientRect().height) })).slice(0, 8),
    activeEl: document.activeElement ? document.activeElement.tagName.toLowerCase() + '.' + String(document.activeElement.className || '').slice(0, 40) : null,
  }));

  // Playwright resolves an uppercase 'K' through the shiftKey slot of the US layout,
  // so press('Control+K') can arrive as e.key === 'K' (+shift). Both spellings are
  // measured because the app compares against the lowercase 'k'.
  const before = await probe();
  const keyEvents = [];
  await page.evaluate(() => {
    window.__qaKeys = [];
    window.addEventListener('keydown', (e) => window.__qaKeys.push({ key: e.key, code: e.code, ctrl: e.ctrlKey, meta: e.metaKey, shift: e.shiftKey, defaultPrevented: e.defaultPrevented }), true);
  });
  const attempts = [];
  for (const combo of ['Control+K', 'Control+k']) {
    await page.keyboard.press(combo);
    await page.waitForTimeout(1200);
    const st = await probe();
    attempts.push({ combo, state: st, openedNow: st.dialogs > before.dialogs || st.terminalish > before.terminalish || st.visibleOverlay.length > before.visibleOverlay.length || st.bodyChildren > before.bodyChildren });
    if (attempts[attempts.length - 1].openedNow) break;
  }
  keyEvents.push(...(await page.evaluate(() => window.__qaKeys || [])));
  const afterCtrlK = attempts[attempts.length - 1].state;
  await shot(page, 'keyboard-ctrlk.png', false, notes);

  // Focus containment inside whatever Ctrl+k opened
  const trap = [];
  for (let i = 1; i <= 6; i++) {
    await page.keyboard.press('Tab');
    await page.waitForTimeout(80);
    trap.push(await page.evaluate(() => {
      const a = document.activeElement;
      if (!a) return null;
      const inOverlay = !!a.closest('[class*=terminal i],[class*=draggable-window i],[role=dialog]');
      return { tag: a.tagName.toLowerCase(), cls: String(a.className || '').slice(0, 50), insideOverlay: inOverlay };
    }));
  }

  await page.keyboard.press('Escape');
  await page.waitForTimeout(1200);
  const afterEscape = await probe();
  await shot(page, 'keyboard-after-escape.png', false, notes);

  // Diagnostic: does Escape reach window at all, or is it swallowed by the
  // focused widget? Move focus to body and retry.
  const escapeDiag = await page.evaluate(() => {
    window.__qaEsc = [];
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') window.__qaEsc.push({ target: e.target.tagName.toLowerCase() + '.' + String(e.target.className || '').slice(0, 40), defaultPrevented: e.defaultPrevented }); }, true);
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    return document.activeElement ? document.activeElement.tagName.toLowerCase() : null;
  });
  await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);
  const afterEscapeFromBody = await probe();
  const escEvents = await page.evaluate(() => window.__qaEsc || []);

  const opened = attempts.some((a) => a.openedNow);
  const result = {
    viewport: '1440x900',
    tabsPressed: order.length,
    loopedBackAtTab: loopedAt,
    focusableInvisible: order.filter((o) => o && o.tag && !o.visible).map((o) => ({ tab: o.tab, tag: o.tag, cls: o.cls, text: o.text, rect: o.rect })),
    focusOutsideViewport: order.filter((o) => o && o.visible && !o.inViewport).map((o) => ({ tab: o.tab, tag: o.tag, text: o.text, scrollY: o.scrollY, rect: o.rect })),
    noVisibleOutline: order.filter((o) => o && (o.outlineStyle === 'none' || o.outlineWidth === '0px')).map((o) => ({ tab: o.tab, tag: o.tag, cls: o.cls, text: o.text })),
    sectionsReached: [...new Set(order.map((o) => o.section).filter(Boolean))],
    ctrlK: { before, after: afterCtrlK, opened, attempts: attempts.map((a) => ({ combo: a.combo, opened: a.openedNow })), keydownEventsSeenByPage: keyEvents },
    focusTrapAfterCtrlK: { taggedTabs: trap, escapesOverlay: trap.some((t) => t && !t.insideOverlay) },
    escape: {
      after: afterEscape,
      closed: opened ? afterEscape.visibleOverlay.length <= before.visibleOverlay.length && afterEscape.dialogs <= before.dialogs : 'n/a (nothing opened)',
      retryWithFocusOnBody: { activeElementBefore: escapeDiag, after: afterEscapeFromBody, closed: opened ? afterEscapeFromBody.visibleOverlay.length <= before.visibleOverlay.length : 'n/a' },
      escapeEventsSeenByWindow: escEvents,
    },
    order,
  };
  J('keyboard.json', result);
  await ctx.close();
  return result;
}

// ------------------------------------------------------------------ cpu 4x
async function cpuAudit(browser, vp, expSelector, notes) {
  const ctx = await browser.newContext(vp.opts);
  const page = await ctx.newPage();
  await page.addInitScript(INIT);
  const cdp = await ctx.newCDPSession(page);
  await gotoHome(page, notes);
  const geo = await experienceGeometry(page, expSelector);
  if (!geo) { notes.push('cpu4x ' + vp.w + ': selector ' + expSelector + ' not found'); await ctx.close(); return null; }

  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.waitForTimeout(500);

  const obsType = await page.evaluate(() => {
    window.__qaLong = [];
    const supported = PerformanceObserver.supportedEntryTypes || [];
    const type = supported.includes('long-animation-frame') ? 'long-animation-frame' : supported.includes('longtask') ? 'longtask' : null;
    if (!type) return null;
    window.__qaObs = new PerformanceObserver((list) => {
      for (const e of list.getEntries()) window.__qaLong.push({ name: e.name, start: Math.round(e.startTime), duration: Math.round(e.duration), blocking: Math.round(e.blockingDuration || 0) });
    });
    window.__qaObs.observe({ type, buffered: false });
    window.__qaT0 = performance.now();
    window.__qaRaf = [];
    let last = performance.now();
    const tick = (t) => { window.__qaRaf.push(Math.round(t - last)); last = t; if (window.__qaRafOn) requestAnimationFrame(tick); };
    window.__qaRafOn = true;
    requestAnimationFrame(tick);
    return type;
  });
  if (!obsType) notes.push('cpu4x ' + vp.w + ': no longtask/long-animation-frame support');

  await page.evaluate(async ({ start, end }) => {
    const nap = (ms) => new Promise((r) => setTimeout(r, ms));
    window.scrollTo({ top: start, behavior: 'instant' });
    await nap(300);
    for (let i = 1; i <= 40; i++) {
      window.scrollTo({ top: Math.round(start + ((end - start) * i) / 40), behavior: 'instant' });
      await nap(100);
    }
  }, { start: geo.scrollStart, end: geo.scrollEnd });

  const data = await page.evaluate(() => {
    window.__qaRafOn = false;
    if (window.__qaObs) {
      try {
        window.__qaObs.takeRecords().forEach((e) => window.__qaLong.push({ name: e.name, start: Math.round(e.startTime), duration: Math.round(e.duration), blocking: Math.round(e.blockingDuration || 0) }));
        window.__qaObs.disconnect();
      } catch (e) { /* noop */ }
    }
    const raf = window.__qaRaf || [];
    const sorted = raf.slice().sort((a, b) => a - b);
    return {
      long: window.__qaLong || [],
      rafFrames: raf.length,
      rafOver50: raf.filter((d) => d > 50).length,
      rafMax: raf.length ? Math.max.apply(null, raf) : 0,
      rafMedian: raf.length ? sorted[Math.floor(raf.length / 2)] : 0,
      rafP95: raf.length ? sorted[Math.floor(raf.length * 0.95)] : 0,
      durationMs: Math.round(performance.now() - window.__qaT0),
    };
  });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });

  const sorted = data.long.slice().sort((a, b) => b.duration - a.duration);
  const out = {
    viewport: vp.w + 'x' + vp.h, cpuThrottlingRate: 4, entryType: obsType,
    selector: expSelector, geometry: geo,
    scrollSteps: 40, stepDelayMs: 100, observedWindowMs: data.durationMs,
    framesOver50ms: data.long.filter((e) => e.duration > 50).length,
    framesOver100ms: data.long.filter((e) => e.duration > 100).length,
    longestMs: sorted.length ? sorted[0].duration : 0,
    totalBlockingMs: data.long.reduce((s, e) => s + Math.max(0, e.duration - 50), 0),
    top10: sorted.slice(0, 10),
    rafStats: {
      frames: data.rafFrames, framesOver50ms: data.rafOver50, maxFrameMs: data.rafMax,
      medianFrameMs: data.rafMedian, p95FrameMs: data.rafP95,
      effectiveFps: data.durationMs ? Math.round((data.rafFrames / data.durationMs) * 1000) : null,
    },
  };
  J('experience-cpu4x-' + vp.w + '.json', out);
  await ctx.close();
  return out;
}

// ------------------------------------------------------------------ main run
async function runViewport(browser, vp, summary) {
  const notes = [];
  const console_ = [], failed_ = [], transfer_ = [];

  // --- phase A: normal motion
  const ctx = await browser.newContext(vp.opts);
  const page = await ctx.newPage();
  await page.addInitScript(INIT);
  attachCollectors(page, 'normal', console_, failed_, transfer_);
  const loadMs = await gotoHome(page, notes);
  const shots = [];
  shots.push(await shot(page, 'home-' + vp.w + '-top.png', true, notes));
  const scrollInfo = await slowScrollToBottom(page);
  await page.waitForTimeout(1500);
  await toTop(page);
  await page.waitForTimeout(1000);
  shots.push(await shot(page, 'home-' + vp.w + '-scrolled.png', true, notes));

  const exp = await findExperience(page);
  let geo = null;
  if (exp) {
    geo = await experienceGeometry(page, exp.selector);
    for (const pct of [25, 50, 100]) {
      const y = Math.round(geo.scrollStart + ((geo.scrollEnd - geo.scrollStart) * pct) / 100);
      await page.evaluate((t) => window.scrollTo({ top: t, behavior: 'instant' }), y);
      await page.waitForTimeout(800);
      shots.push(await shot(page, 'experience-' + vp.w + '-' + pct + '.png', false, notes));
    }
  } else notes.push('Experience section not found by any strategy');

  await slowScrollToBottom(page);
  await page.waitForTimeout(1200);
  const canvases = await canvasAudit(page);
  await ctx.close();

  // --- phase B: prefers-reduced-motion: reduce
  const ctxRM = await browser.newContext(Object.assign({}, vp.opts, { reducedMotion: 'reduce' }));
  const pageRM = await ctxRM.newPage();
  await pageRM.addInitScript(INIT);
  attachCollectors(pageRM, 'reduced-motion', console_, failed_, transfer_);
  await gotoHome(pageRM, notes);
  shots.push(await shot(pageRM, 'home-' + vp.w + '-rm-top.png', true, notes));
  await slowScrollToBottom(pageRM);
  await pageRM.waitForTimeout(1500);
  await toTop(pageRM);
  await pageRM.waitForTimeout(1000);
  shots.push(await shot(pageRM, 'home-' + vp.w + '-rm-scrolled.png', true, notes));
  const canvasesRM = await canvasAudit(pageRM);
  await ctxRM.close();

  // --- aggregate transfer
  const normal = transfer_.filter((r) => r.phase === 'normal');
  const byType = {};
  let total = 0, totalWire = 0;
  for (const r of normal) {
    const t = r.type === 'xhr' || r.type === 'fetch' ? 'fetch/xhr' : r.type;
    if (!byType[t]) byType[t] = { requests: 0, bodyBytes: 0, wireBytes: 0 };
    byType[t].requests++; byType[t].bodyBytes += r.bodyBytes; byType[t].wireBytes += r.wireBytes;
    total += r.bodyBytes; totalWire += r.wireBytes;
  }
  for (const k of Object.keys(byType)) byType[k].bodyKB = +(byType[k].bodyBytes / 1024).toFixed(1);

  J('transfer-' + vp.w + '.json', {
    viewport: vp.w + 'x' + vp.h, baseUrl: BASE, phase: 'normal motion: initial load + one full slow scroll + experience steps + second slow scroll',
    method: 'Playwright requestfinished -> request.sizes().responseBodySize (encoded over-the-wire body), falling back to the content-length header. wireBytes = body + response headers.',
    caveat: 'Vite DEV server serves unminified, ungzipped ES modules; absolute numbers are far above production. Compare only against other runs of this same script on the dev server.',
    totalRequests: normal.length,
    totalBodyBytes: total, totalBodyKB: +(total / 1024).toFixed(1), totalBodyMB: +(total / 1048576).toFixed(2),
    totalWireBytes: totalWire, totalWireKB: +(totalWire / 1024).toFixed(1),
    byType,
    top20Heaviest: normal.slice().sort((a, b) => b.bodyBytes - a.bodyBytes).slice(0, 20).map((r) => ({ kb: +(r.bodyBytes / 1024).toFixed(1), type: r.type, status: r.status, url: r.url.replace(BASE, '') })),
    thirdParty: normal.filter((r) => !r.url.startsWith(BASE)).map((r) => ({ kb: +(r.bodyBytes / 1024).toFixed(1), type: r.type, url: r.url.slice(0, 140) })),
  });
  J('console-' + vp.w + '.json', {
    viewport: vp.w + 'x' + vp.h,
    errors: console_.filter((c) => c.level === 'error').length,
    warnings: console_.filter((c) => c.level === 'warning').length,
    entries: console_,
  });
  J('failed-requests-' + vp.w + '.json', { viewport: vp.w + 'x' + vp.h, count: failed_.length, entries: failed_ });

  summary.viewports.push({
    viewport: vp.w + 'x' + vp.h, loadMs, scrollInfo, experience: exp, experienceGeometry: geo,
    canvases: {
      normal: { elements: canvases.canvasElements, webgl: canvases.canvasWithWebGLContext, ctx2d: canvases.canvasWith2DContext, noneObserved: canvases.canvasWithNoObservedContext, detachedWebGL: canvases.detachedWebGLCanvases, contextTypes: canvases.contextTypesRequested, detail: canvases.canvases },
      reducedMotion: { elements: canvasesRM.canvasElements, webgl: canvasesRM.canvasWithWebGLContext },
    },
    transfer: { totalRequests: normal.length, totalBodyKB: +(total / 1024).toFixed(1), byType },
    consoleErrors: console_.filter((c) => c.level === 'error').length,
    consoleWarnings: console_.filter((c) => c.level === 'warning').length,
    failedRequests: failed_.length,
    shots, notes,
  });
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--disable-dev-shm-usage'],
  });
  const summary = { generatedAt: new Date().toISOString(), baseUrl: BASE, outDir: OUT, playwright: '1.61.1', viewports: [] };
  // QA_ONLY=shots|keyboard|cpu re-runs a single phase (default: everything)
  const ONLY = (process.env.QA_ONLY || 'all').toLowerCase();
  const wants = (p) => ONLY === 'all' || ONLY === p;
  try {
    if (wants('shots')) for (const vp of VIEWPORTS) { console.log('>> viewport ' + vp.w); await runViewport(browser, vp, summary); }
    const expSel = (summary.viewports[0] && summary.viewports[0].experience && summary.viewports[0].experience.selector) || '#work-experience';
    const sink = summary.viewports[0] ? summary.viewports[0].notes : (summary.notes = []);
    if (wants('keyboard')) {
      console.log('>> keyboard');
      const kb = await keyboardAudit(browser, sink);
      summary.keyboard = { tabsPressed: kb.tabsPressed, loopedBackAtTab: kb.loopedBackAtTab, ctrlKOpened: kb.ctrlK.opened, ctrlKAttempts: kb.ctrlK.attempts, escapeClosed: kb.escape.closed, invisibleFocusables: kb.focusableInvisible.length, sectionsReached: kb.sectionsReached };
    }
    if (wants('cpu')) {
      summary.cpu = {};
      for (const vp of VIEWPORTS) {
        console.log('>> cpu4x ' + vp.w);
        const c = await cpuAudit(browser, vp, expSel, sink);
        if (c) summary.cpu[vp.w] = { framesOver50ms: c.framesOver50ms, longestMs: c.longestMs, entryType: c.entryType, rafFps: c.rafStats.effectiveFps, rafMax: c.rafStats.maxFrameMs };
      }
    }
  } catch (e) {
    summary.fatal = String(e && e.stack ? e.stack : e).slice(0, 2000);
    console.error('FATAL', e);
  } finally {
    J(ONLY === 'all' ? 'capture-summary.json' : 'capture-summary-' + ONLY + '.json', summary);
    await browser.close();
  }
  console.log(JSON.stringify({
    viewports: summary.viewports.map((v) => ({ vp: v.viewport, errors: v.consoleErrors, warnings: v.consoleWarnings, failed: v.failedRequests, bodyKB: v.transfer.totalBodyKB, canvasEls: v.canvases.normal.elements, webgl: v.canvases.normal.webgl, notes: v.notes })),
    keyboard: summary.keyboard, cpu: summary.cpu,
  }, null, 1));
})();
