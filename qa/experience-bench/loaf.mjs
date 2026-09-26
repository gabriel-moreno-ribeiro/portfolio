/**
 * loaf.mjs — mesmo cenário do QA (scroll da seção em 40 passos, CPU 4×), mas guardando a
 * decomposição de cada `long-animation-frame`: quanto foi script (com atribuição) e quanto
 * foi render/estilo/layout. Uso: node qa/experience-bench/loaf.mjs [1440|390]
 */
import { chromium } from 'playwright';

const W = Number(process.argv[2] ?? 1440);
const H = W < 600 ? 844 : 900;
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: W, height: H }, isMobile: W < 600, hasTouch: W < 600, deviceScaleFactor: W < 600 ? 2 : 1 });
const p = await ctx.newPage();
const cdp = await ctx.newCDPSession(p);
await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
// `--cold` = exatamente o cenário do QA (página nunca rolada antes de medir, então todas as
// seções lazy montam DENTRO da janela medida). Sem a flag, aquece antes.
if (!process.argv.includes('--cold')) {
  const total = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < total; y += 600) { await p.evaluate((v) => scrollTo(0, v), y); await p.waitForTimeout(60); }
  await p.waitForTimeout(1500);
}
await p.waitForSelector('#work-experience', { state: 'attached', timeout: 30000 });
const geo = await p.evaluate(() => {
  const r = document.querySelector('#work-experience').getBoundingClientRect();
  return { start: Math.round(r.top + scrollY), end: Math.round(r.top + scrollY + r.height - innerHeight) };
});

await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
await p.waitForTimeout(400);
await p.evaluate(() => {
  window.__loaf = [];
  window.__obs = new PerformanceObserver((l) => {
    for (const e of l.getEntries()) {
      const j = e.toJSON ? e.toJSON() : e;
      window.__loaf.push({
        start: Math.round(e.startTime),
        dur: Math.round(e.duration),
        blocking: Math.round(e.blockingDuration || 0),
        // fases: script → render (estilo+layout) → paint
        preRender: Math.round((e.renderStart || e.startTime) - e.startTime),
        render: e.renderStart ? Math.round(e.startTime + e.duration - e.renderStart) : 0,
        styleLayout: e.styleAndLayoutStart ? Math.round(e.startTime + e.duration - e.styleAndLayoutStart) : 0,
        scripts: (j.scripts || []).map((s) => ({
          dur: Math.round(s.duration),
          type: s.invokerType,
          invoker: String(s.invoker || '').slice(0, 90),
          src: String(s.sourceURL || '').split('/').slice(-1)[0] + ':' + (s.sourceFunctionName || '?'),
        })).sort((x, y) => y.dur - x.dur).slice(0, 3),
      });
    }
  });
  window.__obs.observe({ type: 'long-animation-frame', buffered: false });
});
await p.evaluate(async ({ start, end }) => {
  const nap = (ms) => new Promise((r) => setTimeout(r, ms));
  scrollTo({ top: start, behavior: 'instant' });
  await nap(300);
  for (let i = 1; i <= 40; i++) { scrollTo({ top: Math.round(start + ((end - start) * i) / 40), behavior: 'instant' }); await nap(100); }
}, geo);
const out = await p.evaluate(() => { window.__obs.disconnect(); return window.__loaf; });
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });

const over = out.filter((e) => e.dur > 50).sort((a, b) => b.dur - a.dur);
console.log(`${W}x${H}  LoAF total=${out.length}  >50ms=${over.length}  >100ms=${out.filter((e) => e.dur > 100).length}  maior=${over[0]?.dur ?? 0}ms  TBT=${out.reduce((s, e) => s + e.blocking, 0)}ms`);
for (const e of over.slice(0, 8)) {
  console.log(`  dur=${String(e.dur).padStart(5)} script=${String(e.preRender).padStart(5)} render=${String(e.render).padStart(5)} styleLayout=${String(e.styleLayout).padStart(5)} blocking=${e.blocking}`);
  for (const s of e.scripts) console.log(`        ${String(s.dur).padStart(5)}ms ${s.type} ${s.src} ${s.invoker}`);
}
await b.close();
