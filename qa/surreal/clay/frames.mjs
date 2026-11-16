// The motion of the clay stories, frame by frame, with a real GPU (dev server up):
//   node qa/surreal/clay/frames.mjs [slug=both] [theme=light] [outDir=qa/surreal/clay]
// For every step it holds the scene at three moments of the step's performance (start, middle,
// end: seconds since the story set off for that step) and shoots the page at 1440x900:
//   <slug>-<step>-a.png, -b.png, -c.png   (dark: dark-<slug>-<step>-a.png ...)
// ONLY=0,3 shoots just those steps (0-based). AGES=0.3,1.2,2.8 picks other moments.
// SHEET=<dir> also writes <dir>/<slug>-<theme>-sheet.png: the stage alone, one row per step.
// PAGES=0 skips the page shots (only the sheet).
import { chromium } from 'playwright';
import sharp from 'sharp';
import path from 'node:path';

const [which = 'both', theme = 'light', outDir = 'qa/surreal/clay'] = process.argv.slice(2);
const BASE = process.env.BASE || 'http://localhost:5173';
const AGES = (process.env.AGES || '0.3,1.2,2.8').split(',').map(Number);
const ONLY = process.env.ONLY ? process.env.ONLY.split(',').map(Number) : [0, 1, 2, 3, 4];
const dark = theme === 'dark';

const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
await ctx.addInitScript((d) => { try { localStorage.setItem('darkMode', String(d)); } catch {} }, dark);
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 300)));
page.on('pageerror', (e) => errors.push('pageerror: ' + String(e).slice(0, 300)));
await page.goto(BASE + '/#work', { waitUntil: 'load' });

for (const slug of which === 'both' ? ['hibeex', 'candela'] : [which]) {
  const row = page.locator(`[data-clay="${slug}"]`);
  await row.waitFor({ timeout: 20000 });
  // The home keeps re-aligning to the hash target until the visitor scrolls: tell it we did.
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.dispatchEvent(new WheelEvent('wheel')));
  const stage = row.locator('.clay-stage');
  await stage.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await row.locator('.clay-stage--live').waitFor({ timeout: 20000 });
  const canvas = stage.locator('canvas').first();
  const crops = [];
  for (const i of ONLY) {
    await canvas.evaluate((c) => c.__seek());
    await row.locator('.clay-ctl__segs button').nth(i).click();
    await page.waitForTimeout(1200);
    for (const [n, age] of AGES.entries()) {
      await canvas.evaluate((c, [from, to, age]) => c.__seek(from, to, age), [(i + 4) % 5, i, age]);
      await page.waitForTimeout(220);
      if (process.env.PAGES !== '0') await page.screenshot({ path: path.join(outDir, `${dark ? 'dark-' : ''}${slug}-${i + 1}-${'abc'[n]}.png`) });
      if (process.env.SHEET) crops.push(await sharp(await stage.screenshot()).resize({ width: 600 }).toBuffer());
    }
  }
  await canvas.evaluate((c) => c.__seek());
  if (process.env.SHEET) {
    const h = (await sharp(crops[0]).metadata()).height;
    await sharp({ create: { width: 600 * AGES.length, height: h * ONLY.length, channels: 3, background: dark ? '#14100d' : '#fff8f4' } })
      .composite(crops.map((input, k) => ({ input, left: (k % AGES.length) * 600, top: Math.floor(k / AGES.length) * h })))
      .png()
      .toFile(path.join(process.env.SHEET, `${slug}-${theme}-sheet.png`));
  }
}
console.log(JSON.stringify({ errors: [...new Set(errors)] }));
await browser.close();
