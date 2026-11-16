// Diorama posters and QA shots. Needs the dev server on :5173.
//   node qa/surreal/dioramas/capture.mjs posters   → public/work/<slug>/diorama-{light,dark}.webp
//   node qa/surreal/dioramas/capture.mjs shots     → qa/surreal/dioramas/*.png
import { chromium } from 'playwright';
import sharp from 'sharp';

const BASE = 'http://localhost:5173';
const SLUGS = ['hibeex', 'candela', 'gsat'];
const mode = process.argv[2] ?? 'shots';
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const errors = [];

async function open(theme, viewport, path, scale = 1) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: scale });
  await ctx.addInitScript((t) => localStorage.setItem('darkMode', String(t === 'dark')), theme);
  const page = await ctx.newPage();
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`${path} ${theme}: ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`${path} ${theme}: ${e.message}`));
  await page.goto(BASE + path, { waitUntil: 'networkidle' });
  return page;
}

if (mode === 'posters') {
  for (const slug of SLUGS) for (const theme of ['light', 'dark']) {
    // 1024px wide page gives a pinned stage; the canvas is shot alone, transparent, at 2x.
    const page = await open(theme, { width: 1440, height: 900 }, `/work/${slug}`, 2);
    await page.waitForSelector('.diorama.is-live', { timeout: 20000 });
    // finished scene: scroll to the end of the pinned section
    await page.evaluate(() => { const h = document.querySelector('.how'); window.scrollTo(0, h.offsetTop + h.offsetHeight - innerHeight); });
    await page.waitForTimeout(2500);
    await page.addStyleTag({ content: '*{background:transparent!important;border-color:transparent!important} .diorama__labels,.diorama__poster,.page-nav,.floating-buttons,nav{visibility:hidden!important}' });
    await page.waitForTimeout(300);
    const png = await page.locator('.diorama__canvas canvas').screenshot({ omitBackground: true });
    const out = `public/work/${slug}/diorama-${theme}.webp`;
    await sharp(png).resize(1280, 800).webp({ quality: 86, alphaQuality: 90 }).toFile(out);
    console.log(out);
    await page.context().close();
  }
} else {
  const sizes = { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } };
  for (const [name, viewport] of Object.entries(sizes)) for (const theme of ['light', 'dark']) {
    for (const slug of SLUGS) {
      const page = await open(theme, viewport, `/work/${slug}`);
      if (name === 'desktop') {
        await page.waitForSelector('.diorama.is-live', { timeout: 20000 });
        const steps = await page.locator('.how__steps li').count();
        for (let i = 0; i < steps; i++) {
          await page.evaluate((t) => { const h = document.querySelector('.how'); window.scrollTo(0, h.offsetTop + (h.offsetHeight - innerHeight) * t); }, steps > 1 ? i / (steps - 1) : 1);
          await page.waitForTimeout(1800);
          await page.screenshot({ path: `qa/surreal/dioramas/work-${slug}-${name}-${theme}-step${i + 1}.png` });
        }
      } else {
        await page.waitForTimeout(800);
        await page.screenshot({ path: `qa/surreal/dioramas/work-${slug}-${name}-${theme}.png`, fullPage: true });
      }
      await page.context().close();
    }
    const page = await open(theme, viewport, '/');
    // sections mount lazily: walk down until the rows exist
    for (let y = 0; y < 30000 && !(await page.locator('.work-row').count()); y += 500) {
      await page.evaluate((to) => window.scrollTo(0, to), y);
      await page.waitForTimeout(150);
    }
    await page.waitForSelector('.work-row', { timeout: 20000 });
    const rows = page.locator('.work-row');
    for (let i = 0; i < await rows.count(); i++) {
      await rows.nth(i).scrollIntoViewIfNeeded();
      await page.mouse.move(2, 2);
      await page.waitForTimeout(900);
      await rows.nth(i).screenshot({ path: `qa/surreal/dioramas/home-card${i + 1}-${name}-${theme}.png` });
    }
    const strip = page.locator('.numbers-strip');
    await strip.scrollIntoViewIfNeeded();
    await page.waitForTimeout(2500);
    await strip.screenshot({ path: `qa/surreal/dioramas/home-numbers-${name}-${theme}.png` });
    await page.context().close();
  }
}
await browser.close();
console.log(errors.length ? `CONSOLE ERRORS:\n${errors.join('\n')}` : 'no console errors');
