// The stills as phones see them (dev server up): node qa/surreal/clay/mobile.mjs [outDir=qa/surreal/clay]
// Every step of both stories at 390px, light, in one sheet per story; plus reduced-motion on desktop.
import { chromium } from 'playwright';
import sharp from 'sharp';
import path from 'node:path';

const [outDir = 'qa/surreal/clay'] = process.argv.slice(2);
const BASE = process.env.BASE || 'http://localhost:5173';
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 200)));
page.on('pageerror', (e) => errors.push('pageerror: ' + String(e).slice(0, 200)));
await page.goto(BASE + '/qa/surreal/clay/harness.html', { waitUntil: 'load' });
const out = { canvases: 0, hScroll: false };
for (const [n, slug] of ['hibeex', 'candela'].entries()) {
  const player = page.locator('.clay-player').nth(n);
  await player.waitFor({ timeout: 20000 });
  await player.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
  const shots = [];
  for (let i = 0; i < 5; i++) {
    await player.locator('.clay-ctl__segs button').nth(i).click();
    await page.waitForTimeout(700);
    shots.push(await player.screenshot());
    // EACH=<dir> also keeps every step on its own, at full size.
    if (process.env.EACH) await sharp(shots.at(-1)).toFile(path.join(process.env.EACH, `m-${slug}-${i + 1}.png`));
  }
  const metas = await Promise.all(shots.map((s) => sharp(s).metadata()));
  const [w, h] = [metas[0].width, Math.max(...metas.map((m) => m.height))];
  const sheet = await sharp({ create: { width: w * 5, height: h, channels: 3, background: '#fff8f4' } })
    .composite(shots.map((input, i) => ({ input, left: i * w, top: 0 })))
    .png()
    .toBuffer();
  await sharp(sheet)
    .resize({ width: 1950 })
    .png()
    .toFile(path.join(outDir, `m-${slug}-390.png`));
}
out.canvases = await page.locator('.find-my-work .clay-stage canvas').count();
out.hScroll = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
out.errors = [...new Set(errors)];
console.log(JSON.stringify(out));
await browser.close();
