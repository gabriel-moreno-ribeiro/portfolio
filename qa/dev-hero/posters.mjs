import { chromium } from 'playwright';
import sharp from 'sharp';
import fs from 'node:fs';

const OUT = 'C:/portfolio-gabriel';
const GL = ['--use-gl=angle', '--use-angle=gl', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const browser = await chromium.launch({ args: GL });

async function shot(dark) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
  await ctx.addInitScript(`localStorage.setItem('darkMode', ${dark})`);
  const page = await ctx.newPage();
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  if (!dark) {
    try {
      await page.waitForSelector('.robot-canvas canvas', { timeout: 25000 });
      await page.waitForTimeout(5000);
      const png = await page.locator('.robot-canvas canvas').screenshot({ omitBackground: true });
      await sharp(png).resize(600, 600, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .webp({ quality: 90, alphaQuality: 92 }).toFile(`${OUT}/public/assets/robot-poster.webp`);
      console.log('robot poster', fs.statSync(`${OUT}/public/assets/robot-poster.webp`).size, 'bytes');
    } catch (e) { console.log('ROBOT FAIL', e.message.slice(0, 160)); }
  }

  try {
    await page.evaluate(() => document.getElementById('background')?.scrollIntoView({ block: 'center' }));
    await page.waitForSelector('canvas.globe-canvas', { timeout: 25000 });
    await page.waitForTimeout(7000);
    const png = await page.locator('canvas.globe-canvas').screenshot();
    const name = dark ? 'globe-poster-dark.webp' : 'globe-poster.webp';
    await sharp(png).resize(960, 960, { fit: 'contain' }).webp({ quality: 84 }).toFile(`${OUT}/public/background/${name}`);
    console.log(name, fs.statSync(`${OUT}/public/background/${name}`).size, 'bytes');
  } catch (e) { console.log('GLOBE FAIL', dark, e.message.slice(0, 160)); }
  await ctx.close();
}

await shot(false);
await shot(true);
await browser.close();
