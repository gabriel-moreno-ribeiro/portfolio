import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'shots');
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
const total = await p.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < total; y += 600) { await p.evaluate((v) => scrollTo(0, v), y); await p.waitForTimeout(70); }
await p.waitForSelector('#work-experience .exp__car');
await p.evaluate(() => { const r = document.querySelector('#work-experience').getBoundingClientRect(); scrollTo(0, r.top + scrollY - 80); });
await p.waitForTimeout(1200);
console.log(JSON.stringify(await p.evaluate(() => {
  const h = document.querySelector('.exp__head').getBoundingClientRect();
  const first = document.querySelector('.exp__stop').getBoundingClientRect();
  const odo = document.querySelector('.exp__odo').getBoundingClientRect();
  return { headerAltura: Math.round(h.height), vaoAteOCardTopo: Math.round(first.top - h.bottom), odoTop: Math.round(odo.top), subtitulo: !!document.querySelector('.exp__sub'), nav: !!document.querySelector('#work-experience nav') };
})));
await p.screenshot({ path: `${OUT}/header.png` });
await b.close();
