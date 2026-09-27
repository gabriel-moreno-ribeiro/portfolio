// Ruler click trace at 1440 (SwiftShader): when the new title enters the card (it is inserted
// next to the outgoing one, so a :last-child watcher sees it only after the 250 ms crossfade).
import { chromium } from 'playwright';
import fs from 'node:fs';
const out = [];
const b = await chromium.launch({ args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:5173/library', { waitUntil: 'load' });
await p.waitForSelector('.library--ready', { timeout: 60000 });
await p.waitForTimeout(3000);
for (const to of [6, 1]) {
out.push(await p.evaluate(async (to) => {
  const cap = document.querySelector('.library__caption');
  const titles = () => [...cap.querySelectorAll('.library__title')].map(e => e.textContent).join('|');
  const log = [];
  const t0 = performance.now();
  const mo = new MutationObserver(() => log.push(['mo', Math.round(performance.now() - t0), titles()]));
  mo.observe(cap, { childList: true, subtree: true, characterData: true });
  log.push(['before', titles()]);
  document.querySelectorAll('.library__ages button.library__age')[to].click();
  log.push(['sync', Math.round(performance.now() - t0), titles()]);
  await Promise.resolve();
  log.push(['micro', Math.round(performance.now() - t0), titles()]);
  await new Promise(r => setTimeout(r, 0));
  log.push(['task', Math.round(performance.now() - t0), titles()]);
  await new Promise(r => requestAnimationFrame(r));
  log.push(['raf', Math.round(performance.now() - t0), titles()]);
  await new Promise(r => setTimeout(r, 3000));
  mo.disconnect();
  return log;
}, to));
}
console.log(JSON.stringify(out));
fs.writeFileSync('C:/portfolio-gabriel/qa/libnews-repair/age-click-trace.json', JSON.stringify(out, null, 2));
await b.close();
