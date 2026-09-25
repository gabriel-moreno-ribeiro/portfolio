import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'shots');
const b = await chromium.launch();
for (const theme of ['light', 'dark']) {
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await p.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
  await p.waitForSelector('#work-experience .exp__card-cta');
  for (let i = 0; i < 6; i++) {
    const off = await p.evaluate(() => {
      const r = document.querySelector('#work-experience').getBoundingClientRect();
      scrollTo(0, r.top + scrollY + r.height - innerHeight);
      return Math.abs(r.top + r.height - innerHeight);
    });
    await p.waitForTimeout(400);
    if (off < 4) break;
  }
  await p.waitForTimeout(800);
  const info = await p.evaluate(() => {
    const a = document.querySelector('.exp__card-cta');
    const cs = getComputedStyle(a);
    const card = document.querySelector('#exp-hibeex').getBoundingClientRect();
    const sec = document.querySelector('#work-experience').getBoundingClientRect();
    return {
      cta: { color: cs.color, decoration: cs.textDecorationLine, border: cs.borderTopColor, display: cs.display, on: a.classList.contains('is-on') },
      estradaNuaAbaixoDoHibeex: Math.round(sec.bottom - card.bottom),
      hazardOn: document.querySelector('.exp__hazard')?.classList.contains('is-on'),
    };
  });
  console.log(theme, JSON.stringify(info));
  await p.screenshot({ path: `${OUT}/cta-${theme}.png`, clip: { x: 560, y: 0, width: 560, height: 500 } });
  await p.close();
}
await b.close();
