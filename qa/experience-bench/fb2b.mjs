/**
 * fb2b.mjs — prova das correções da rodada fb2b da Experience. Capturas em shots/fb2b-*.png.
 *   1. odômetro nunca fora da seção: varre a rolagem do fim da Experience até o Contact
 *      (1440 e 390) e registra o pior caso de odômetro visível acima do pé da seção.
 *   2. névoa: carro entre a 2ª e a 3ª parada em 1280, claro e escuro; reduced-motion inteiro.
 *   3. legenda da D-20: folga até a estrada e até o card em 390/768/1024/1280/1440.
 *   4. vazamento: pixels laranja no início do Contact (1440 e 390).
 *   5. cabeçalho: centro do título vs centro da seção e da viewport.
 *   6. parada: com cada card centrado (1280), distância carro↔marco.
 *   7. erros de console em 1280/1440/390, inclusive durante resize.
 * Uso: node qa/experience-bench/fb2b.mjs [url]
 */
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const URL = process.argv.find((a) => a.startsWith('http')) ?? 'http://localhost:5173/';
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'shots');
const b = await chromium.launch();

async function open(w, opts = {}) {
  const ctx = await b.newContext({ viewport: { width: w, height: w < 600 ? 844 : 800 }, ...opts });
  const p = await ctx.newPage();
  const errs = [];
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
  p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
  await p.goto(URL, { waitUntil: 'networkidle' });
  const total = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < total; y += 600) { await p.evaluate((v) => scrollTo({ top: v, behavior: 'instant' }), y); await p.waitForTimeout(50); }
  await p.waitForSelector('#work-experience .exp__car', { state: 'attached', timeout: 30000 });
  await p.waitForTimeout(600);
  return { p, ctx, errs };
}
const jump = (p, y) => p.evaluate((v) => scrollTo({ top: v, behavior: 'instant' }), y);
const centerCard = (p, id, frac = 0.5) => p.evaluate(([s, f]) => {
  const c = document.querySelector(`#${s} .exp__card`).getBoundingClientRect();
  scrollTo({ top: c.top + scrollY + c.height / 2 - innerHeight * f, behavior: 'instant' });
}, [id, frac]);

// Conta pixels "laranja" (matiz 10–40°, saturação alta) numa captura, decodificando no browser.
async function orangePixels(p, buf, box) {
  return p.evaluate(async ([b64, bx]) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + b64;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    const d = g.getImageData(bx.x, bx.y, bx.w, bx.h).data;
    let n = 0;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i] / 255, gg = d[i + 1] / 255, bb = d[i + 2] / 255;
      const mx = Math.max(r, gg, bb), mn = Math.min(r, gg, bb);
      if (mx - mn < 0.12) continue;
      let h = mx === r ? ((gg - bb) / (mx - mn)) * 60 : mx === gg ? (2 + (bb - r) / (mx - mn)) * 60 : (4 + (r - gg) / (mx - mn)) * 60;
      if (h < 0) h += 360;
      if (h >= 10 && h <= 40) n++;
    }
    return n;
  }, [buf.toString('base64'), box]);
}

const report = {};

// ── 1 + 4 + 7: odômetro, vazamento e console em 1440 / 390 / 1280 ──────────
for (const w of [1440, 390, 1280]) {
  const { p, ctx, errs } = await open(w);
  const r = { };
  // varre do centro da última parada até o Contact encostar na nav, de 40 em 40 px
  const { from, to } = await p.evaluate(() => {
    const last = [...document.querySelectorAll('.exp__stop')].pop().getBoundingClientRect();
    const contact = document.querySelector('#contact').getBoundingClientRect();
    return { from: last.top + scrollY + last.height / 2 - innerHeight / 2, to: contact.top + scrollY };
  });
  let worst = null;
  for (let y = from; y <= to; y += 40) {
    await jump(p, y);
    await p.waitForTimeout(90);
    const s = await p.evaluate(() => {
      const odo = document.querySelector('.exp__odo');
      const o = odo.getBoundingClientRect();
      const sec = document.querySelector('#work-experience').getBoundingClientRect();
      const op = parseFloat(getComputedStyle(odo).opacity);
      // visível = opacidade > 0 e dentro da viewport
      const vis = op > 0.01 && o.bottom > 0 && o.top < innerHeight;
      return { vis, op, odoTop: Math.round(o.top), odoBottom: Math.round(o.bottom), secBottom: Math.round(sec.bottom) };
    });
    // o que interessa: odômetro visível perto do topo (zona da nav: a pill termina em ~66 px; o sticky do odômetro fica em 76 no mobile e 88 no desktop) ou abaixo do pé da seção
    if (s.vis && (s.odoTop < 72 || s.odoBottom > s.secBottom)) worst = { y: Math.round(y), ...s };
  }
  r.odoLeak = worst ?? 'none';
  // início do Contact: topo do Contact a 80 px da viewport
  await jump(p, to - 80);
  await p.waitForTimeout(1500);
  const shot = await p.screenshot({ path: `${OUT}/fb2b-contact-${w}.png` });
  const box = await p.evaluate(() => {
    const c = document.querySelector('#contact').getBoundingClientRect();
    return { x: 0, y: Math.max(0, Math.round(c.top)), w: innerWidth, h: Math.min(innerHeight, Math.round(c.bottom)) - Math.max(0, Math.round(c.top)) };
  });
  // A/B: laranja no Contact com a Experience visível menos com ela escondida (visibility não
  // mexe no layout). Diferença 0 = nada da Experience pinta sobre o Contact.
  const hideExp = (v) => p.evaluate((on) => { document.querySelector('#work-experience').style.visibility = on ? 'hidden' : ''; }, v);
  r.contactOrange = {};
  for (const off of [80, 420]) {
    await jump(p, to - off);
    await p.waitForTimeout(1500);
    const bx = await p.evaluate(() => {
      const c = document.querySelector('#contact').getBoundingClientRect();
      const t = Math.max(0, Math.round(c.top));
      return { x: 0, y: t, w: innerWidth, h: Math.min(innerHeight, Math.round(c.bottom)) - t };
    });
    const withExp = await orangePixels(p, await p.screenshot(off === 420 ? { path: `${OUT}/fb2b-contact-edge-${w}.png` } : {}), bx);
    await hideExp(true);
    await p.waitForTimeout(100);
    const without = await orangePixels(p, await p.screenshot(), bx);
    await hideExp(false);
    r.contactOrange[`contactTopAt${off}`] = { withExp, without, fromExperience: withExp - without };
  }
  void shot; void box;
  const odoNow = await p.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.exp__odo')).opacity));
  r.odoOpacityAtContact = odoNow;
  // resize com a seção na tela: 7 larguras, depois volta
  await centerCard(p, 'exp-estudar');
  await p.waitForTimeout(300);
  for (const rw of [1100, 900, 761, 760, 600, 390, 1440, w]) {
    await p.setViewportSize({ width: rw, height: rw < 600 ? 844 : 800 });
    await p.waitForTimeout(250);
    await p.mouse.wheel(0, 120);
    await p.waitForTimeout(150);
  }
  const bad = await p.evaluate(() => [...document.querySelectorAll('path')].filter((e) => /NaN/.test(e.getAttribute('d') ?? '')).length);
  r.nanPaths = bad;
  r.consoleErrors = errs;
  report[`w${w}`] = r;
  await ctx.close();
}

// ── 2: névoa em 1280 claro/escuro; reduced-motion ─────────────────────────
{
  const { p, ctx } = await open(1280);
  await p.evaluate(() => {
    const a = document.querySelector('#exp-olympic-club').getBoundingClientRect();
    const c = document.querySelector('#exp-estudar').getBoundingClientRect();
    scrollTo({ top: (a.top + a.bottom + c.top + c.bottom) / 4 + scrollY - innerHeight * 0.5, behavior: 'instant' });
  });
  await p.waitForTimeout(2200);
  await p.screenshot({ path: `${OUT}/fb2b-fog-light-1280.png` });
  await p.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await p.waitForTimeout(1200);
  await p.screenshot({ path: `${OUT}/fb2b-fog-dark-1280.png` });
  report.fog = await p.evaluate(() => ({
    masks: document.querySelectorAll('#work-experience [style*="mask"], .exp__reveal').length,
    gradients: document.querySelectorAll('.exp__fog').length,
    stroke: getComputedStyle(document.querySelector('.exp__road-bed')).stroke,
  }));
  await ctx.close();
  const rm = await open(1280, { reducedMotion: 'reduce' });
  await centerCard(rm.p, 'exp-estudar');
  await rm.p.waitForTimeout(600);
  await rm.p.screenshot({ path: `${OUT}/fb2b-reduced-1280.png` });
  report.reduced = await rm.p.evaluate(() => ({
    gradients: document.querySelectorAll('.exp__fog').length,
    stroke: getComputedStyle(document.querySelector('.exp__road-bed')).stroke,
  }));
  await rm.ctx.close();
}

// ── 3: legenda da D-20 ─────────────────────────────────────────────────────
report.d20 = {};
for (const w of [390, 768, 1024, 1280, 1440]) {
  const { p, ctx } = await open(w);
  await centerCard(p, 'exp-principia');
  await p.waitForTimeout(2200);
  report.d20[w] = await p.evaluate(() => {
    const sec = document.querySelector('#work-experience');
    const t = document.querySelector('.exp__d20-text');
    const range = document.createRange(); range.selectNodeContents(t);
    const rects = [...range.getClientRects()];
    const card = document.querySelector('#exp-principia .exp__card').getBoundingClientRect();
    const edge = sec.querySelector('.exp__road-edge');
    const half = Number(edge.getAttribute('stroke-width')) / 2;
    const sr = sec.getBoundingClientRect();
    const len = edge.getTotalLength();
    let road = Infinity;
    for (let s = 0; s <= len; s += 2) {
      const pt = edge.getPointAtLength(s); const x = pt.x + sr.left, y = pt.y + sr.top;
      for (const q of rects) {
        const dx = Math.max(q.left - x, 0, x - q.right), dy = Math.max(q.top - y, 0, y - q.bottom);
        road = Math.min(road, Math.hypot(dx, dy) - half);
      }
    }
    let cardGap = Infinity;
    for (const q of rects) {
      const dx = Math.max(card.left - q.right, 0, q.left - card.right), dy = Math.max(card.top - q.bottom, 0, q.top - card.bottom);
      cardGap = Math.min(cardGap, Math.hypot(dx, dy));
    }
    const link = document.querySelector('.exp__d20-link');
    const ls = getComputedStyle(link);
    return {
      roadGap: Math.round(road * 10) / 10, cardGap: Math.round(cardGap * 10) / 10,
      link: `${link.textContent.trim()} | ${ls.fontFamily.split(',')[0]} ${ls.fontStyle} | ${ls.textDecorationLine}`,
      shown: !document.querySelector('.exp__d20').classList.contains('is-gone'),
    };
  });
  if (w === 390 || w === 1280) await p.screenshot({ path: `${OUT}/fb2b-d20-${w}.png` });
  // anda até a 2ª parada: a legenda some
  await centerCard(p, 'exp-olympic-club');
  await p.waitForTimeout(1500);
  report.d20[w].goneAfterMove = await p.evaluate(() => document.querySelector('.exp__d20').classList.contains('is-gone'));
  await ctx.close();
}

// ── 5 + 6: cabeçalho e paradas em 1280 ─────────────────────────────────────
{
  const { p, ctx } = await open(1280);
  report.head = await p.evaluate(() => {
    const h = document.querySelector('#work-experience .section-title');
    const range = document.createRange(); range.selectNodeContents(h);
    const t = range.getBoundingClientRect();
    const s = document.querySelector('#work-experience').getBoundingClientRect();
    const road = document.querySelector('.exp__road-edge').getBoundingClientRect();
    return {
      textCenterX: Math.round(t.left + t.width / 2), sectionCenterX: Math.round(s.left + s.width / 2), viewportCenterX: innerWidth / 2,
      titleBottomToRoadTop: Math.round(road.top - t.bottom),
    };
  });
  await p.evaluate(() => document.querySelector('#work-experience').scrollIntoView({ behavior: 'instant' }));
  await p.waitForTimeout(800);
  await p.screenshot({ path: `${OUT}/fb2b-head-1280.png` });
  const ids = await p.evaluate(() => [...document.querySelectorAll('.exp__stop')].map((l) => l.id));
  report.park = {};
  for (const [i, id] of ids.entries()) {
    await centerCard(p, id);
    await p.waitForTimeout(2000);
    report.park[id] = await p.evaluate((k) => {
      const car = document.querySelector('.exp__car').getBoundingClientRect();
      const km = document.querySelectorAll('.exp__km')[k];
      const [, x, y] = km.getAttribute('transform').match(/translate\(([-\d.]+) ([-\d.]+)\)/);
      const sr = document.querySelector('#work-experience').getBoundingClientRect();
      return Math.round(Math.hypot(car.left + car.width / 2 - (sr.left + +x), car.top + car.height / 2 - (sr.top + +y)));
    }, i);
    await p.screenshot({ path: `${OUT}/fb2b-park${i + 1}-1280.png` });
  }
  await ctx.close();
}

await b.close();
console.log(JSON.stringify(report, null, 1));
