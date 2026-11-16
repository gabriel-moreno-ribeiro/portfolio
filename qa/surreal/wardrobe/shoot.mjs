// Screenshots of the wardrobe rail (dev server on :5173): node qa/surreal/wardrobe/shoot.mjs [rest|turn|detail|mobile|home ...]
import { chromium } from 'playwright';

const OUT = 'qa/surreal/wardrobe';
const want = new Set(process.argv.slice(2));
const on = (k) => !want.size || want.has(k);
const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const errors = [];

async function open(theme, width, height, url = 'http://localhost:5173/story') {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2, hasTouch: width < 600 });
  await ctx.addInitScript((t) => { try { localStorage.setItem('theme', t); } catch {} }, theme);
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`${theme} ${width}: ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`${theme} ${width}: ${e.message}`));
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
  const rail = page.locator('.wardrobe-rail');
  await rail.scrollIntoViewIfNeeded();
  await page.evaluate(() => document.querySelector('.wardrobe-rail').scrollIntoView({ block: 'center' }));
  await page.waitForFunction(() => [...document.querySelectorAll('.wardrobe-rail img')].every((i) => i.complete && i.naturalWidth > 0));
  await page.waitForTimeout(1600);
  return { ctx, page, rail };
}

for (const theme of ['light', 'dark']) {
  const { ctx, page, rail } = await open(theme, 1440, 900);
  if (on('rest')) await rail.screenshot({ path: `${OUT}/rest-${theme}.png` });
  for (let i = 0; i < 5; i++) {
    const g = page.locator(`[data-garment="${i}"]`);
    if (on('turn')) {
      const box = await g.boundingBox();
      await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.45);
      await page.waitForTimeout(1300);
      await rail.screenshot({ path: `${OUT}/turn-${i}-${theme}.png` });
      await page.mouse.move(5, 5);
      await page.waitForTimeout(700);
    }
    if (on('detail')) {
      await g.focus();
      await page.keyboard.press('Enter');
      await page.waitForTimeout(1300);
      await page.screenshot({ path: `${OUT}/detail-${i}-front-${theme}.png` });
      await page.getByRole('button', { name: 'Back', exact: true }).click();
      await page.waitForTimeout(1400);
      await page.screenshot({ path: `${OUT}/detail-${i}-back-${theme}.png` });
      await page.keyboard.press('Escape');
      await page.waitForTimeout(900);
      await page.mouse.move(5, 5);
      await page.evaluate(() => document.activeElement?.blur());
      await page.waitForTimeout(500);
    }
  }
  await ctx.close();
}

if (on('mobile')) {
  const { ctx, page, rail } = await open('light', 390, 844);
  await rail.screenshot({ path: `${OUT}/mobile-light.png` });
  console.log('390 overflow-x:', await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth));
  await ctx.close();
}

if (on('home')) {
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const { ctx, page } = await open('light', w, h, 'http://localhost:5173/#wardrobe');
    const m = await page.evaluate(() => { const s = document.querySelector('#wardrobe'); const r = s.getBoundingClientRect(); const cs = getComputedStyle(s); return { section: Math.round(r.height), marginBottom: cs.marginBottom, wrapper: Math.round((s.closest('[data-lazy-section], section')?.parentElement ?? s).getBoundingClientRect().height), overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth }; });
    console.log(`home ${w}:`, JSON.stringify(m));
    await page.screenshot({ path: `${OUT}/home-${w}.png` });
    await ctx.close();
  }
}

await browser.close();
console.log(errors.length ? `console errors:\n${errors.join('\n')}` : 'no console errors');
