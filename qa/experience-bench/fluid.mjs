/**
 * fluid.mjs — prova de fluidez: 12 capturas de viewport a cada 60 ms durante uma rolagem
 * contínua com `page.mouse.wheel`, medindo o deslocamento do carro na TELA entre quadros.
 * Monotônico e sem salto > 15 px = movimento contínuo.
 * Uso: node qa/experience-bench/fluid.mjs
 */
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
await p.waitForTimeout(1500);
await p.evaluate(() => { const r = document.querySelector('#work-experience').getBoundingClientRect(); scrollTo(0, r.top + scrollY + 900); });
await p.waitForTimeout(1500);

const read = () => p.evaluate(() => {
  const c = document.querySelector('.exp__car').getBoundingClientRect();
  const beam = getComputedStyle(document.querySelector('.exp__beam'));
  const m = beam.transform.match(/matrix\(([^)]+)\)/);
  const n = m ? m[1].split(',').map(Number) : [1, 0];
  return {
    x: +(c.left + c.width / 2).toFixed(1),
    y: +(c.top + c.height / 2).toFixed(1),
    beamDeg: +((Math.atan2(n[1], n[0]) * 180) / Math.PI).toFixed(1),
    beamOpacity: +(+beam.opacity).toFixed(3),
  };
});

// Gravador por rAF: é aqui que a trepidação apareceria (a captura a cada 60 ms mede a
// velocidade do scroll, não a suavidade).
await p.evaluate(() => {
  window.__trk = [];
  const el = document.querySelector('.exp__car');
  window.__trkOn = true;
  const tick = () => {
    const m = /translate3d\(([-\d.]+)px, ([-\d.]+)px/.exec(el.style.transform);
    const roll = parseFloat(el.style.getPropertyValue('--exp-roll')) || 0;
    if (m) window.__trk.push([+m[1], +m[2], roll]);
    if (window.__trkOn) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
});

const STEP = Number(process.env.WHEEL ?? 30); // trackpad: rolagem contínua e mansa
const samples = [read()];
await p.mouse.move(700, 450);
for (let i = 0; i < 12; i++) {
  await p.mouse.wheel(0, STEP);
  await p.waitForTimeout(60);
  samples.push(await read());
  await p.screenshot({ path: `${OUT}/fluid-${String(i).padStart(2, '0')}.png` });
}
const pts = await Promise.all(samples);
const rows = pts.slice(1).map((s, i) => {
  const a = pts[i];
  return {
    quadro: i,
    x: s.x, y: s.y,
    'Δtela(px)': +Math.hypot(s.x - a.x, s.y - a.y).toFixed(1),
    'Δbeam(°)': +Math.abs(((s.beamDeg - a.beamDeg + 540) % 360) - 180).toFixed(1),
    beamOpacity: s.beamOpacity,
  };
});
console.table(rows);
const d = rows.map((r) => r['Δtela(px)']);
console.log('capturas 60 ms — salto máx:', Math.max(...d).toFixed(1), 'px | y monotônico:',
  rows.every((r, i) => i === 0 || r.y >= rows[i - 1].y - 0.5),
  '| Δbeam máx:', Math.max(...rows.map((r) => r['Δbeam(°)'])).toFixed(1), '°');

const trk = await p.evaluate(() => { window.__trkOn = false; return window.__trk; });
const step = [];
const accel = [];
const rolls = [];
for (let i = 1; i < trk.length; i++) {
  step.push(Math.hypot(trk[i][0] - trk[i - 1][0], trk[i][1] - trk[i - 1][1]));
  rolls.push(Math.abs(trk[i][2] - trk[i - 1][2]));
  if (i > 1) accel.push(Math.abs(step[i - 1] - step[i - 2]));
}
const q = (a, f) => { const s2 = [...a].sort((x, y) => x - y); return +(s2[Math.min(s2.length - 1, Math.floor(s2.length * f))] ?? 0).toFixed(2); };
const back = trk.map((v, i) => (i > 0 ? trk[i - 1][1] - v[1] : 0)).filter((d) => d > 0);
const backwards = back.length;
console.log(`por rAF (${trk.length} quadros) — deslocamento p50/p95/máx: ${q(step, 0.5)}/${q(step, 0.95)}/${Math.max(...step).toFixed(2)} px`);
console.log(`por rAF — "solavanco" (2ª diferença) p95/máx: ${q(accel, 0.95)}/${Math.max(...accel).toFixed(2)} px · Δroll p95: ${q(rolls, 0.95)}° · quadros andando para trás: ${backwards} (recuo máx ${backwards ? Math.max(...back).toFixed(2) : 0} px)`);
await b.close();
