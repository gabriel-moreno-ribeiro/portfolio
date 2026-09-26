import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'shots');
// a seção agora é lazy (LazySection): rola a página inteira antes de esperar pelo seletor
async function warm(page) {
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < total; y += 600) { await page.evaluate((v) => scrollTo(0, v), y); await page.waitForTimeout(70); }
  await page.waitForSelector('#work-experience .exp__car', { timeout: 30000 });
  await page.waitForTimeout(1200);
}

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const errs = [];
p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
p.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await warm(p);
for (const pct of [0.25, 0.5, 1]) {
  for (let i = 0; i < 6; i++) {
    const off = await p.evaluate((f) => {
      const r = document.querySelector('#work-experience').getBoundingClientRect();
      const want = -f * (r.height - innerHeight);
      scrollTo(0, Math.max(0, r.top + scrollY + f * (r.height - innerHeight)));
      return Math.abs(r.top - want);
    }, pct);
    await p.waitForTimeout(400);
    if (off < 4) break;
  }
  await p.waitForTimeout(700);
  const info = await p.evaluate(() => {
    const car = document.querySelector('.exp__car').getBoundingClientRect();
    const odo = document.querySelector('.exp__odo').getBoundingClientRect();
    const pill = document.querySelector('.navbar, nav[class*="nav"]')?.getBoundingClientRect();
    return { carY: Math.round(car.top + car.height / 2), vh: innerHeight, odoTop: Math.round(odo.top), pillBottom: pill ? Math.round(pill.bottom) : null, odoText: document.querySelector('.exp__odo').textContent.replace(/\s+/g, ' ') };
  });
  console.log(pct, JSON.stringify({ ...info, inView: info.carY > 0 && info.carY < info.vh, odoBelowPill: info.pillBottom === null || info.odoTop >= info.pillBottom - 2 }));
  await p.screenshot({ path: `${OUT}/mob-${Math.round(pct * 100)}.png` });
}
console.log(errs.length ? errs.join('\n') : 'sem erros de console');
await b.close();
