/**
 * attrib.mjs — de quem é o JavaScript que roda durante a rolagem (CPU 4x).
 *
 * Duas fontes, no mesmo cenário do measure.mjs:
 *   1. CPU profile (CDP Profiler): tempo próprio por arquivo e por função.
 *   2. Commits do React (gancho __REACT_DEVTOOLS_GLOBAL_HOOK__): quais componentes renderizaram,
 *      quantas vezes e por quanto tempo. `performWorkUntilDeadline` no long-animation-frame só diz
 *      "foi o React"; isto diz qual componente.
 *
 * O gancho tem custo próprio, então os números de quadro saem do measure.mjs, não daqui.
 *
 * Uso: node qa/smooth/attrib.mjs <rotulo> <1440|390> <warm|cold>
 * Saída: qa/smooth/<rotulo>-attrib-<viewport>-<caminho>.json
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

function hook() {
  window.__commits = [];
  window.__recording = false;
  const nameOf = (f) => {
    const t = f.type;
    if (!t) return null;
    if (typeof t === 'function') return t.displayName || t.name || 'Anonymous';
    if (typeof t === 'object') {
      const inner = t.render || t.type;
      if (typeof inner === 'function') return inner.displayName || inner.name || 'Anonymous';
      if (t.displayName) return t.displayName;
    }
    return null;
  };
  const walk = (fiber, out, parent) => {
    let node = fiber;
    while (node) {
      const name = nameOf(node);
      const own = name || parent;
      const mounted = node.alternate === null;
      if (name && (mounted || (node.flags & 1) === 1)) {
        out.push([name, mounted ? 1 : 0, Math.round((node.selfBaseDuration || 0) * 10) / 10, Math.round((node.actualDuration || 0) * 10) / 10]);
      }
      if (node.child && (mounted || node.child !== node.alternate.child)) walk(node.child, out, own);
      node = node.sibling;
    }
  };
  const renderers = new Map();
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
    renderers,
    supportsFiber: true,
    supportsFlight: false,
    hasUnsupportedRendererAttached: false,
    inject(r) { const id = renderers.size + 1; renderers.set(id, r); return id; },
    onCommitFiberRoot(_id, root) {
      if (!window.__recording) return;
      try {
        const out = [];
        walk(root.current, out, null);
        if (out.length) window.__commits.push({ t: Math.round(performance.now()), y: Math.round(window.pageYOffset), list: out });
      } catch { /* o gancho nunca pode derrubar a página */ }
    },
    onPostCommitFiberRoot() {},
    onCommitFiberUnmount() {},
    setStrictMode() {},
    checkDCE() {},
    on() {}, off() {}, emit() {}, sub() { return () => {}; },
  };
}

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
await page.addInitScript(hook);
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
await cdp.send('Profiler.enable');
await cdp.send('Profiler.setSamplingInterval', { interval: 500 });
await page.evaluate(() => { window.__commits = []; window.__recording = true; });
await cdp.send('Profiler.start');
const t0 = Date.now();
await scrollThrough(page, 300, 100);
await page.waitForTimeout(600);
const { profile } = await cdp.send('Profiler.stop');
const wall = Date.now() - t0;
const commits = await page.evaluate(() => { window.__recording = false; return window.__commits; });
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
await browser.close();

// ---- CPU profile: tempo próprio por nó, por função e por arquivo
const nodes = new Map(profile.nodes.map((n) => [n.id, n]));
const selfUs = new Map();
for (let i = 0; i < profile.samples.length; i++) {
  const id = profile.samples[i];
  selfUs.set(id, (selfUs.get(id) ?? 0) + (profile.timeDeltas[i] ?? 0));
}
const clean = (u) => String(u || '').replace('http://localhost:5173', '').split('?')[0];
const byFile = new Map();
const byFn = new Map();
let busy = 0;
for (const [id, us] of selfUs) {
  const cf = nodes.get(id).callFrame;
  if (cf.functionName === '(idle)' || cf.functionName === '(program)' && !cf.url) {
    if (cf.functionName === '(idle)') continue;
  }
  const file = clean(cf.url) || cf.functionName;
  busy += us;
  byFile.set(file, (byFile.get(file) ?? 0) + us);
  const fn = `${cf.functionName || '(anon)'} @ ${clean(cf.url) || '-'}:${cf.lineNumber + 1}`;
  byFn.set(fn, (byFn.get(fn) ?? 0) + us);
}
const top = (m, n) => [...m].sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, us]) => ({ what: k, ms: Math.round(us / 1000) }));

// ---- React: componentes que renderizaram
const comp = new Map();
for (const c of commits) {
  for (const [name, mounted, selfMs] of c.list) {
    const cur = comp.get(name) ?? { renders: 0, mounts: 0, selfMs: 0 };
    cur.renders += 1; cur.mounts += mounted; cur.selfMs += selfMs;
    comp.set(name, cur);
  }
}
const components = [...comp].map(([name, v]) => ({ name, ...v, selfMs: Math.round(v.selfMs) })).sort((a, b) => b.selfMs - a.selfMs || b.renders - a.renders);
// raiz de cada commit: o primeiro componente da lista que não é só casca de roteador/provider
const roots = new Map();
for (const c of commits) {
  const key = c.list.slice(0, 3).map((l) => l[0]).join(' > ');
  const cur = roots.get(key) ?? { commits: 0, comps: 0, ms: 0 };
  cur.commits += 1; cur.comps += c.list.length; cur.ms += c.list.reduce((s, l) => s + l[2], 0);
  roots.set(key, cur);
}

const report = {
  label: LABEL, viewport: VP, mode: MODE, wallMs: wall, busyMs: Math.round(busy / 1000),
  files: top(byFile, 30), functions: top(byFn, 40),
  commits: commits.length, components: components.slice(0, 50),
  commitRoots: [...roots].map(([k, v]) => ({ first: k, ...v, ms: Math.round(v.ms) })).sort((a, b) => b.ms - a.ms).slice(0, 25),
  timeline: commits.map((c) => ({ t: c.t, y: c.y, n: c.list.length, ms: Math.round(c.list.reduce((s, l) => s + l[2], 0)), first: c.list.slice(0, 4).map((l) => l[0]).join(' > ') })),
};
fs.writeFileSync(path.join(HERE, `${LABEL}-attrib-${VP}-${MODE}.json`), JSON.stringify(report, null, 2));
console.log(`${VP} ${MODE}: parede=${wall}ms ocupado=${report.busyMs}ms commits=${commits.length}`);
console.log('-- arquivos (tempo próprio)');
for (const f of report.files.slice(0, 18)) console.log(`  ${String(f.ms).padStart(6)}ms ${f.what}`);
console.log('-- funções (tempo próprio)');
for (const f of report.functions.slice(0, 22)) console.log(`  ${String(f.ms).padStart(6)}ms ${f.what}`);
console.log('-- componentes React (renders / mounts / ms próprios)');
for (const c of report.components.slice(0, 30)) console.log(`  ${String(c.selfMs).padStart(6)}ms r=${String(c.renders).padStart(4)} m=${String(c.mounts).padStart(3)} ${c.name}`);
console.log('-- commits por raiz');
for (const c of report.commitRoots.slice(0, 15)) console.log(`  ${String(c.ms).padStart(6)}ms commits=${String(c.commits).padStart(3)} comps=${String(c.comps).padStart(4)} ${c.first}`);
