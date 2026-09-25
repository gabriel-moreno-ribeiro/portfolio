/**
 * qa/scripts/console-probe.mjs - sanity check that console collection in
 * capture.mjs is not silently broken (e.g. the app monkey-patching console,
 * or Playwright missing messages). Injects two known messages and confirms
 * they are received.
 * Usage: node qa/scripts/console-probe.mjs [baseUrl]
 */
import { chromium } from 'playwright';

const BASE = process.argv[2] || 'http://localhost:5173';
const b = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const c = await b.newContext({ viewport: { width: 1440, height: 900 } });
const p = await c.newPage();
const all = [];
p.on('console', (m) => all.push({ type: m.type(), text: m.text().slice(0, 160) }));
p.on('pageerror', (e) => all.push({ type: 'pageerror', text: String(e.message).slice(0, 160) }));
await p.goto(BASE + '/', { waitUntil: 'load', timeout: 60000 });
await p.waitForTimeout(5000);
await p.evaluate(async () => {
  const nap = (ms) => new Promise((r) => setTimeout(r, ms));
  const maxY = () => document.documentElement.scrollHeight - window.innerHeight;
  let y = 0;
  while (y < maxY()) { y = Math.min(y + 600, maxY()); window.scrollTo({ top: y, behavior: 'instant' }); await nap(100); }
});
await p.waitForTimeout(2000);
await p.evaluate(() => { console.warn('QA-PROBE-WARN'); console.error('QA-PROBE-ERROR'); console.log('QA-PROBE-LOG'); });
await p.waitForTimeout(600);
const patched = await p.evaluate(() => ({
  warnIsNative: /\[native code\]/.test(String(console.warn)),
  errorIsNative: /\[native code\]/.test(String(console.error)),
  logIsNative: /\[native code\]/.test(String(console.log)),
}));
const tally = {};
for (const m of all) tally[m.type] = (tally[m.type] || 0) + 1;
console.log('console types received:', JSON.stringify(tally));
console.log('probe messages received:', JSON.stringify(all.filter((m) => m.text.includes('QA-PROBE'))));
console.log('console still native (not monkey-patched by the app):', JSON.stringify(patched));
console.log('non-probe messages:', JSON.stringify(all.filter((m) => !m.text.includes('QA-PROBE')).slice(0, 25), null, 1));
await b.close();
