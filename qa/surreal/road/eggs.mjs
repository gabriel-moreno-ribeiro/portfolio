// Surpresas da estrada: clica cada uma (balão aberto → egg-<id>.png), confere que nem o desenho
// nem o balão ficam sobre texto, as passivas (capivara e pichação devagar; radar só correndo), o contador, o
// sessionStorage, o prêmio (D-20 dourada + confete) e o teclado (um só Tab, setas entre elas).
//   node qa/surreal/road/eggs.mjs [dark]
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = process.env.OUT ? path.resolve(HERE, process.env.OUT) : HERE;
const dark = process.argv[2] === 'dark';
const browser = await chromium.launch();
const W = Number(process.env.W ?? 1440); // W=768: confere os balões na coluna estreita
const ctx = await browser.newContext({ viewport: { width: W, height: 900 } });
await ctx.addInitScript((d) => { try { localStorage.setItem('darkMode', String(d)); } catch {} }, dark);
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 200)));
page.on('pageerror', (e) => errors.push('pageerror: ' + String(e).slice(0, 200)));
await page.goto('http://localhost:5173/#work-experience');
await page.waitForSelector('#work-experience .exp__car');
await page.waitForTimeout(4000);
await page.evaluate(() => window.dispatchEvent(new Event('wheel')));
const tag = dark ? '-dark' : '';
const top = await page.evaluate(() => document.querySelector('section.exp').getBoundingClientRect().top + scrollY);
const height = await page.evaluate(() => document.querySelector('section.exp').offsetHeight);
const glide = async (to, step = 40, wait = 30) => {
  let y = await page.evaluate(() => scrollY);
  const dir = Math.sign(to - y) || 1;
  while (Math.abs(to - y) > step) { y += dir * step; await page.evaluate((v) => scrollTo({ top: v, behavior: 'instant' }), y); await page.waitForTimeout(wait); }
  await page.evaluate((v) => scrollTo({ top: v, behavior: 'instant' }), to);
};
const found = () => page.evaluate(() => JSON.parse(sessionStorage.getItem('exp:eggs') ?? '[]'));
const out = { buttons: {}, passive: {} };

// ── passivas: desce a estrada inteira devagar (capivara, pichação); o radar não pode disparar ──
await page.evaluate((v) => scrollTo({ top: v, behavior: 'instant' }), top - 100);
await page.waitForTimeout(1000);
await glide(top + height - 700, 14, 16);
await page.waitForTimeout(1500);
out.passive.slow = (await found()).join() + ' (devagar: capy e graffiti, sem camera)';
out.counterAfterSlow = await page.evaluate(() => document.querySelector('.exp__found')?.textContent ?? null);
// ── teclado, antes de qualquer clique ──
out.keyboard = await page.evaluate(() => {
  const all = [...document.querySelectorAll('.exp [data-egg]')];
  return { buttons: all.map((b) => b.dataset.egg).join(), tabStops: all.filter((b) => b.tabIndex === 0).map((b) => b.dataset.egg).join(), small: all.filter((b) => { const r = b.getBoundingClientRect(); return r.width < 24 || r.height < 24; }).map((b) => b.dataset.egg).join() || 'none', unlabeled: all.filter((b) => !b.getAttribute('aria-label')).length };
});
await page.evaluate((v) => scrollTo({ top: v, behavior: 'instant' }), top - 100);
await page.waitForTimeout(1200);
await page.focus('.exp__honk');
const walk = [];
for (let k = 0; k < 3; k++) { await page.keyboard.press('ArrowDown'); await page.waitForTimeout(700); walk.push(await page.evaluate(() => document.activeElement?.dataset.egg + (document.activeElement?.matches(':focus-visible') ? '' : '(no ring)'))); }
await page.keyboard.press('Home');
await page.waitForTimeout(500);
walk.push('Home→' + (await page.evaluate(() => document.activeElement?.dataset.egg)));
out.keyboard.arrows = walk.join(' → ');
out.keyboard.tabStopsAfter = await page.evaluate(() => [...document.querySelectorAll('.exp [data-egg]')].filter((b) => b.tabIndex === 0).map((b) => b.dataset.egg).join());
await page.evaluate(() => document.activeElement?.blur());

// ── cada botão: chega andando, clica, mede, fotografa ──
const ids = await page.evaluate(() => [...document.querySelectorAll('.exp__roadside [data-egg]')].map((b) => ({ id: b.dataset.egg, y: parseFloat(b.style.top) })));
await page.evaluate((v) => scrollTo({ top: v, behavior: 'instant' }), top - 100);
await page.waitForTimeout(800);
for (const egg of ids) {
  await glide(top + egg.y - 520);
  await page.waitForTimeout(1500);
  if (egg.id === 'hitch') await page.screenshot({ path: path.join(OUT, `egg-hitch-before${tag}.png`), clip: { x: Math.max(0, W / 2 - 200), y: 200, width: Math.min(W, 560), height: 320 } });
  const ahead = await page.evaluate((id) => document.querySelector(`[data-egg="${id}"]`).hasAttribute('data-ahead'), egg.id);
  if (egg.id === 'shortcut') {
    // clicar já leva a página embora: fotografa a plaquinha e a trilha antes
    const r = await page.evaluate(() => { const b = document.querySelector('[data-egg="shortcut"]').getBoundingClientRect(); return { x: b.x, y: b.y }; });
    await page.screenshot({ path: path.join(OUT, `egg-shortcut${tag}.png`), clip: { x: Math.max(0, r.x - 420), y: Math.max(0, r.y - 80), width: 560, height: Math.min(700, 900 - Math.max(0, r.y - 80)) } });
  }
  await page.click(`[data-egg="${egg.id}"]`, { force: true });
  await page.waitForTimeout(700);
  const m = await page.evaluate((id) => {
    const s = document.querySelector('section.exp');
    const btn = s.querySelector(`[data-egg="${id}"]`);
    const texts = [...s.querySelectorAll('.exp__card, .section-title, .exp__route ol, .exp__d20-text')].map((el) => el.getBoundingClientRect());
    const gap = (r) => Math.round(Math.min(...texts.map((t) => Math.hypot(Math.max(t.left - r.right, 0, r.left - t.right), Math.max(t.top - r.bottom, 0, r.top - t.bottom)))));
    const say = btn.querySelector('.exp__say');
    const b = btn.getBoundingClientRect();
    const sr = say.getBoundingClientRect();
    return { art: gap(b), bubble: gap(sr), say: say.textContent, shown: getComputedStyle(say).opacity, label: btn.getAttribute('aria-label'), live: s.querySelector('.exp__roadside [aria-live]').textContent, inView: sr.left >= 0 && sr.right <= innerWidth, clip: { x: Math.max(0, Math.min(innerWidth - 560, b.x + b.width / 2 - 280)), y: Math.max(0, Math.min(innerHeight - 320, b.y + b.height / 2 - 170)), width: Math.min(innerWidth, 560), height: 320 } };
  }, egg.id);
  if (egg.id !== 'shortcut') await page.screenshot({ path: path.join(OUT, `egg-${egg.id}${tag}.png`), clip: m.clip });
  if (egg.id === 'shortcut') {
    // o atalho rola a página até a parada seguinte: espera assentar e fotografa a chegada
    await page.waitForTimeout(2000);
    m.arrived = await page.evaluate(() => document.activeElement?.id);
    await page.screenshot({ path: path.join(OUT, `egg-shortcut-arrived${tag}.png`), clip: { x: Math.max(0, W / 2 - 380), y: 100, width: Math.min(W, 760), height: 700 } });
  }
  out.buttons[egg.id] = `ahead=${ahead} · art→text ${m.art}px · bubble→text ${m.bubble}px · bubble on screen ${m.inView} · "${m.say}" · label "${m.label}" · live "${m.live}"${m.arrived ? ` · focus → #${m.arrived}` : ''}`;
}

// ── buzina ──
await page.click('.exp__honk');
await page.waitForTimeout(250);
const car = await page.evaluate(() => { const r = document.querySelector('.exp__car').getBoundingClientRect(); return { x: r.x - 120, y: Math.max(0, r.y - 80), width: 380, height: 280 }; });
await page.screenshot({ path: path.join(OUT, `egg-honk${tag}.png`), clip: car });
out.honk = await page.evaluate(() => document.querySelector('.exp__car').classList.contains('is-honk'));

// agora correndo pelo radar
const camY = await page.evaluate(() => parseFloat(document.querySelector('.exp__egg--camera')?.style.top ?? '0'));
await page.evaluate((v) => scrollTo({ top: v, behavior: 'instant' }), top + camY - 1100);
await page.waitForTimeout(1500);
let flashed = false;
for (let y = top + camY - 1100; y < top + camY + 300; y += 90) {
  await page.evaluate((v) => scrollTo({ top: v, behavior: 'instant' }), y);
  await page.waitForTimeout(16);
  if (!flashed && (await page.evaluate(() => document.querySelector('.exp__egg--camera')?.hasAttribute('data-flash')))) {
    flashed = true;
    const c = await page.evaluate(() => { const r = document.querySelector('.exp__egg--camera').getBoundingClientRect(); return { x: Math.max(0, r.x - 260), y: Math.max(0, Math.min(innerHeight - 320, r.y - 140)), width: 560, height: 320 }; });
    await page.screenshot({ path: path.join(OUT, `egg-camera${tag}.png`), clip: c });
  }
}
for (let k = 0; k < 40 && !flashed; k++) { await page.waitForTimeout(30); flashed = await page.evaluate(() => !!document.querySelector('.exp__egg--camera')?.hasAttribute('data-flash')); }
await page.waitForTimeout(1200);
out.passive.fast = `flash seen: ${flashed} · found: ${(await found()).includes('camera')}`;

// ── tudo achado: contador, D-20 dourada, confete na chegada ──
out.found = (await found()).join();
out.counter = await page.evaluate(() => document.querySelector('.exp__found')?.textContent ?? null);
const lastY = await page.evaluate(() => { const li = [...document.querySelectorAll('.exp__stop')].pop().getBoundingClientRect(); return li.top + scrollY + li.height / 2; });
await glide(lastY - 450 + 6);
await page.waitForTimeout(700);
await page.screenshot({ path: path.join(OUT, `egg-reward-falling${tag}.png`), clip: { x: Math.max(0, W / 2 - 300), y: 60, width: Math.min(W, 760), height: 520 } });
await page.waitForTimeout(1800);
out.reward = await page.evaluate(() => ({ gold: document.querySelector('.exp__car').hasAttribute('data-gold'), confetti: getComputedStyle(document.querySelector('.exp__confetti')).visibility, kidInBed: document.querySelector('.exp__cargo').hasAttribute('data-kid'), cargo: document.querySelector('.exp__cargo').dataset.got }));
const fin = await page.evaluate(() => { const r = document.querySelector('.exp__car').getBoundingClientRect(); return { x: Math.max(0, r.x - 320), y: Math.max(0, Math.min(innerHeight - 520, r.y - 300)), width: 760, height: 520 }; });
await page.screenshot({ path: path.join(OUT, `egg-reward${tag}.png`), clip: fin });
// recarrega: a sessão lembra
await page.reload();
await page.waitForSelector('#work-experience .exp__car');
await page.waitForTimeout(3500);
out.afterReload = await page.evaluate(() => ({ counter: document.querySelector('.exp__found')?.textContent ?? null, gold: document.querySelector('.exp__car').hasAttribute('data-gold') }));
out.errors = errors;
console.log(JSON.stringify(out, null, 1));
await browser.close();
