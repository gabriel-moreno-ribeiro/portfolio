/**
 * measure.mjs — fluidez da rolagem da Home sob CPU 4x (Playwright + CDP).
 *
 * Cenários: viewport 1440x900 e 390x844 (isMobile, touch, DPR 2) x caminho quente e frio.
 *   quente: rola a página inteira uma vez (monta tudo), volta ao topo, e então mede a rolagem
 *           do topo ao fim em passos de 300 px a cada 100 ms.
 *   frio:   página recém-carregada, rolagem direta (as seções lazy montam dentro da janela medida).
 *
 * Para cada `long-animation-frame` (> 50 ms por definição) guarda duração, renderStart,
 * styleAndLayoutStart, forcedStyleAndLayoutDuration e os scripts (sourceURL + função + invoker).
 *
 * Uso: node qa/smooth/measure.mjs <rotulo> [--runs=3] [--only=1440-warm,390-cold]
 * Saída: qa/smooth/<rotulo>-<viewport>-<caminho>.json e qa/smooth/<rotulo>-summary.json
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const LABEL = process.argv[2] ?? 'before';
const arg = (name, fallback) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.split('=')[1] : fallback;
};
const RUNS = Number(arg('runs', 3));
const ONLY = arg('only', '').split(',').filter(Boolean);
const URL = arg('url', 'http://localhost:5173/');
const STEP = 300;
const EVERY = 100;
const RATE = 4;

const VIEWPORTS = {
  1440: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  390: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};

// Roda dentro da página, antes de qualquer script do site.
function probe() {
  window.__loaf = [];
  window.__steps = [];
  window.__frames = [];
  window.__counting = false;
  const short = (u) => String(u || '').replace(location.origin, '').split('?')[0];
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) {
      const end = e.startTime + e.duration;
      window.__loaf.push({
        start: Math.round(e.startTime),
        dur: Math.round(e.duration),
        blocking: Math.round(e.blockingDuration || 0),
        renderStart: Math.round(e.renderStart || 0),
        styleAndLayoutStart: Math.round(e.styleAndLayoutStart || 0),
        // fases: antes do render (script), render inteiro, e só estilo+layout
        preRender: e.renderStart ? Math.round(e.renderStart - e.startTime) : Math.round(e.duration),
        render: e.renderStart ? Math.round(end - e.renderStart) : 0,
        styleLayout: e.styleAndLayoutStart ? Math.round(end - e.styleAndLayoutStart) : 0,
        forced: Math.round((e.scripts || []).reduce((s, x) => s + (x.forcedStyleAndLayoutDuration || 0), 0)),
        scripts: (e.scripts || [])
          .map((s) => ({
            dur: Math.round(s.duration),
            forced: Math.round(s.forcedStyleAndLayoutDuration || 0),
            type: s.invokerType,
            invoker: String(s.invoker || '').slice(0, 120),
            src: short(s.sourceURL),
            fn: s.sourceFunctionName || '',
          }))
          .sort((a, b) => b.dur - a.dur)
          .slice(0, 5),
      });
    }
  }).observe({ type: 'long-animation-frame', buffered: true });
  const tick = (t) => {
    if (window.__counting) window.__frames.push(t);
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

const median = (xs) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? s[Math.floor((s.length - 1) / 2)] : 0;
};

async function scrollThrough(page, step, every) {
  // Para quando a rolagem deixa de avançar (fim da página), sem ler scrollHeight a cada passo.
  let y = 0;
  let last = -1;
  for (let i = 0; i < 400; i++) {
    const at = await page.evaluate((v) => {
      window.scrollTo({ top: v, behavior: 'instant' });
      window.__steps.push([Math.round(performance.now()), v]);
      return Math.round(window.scrollY);
    }, y);
    await page.waitForTimeout(every);
    if (at === last && at < y) break;
    last = at;
    y += step;
  }
}

async function runOnce(browser, vp, mode) {
  const ctx = await browser.newContext(VIEWPORTS[vp]);
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 300)); });
  page.on('pageerror', (e) => errors.push(`pageerror: ${String(e).slice(0, 300)}`));
  await page.addInitScript(probe);
  const cdp = await ctx.newCDPSession(page);
  await page.goto(URL, { waitUntil: 'load' });
  await page.waitForTimeout(2000);

  if (mode === 'warm') {
    await scrollThrough(page, 600, 120);
    await page.waitForTimeout(1500);
    // segunda passada curta: o que ainda estava baixando na primeira termina de montar
    await scrollThrough(page, 900, 80);
    await page.waitForTimeout(1000);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.waitForTimeout(1500);
  }

  await cdp.send('Emulation.setCPUThrottlingRate', { rate: RATE });
  await page.waitForTimeout(500);
  const t0 = await page.evaluate(() => {
    window.__steps = [];
    window.__frames = [];
    window.__counting = true;
    return performance.now();
  });
  await scrollThrough(page, STEP, EVERY);
  await page.waitForTimeout(600);
  const out = await page.evaluate(() => {
    window.__counting = false;
    const ids = ['main-content', 'moments', 'background', 'work', 'numbers', 'research', 'skills', 'work-experience', 'contact'];
    const sections = ids
      .map((id) => {
        const el = document.getElementById(id);
        if (!el || id === 'main-content') return null;
        const r = el.getBoundingClientRect();
        return { id, top: Math.round(r.top + scrollY), bottom: Math.round(r.bottom + scrollY) };
      })
      .filter(Boolean);
    const footer = document.querySelector('footer');
    if (footer) {
      const r = footer.getBoundingClientRect();
      sections.push({ id: 'footer', top: Math.round(r.top + scrollY), bottom: Math.round(r.bottom + scrollY) });
    }
    return {
      t1: performance.now(),
      loaf: window.__loaf,
      steps: window.__steps,
      frames: window.__frames,
      sections,
      height: document.documentElement.scrollHeight,
      vh: innerHeight,
    };
  });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  await ctx.close();

  const inWindow = out.loaf.filter((e) => e.start >= t0 - 1 && e.start <= out.t1);
  const where = (t) => {
    let y = 0;
    for (const [ts, v] of out.steps) { if (ts <= t) y = v; else break; }
    const mid = y + out.vh / 2;
    const hit = out.sections.find((s) => mid >= s.top && mid < s.bottom);
    return { y, section: hit ? hit.id : y < (out.sections[0]?.top ?? 0) ? 'hero' : 'gap' };
  };
  const frames = inWindow
    .map((e) => ({ ...e, ...where(e.start + e.dur) }))
    .sort((a, b) => b.dur - a.dur);
  const gaps = [];
  for (let i = 1; i < out.frames.length; i++) gaps.push(out.frames[i] - out.frames[i - 1]);
  const elapsed = out.frames.length > 1 ? out.frames[out.frames.length - 1] - out.frames[0] : 0;
  return {
    over50: frames.length,
    over100: frames.filter((f) => f.dur > 100).length,
    maxFrame: frames[0]?.dur ?? 0,
    blocking: frames.reduce((s, f) => s + f.blocking, 0),
    forced: frames.reduce((s, f) => s + f.forced, 0),
    fps: elapsed ? Math.round(((out.frames.length - 1) / elapsed) * 10000) / 10 : 0,
    rafGapsOver50: gaps.filter((g) => g > 50).length,
    rafGapMax: Math.round(Math.max(0, ...gaps)),
    steps: out.steps.length,
    height: out.height,
    errors,
    frames,
  };
}

const browser = await chromium.launch();
const summary = {};
for (const vp of [1440, 390]) {
  for (const mode of ['warm', 'cold']) {
    const key = `${vp}-${mode}`;
    if (ONLY.length && !ONLY.includes(key)) continue;
    const runs = [];
    for (let i = 0; i < RUNS; i++) runs.push(await runOnce(browser, vp, mode));
    const row = {
      over50: median(runs.map((r) => r.over50)),
      over100: median(runs.map((r) => r.over100)),
      maxFrame: median(runs.map((r) => r.maxFrame)),
      fps: median(runs.map((r) => r.fps)),
      blocking: median(runs.map((r) => r.blocking)),
      forced: median(runs.map((r) => r.forced)),
      rafGapsOver50: median(runs.map((r) => r.rafGapsOver50)),
      perRun: runs.map((r) => ({ over50: r.over50, maxFrame: r.maxFrame, fps: r.fps, blocking: r.blocking })),
      errors: [...new Set(runs.flatMap((r) => r.errors))],
    };
    summary[key] = row;
    fs.writeFileSync(
      path.join(HERE, `${LABEL}-${key}.json`),
      JSON.stringify({ label: LABEL, key, url: URL, cpuRate: RATE, step: STEP, every: EVERY, median: row, runs }, null, 2),
    );
    console.log(`${key.padEnd(10)} >50ms=${row.over50} >100ms=${row.over100} maior=${row.maxFrame}ms fps=${row.fps} TBT=${row.blocking}ms forced=${row.forced}ms erros=${row.errors.length}  runs=${JSON.stringify(row.perRun.map((r) => [r.over50, r.maxFrame, r.fps]))}`);
  }
}
const file = path.join(HERE, `${LABEL}-summary.json`);
const prev = fs.existsSync(file) && ONLY.length ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
fs.writeFileSync(file, JSON.stringify({ ...prev, ...summary }, null, 2));
await browser.close();
