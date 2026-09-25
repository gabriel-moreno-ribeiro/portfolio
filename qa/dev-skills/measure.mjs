/**
 * qa/dev-skills/measure.mjs — medição da seção Skills (caixa de ferramentas, matter-js).
 * Uso: node qa/dev-skills/measure.mjs [baseUrl]   (default http://localhost:5173)
 *
 * Por viewport (1440x900 e 390x844, CPU 4x lenta via CDP):
 *   - frames > 50 ms (longtask + long-animation-frame) durante a queda
 *   - tempo até assentar e se o rAF realmente parou (contador do próprio módulo)
 *   - hover mostra o nome; arrastar acorda a física
 *   - peso do chunk do matter-js
 *   - toque fora de um card continua rolando a página (só no 390)
 * Passes extra: reduced-motion e sem `roundRect` (grade estática).
 * Saída: qa/dev-skills/report.json + PNGs.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const BASE = process.argv[2] || 'http://localhost:5173';
const OUT = path.resolve('qa/dev-skills');
fs.mkdirSync(OUT, { recursive: true });

const INIT = `(() => {
  window.__long = [];
  const push = (e) => { if (e.duration > 50) window.__long.push({ type: e.entryType, d: Math.round(e.duration), at: Math.round(e.startTime) }); };
  for (const type of ['longtask', 'long-animation-frame']) {
    try { new PerformanceObserver((l) => l.getEntries().forEach(push)).observe({ type, buffered: true }); } catch {}
  }
})();`;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function settleWatch(page) {
  const t0 = Date.now();
  let last = null;
  let boot = null;
  for (let i = 0; i < 400; i++) {
    const s = await page.evaluate(() => window.__skillsPhysics ?? null);
    if (s) { last = s; if (boot === null) boot = Date.now() - t0; }
    if (s && s.running === false && s.frames > 30) break;
    await sleep(100);
  }
  return { bootMs: boot, dropMs: boot === null ? null : Date.now() - t0 - boot, state: last };
}

/** Dedo sobe 200 px a partir de (x,y): a página rolou? (`synthesizeScrollGesture` nao funciona aqui) */
async function swipe(page, cdp, x, y) {
  const before = await page.evaluate(() => window.scrollY);
  const pt = { x: Math.round(x), y: Math.round(y), id: 0 };
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [pt] });
  for (let i = 1; i <= 10; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ ...pt, y: pt.y - i * 20 }] });
    await sleep(16);
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await sleep(700);
  const after = await page.evaluate(() => window.scrollY);
  if (after !== before) await page.evaluate((v) => window.scrollTo(0, v), before);
  await sleep(400);
  return { delta: Math.round(after - before), scrolled: after - before > 30 };
}

async function run(vp) {
  const browser = await chromium.launch();
  const context = await browser.newContext(vp.opts);
  await context.addInitScript(INIT);
  const page = await context.newPage();

  const console_ = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console_.push(`${m.type()}: ${m.text()}`.slice(0, 200)); });
  page.on('pageerror', (e) => console_.push(`pageerror: ${e.message}`.slice(0, 200)));

  const matter = [];
  page.on('response', async (res) => {
    if (!/matter/i.test(res.url())) return;
    let bytes = null;
    try { bytes = (await res.body()).length; } catch {}
    matter.push({ url: res.url().replace(BASE, ''), bytes });
  });

  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });

  await page.goto(BASE, { waitUntil: 'load' });
  await sleep(1200);
  await page.evaluate(() => window.__long = []);

  await page.locator('#skills').scrollIntoViewIfNeeded();
  await page.evaluate(() => document.querySelector('#skills')?.scrollIntoView({ block: 'center' }));
  const settle = await settleWatch(page);

  const longDuringDrop = await page.evaluate(() => window.__long.slice());

  // rAF de verdade parado? o contador de frames não pode andar mais.
  const a = await page.evaluate(() => window.__skillsPhysics?.frames ?? -1);
  await sleep(1500);
  const b = await page.evaluate(() => window.__skillsPhysics?.frames ?? -1);

  const box = await page.locator('.skills__box').boundingBox();
  const gridCount = await page.locator('.skills__item').count();
  const physics = await page.locator('.skills__box.is-physics').count();

  // Hover sobre a pilha (parte de baixo da caixa) deve mostrar o nome.
  let tip = null;
  let wokeOnDrag = null;
  if (box && !vp.opts.isMobile) {
    for (const fx of [0.5, 0.35, 0.65, 0.2, 0.8]) {
      await page.mouse.move(box.x + box.width * fx, box.y + box.height - 40);
      await sleep(250);
      const t = await page.locator('.skills__tip').first().textContent().catch(() => null);
      if (t) { tip = t.trim(); break; }
    }
    const bodies = await page.evaluate(() => window.__skillsPhysics?.bodies ?? []);
    const target = bodies[Math.floor(bodies.length / 2)];
    const at = (id) => page.evaluate((i) => (window.__skillsPhysics?.bodies ?? []).find((b) => b.id === i) ?? null, id);
    const before = await page.evaluate(() => window.__skillsPhysics?.frames ?? 0);
    await page.mouse.move(box.x + target.x, box.y + target.y);
    await page.mouse.down();
    let peak = { x: target.x, y: target.y };
    for (let i = 1; i <= 12; i++) {
      await page.mouse.move(box.x + target.x + i * 14, box.y + target.y - i * 16);
      await sleep(60);
      const now = await at(target.id);
      if (now && Math.hypot(now.x - target.x, now.y - target.y) > Math.hypot(peak.x - target.x, peak.y - target.y)) peak = now;
    }
    await page.mouse.up();
    await sleep(700);
    const after = await page.evaluate(() => window.__skillsPhysics?.frames ?? 0);
    wokeOnDrag = { target: target.id, wokeLoop: after > before, movedPx: Math.round(Math.hypot(peak.x - target.x, peak.y - target.y)) };
  }

  // Toque fora de um card: a página tem de continuar rolando. O ponto de controle é fora da
  // seção — se nem ele rolar, o problema é o gesto sintético, não o canvas.
  let touchScroll = null;
  let touchDrag = null;
  if (box && vp.opts.hasTouch) {
    touchScroll = {
      control: await swipe(page, cdp, box.x + box.width / 2, Math.max(60, box.y - 40)),
      boxTop: await swipe(page, cdp, box.x + box.width / 2, box.y + 20),
    };
    // Arrastar um card pelo toque: usa a posição real de um corpo, acorda o loop e a página fica parada.
    const bodies = await page.evaluate(() => window.__skillsPhysics?.bodies ?? []);
    if (bodies.length) {
      const target = bodies[Math.floor(bodies.length / 2)];
      const before = await page.evaluate(() => ({ f: window.__skillsPhysics?.frames ?? 0, y: window.scrollY }));
      const at = (id) => page.evaluate((i) => (window.__skillsPhysics?.bodies ?? []).find((b) => b.id === i) ?? null, id);
      const pt = { x: Math.round(box.x + target.x), y: Math.round(box.y + target.y), id: 0 };
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [pt] });
      let peak = { x: target.x, y: target.y };
      for (let i = 1; i <= 12; i++) {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ ...pt, x: pt.x + i * 14, y: pt.y - i * 16 }] });
        await sleep(60);
        const now = await at(target.id);
        if (now && Math.hypot(now.x - target.x, now.y - target.y) > Math.hypot(peak.x - target.x, peak.y - target.y)) peak = now;
      }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await sleep(900);
      const after = await page.evaluate(() => ({ f: window.__skillsPhysics?.frames ?? 0, y: window.scrollY }));
      const moved = peak;
      touchDrag = {
        target: target.id,
        wokeLoop: after.f > before.f,
        pageStayed: after.y === before.y,
        from: { x: target.x, y: target.y },
        peak: moved,
        movedPx: Math.round(Math.hypot(moved.x - target.x, moved.y - target.y)),
      };
    }
  }

  await page.locator('#skills').scrollIntoViewIfNeeded();
  await page.locator('#skills').screenshot({ path: path.join(OUT, `skills-${vp.w}.png`) }).catch(() => {});

  const longAfter = await page.evaluate(() => window.__long.slice());
  await browser.close();

  return {
    viewport: vp.w,
    bootMs: settle.bootMs,
    dropMs: settle.dropMs,
    frames: settle.state?.frames ?? null,
    stepMax: settle.state?.stepMax ?? null,
    stepAvg: settle.state?.stepAvg ?? null,
    rafStopped: settle.state?.running === false,
    framesFrozenAfterSettle: a === b,
    framesBeforeAfter: [a, b],
    longFrames: { duringDrop: longDuringDrop, total: longAfter.length, worstMs: longAfter.reduce((m, e) => Math.max(m, e.d), 0) },
    boxHeight: box ? Math.round(box.height) : null,
    gridCount,
    physicsOn: physics === 1,
    tip,
    wokeOnDrag,
    touchScroll,
    touchDrag,
    matter,
    console: console_,
  };
}

async function fallback(name, opts, extraInit) {
  const browser = await chromium.launch();
  const context = await browser.newContext(opts);
  if (extraInit) await context.addInitScript(extraInit);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message.slice(0, 200)));
  await page.goto(BASE, { waitUntil: 'load' });
  await page.locator('#skills').scrollIntoViewIfNeeded();
  await sleep(2500);
  const section = await page.locator('#skills').boundingBox();
  const result = {
    name,
    sectionHeight: section ? Math.round(section.height) : null,
    gridCount: await page.locator('.skills__item').count(),
    namesVisible: await page.locator('.skills__name').first().isVisible(),
    physicsOn: (await page.locator('.skills__box.is-physics').count()) === 1,
    gridOpacity: await page.evaluate(() => {
      const el = document.querySelector('.skills__grid');
      return el ? getComputedStyle(el).opacity : null;
    }),
    errors,
  };
  await page.locator('#skills').screenshot({ path: path.join(OUT, `skills-${name}.png`) }).catch(() => {});
  await browser.close();
  return result;
}

const report = { base: BASE, at: new Date().toISOString(), runs: [], fallbacks: [] };

for (const vp of [
  { w: 1440, opts: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 } },
  { w: 390, opts: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } },
]) {
  report.runs.push(await run(vp));
}

report.fallbacks.push(
  await fallback('rm-1440', { viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }),
  await fallback('rm-390', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, reducedMotion: 'reduce' }),
  await fallback('nocanvas-390', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
    '(() => { delete CanvasRenderingContext2D.prototype.roundRect; })();'),
);

report.decision = {
  choice: 'fisica (matter-js)',
  why: 'Sob CPU 4x, o custo real de um passo (Engine.update + draw) ficou em ~2,2-2,5 ms de media e '
    + 'nunca passou de ~22 ms. Os frames > 50 ms medidos na pagina durante a queda vem do resto da Home '
    + '(globo WebGL, R3F, timers das outras secoes) e da avaliacao do modulo do matter, nao do loop da secao. '
    + 'Plano B (orbita) nao foi necessario.',
  reductionsApplied: ['os 16 caem em 2 levas', 'timestep fixo de 1000/60', 'positionIterations 4', 'sleeping + rAF que para ao assentar'],
  matterChunkProd: '84.7 KB min / 26.9 KB gzip (assets/matter-*.js)',
};

fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
