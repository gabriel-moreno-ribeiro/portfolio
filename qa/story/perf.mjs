// qa/story/perf.mjs - scroll /story top to bottom under 4x CPU throttle and record
// long animation frames (> 50 ms) with the dominant script of each.
// Usage: node qa/story/perf.mjs <before|after> [baseUrl]
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const TAG = process.argv[2] || 'before';
const BASE = process.argv[3] || 'http://localhost:5173';
const OUT = path.resolve('qa/story');
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const report = { tag: TAG, generatedAt: new Date().toISOString(), throttle: 4, runs: [] };

for (const vp of [{ w: 1440, h: 900 }, { w: 390, h: 844 }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    window.__loaf = [];
    window.__cls = 0;
    try {
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) {
          const scripts = (e.scripts || []).map((s) => ({
            d: Math.round(s.duration),
            url: (s.sourceURL || '').replace(location.origin, '').split('?')[0],
            fn: s.sourceFunctionName || '',
            invoker: s.invoker || '',
            type: s.invokerType || '',
            layout: Math.round(s.forcedStyleAndLayoutDuration || 0),
          })).sort((a, b) => b.d - a.d);
          window.__loaf.push({
            start: Math.round(e.startTime), duration: Math.round(e.duration),
            blocking: Math.round(e.blockingDuration || 0),
            render: Math.round(e.renderStart ? e.startTime + e.duration - e.renderStart : 0),
            top: scripts[0] || null,
          });
        }
      }).observe({ type: 'long-animation-frame', buffered: true });
      new PerformanceObserver((list) => {
        for (const e of list.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
      }).observe({ type: 'layout-shift', buffered: true });
    } catch { /* unsupported */ }
  });

  const cdp = await ctx.newCDPSession(page);
  await page.goto(BASE + '/story', { waitUntil: 'load', timeout: 60000 });
  try { await page.waitForLoadState('networkidle', { timeout: 15000 }); } catch { /* keep going */ }
  await page.waitForTimeout(1500);

  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.waitForTimeout(500);
  const scrollStart = await page.evaluate(() => performance.now());
  await page.mouse.move(vp.w / 2, vp.h / 2);

  let guard = 0;
  for (;;) {
    await page.mouse.wheel(0, 100);
    await page.waitForTimeout(16);
    guard += 1;
    if (guard % 20 === 0) {
      const done = await page.evaluate(() => window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2);
      if (done || guard > 4000) break;
    }
  }
  await page.waitForTimeout(1500);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });

  const data = await page.evaluate((t0) => ({
    pageHeight: document.documentElement.scrollHeight,
    cls: Number(window.__cls.toFixed(4)),
    scrollMs: Math.round(performance.now() - t0),
    frames: window.__loaf.filter((f) => f.start >= t0),
  }), scrollStart);

  const long = data.frames.filter((f) => f.duration > 50).sort((a, b) => b.duration - a.duration);
  const byScript = {};
  for (const f of long) {
    const key = f.top ? `${f.top.url || '(inline)'} :: ${f.top.fn || f.top.invoker || f.top.type}` : '(no script: style/layout/paint)';
    byScript[key] = byScript[key] || { frames: 0, totalMs: 0 };
    byScript[key].frames += 1;
    byScript[key].totalMs += f.duration;
  }
  const run = {
    viewport: `${vp.w}x${vp.h}`, pageHeight: data.pageHeight, scrollMs: data.scrollMs, cls: data.cls,
    framesOver50: long.length,
    worstMs: long[0]?.duration ?? 0,
    totalBlockingMs: long.reduce((s, f) => s + f.blocking, 0),
    dominant: Object.entries(byScript).sort((a, b) => b[1].totalMs - a[1].totalMs).map(([k, v]) => ({ script: k, ...v })),
    frames: long,
  };
  report.runs.push(run);
  console.log(run.viewport, 'height', run.pageHeight, 'frames>50ms', run.framesOver50, 'worst', run.worstMs + 'ms',
    'blocking', run.totalBlockingMs + 'ms', 'CLS', run.cls);
  for (const d of run.dominant.slice(0, 5)) console.log('   ', d.frames, 'x', d.totalMs + 'ms', d.script);
  await ctx.close();
}

await browser.close();
fs.writeFileSync(path.join(OUT, `${TAG}-perf.json`), JSON.stringify(report, null, 2));
