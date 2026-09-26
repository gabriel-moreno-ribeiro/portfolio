/**
 * verify.mjs — conferência da seção Experience na página real (depois da integração).
 * Uso: node qa/experience-bench/verify.mjs [url]   (default http://localhost:5173/)
 * Checa: semântica (ol/li/h3), aria-hidden da estrada e do carro, índice como nav real,
 * poster antes do canvas, reduced-motion (carro parado na última parada), fallback sem
 * canvas 2D, e que nenhum rAF roda com a seção fora da viewport.
 */
import { chromium } from 'playwright';

const TARGET = process.argv[2] ?? 'http://localhost:5173/';
const SHOTS = process.env.TMP ? `${process.env.TMP}/expshot` : '.';
// a seção agora é lazy (LazySection): rola a página inteira antes de esperar pelo seletor
async function warm(page) {
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < total; y += 600) { await page.evaluate((v) => scrollTo(0, v), y); await page.waitForTimeout(70); }
  await page.waitForSelector('#work-experience .exp__car', { timeout: 30000 });
  await page.waitForTimeout(1200);
}

const b = await chromium.launch();
const errs = [];
const watch = (p, tag) => {
  p.on('pageerror', (e) => errs.push(`${tag} pageerror: ${e.message}`));
  p.on('console', (m) => { if (m.type() === 'error') errs.push(`${tag} console: ${m.text()}`); });
};

// ── semântica + screenshots ao longo do scroll ──────────────────────────────
let ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
let p = await ctx.newPage();
watch(p, 'light');
await p.goto(TARGET, { waitUntil: 'networkidle' });
await warm(p);
await p.waitForTimeout(1200);

console.log('dom:', JSON.stringify(await p.evaluate(() => {
  const sec = document.querySelector('#work-experience');
  const lis = [...sec.querySelectorAll('ol.exp__stops > li')];
  return {
    liCount: lis.length,
    ids: lis.map((l) => l.id),
    h3: lis.map((l) => l.querySelector('h3')?.textContent.trim()),
    roadAria: sec.querySelector('svg.exp__road')?.getAttribute('aria-hidden'),
    carAria: sec.querySelector('.exp__car')?.getAttribute('aria-hidden'),
    nav: sec.querySelector('nav')?.getAttribute('aria-label'),
    navHrefs: [...sec.querySelectorAll('nav a')].map((a) => a.getAttribute('href')),
    live: sec.querySelector('[aria-live]')?.textContent,
    posterFirst: [...document.querySelector('.exp__car-shake').children].map((k) => k.tagName),
    posterDims: [document.querySelector('.exp__poster')?.getAttribute('width'), document.querySelector('.exp__poster')?.getAttribute('height')],
  };
}), null, 1));

const box = await p.evaluate(() => { const r = document.querySelector('#work-experience').getBoundingClientRect(); return { top: r.top + scrollY, h: r.height }; });
for (const frac of [0, 0.15, 0.35, 0.55, 0.75, 0.98]) {
  await p.evaluate((y) => scrollTo(0, Math.max(0, y)), box.top + frac * (box.h - 900));
  await p.waitForTimeout(700);
  await p.screenshot({ path: `${SHOTS}/desk-${frac}.png` });
}

// rAF com a seção fora da viewport
await p.evaluate(() => { window.__raf = 0; const o = requestAnimationFrame; window.requestAnimationFrame = (cb) => { window.__raf++; return o(cb); }; });
await p.evaluate(() => scrollTo(0, 0));
await p.waitForTimeout(1500);
const r0 = await p.evaluate(() => window.__raf);
await p.waitForTimeout(2000);
console.log('rAF em 2 s com a seção fora da viewport:', (await p.evaluate(() => window.__raf)) - r0);
await ctx.close();

// ── mobile ──────────────────────────────────────────────────────────────────
ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
p = await ctx.newPage();
watch(p, 'mobile');
await p.goto(TARGET, { waitUntil: 'networkidle' });
await warm(p);
await p.evaluate(() => { const r = document.querySelector('#work-experience').getBoundingClientRect(); scrollTo(0, r.top + scrollY + 600); });
await p.waitForTimeout(1500);
const mbox = await p.evaluate(() => { const r = document.querySelector('#work-experience').getBoundingClientRect(); return { top: r.top + scrollY, h: r.height }; });
for (const frac of [0.1, 0.5, 0.95]) {
  await p.evaluate((y) => scrollTo(0, Math.max(0, y)), mbox.top + frac * (mbox.h - 844));
  await p.waitForTimeout(700);
  await p.screenshot({ path: `${SHOTS}/mob-${frac}.png` });
}
await ctx.close();

// ── reduced-motion ──────────────────────────────────────────────────────────
ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
p = await ctx.newPage();
watch(p, 'reduced');
await p.goto(TARGET, { waitUntil: 'networkidle' });
await warm(p);
console.log('reduced-motion:', JSON.stringify(await p.evaluate(() => {
  const sec = document.querySelector('#work-experience');
  const cr = document.querySelector('.exp__car').getBoundingClientRect();
  const sr = sec.getBoundingClientRect();
  return {
    carCenterY: Math.round(cr.top - sr.top + cr.height / 2),
    stopCenters: [...sec.querySelectorAll('.exp__stop')].map((li) => { const r = li.getBoundingClientRect(); return Math.round(r.top - sr.top + r.height / 2); }),
    odo: sec.querySelector('.exp__odo')?.textContent,
    hazardDots: sec.querySelectorAll('.exp__hazard-dot').length,
  };
})));
await ctx.close();

// ── sem canvas 2D: fica o poster ────────────────────────────────────────────
ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
p = await ctx.newPage();
watch(p, 'no2d');
// Só o canvas do carro perde o 2d: anular getContext('2d') na página toda quebra o
// terminal e os outros widgets e a seção nem chega a montar.
await p.addInitScript(() => {
  const o = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (t, ...a) {
    return t === '2d' && this.classList.contains('exp__sprite') ? null : o.call(this, t, ...a);
  };
});
await p.goto(TARGET, { waitUntil: 'networkidle' });
await warm(p);
await p.evaluate(() => { const r = document.querySelector('#work-experience').getBoundingClientRect(); scrollTo(0, r.top + scrollY + 600); });
await p.waitForTimeout(1500);
console.log('sem canvas 2D:', JSON.stringify(await p.evaluate(() => ({
  posterVisivel: !document.querySelector('.exp__poster').classList.contains('is-hidden'),
  carTransform: document.querySelector('.exp__car').style.transform,
}))));
await ctx.close();

console.log(errs.length ? errs.join('\n') : 'sem erros de console');
await b.close();
