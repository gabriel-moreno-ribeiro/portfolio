// Frame rate of the clay stories on the Home, with a real GPU (dev server up): node qa/surreal/clay/fps.mjs
// Per step: frames per second over 3 s of the live page, and the cost of one frame (ms) with the occlusion pass.
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'http://localhost:5173';
const DPR = Number(process.env.DPR || 1.75);
const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: DPR });
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 200)));
page.on('pageerror', (e) => errors.push('pageerror: ' + String(e).slice(0, 200)));
await page.goto(BASE + '/#work', { waitUntil: 'load' });
const out = { dpr: DPR };
for (const slug of ['hibeex', 'candela']) {
  const row = page.locator(`[data-clay="${slug}"]`);
  await row.waitFor({ timeout: 20000 });
  await page.waitForTimeout(1500);
  await page.evaluate(() => window.dispatchEvent(new WheelEvent('wheel')));
  await row.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
  await row.locator('.clay-stage--live').waitFor({ timeout: 20000 });
  out[slug] = [];
  for (let i = 0; i < 5; i++) {
    await row.locator('.clay-ctl__segs button').nth(i).click();
    await page.waitForTimeout(1500);
    const fps = await page.evaluate(() => new Promise((done) => {
      let n = 0;
      const t0 = performance.now();
      const tick = (t) => (t - t0 < 3000 ? (n++, requestAnimationFrame(tick)) : done(Math.round((n / (t - t0)) * 1000)));
      requestAnimationFrame(tick);
    }));
    const canvas = row.locator('.clay-stage canvas').first();
    const ms = await canvas.evaluate((c) => +c.__bench(true, 30).toFixed(2));
    out[slug].push({ step: i + 1, fps, frameMs: ms, degraded: await canvas.evaluate((c) => c.dataset.degraded || '') });
  }
}
out.errors = [...new Set(errors)];
console.log(JSON.stringify(out, null, 1));
await browser.close();
