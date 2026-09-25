import { chromium } from 'playwright';
import sharp from 'sharp';
import fs from 'node:fs';
const browser = await chromium.launch({ args: ['--use-gl=angle','--use-angle=gl','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForSelector('.robot-canvas canvas', { timeout: 25000 });
await page.waitForTimeout(5000);
await page.evaluate(() => {
  document.querySelector('.hero-slideshow')?.remove();
  document.documentElement.style.background = 'transparent';
  document.body.style.background = 'transparent';
  document.querySelector('.app')?.style.setProperty('background', 'transparent', 'important');
  document.querySelectorAll('.custom-mouse, .cursor').forEach(e => e.remove());
});
await page.waitForTimeout(600);
const png = await page.locator('.robot-canvas canvas').screenshot({ omitBackground: true });
const s = await sharp(png).stats();
console.log('isOpaque', s.isOpaque, 'alpha mean', s.channels[3] ? Math.round(s.channels[3].mean) : 'n/a');
await sharp(png).resize(600, 600, { fit: 'contain', background: { r:0,g:0,b:0,alpha:0 } })
  .webp({ quality: 90, alphaQuality: 92 }).toFile('C:/portfolio-gabriel/public/assets/robot-poster.webp');
console.log('robot poster', fs.statSync('C:/portfolio-gabriel/public/assets/robot-poster.webp').size);
await browser.close();
