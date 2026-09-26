/**
 * proof.mjs — provas visuais + numéricas da seção Experience na página real.
 * Uso: node qa/experience-bench/proof.mjs [url]
 * Grava em qa/experience-bench/shots/.
 * 1) o carro está dentro da viewport em 10/25/50/75/100 % da seção;
 * 2) o capô aponta para onde o cone aponta (desenha a seta da tangente por cima).
 */
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TARGET = process.argv[2] ?? 'http://localhost:5173/';
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'shots');
// a seção agora é lazy (LazySection): rola a página inteira antes de esperar pelo seletor
async function warm(page) {
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < total; y += 600) { await page.evaluate((v) => scrollTo(0, v), y); await page.waitForTimeout(70); }
  await page.waitForSelector('#work-experience .exp__car', { timeout: 30000 });
  await page.waitForTimeout(1200);
}

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
p.on('console', (m) => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
await p.goto(TARGET, { waitUntil: 'networkidle' });
await warm(p);

// seta da tangente por cima do carro (só para a prova)
await p.evaluate(() => {
  const d = document.createElement('div');
  d.id = '__tangent';
  d.style.cssText = 'position:fixed;z-index:9999;height:4px;background:#00a000;transform-origin:0 50%;pointer-events:none';
  document.body.appendChild(d);
  window.__mark = () => {
    const car = document.querySelector('.exp__car');
    const beam = document.querySelector('.exp__beam');
    const cr = car.getBoundingClientRect();
    const m = getComputedStyle(beam).transform.match(/matrix\(([^)]+)\)/);
    const [a, bb] = m[1].split(',').map(Number);
    const deg = (Math.atan2(bb, a) * 180) / Math.PI;
    const el = document.getElementById('__tangent');
    el.style.left = cr.left + cr.width / 2 + 'px';
    el.style.top = cr.top + cr.height / 2 + 'px';
    el.style.width = '170px';
    el.style.transform = `rotate(${deg}deg)`;
    return { deg: Math.round(deg), cx: Math.round(cr.left + cr.width / 2), cy: Math.round(cr.top + cr.height / 2) };
  };
});

const rows = [];
for (const pct of [0.1, 0.25, 0.5, 0.75, 1]) {
  // O conteúdo lazy acima da seção ainda cresce: rola, espera, remede e repete até o
  // topo da seção parar de se mexer. Sem isso a captura mente sobre o progresso.
  for (let tries = 0; tries < 6; tries++) {
    const off = await p.evaluate((f) => {
      const r = document.querySelector('#work-experience').getBoundingClientRect();
      const want = -f * (r.height - innerHeight);
      scrollTo(0, Math.max(0, r.top + scrollY + f * (r.height - innerHeight)));
      return Math.abs(r.top - want);
    }, pct);
    await p.waitForTimeout(450);
    if (off < 4) break;
  }
  await p.waitForTimeout(700);
  const info = await p.evaluate(() => {
    const r = window.__mark();
    return { ...r, vh: innerHeight, odo: document.querySelector('.exp__odo').textContent.replace(/\s+/g, ' ') };
  });
  const inView = info.cy > 0 && info.cy < info.vh;
  rows.push({ pct, carY: info.cy, screenFrac: +(info.cy / info.vh).toFixed(2), inView, tangentDeg: info.deg, odo: info.odo });
  await p.screenshot({ path: `${OUT}/car-${Math.round(pct * 100)}.png` });
}
console.table(rows);
console.log('todos dentro da viewport:', rows.every((r) => r.inView));
console.log(errs.length ? errs.join('\n') : 'sem erros de console');
await b.close();
