// Ruler click with el.click() (no Playwright actionability waits, which cost two frames each):
// time from click to the card showing the age's first book, and how many titles pass by.
import { chromium } from 'playwright';
import fs from 'node:fs';
const b = await chromium.launch({ args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=swiftshader'] });
const out = {};
for (const [w, h] of [[1440, 900], [390, 844]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.goto('http://localhost:5173/library', { waitUntil: 'load' });
  await p.waitForSelector('.library--ready', { timeout: 60000 });
  await p.waitForTimeout(2500);
  out[w] = [];
  for (const to of [6, 1, 10, 0]) {
    out[w].push(await p.evaluate(async (to) => {
      const seen = [];
      const cap = document.querySelector('.library__caption');
      const mo = new MutationObserver(() => { const t = cap.querySelector('.library__caption-body:last-child .library__title')?.textContent; if (t && seen.at(-1)?.t !== t) seen.push({ t, at: performance.now() }); });
      mo.observe(cap, { childList: true, subtree: true, characterData: true });
      const btn = document.querySelectorAll('.library__ages button.library__age')[to];
      const t0 = performance.now();
      btn.click();
      const title = () => cap.querySelector('.library__caption-body:last-child .library__title')?.textContent;
      await new Promise((r) => setTimeout(r, 4000));
      mo.disconnect();
      return { age: btn.getAttribute('aria-label'), firstChangeMs: seen.length ? Math.round(seen[0].at - t0) : null, titlesSeen: seen.length, final: title() };
    }, to));
  }
  await p.close();
}
console.log(JSON.stringify(out));
fs.writeFileSync('C:/portfolio-gabriel/qa/libnews-repair/age-click-sync.json', JSON.stringify(out, null, 2));
await b.close();
