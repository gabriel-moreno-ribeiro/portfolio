/**
 * trace.mjs — para onde vai o tempo da thread principal durante a rolagem (CPU 4x).
 *
 * O `long-animation-frame` diz quanto durou o quadro e qual script dominou, mas não abre o que
 * acontece dentro da fase de render (eventos de scroll, rAF, animações, estilo, layout, pintura,
 * layerize, commit). Este script grava um trace do Chrome no mesmo cenário do measure.mjs e soma
 * o tempo próprio (self time) por tipo de evento, e detalha as tarefas mais longas.
 *
 * Uso: node qa/smooth/trace.mjs <rotulo> <1440|390> <warm|cold>
 * Saída: qa/smooth/<rotulo>-trace-<viewport>-<caminho>.json
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const LABEL = process.argv[2] ?? 'before';
const VP = Number(process.argv[3] ?? 1440);
const MODE = process.argv[4] ?? 'warm';
const URL = 'http://localhost:5173/';

const VIEWPORTS = {
  1440: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  390: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};

async function scrollThrough(page, step, every) {
  let y = 0;
  let last = -1;
  for (let i = 0; i < 400; i++) {
    const at = await page.evaluate((v) => { window.scrollTo({ top: v, behavior: 'instant' }); return Math.round(window.scrollY); }, y);
    await page.waitForTimeout(every);
    if (at === last && at < y) break;
    last = at;
    y += step;
  }
}

const browser = await chromium.launch();
const ctx = await browser.newContext(VIEWPORTS[VP]);
const page = await ctx.newPage();
const cdp = await ctx.newCDPSession(page);
await page.goto(URL, { waitUntil: 'load' });
await page.waitForTimeout(2000);
if (MODE === 'warm') {
  await scrollThrough(page, 600, 120);
  await page.waitForTimeout(1500);
  await scrollThrough(page, 900, 80);
  await page.waitForTimeout(1000);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(1500);
}
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
await page.waitForTimeout(500);

const events = [];
cdp.on('Tracing.dataCollected', (d) => { for (const e of d.value) events.push(e); });
const done = new Promise((r) => cdp.once('Tracing.tracingComplete', r));
await cdp.send('Tracing.start', {
  transferMode: 'ReportEvents',
  traceConfig: {
    recordMode: 'recordAsMuchAsPossible',
    includedCategories: ['devtools.timeline', 'disabled-by-default-devtools.timeline', 'v8', 'blink', 'cc', 'gpu', 'loading', 'toplevel'],
    excludedCategories: ['*'],
  },
});
await scrollThrough(page, 300, 100);
await page.waitForTimeout(600);
await cdp.send('Tracing.end');
await done;
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
await browser.close();

// Thread principal do renderer: a que tem mais eventos "RunTask" com FunctionCall/Layout dentro.
const byThread = new Map();
for (const e of events) {
  if (e.ph !== 'X') continue;
  const k = `${e.pid}:${e.tid}`;
  if (!byThread.has(k)) byThread.set(k, []);
  byThread.get(k).push(e);
}
let main = null;
let best = -1;
for (const [k, list] of byThread) {
  const score = list.filter((e) => e.name === 'UpdateLayoutTree' || e.name === 'Layout' || e.name === 'FunctionCall').length;
  if (score > best) { best = score; main = k; }
}
const list = byThread.get(main).sort((a, b) => a.ts - b.ts || b.dur - a.dur);

// Tempo próprio por nome (pilha de eventos aninhados).
const self = new Map();
const stack = [];
const tops = [];
const close = (e) => {
  const own = e.dur - e.kids;
  const cur = self.get(e.name) ?? { ms: 0, n: 0 };
  cur.ms += own / 1000; cur.n += 1;
  self.set(e.name, cur);
};
for (const e of list) {
  while (stack.length && stack[stack.length - 1].ts + stack[stack.length - 1].dur <= e.ts) close(stack.pop());
  const node = { name: e.name, ts: e.ts, dur: e.dur ?? 0, kids: 0, args: e.args, children: [] };
  if (stack.length) { stack[stack.length - 1].kids += node.dur; stack[stack.length - 1].children.push(node); } else tops.push(node);
  stack.push(node);
}
while (stack.length) close(stack.pop());

const describe = (n) => {
  const d = n.args?.data ?? n.args?.beginData ?? {};
  const bits = [d.functionName, d.url && String(d.url).replace('http://localhost:5173', '').split('?')[0], d.type, d.stackTrace?.[0]?.functionName, d.stackTrace?.[0]?.url && String(d.stackTrace[0].url).replace('http://localhost:5173', '').split('?')[0]].filter(Boolean);
  return bits.join(' ');
};
const flat = (n, depth, out) => {
  out.push({ depth, name: n.name, ms: Math.round(n.dur / 1000), self: Math.round((n.dur - n.kids) / 1000), what: describe(n) });
  for (const c of n.children.filter((k) => k.dur > 20000).sort((a, b) => b.dur - a.dur).slice(0, 6)) flat(c, depth + 1, out);
  return out;
};
const long = tops.filter((t) => t.dur > 50000).sort((a, b) => b.dur - a.dur);
const report = {
  label: LABEL, viewport: VP, mode: MODE, mainThread: main, events: events.length,
  longTasks: long.length,
  selfTime: [...self].map(([name, v]) => ({ name, ms: Math.round(v.ms), n: v.n })).sort((a, b) => b.ms - a.ms).slice(0, 30),
  top: long.slice(0, 10).map((t) => flat(t, 0, [])),
};
fs.writeFileSync(path.join(HERE, `${LABEL}-trace-${VP}-${MODE}.json`), JSON.stringify(report, null, 2));
console.log(`${VP} ${MODE}: eventos=${events.length} tarefas>50ms=${long.length}`);
for (const s of report.selfTime.slice(0, 22)) console.log(`  ${String(s.ms).padStart(6)}ms x${String(s.n).padStart(5)}  ${s.name}`);
for (const t of report.top.slice(0, 6)) {
  console.log('--');
  for (const r of t.slice(0, 14)) console.log(`${'  '.repeat(r.depth)}${r.ms}ms (self ${r.self}) ${r.name} ${r.what}`);
}
