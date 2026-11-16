// O carro FAZENDO as coisas: põe-no numa distância exata da estrada (poeira, capivara, derrapagem,
// salto, pedágio, volta na rotatória, faróis no túnel, trem, pórtico) e fotografa um recorte em
// volta dele. Grava stunt-<nome>.png.   node qa/surreal/road/stunts.mjs [filtro] [dark]
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = process.env.OUT ? path.resolve(HERE, process.env.OUT) : HERE;
const only = process.argv[2];
const dark = process.argv[3] === 'dark';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript((d) => { try { localStorage.setItem('darkMode', String(d)); } catch {} }, dark);
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 200)));
page.on('pageerror', (e) => errors.push('pageerror: ' + String(e).slice(0, 200)));
await page.goto('http://localhost:5173/#work-experience');
await page.waitForSelector('#work-experience .exp__car');
await page.waitForTimeout(4000);
await page.evaluate(() => window.dispatchEvent(new Event('wheel')));

// Plano da estrada (mesmo geometry.ts do site) e, para cada momento, a rolagem que põe o carro lá.
const plan = await page.evaluate(async () => {
  const g = await import('/src/components/Home/Experience/geometry.ts');
  const s = document.querySelector('section.exp');
  const box = s.getBoundingClientRect();
  const reach = g.CARD_GAP.wide + g.roadHalf(false);
  const stops = [], cards = [];
  [...s.querySelectorAll('.exp__stop')].forEach((li, i) => {
    const r = li.getBoundingClientRect();
    const c = li.querySelector('.exp__card').getBoundingClientRect();
    const left = g.cardSide(i) === 'left';
    stops.push({ x: left ? c.right - box.left + reach : c.left - box.left - reach, y: r.top - box.top + r.height / 2 });
    cards.push({ left: c.left - box.left, right: c.right - box.left, top: c.top - box.top, bottom: c.bottom - box.top });
  });
  const p = g.buildRoad(s.clientWidth, s.clientHeight, stops, cards, false, cards[cards.length - 1].bottom);
  const look = g.roadLookup(p);
  const ys = stops.map((q) => q.y);
  const act = (kind, n = 0) => p.actors.filter((a) => a.kind === kind)[n];
  const egg = (id) => p.eggs.find((e) => e.id === id);
  const drift = p.drift.map((z) => [look.markS(z.from), look.markS(z.to)]);
  const moments = {
    dust: p.dirt && p.dirt.from + (p.dirt.to - p.dirt.from) * 0.72,
    'capy-crossing': act('capy') && act('capy').from + (act('capy').to - act('capy').from) * 0.55,
    'capy-brake': egg('capy')?.at,
    drift: drift[1] && drift[1][0] + (drift[1][1] - drift[1][0]) * 0.5,
    'jump-takeoff': p.jump && p.jump.from + (p.jump.to - p.jump.from) * 0.2,
    'jump-air': p.jump && (p.jump.from + p.jump.to) / 2,
    'jump-land': p.jump && p.jump.to + (p.jump.land - p.jump.to) * 0.25,
    'toll-closed': act('gate') && act('gate').from - 30,
    'toll-open': act('gate') && act('gate').to,
    roundabout: look.stopS[3] + (look.stopS[4] - look.stopS[3]) * 0.8,
    'tunnel-lights': p.beam && (p.beam.from + p.beam.to) / 2,
    'tunnel-exit': p.beam && p.beam.to - 12,
    'train-crossing': act('train') && act('train').from + (act('train').to - act('train').from) * 0.62,
    'crossing-open': act('gate', 1) && act('gate', 1).to,
    finish: look.stopS[6] - 150,
    parked: look.stopS[6],
  };
  // rolagem (centro da viewport, px da seção) em que o carro está em `s`
  const centerFor = (s0) => {
    let best = ys[0], bd = Infinity;
    for (let c = ys[0]; c <= ys[ys.length - 1]; c += 0.5) {
      const d = Math.abs(g.carTargetS(c, ys, look) - s0);
      if (d < bd) { bd = d; best = c; }
    }
    return best;
  };
  return { top: box.top + scrollY, left: box.left, shots: Object.entries(moments).filter(([, v]) => v != null).map(([name, s0]) => ({ name, s: s0, center: centerFor(s0), at: look.at(s0) })) };
});

for (const m of plan.shots) {
  if (only && !m.name.includes(only)) continue;
  // a seção pode ter mudado de lugar (vizinhas lazy montando acima): relê a cada foto
  const top = await page.evaluate(() => document.querySelector('section.exp').getBoundingClientRect().top + scrollY);
  const target = top + m.center - 450;
  // chega andando, de 500 px antes (o carro vem pela estrada; o que é passivo acontece)
  const from = target - 500;
  await page.evaluate((v) => scrollTo({ top: v, behavior: 'instant' }), from);
  await page.waitForTimeout(700);
  for (let k = 1; k <= 20; k++) {
    await page.evaluate((v) => scrollTo({ top: v, behavior: 'instant' }), from + (500 * k) / 20);
    await page.waitForTimeout(30);
  }
  // a poeira só existe com o carro andando: fotografa no meio do movimento
  await page.waitForTimeout(m.name === 'dust' ? 60 : 1400);
  const y = (await page.evaluate(() => document.querySelector('section.exp').getBoundingClientRect().top)) + m.at.y;
  const x = plan.left + m.at.x;
  const z = process.env.ZOOM ? 150 : 380; // ZOOM=1: recorte fechado no carro
  const clip = { x: Math.max(0, Math.min(1440 - 2 * z, x - z)), y: Math.max(0, Math.min(900 - z * 1.37, y - z * 0.68)), width: 2 * z, height: Math.round(z * 1.37) };
  await page.screenshot({ path: path.join(OUT, `stunt-${m.name}${dark ? '-dark' : ''}.png`), clip });
  console.log(m.name, 's', Math.round(m.s), 'truck on screen at', Math.round(x), Math.round(y));
}
console.log('errors:', errors.length ? errors : 'none');
await browser.close();
