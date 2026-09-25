/**
 * qa/scripts/r2-cpu-coldpath.mjs - same method as capture.mjs's cpu4x (throttle BEFORE
 * the Experience section mounts, then scroll into it) but with long-animation-frame
 * script attribution, so the 2.6-2.7s frame can be blamed on the right chunk.
 * Usage: node qa/scripts/r2-cpu-coldpath.mjs <outDir> [baseUrl]
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
const OUT = path.resolve(process.argv[2] || 'qa/r2');
const BASE = process.argv[3] || 'http://localhost:4173';
const VIEWPORTS = [
  { w: 1440, h: 900, opts: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 } },
  { w: 390, h: 844, opts: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } },
];
const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const out = { generatedAt: new Date().toISOString(), baseUrl: BASE, method: 'CPU 4x applied at scrollY 0 (Experience still unmounted), then scroll through the section - same as capture.mjs', runs: [] };
for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext(vp.opts);
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  const net = [];
  page.on('request', (r) => net.push({ url: r.url(), t: Date.now() }));
  await page.goto(BASE + '/', { waitUntil: 'load', timeout: 60000 });
  try { await page.waitForLoadState('networkidle', { timeout: 20000 }); } catch { /* ignore */ }
  await page.waitForTimeout(1500);
  const geo = await page.evaluate(() => {
    const el = document.getElementById('work-experience');
    const r = el.getBoundingClientRect();
    const top = Math.round(r.top + window.scrollY);
    const maxY = document.documentElement.scrollHeight - window.innerHeight;
    return { sectionTop: top, sectionHeight: Math.round(r.height), innerHeight: window.innerHeight, docMaxScroll: maxY, scrollStart: top, scrollEnd: Math.min(maxY, top + Math.round(r.height) - window.innerHeight) };
  });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.waitForTimeout(400);
  const mark = net.length;
  await page.evaluate(() => {
    window.__q = [];
    window.__o = new PerformanceObserver((l) => { for (const e of l.getEntries()) { const j = e.toJSON ? e.toJSON() : {};
      window.__q.push({ start: Math.round(e.startTime), duration: Math.round(e.duration), blocking: Math.round(e.blockingDuration || 0),
        scripts: (j.scripts || []).map((s) => ({ dur: Math.round(s.duration || 0), invoker: s.invoker || null, invokerType: s.invokerType || null, sourceURL: (s.sourceURL || '').split('/').pop() || null, fn: s.sourceFunctionName || null, forcedLayout: Math.round(s.forcedStyleAndLayoutDuration || 0) })).sort((a, b) => b.dur - a.dur).slice(0, 4) }); } });
    window.__o.observe({ type: 'long-animation-frame', buffered: false });
    window.__t0 = performance.now(); window.__raf = []; let last = performance.now(); window.__on = true;
    const tick = (t) => { window.__raf.push(Math.round(t - last)); last = t; if (window.__on) requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  });
  await page.evaluate(async ({ start, end }) => {
    const nap = (t) => new Promise((r) => setTimeout(r, t));
    window.scrollTo({ top: start, behavior: 'instant' }); await nap(300);
    for (let i = 1; i <= 40; i++) { window.scrollTo({ top: Math.round(start + ((end - start) * i) / 40), behavior: 'instant' }); await nap(100); }
  }, { start: geo.scrollStart, end: geo.scrollEnd });
  const data = await page.evaluate(() => { window.__on = false; try { window.__o.disconnect(); } catch { /* noop */ }
    const raf = window.__raf || []; const s = raf.slice().sort((a, b) => a - b);
    return { long: window.__q, dur: Math.round(performance.now() - window.__t0), rafN: raf.length, rafOver50: raf.filter((d) => d > 50).length, rafMax: raf.length ? Math.max(...raf) : 0, rafMed: raf.length ? s[Math.floor(raf.length / 2)] : 0 }; });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  const sorted = data.long.slice().sort((a, b) => b.duration - a.duration);
  out.runs.push({ viewport: vp.w, geometry: geo, observedWindowMs: data.dur,
    framesOver50ms: data.long.filter((e) => e.duration > 50).length, framesOver100ms: data.long.filter((e) => e.duration > 100).length,
    longestMs: sorted.length ? sorted[0].duration : 0, totalBlockingMs: data.long.reduce((s, e) => s + Math.max(0, e.duration - 50), 0),
    rafStats: { frames: data.rafN, over50: data.rafOver50, max: data.rafMax, median: data.rafMed, fps: Math.round((data.rafN / data.dur) * 1000) },
    top5: sorted.slice(0, 5), requestsWhileThrottled: net.slice(mark).map((n) => n.url.split('/').pop()).slice(0, 30) });
  await ctx.close();
}
fs.writeFileSync(path.join(OUT, 'r2-cpu-coldpath.json'), JSON.stringify(out, null, 2));
for (const r of out.runs) {
  console.log(`== vp ${r.viewport}: ${r.framesOver50ms} frames >50ms (${r.framesOver100ms} >100ms), longest ${r.longestMs}ms, blocking ${r.totalBlockingMs}ms, raf ${r.rafStats.fps}fps max ${r.rafStats.max}ms`);
  r.top5.forEach((f, i) => { console.log(`   #${i + 1} ${f.duration}ms (blocking ${f.blocking}ms) @${f.start}`);
    f.scripts.forEach((s) => console.log(`       ${s.dur}ms ${s.invokerType || '?'} invoker=${String(s.invoker).slice(0, 60)} src=${s.sourceURL} fn=${s.fn} forcedLayout=${s.forcedLayout}ms`)); });
}
await browser.close();
