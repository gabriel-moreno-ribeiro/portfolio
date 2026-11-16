// Pre-rendered stills of every step of the clay stories, light and dark, shot from the live
// scene with a real GPU, plus where each label sits. They are what phones, tablets,
// reduced-motion and no-WebGL visitors see: the still, with the labels as real text over it.
// Run (dev server up): node qa/surreal/clay/stills.mjs
//   -> public/work/<slug>/clay-<step>-<theme>.webp (1280x800)
//   -> src/components/Home/Clay/labels.json
import { chromium } from 'playwright';
import sharp from 'sharp';
import fs from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:5173';
const STEPS = 5;
const TRAVEL_MS = 1400;
// The idle animations are put at a moment that shows the point of the step (seconds on the scene's clock).
const MOMENT = { hibeex: [2.2, 3.1, 1.25 + 1.9 * 3, 2.4 * 2 + 0.85, 1], candela: [1.6, 2, 3.1, 1.2, 1.5] };
const labels = {};

const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
for (const theme of ['light', 'dark']) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.6 });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.error('pageerror:', String(e).slice(0, 300)));
  await page.goto(`${BASE}/qa/surreal/clay/harness.html${theme === 'dark' ? '?dark' : ''}`, { waitUntil: 'load' });
  for (const slug of ['hibeex', 'candela']) {
    const row = page.locator(`[data-clay="${slug}"]`);
    await row.waitFor({ timeout: 20000 });
    await row.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await row.locator('.clay-stage--live').waitFor({ timeout: 20000 });
    const stage = row.locator('.clay-stage');
    labels[slug] ??= [];
    for (let i = 0; i < STEPS; i++) {
      await row.locator('.clay-ctl__segs button').nth(i).click();
      await page.waitForTimeout(TRAVEL_MS + 900);
      await stage.locator('canvas').evaluate((c, t) => c.__setTime(t), MOMENT[slug][i]);
      await page.waitForTimeout(250);
      if (theme === 'light') {
        // Where every visible label is anchored, as a share of the stage.
        labels[slug][i] = await stage.evaluate((el) => {
          const box = el.getBoundingClientRect();
          return [...el.querySelectorAll('.clay-stage__canvas .clay-tag')]
            .filter((t) => Number(t.style.opacity) > 0.9)
            .map((t) => {
              const r = t.getBoundingClientRect();
              return { t: t.querySelector('span').textContent, x: +(((r.left - box.left) / box.width) * 100).toFixed(2), y: +(((r.top - box.top) / box.height) * 100).toFixed(2), dx: Number(t.dataset.dx), dy: Number(t.dataset.dy) };
            })
            .filter((l) => l.x > -5 && l.x < 105 && l.y > -5 && l.y < 105);
        });
      }
      // The picture carries no text: the labels are drawn as HTML over it, at any size.
      await page.addStyleTag({ content: '.clay-stage__canvas .clay-tag { visibility: hidden !important; }' });
      const png = await stage.screenshot();
      const file = `public/work/${slug}/clay-${i + 1}-${theme}.webp`;
      const info = await sharp(png).resize(1280, 800).webp({ quality: 80, effort: 6 }).toFile(file);
      console.log(file, `${info.width}x${info.height}`, `${Math.round(info.size / 1024)} KB`, theme === 'light' ? `${labels[slug][i].length} labels` : '');
    }
  }
  await ctx.close();
}
await browser.close();
fs.writeFileSync('src/components/Home/Clay/labels.json', JSON.stringify(labels, null, 1) + '\n');
