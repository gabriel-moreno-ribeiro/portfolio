/**
 * QA da estrada da seção Experience.
 *   node qa/surreal/road/road.mjs bench [label]   → tempo de quadro sob CPU 4× + trilha do carro
 *   node qa/surreal/road/road.mjs shots           → capturas (1440 claro/escuro, 390, reduced-motion)
 *   node qa/surreal/road/road.mjs layout          → alturas e vão estrada/cenário × texto por largura (REDUCED=1: reduced-motion)
 *   node qa/surreal/road/road.mjs moments [nome]  → cada manobra em 4 momentos (claro) e 1 (escuro)
 *   node qa/surreal/road/road.mjs full [larguras] [dark] → a seção inteira numa imagem por largura
 * Servidor de dev já rodando em :5173.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = process.env.OUT ? path.resolve(HERE, process.env.OUT) : HERE;
fs.mkdirSync(OUT, { recursive: true });
const URL_ = 'http://localhost:5173/#work-experience';
const mode = process.argv[2] ?? 'bench';
const browser = await chromium.launch();

async function open({ width, height, dark = false, reduced = false }) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    isMobile: width < 700,
    hasTouch: width < 700,
    reducedMotion: reduced ? 'reduce' : 'no-preference',
  });
  await ctx.addInitScript((d) => {
    try { localStorage.setItem('darkMode', String(d)); } catch {}
    // Qual sprite foi desenhado por último (o frame não vai para o DOM).
    const orig = CanvasRenderingContext2D.prototype.drawImage;
    CanvasRenderingContext2D.prototype.drawImage = function (img, ...rest) {
      if (img && img.src && img.src.includes('/assets/car/')) window.__carSrc = img.src;
      return orig.call(this, img, ...rest);
    };
  }, dark);
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 300)));
  page.on('pageerror', (e) => errors.push('pageerror: ' + String(e).slice(0, 300)));
  await page.goto(URL_, { waitUntil: 'load' });
  await page.waitForSelector('#work-experience .exp__car', { timeout: 20000 });
  await page.waitForTimeout(4000);
  // O Home fica realinhando o scroll ao hash até o visitante assumir: assume.
  await page.evaluate(() => window.dispatchEvent(new Event('wheel')));
  await page.waitForTimeout(300);
  return { ctx, page, errors };
}

const box = (page) => page.evaluate(() => {
  const s = document.querySelector('section.exp');
  const r = s.getBoundingClientRect();
  return { top: r.top + scrollY, height: r.height, width: r.width, left: r.left, vh: innerHeight, doc: document.documentElement.scrollHeight };
});

/** Amostra o path real do DOM (só no teste) para conferir carro × estrada. */
const pathSamples = (page) => page.evaluate(() => {
  const el = document.querySelector('.exp__road-bed');
  const n = Math.ceil(el.getTotalLength() / 3);
  const out = [];
  for (let i = 0; i <= n; i++) {
    const a = el.getPointAtLength(i * 3);
    const b = el.getPointAtLength(i * 3 + 1);
    out.push([a.x, a.y, (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI]);
  }
  return { pts: out, length: el.getTotalLength(), lane: +el.getAttribute('stroke-width') };
});

async function run(page, speed, { from, to }) {
  return page.evaluate(({ speed, from, to }) => new Promise((resolve) => {
    const car = document.querySelector('.exp__car');
    const rec = [];
    let long = 0;
    let po = null;
    scrollTo({ top: from, behavior: 'instant' });
    let y = from;
    let last = performance.now();
    let idleFrames = 0;
    const tick = (now) => {
      const dt = now - last;
      last = now;
      const m = /translate3d\(([-\d.]+)px, ([-\d.]+)px/.exec(car.style.transform);
      rec.push([dt, m ? +m[1] + car.offsetWidth / 2 : NaN, m ? +m[2] + car.offsetHeight / 2 : NaN, window.__carSrc || '', y]);
      if (y < to) {
        y = Math.min(to, y + (speed * Math.min(dt, 50)) / 1000);
        scrollTo({ top: y, behavior: 'instant' });
      } else if (++idleFrames > 90) {
        po.disconnect();
        return resolve({ rec, long });
      }
      requestAnimationFrame(tick);
    };
    // Só conta tarefa longa depois que o salto até o início assentou (vizinhas montando).
    setTimeout(() => {
      po = new PerformanceObserver((l) => { for (const e of l.getEntries()) long = Math.max(long, e.duration); });
      try { po.observe({ entryTypes: ['longtask'] }); } catch {}
      last = performance.now();
      requestAnimationFrame(tick);
    }, 1500);
  }), { speed, from, to });
}

const q = (a, f) => { const s = [...a].sort((x, y) => x - y); return +(s[Math.min(s.length - 1, Math.floor(s.length * f))] ?? 0).toFixed(1); };
const adiff = (a, b) => Math.abs(((((a - b) % 360) + 540) % 360) - 180);

if (mode === 'bench') {
  const label = process.argv[3] ?? 'run';
  const sprites = fs.readFileSync(path.join(HERE, '../../../src/components/Home/Experience/carSprites.ts'), 'utf8');
  const headings = Object.fromEntries([...sprites.matchAll(/"file":"(car-\d+\.webp)","yaw":[-\d.]+,"heading":([-\d.]+)/g)].map((m) => [m[1], +m[2]]));
  const result = { label };
  for (const [name, vp] of [['1440', { width: 1440, height: 900 }], ['390', { width: 390, height: 844 }]]) {
    const { ctx, page, errors } = await open(vp);
    const b = await box(page);
    const road = await pathSamples(page);
    const cdp = await ctx.newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    await cdp.send('Performance.enable');
    const metrics = async () => Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));
    // Seção na tela do começo ao fim: o que se mede é ela, não as vizinhas montando.
    const range = { from: b.top - 200, to: b.top + b.height - b.vh + 200 };
    await run(page, 3000, range); // aquecimento: sprites decodificados, vizinhas montadas
    for (const speed of [2000, 1500, 400]) {
      await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), range.from);
      await page.waitForTimeout(1500);
      const m0 = await metrics();
      const { rec, long } = await run(page, speed, range);
      const m1 = await metrics();
      const per = (k) => +(((m1[k] - m0[k]) * 1000) / rec.length).toFixed(3);
      const dts = rec.slice(2).map((r) => r[0]);
      const steps = [];
      const off = [];
      const turn = [];
      const headErr = [];
      const screenY = [];
      let prevH = null;
      for (let i = 1; i < rec.length; i++) {
        const [, x, y, src, sy] = rec[i];
        if (Number.isNaN(x)) continue;
        // só com o carro na tela: fora dela ele acompanha o scroll cru de propósito
        const seen = b.top + y - sy > -60 && b.top + y - sy < b.vh + 60;
        if (seen) screenY.push(b.top + y - sy);
        if (seen && !Number.isNaN(rec[i - 1][1])) steps.push(Math.hypot(x - rec[i - 1][1], y - rec[i - 1][2]));
        let best = Infinity;
        let bestTan = Infinity;
        const h = headings[src.split('/').pop()];
        for (const [px, py, pa] of road.pts) {
          const d = Math.hypot(px - x, py - y);
          if (d < best) best = d;
          if (d < 8 && h !== undefined) bestTan = Math.min(bestTan, adiff(pa, h));
        }
        off.push(best);
        if (bestTan < Infinity) headErr.push(bestTan);
        if (h !== undefined) {
          if (prevH !== null) turn.push(adiff(h, prevH));
          prevH = h;
        }
      }
      result[`${name}@${speed}`] = {
        frames: dts.length,
        'dt p50/p95/max (ms)': `${q(dts, 0.5)}/${q(dts, 0.95)}/${Math.max(...dts).toFixed(1)}`,
        'longtask max (ms)': +long.toFixed(1),
        'slow frames (ms@section px)': rec.slice(2).filter((r) => r[0] > 14).map((r) => `${r[0].toFixed(0)}@${Math.round(r[4] - b.top)}`).join(' ') || 'none',
        'main thread per frame (ms): task/script/layout/style': `${per('TaskDuration')}/${per('ScriptDuration')}/${per('LayoutDuration')}/${per('RecalcStyleDuration')}`,
        'car step p95/max (px)': `${q(steps, 0.95)}/${Math.max(...steps).toFixed(1)}`,
        'off-lane max (px)': +Math.max(...off).toFixed(1),
        'heading jump max (deg)': +Math.max(0, ...turn).toFixed(1),
        'heading vs tangent p95/max (deg)': `${q(headErr, 0.95)}/${Math.max(0, ...headErr).toFixed(1)}`,
        'car on screen y min/max (px of viewport)': `${Math.round(Math.min(...screenY))}/${Math.round(Math.max(...screenY))}`,
        lane: road.lane,
        roadLength: Math.round(road.length),
      };
    }
    result[`${name} errors`] = errors;
    result[`${name} section`] = b;
    await ctx.close();
  }
  console.log(JSON.stringify(result, null, 1));
  fs.writeFileSync(path.join(OUT, `bench-${label}.json`), JSON.stringify(result, null, 1));
}

if (mode === 'shots') {
  const sets = [
    { tag: '1440-light', vp: { width: 1440, height: 900 }, step: 400 },
    { tag: '1440-dark', vp: { width: 1440, height: 900, dark: true }, count: 6 },
    { tag: '390-light', vp: { width: 390, height: 844 }, step: 500 },
    { tag: '1280-light', vp: { width: 1280, height: 720 }, count: 8 },
    { tag: '1024-light', vp: { width: 1024, height: 768 }, count: 8 },
    { tag: '768-light', vp: { width: 768, height: 1024 }, count: 7 },
    { tag: '360-light', vp: { width: 360, height: 740 }, count: 3 },
    { tag: '390-dark', vp: { width: 390, height: 844, dark: true }, count: 3 },
    { tag: '1440-reduced', vp: { width: 1440, height: 900, reduced: true }, count: 4 },
    { tag: '390-reduced', vp: { width: 390, height: 844, reduced: true }, count: 4 },
  ];
  const only = process.argv[3];
  for (const s of sets) {
    if (only && !s.tag.includes(only)) continue;
    const { ctx, page, errors } = await open(s.vp);
    const b = await box(page);
    const from = Math.max(0, b.top - 120);
    const to = b.top + b.height - b.vh + 200;
    const ys = [];
    if (s.step) for (let y = from; y <= to + s.step - 1; y += s.step) ys.push(Math.min(y, to));
    else for (let i = 0; i < s.count; i++) ys.push(from + ((to - from) * (i + 0.5)) / s.count);
    let i = 0;
    for (const y of ys) {
      // Rolagem em passos (como um usuário), para o carro percorrer a estrada até ali.
      const cur = await page.evaluate(() => scrollY);
      for (let k = 1; k <= 8; k++) {
        await page.evaluate((v) => scrollTo({ top: v, behavior: 'instant' }), cur + ((y - cur) * k) / 8);
        await page.waitForTimeout(40);
      }
      await page.waitForTimeout(1400);
      await page.screenshot({ path: path.join(OUT, `${s.tag}-${String(i++).padStart(2, '0')}.png`) });
    }
    console.log(s.tag, i, 'shots', 'errors:', errors.length ? errors : 'none');
    await ctx.close();
  }
}

if (mode === 'layout') {
  for (const width of [1440, 1280, 1024, 768, 390, 360]) {
    const { ctx, page, errors } = await open({ width, height: width < 700 ? 844 : 900, reduced: !!process.env.REDUCED });
    const b = await box(page);
    const road = await pathSamples(page);
    const info = await page.evaluate(({ pts, lane }) => {
      const s = document.querySelector('section.exp');
      const sb = s.getBoundingClientRect();
      const half = lane / 2 + 1;
      const rects = [...s.querySelectorAll('.exp__card, .section-title, .exp__route ol, .exp__d20-text')].map((el) => {
        const r = el.getBoundingClientRect();
        return { n: el.className.toString().split(' ')[0] + ':' + (el.textContent || '').trim().slice(0, 18), l: r.left - sb.left, t: r.top - sb.top, r: r.right - sb.left, b: r.bottom - sb.top };
      });
      // menor distância da borda da estrada a cada caixa de texto (negativa = por baixo do texto)
      const gaps = rects.map((r) => {
        let min = Infinity;
        for (const [x, y] of pts) {
          const dx = Math.max(r.l - x, 0, x - r.r);
          const dy = Math.max(r.t - y, 0, y - r.b);
          const d = Math.hypot(dx, dy) - half;
          if (d < min) min = d;
        }
        return `${r.n} → ${min.toFixed(0)}px`;
      });
      // cenário (traços amostrados, ícones e viaduto pela caixa) × caixas de texto
      const scene = [];
      for (const el of s.querySelector('.exp__road').querySelectorAll('.exp__sc, .exp__bridge')) {
        if (el.tagName === 'path') {
          const n = Math.ceil(el.getTotalLength() / 5);
          for (let i = 0; i <= n; i++) { const q = el.getPointAtLength(i * 5); scene.push([q.x - 1, q.y - 1, q.x + 1, q.y + 1]); }
        } else {
          const r = el.getBoundingClientRect();
          scene.push([r.left - sb.left, r.top - sb.top, r.right - sb.left, r.bottom - sb.top]);
        }
      }
      let sceneGap = Infinity, sceneAt = '';
      for (const r of rects) for (const q of scene) {
        const d = Math.hypot(Math.max(r.l - q[2], 0, q[0] - r.r), Math.max(r.t - q[3], 0, q[1] - r.b));
        if (d < sceneGap) { sceneGap = d; sceneAt = `${r.n} @ ${Math.round(q[0])},${Math.round(q[1])}`; }
      }
      const sx = scene.flatMap((q) => [q[0], q[2]]);
      const xs = pts.map((p) => p[0]);
      const de = document.documentElement;
      // estrada por px de rolagem em cada trecho (parada a parada)
      const stops = [...s.querySelector('.exp__road').querySelectorAll('.exp__km')].map((g) => /translate\(([-\d.]+)[ ,]+([-\d.]+)\)/.exec(g.getAttribute('transform')).slice(1).map(Number));
      const at = stops.map(([x, y]) => { let best = 0, bd = Infinity; pts.forEach((p, i) => { const d = Math.hypot(p[0] - x, p[1] - y); if (d < bd) { bd = d; best = i; } }); return best * 3; });
      const ratios = at.slice(1).map((v, i) => `${Math.round(v - at[i])}/${Math.round(stops[i + 1][1] - stops[i][1])}=${((v - at[i]) / (stops[i + 1][1] - stops[i][1])).toFixed(2)}`);
      return {
        ratios,
        gaps,
        scenery: scene.length ? `${scene.length} peças · mais perto de texto: ${sceneGap.toFixed(0)}px (${sceneAt}) · x ${Math.round(Math.min(...sx))}..${Math.round(Math.max(...sx))} de ${Math.round(sb.width)}` : 'nenhum',
        roadX: [Math.min(...xs) - half, Math.max(...xs) + half].map((v) => Math.round(v + sb.left)),
        hScroll: de.scrollWidth > de.clientWidth,
        scrollWidth: de.scrollWidth,
        clientWidth: de.clientWidth,
      };
    }, road);
    console.log(JSON.stringify({ width, sectionHeight: Math.round(b.height), sectionWidth: Math.round(b.width), roadLength: Math.round(road.length), ...info, errors }, null, 1));
    await ctx.close();
  }
}

if (mode === 'full') {
  // Estrada inteira (reduced-motion: sem névoa): uma imagem por largura, `full-<largura>.png`.
  // SLICES=1 grava também fatias de 1100 px (`full-<largura>-<n>.png`), para olhar de perto.
  for (const width of (process.argv[3] ?? '1440').split(',').map(Number)) {
    const { ctx, page, errors } = await open({ width, height: 900, reduced: true, dark: process.argv[4] === 'dark' });
    const b = await box(page);
    await page.setViewportSize({ width, height: Math.ceil(b.doc) });
    await page.waitForTimeout(1200);
    const b2 = await box(page);
    const pad = width >= 1270 ? 160 : 8;
    const tag = `full-${width}${process.argv[4] === 'dark' ? '-dark' : ''}`;
    const clip = (y, height) => ({ x: Math.max(0, b2.left - pad), y: b2.top + y, width: Math.min(width, b2.width + 2 * pad), height });
    await page.screenshot({ path: path.join(OUT, `${tag}.png`), clip: clip(0, b2.height) });
    if (process.env.SLICES) {
      for (let y = 0, i = 0; y < b2.height - 300; y += 850, i++) {
        await page.screenshot({ path: path.join(OUT, `${tag}-${i}.png`), clip: clip(y, Math.min(1100, b2.height - y)) });
      }
    }
    console.log(width, 'section', Math.round(b2.width), 'x', Math.round(b2.height), 'errors:', errors.length ? errors : 'none');
    await ctx.close();
  }
}

if (mode === 'moments') {
  // Cada manobra (trecho entre duas paradas) em frações da rolagem do trecho: 4 momentos no
  // claro, 1 no escuro. `node road.mjs moments [nome]` filtra por manobra.
  const FEATURES = ['esses', 'switchback', 'river', 'roundabout', 'tunnel', 'clover'];
  const only = process.argv[3];
  for (const dark of [false, true]) {
    const { ctx, page, errors } = await open({ width: 1440, height: 900, dark });
    const b = await box(page);
    const ys = await page.evaluate(() => {
      const s = document.querySelector('section.exp');
      const t = s.getBoundingClientRect().top;
      return [...s.querySelectorAll('.exp__stop')].map((li) => { const r = li.getBoundingClientRect(); return r.top - t + r.height / 2; });
    });
    for (const [seg, name] of FEATURES.entries()) {
      if (only && name !== only) continue;
      await page.evaluate((v) => scrollTo({ top: v, behavior: 'instant' }), b.top + ys[seg] - b.vh / 2 - 60);
      await page.waitForTimeout(900);
      for (const u of dark ? [0.55] : [0.25, 0.45, 0.65, 0.85]) {
        const target = b.top + ys[seg] + (ys[seg + 1] - ys[seg]) * u - b.vh / 2;
        const cur = await page.evaluate(() => scrollY);
        for (let k = 1; k <= 10; k++) {
          await page.evaluate((v) => scrollTo({ top: v, behavior: 'instant' }), cur + ((target - cur) * k) / 10);
          await page.waitForTimeout(30);
        }
        await page.waitForTimeout(1300);
        await page.screenshot({ path: path.join(OUT, `1440-${dark ? 'dark' : 'light'}-${name}-${Math.round(u * 100)}.png`) });
      }
    }
    console.log(dark ? 'dark' : 'light', 'moments, errors:', errors.length ? errors : 'none');
    await ctx.close();
  }
}

await browser.close();
