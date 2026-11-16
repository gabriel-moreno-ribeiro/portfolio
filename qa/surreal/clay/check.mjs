// Behaviour checks for the clay stories (dev server up): node qa/surreal/clay/check.mjs
// Mobile list, reduced-motion, no-WebGL fallback, keyboard, Photos pill, console errors.
// PAGE=home runs against the Home instead of the harness.
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://localhost:5173';
const HOME = process.env.PAGE === 'home';
const OUT = new URL('./', import.meta.url).pathname;
const GPU = ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'];
const url = (dark) => BASE + (HOME ? '/#work' : `/qa/surreal/clay/harness.html${dark ? '?dark' : ''}`);
const results = {};
const fail = [];
const expect = (name, ok, detail) => { results[name] = ok ? 'ok' : `FAIL ${JSON.stringify(detail)}`; if (!ok) fail.push(name); };

async function open(browser, opts, dark = false) {
  const ctx = await browser.newContext(opts);
  await ctx.addInitScript((d) => { try { localStorage.setItem('darkMode', String(d)); } catch {} }, dark);
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 200)));
  page.on('pageerror', (e) => errors.push('pageerror: ' + String(e).slice(0, 200)));
  await page.goto(url(dark), { waitUntil: 'load' });
  await page.locator('.find-my-work').waitFor({ timeout: 20000 });
  await page.waitForTimeout(HOME ? 2500 : 600);
  await page.evaluate(() => window.dispatchEvent(new WheelEvent('wheel')));
  return { ctx, page, errors };
}
const scrollTo = (page, sel, dy = 0) => page.evaluate(([sel, dy]) => {
  const el = document.querySelector(sel);
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + dy, behavior: 'instant' });
}, [sel, dy]);

let browser = await chromium.launch({ args: GPU });

// 1 · phone: no pin, no canvas, the list of stills
for (const dark of [false, true]) {
  const { ctx, page, errors } = await open(browser, { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }, dark);
  const t = dark ? 'dark' : 'light';
  await page.locator('.clay-steps').first().waitFor();
  const m = await page.evaluate(() => ({
    pinned: document.querySelectorAll('.clay-row').length,
    canvases: document.querySelectorAll('.find-my-work .clay-stage canvas').length,
    lists: document.querySelectorAll('.clay-steps').length,
    items: document.querySelectorAll('.clay-steps li').length,
    noDims: [...document.querySelectorAll('.clay-steps img')].filter((i) => !i.getAttribute('width') || !i.getAttribute('height')).length,
    hScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    carousels: document.querySelectorAll('.find-my-work .media-carousel').length,
  }));
  expect(`mobile-${t}`, m.pinned === 0 && m.canvases === 0 && m.lists === 2 && m.items === 10 && m.noDims === 0 && !m.hScroll && m.carousels === 2, m);
  for (const [i, slug] of ['hibeex', 'candela'].entries()) {
    await scrollTo(page, `.clay-steps >> nth=${i}`.replace(/ >> nth=\d/, ''), 0);
    await page.evaluate((i) => document.querySelectorAll('.clay-steps')[i].scrollIntoView({ block: 'start', behavior: 'instant' }), i);
    await page.evaluate(() => window.scrollBy({ top: -70, behavior: 'instant' }));
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${OUT}mobile-${slug}-${t}.png` });
  }
  const broken = await page.evaluate(async () => {
    const imgs = [...document.querySelectorAll('.clay-steps img')];
    imgs.forEach((i) => (i.loading = 'eager'));
    await Promise.all(imgs.map((i) => (i.complete ? null : new Promise((r) => { i.onload = i.onerror = r; }))));
    return imgs.filter((i) => !i.naturalWidth).map((i) => i.src);
  });
  expect(`mobile-${t}-stills-load`, broken.length === 0, broken);
  expect(`mobile-${t}-console`, errors.length === 0, errors);
  await ctx.close();
}

// 2 · tablet width and desktop with reduced motion: same list, no pin
{
  const { ctx, page } = await open(browser, { viewport: { width: 768, height: 1024 }, hasTouch: true, isMobile: true });
  const m = await page.evaluate(() => ({ pinned: document.querySelectorAll('.clay-row').length, lists: document.querySelectorAll('.clay-steps').length, hScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth }));
  expect('tablet', m.pinned === 0 && m.lists === 2 && !m.hScroll, m);
  await ctx.close();
}
{
  const { ctx, page } = await open(browser, { viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  await page.locator('.clay-steps').first().waitFor();
  const m = await page.evaluate(() => ({ pinned: document.querySelectorAll('.clay-row').length, lists: document.querySelectorAll('.clay-steps').length, canvases: document.querySelectorAll('.find-my-work .clay-stage canvas').length }));
  expect('reduced-motion', m.pinned === 0 && m.lists === 2 && m.canvases === 0, m);
  await page.evaluate(() => document.querySelectorAll('.clay-steps')[1].scrollIntoView({ block: 'center', behavior: 'instant' }));
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}reduced-motion-candela-light.png` });
  await ctx.close();
}

// 3 · desktop with a GPU: keyboard, Photos pill, canvas gating
{
  const { ctx, page, errors } = await open(browser, { viewport: { width: 1440, height: 900 } });
  const row = page.locator('[data-clay="candela"]');
  await row.waitFor();
  await scrollTo(page, '[data-clay="candela"]', 100);
  await row.locator('.clay-stage--live').waitFor({ timeout: 20000 });
  const third = row.locator('.clay-row__dots button').nth(2);
  await third.focus();
  const ring = await third.evaluate((el) => getComputedStyle(el).outlineStyle);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2200);
  const kb = await row.evaluate((el) => ({ current: [...el.querySelectorAll('.clay-row__dots button')].findIndex((b) => b.getAttribute('aria-current')), title: el.querySelector('.clay-row__step-title').textContent.trim() }));
  expect('keyboard-step', kb.current === 2 && /five experiments/i.test(kb.title), kb);
  expect('focus-ring', ring !== 'none', ring);
  const pill = row.locator('.clay-row__pill');
  await pill.focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(500);
  const ph = await row.evaluate((el) => ({ carousel: !!el.querySelector('.media-carousel img'), pressed: el.querySelector('.clay-row__pill').getAttribute('aria-pressed'), stageHidden: el.querySelector('.clay-stage').parentElement.hidden }));
  expect('photos-pill', ph.carousel && ph.pressed === 'true' && ph.stageHidden, ph);
  await page.screenshot({ path: `${OUT}candela-photos-light.png` });
  await page.keyboard.press('Enter');
  // The canvas mounts lazily: the other row's stage is far away at this point.
  const lazy = await page.evaluate(() => ({ canvases: document.querySelectorAll('.find-my-work .clay-stage canvas').length, hScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth }));
  expect('no-h-scroll', !lazy.hScroll, lazy);
  expect('desktop-console', errors.length === 0, errors);
  results.canvasesWhileOnCandela = lazy.canvases;
  await ctx.close();
}
await browser.close();

// 4 · no WebGL: the still of the current step stands in, and follows the steps
browser = await chromium.launch({ args: ['--disable-gpu', '--disable-webgl', '--disable-webgl2', '--disable-3d-apis'] });
{
  const { ctx, page, errors } = await open(browser, { viewport: { width: 1440, height: 900 } });
  const row = page.locator('[data-clay="hibeex"]');
  await row.waitFor();
  await scrollTo(page, '[data-clay="hibeex"]', 100);
  await page.waitForTimeout(1500);
  await row.locator('.clay-row__dots button').nth(3).click();
  await page.waitForTimeout(2200);
  const m = await row.evaluate((el) => {
    const img = el.querySelector('.clay-stage__still');
    return { canvas: !!el.querySelector('canvas'), src: img.getAttribute('src'), loaded: img.naturalWidth, opacity: getComputedStyle(img).opacity, cls: el.querySelector('.clay-stage').className };
  });
  expect('no-webgl', !m.canvas && /clay-4-light/.test(m.src) && m.loaded > 0 && m.opacity === '1', m);
  expect('no-webgl-console', errors.length === 0, errors);
  await page.screenshot({ path: `${OUT}no-webgl-hibeex-step4-light.png` });
  await ctx.close();
}
await browser.close();

console.log(JSON.stringify(results, null, 1));
if (fail.length) { console.error('FAILED:', fail.join(', ')); process.exit(1); }
