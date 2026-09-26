/**
 * fb2-measure.mjs — mede o vão (px) entre a borda de cada card e a borda da estrada, nas 6
 * paradas, em 1280/1366/1440/390, e tira capturas fb2-*.png.
 * Vão = menor distância horizontal entre a caixa do card e a borda do asfalto (stroke do
 * `.exp__road-edge`) em toda a altura do card; negativo = sobreposição.
 * Uso: node qa/experience-bench/fb2-measure.mjs [url] [--shots]
 */
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const URL = process.argv.find((a) => a.startsWith('http')) ?? 'http://localhost:5173/';
const SHOTS = process.argv.includes('--shots');
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'shots');
const WIDTHS = [1280, 1366, 1440, 390];

async function warm(p) {
  const total = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < total; y += 600) { await p.evaluate((v) => scrollTo(0, v), y); await p.waitForTimeout(60); }
  await p.waitForSelector('#work-experience .exp__car', { timeout: 30000 });
  await p.waitForTimeout(800);
}

const b = await chromium.launch();
const all = {};
for (const w of WIDTHS) {
  const p = await b.newPage({ viewport: { width: w, height: w < 600 ? 844 : 800 }, deviceScaleFactor: 1 });
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(URL, { waitUntil: 'networkidle' });
  await warm(p);
  const r = await p.evaluate(() => {
    const sec = document.querySelector('#work-experience');
    const sr = sec.getBoundingClientRect();
    const edge = sec.querySelector('.exp__road-edge');
    const half = Number(edge.getAttribute('stroke-width')) / 2;
    const len = edge.getTotalLength();
    const pts = [];
    for (let s = 0; s <= len; s += 2) pts.push(edge.getPointAtLength(s));
    return {
      sectionW: Math.round(sr.width),
      stops: [...sec.querySelectorAll('.exp__stop')].map((li) => {
        const c = li.querySelector('.exp__card').getBoundingClientRect();
        const top = c.top - sr.top, bot = c.bottom - sr.top, l = c.left - sr.left, rr = c.right - sr.left;
        let gap = Infinity;
        for (let i = 1; i < pts.length; i++) {
          const a = pts[i - 1], q = pts[i];
          if (q.y < top || a.y > bot) continue;
          const ang = Math.atan2(q.y - a.y, q.x - a.x);
          const hx = half / Math.max(0.2, Math.abs(Math.sin(ang))); // meia-largura horizontal do traço
          const g = q.x < l ? l - (q.x + hx) : q.x > rr ? (q.x - hx) - rr : -Infinity;
          gap = Math.min(gap, g);
        }
        return { id: li.id, gap: Math.round(gap * 10) / 10, cardL: Math.round(l), cardR: Math.round(rr), cardW: Math.round(c.width), inside: l >= -0.5 && rr <= sr.width + 0.5 };
      }),
    };
  });
  all[w] = r;
  console.log(w, 'sectionW', r.sectionW, r.stops.map((s) => `${s.id.replace('exp-', '')}:${s.gap}px[${s.cardL}-${s.cardR}${s.inside ? '' : ' OUT'}]`).join('  '), errs.length ? 'ERR ' + errs.join('|') : '');
  if (SHOTS && (w === 1280 || w === 390)) {
    const ids = await p.evaluate(() => [...document.querySelectorAll('.exp__stop')].map((l) => l.id));
    const center = async (sel, frac = 0.45) => {
      await p.evaluate(([s, f]) => { const el = document.querySelector(s); const r = el.getBoundingClientRect(); scrollTo(0, r.top + scrollY + r.height / 2 - innerHeight * f); }, [sel, frac]);
      await p.waitForTimeout(1800);
    };
    for (let i = 0; i < ids.length; i++) {
      await center(`#${ids[i]}`);
      await p.screenshot({ path: `${OUT}/fb2-stop${i + 1}-${w}.png` });
    }
    // início: carro estacionado na 1ª parada com a legenda da D-20
    await center('#exp-principia', 0.5);
    await p.waitForTimeout(800); // o carro volta da última parada com lerp; a legenda tem 0,35 s de fade
    const noteOn = await p.evaluate(() => { const n = document.querySelector('.exp__d20'); return n && !n.classList.contains('is-gone') && parseFloat(getComputedStyle(n).opacity) > 0.99; });
    await p.screenshot({ path: `${OUT}/fb2-d20-${w}.png` });
    // estrada dissolvendo: carro entre a 2ª e a 3ª parada
    await p.evaluate(() => { const a = document.querySelector('#exp-olympic-club').getBoundingClientRect(); const b2 = document.querySelector('#exp-estudar').getBoundingClientRect(); const mid = (a.top + a.bottom + b2.top + b2.bottom) / 4; scrollTo(0, mid + scrollY - innerHeight * 0.4); });
    await p.waitForTimeout(1800);
    const noteGone = await p.evaluate(() => document.querySelector('.exp__d20').classList.contains('is-gone'));
    await p.screenshot({ path: `${OUT}/fb2-fog-${w}.png` });
    if (w === 1280) {
      await p.screenshot({ path: `${OUT}/fb2-odo-${w}.png`, clip: { x: 1040, y: 60, width: 240, height: 110 } });
      await p.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
      await p.waitForTimeout(1200); // o body tem transition de 0,6 s no fundo
      await p.screenshot({ path: `${OUT}/fb2-fog-dark-${w}.png` });
    }
    console.log(`  shots ${w}: legenda visível no início=${noteOn}, some depois de andar=${noteGone}`);
  }
  await p.close();
}
if (SHOTS) {
  // reduced-motion: estrada inteira, carro e legenda na última parada
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  await p.goto(URL, { waitUntil: 'networkidle' });
  await warm(p);
  const info = await p.evaluate(() => ({ fog: !!document.querySelector('.exp__fog'), note: document.querySelector('.exp__d20')?.className }));
  await p.evaluate(() => { const el = document.querySelector('#exp-hibeex'); const r = el.getBoundingClientRect(); scrollTo(0, r.top + scrollY + r.height / 2 - innerHeight * 0.5); });
  await p.waitForTimeout(600);
  await p.screenshot({ path: `${OUT}/fb2-reduced-1280.png` });
  console.log('reduced:', JSON.stringify(info));
  await ctx.close();
}
await b.close();
