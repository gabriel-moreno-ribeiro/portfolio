// Pre-rendered stills of every step of the clay stories, light and dark, shot from the live
// scene with a real GPU. They are what mobile, tablet, reduced-motion and no-WebGL visitors see.
// Run (dev server up): node qa/surreal/clay/stills.mjs  ->  public/work/<slug>/clay-<step>-<theme>.webp
import { chromium } from 'playwright';
import sharp from 'sharp';

const BASE = process.env.BASE || 'http://localhost:5173';
const HOLD = 0.42;
const STEPS = 5;
const WIDTH = 480; // CSS px of the stage while shooting; x2 = the 960x600 file
// A phone shows the still ~360px wide, so the labels are shot larger than on the desktop scene.
const CSS = `
  html, body, #root, .home-wrapper { background: transparent !important; }
  .find-my-work .clay-row__pin { grid-template-columns: minmax(0, 1fr) ${WIDTH}px !important; }
  .find-my-work .clay-tag { font-size: 10px !important; }
  .find-my-work .clay-stage { background: none !important; } /* the dark floor light is CSS, not pixels */
`;

const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
for (const theme of ['light', 'dark']) {
  const ctx = await browser.newContext({ viewport: { width: 1100, height: 720 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.error('pageerror:', String(e).slice(0, 300)));
  await page.goto(`${BASE}/qa/surreal/clay/harness.html${theme === 'dark' ? '?dark' : ''}`, { waitUntil: 'load' });
  await page.addStyleTag({ content: CSS });
  for (const slug of ['hibeex', 'candela']) {
    const row = page.locator(`[data-clay="${slug}"]`);
    await row.waitFor({ timeout: 20000 });
    for (let i = 0; i < STEPS; i++) {
      await page.evaluate(([slug, p]) => {
        const el = document.querySelector(`[data-clay="${slug}"]`);
        const top = el.getBoundingClientRect().top + window.scrollY;
        window.scrollTo({ top: top + (el.offsetHeight - window.innerHeight) * p, behavior: 'instant' });
      }, [slug, (i + HOLD / 2) / STEPS]);
      if (i === 0) await row.locator('.clay-stage--live').waitFor({ timeout: 20000 });
      await page.waitForTimeout(1900);
      const png = await row.locator('.clay-stage').screenshot({ omitBackground: true });
      const file = `public/work/${slug}/clay-${i + 1}-${theme}.webp`;
      const info = await sharp(png).resize(WIDTH * 2).webp({ quality: 82, alphaQuality: 85, effort: 6 }).toFile(file);
      console.log(file, `${info.width}x${info.height}`, `${Math.round(info.size / 1024)} KB`);
    }
  }
  await ctx.close();
}
await browser.close();
