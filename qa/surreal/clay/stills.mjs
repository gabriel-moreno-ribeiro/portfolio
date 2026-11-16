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
// Every step is held at the moment of its performance that reads best on its own (seconds into the step).
const MOMENT = { hibeex: [2.55, 1.5, 2.02, 1.58, 3.2], candela: [1.6, 1.5, 2.9, 2.9, 2.3] };
const labels = {};

const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
for (const theme of ['light', 'dark']) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.6 });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.error('pageerror:', String(e).slice(0, 300)));
  // A compile error anywhere in the app (other work in progress) puts Vite's overlay over the page: say what it is.
  const overlay = () => page.evaluate(() => document.querySelector('vite-error-overlay')?.shadowRoot?.textContent?.replace(/\s+/g, ' ').slice(0, 400));
  await page.goto(`${BASE}/qa/surreal/clay/harness.html${theme === 'dark' ? '?dark' : ''}`, { waitUntil: 'load' });
  for (const slug of ['hibeex', 'candela']) {
    const row = page.locator(`[data-clay="${slug}"]`);
    await row.waitFor({ timeout: 20000 });
    await row.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
    await row.locator('.clay-stage--live').waitFor({ timeout: 20000 });
    const stage = row.locator('.clay-stage');
    labels[slug] ??= [];
    for (let i = 0; i < STEPS; i++) {
      await row.locator('.clay-ctl__segs button').nth(i).click({ timeout: 8000 }).catch(async (e) => { throw new Error(`step ${i + 1} of ${slug}: ${(await overlay()) ?? e.message}`); });
      await page.waitForTimeout(900);
      await stage.locator('canvas').evaluate((c, [i, t]) => c.__seek(i, i, t), [i, MOMENT[slug][i]]);
      await page.waitForTimeout(300);
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
      await stage.locator('canvas').evaluate((c) => c.__seek());
    }
  }
  await ctx.close();
}
await browser.close();
fs.writeFileSync('src/components/Home/Clay/labels.json', JSON.stringify(labels, null, 1) + '\n');
