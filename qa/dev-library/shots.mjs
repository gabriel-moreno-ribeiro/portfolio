// Library redesign proof: 1440/390, light/dark, card with review, ruler hover, drawer, reading now, loading, no WebGL
import { chromium } from 'playwright';
const out = 'qa/dev-library';
const errors = [];
const gl = await chromium.launch();
async function page(b, w, h, dark) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: w < 500, hasTouch: w < 500 });
  await ctx.addInitScript((d) => localStorage.setItem('darkMode', JSON.stringify(d)), dark);
  const p = await ctx.newPage();
  p.on('console', (m) => { if (m.type() === 'error') errors.push(`${w}${dark ? 'd' : 'l'}: ${m.text().slice(0, 200)}`); });
  p.on('pageerror', (e) => errors.push(`${w}${dark ? 'd' : 'l'} pageerror: ${e.message}`));
  return { ctx, p };
}
for (const dark of [false, true]) for (const [w, h] of [[1440, 900], [390, 844]]) {
  const t = `${w}-${dark ? 'dark' : 'light'}`;
  const { ctx, p } = await page(gl, w, h, dark);
  // Hold the engine module back so the loading state (card + placeholder plank) can be captured
  let release;
  const held = new Promise((r) => { release = r; });
  await p.route(/shelf\/ShelfEngine\.ts/, async (route) => { await held; await route.continue(); });
  await p.goto('http://localhost:5173/library', { waitUntil: 'domcontentloaded' });
  await p.waitForSelector('.library__caption h1');
  await p.waitForTimeout(800);
  await p.screenshot({ path: `${out}/${t}-loading.png` });
  release();
  await p.waitForSelector('.library--ready', { timeout: 60000 });
  await p.waitForTimeout(5000);
  await p.screenshot({ path: `${out}/${t}-card.png` });
  const age = p.locator('.library__age', { hasText: '14' }).first();
  await age.hover();
  await p.waitForTimeout(400);
  await p.screenshot({ path: `${out}/${t}-ruler-hover.png` });
  await p.locator('.library__age', { hasText: '18' }).first().click();
  await p.mouse.move(w / 2, 200);
  await p.waitForTimeout(4000);
  await p.screenshot({ path: `${out}/${t}-reading.png` });
  console.log(t, await p.evaluate(() => document.querySelector('.library__read')?.textContent));
  await p.locator('.library__index-toggle').first().click();
  await p.waitForTimeout(1200);
  await p.screenshot({ path: `${out}/${t}-drawer.png` });
  await ctx.close();
}
await gl.close();
// No WebGL: the drawer opens and the card runs on the data
const nogl = await chromium.launch({ args: ['--disable-webgl', '--disable-3d-apis'] });
for (const [w, h] of [[1440, 900], [390, 844]]) {
  const { ctx, p } = await page(nogl, w, h, false);
  await p.goto('http://localhost:5173/library', { waitUntil: 'load' });
  await p.waitForTimeout(2500);
  await p.screenshot({ path: `${out}/${w}-light-nowebgl.png` });
  console.log('nogl', w, await p.evaluate(() => ({ no3d: !!document.querySelector('.library--no3d'), drawer: !!document.querySelector('.library__drawer.is-open') })));
  await ctx.close();
}
await nogl.close();
console.log('errors', errors);
