import { chromium } from 'playwright';
import sharp from 'sharp';
const browser = await chromium.launch({ args: ['--use-gl=angle','--use-angle=gl','--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
await page.goto('http://localhost:4173/', { waitUntil: 'load' });
await page.waitForSelector('.sticker-image');
await page.waitForTimeout(2000);
// normalize the size bug first so the crop is honest
await page.evaluate(() => document.querySelectorAll('.sticker-image, .flap-image').forEach(i => { i.removeAttribute('height'); i.style.height = 'auto'; }));
await page.waitForTimeout(300);
const cases = [
  ['as-is', () => {}],
  ['no lighting', () => document.querySelectorAll('.sticker-lighting, .flap-lighting').forEach(e => e.style.filter = 'none')],
  ['no dropShadow too', () => document.querySelectorAll('.sticker-main').forEach(e => e.style.filter = 'none')],
  ['no flap fill too', () => document.querySelectorAll('.flap-image').forEach(e => e.style.filter = 'none')],
];
for (const [label, fn] of cases) {
  await page.evaluate(`(${fn.toString()})()`);
  await page.waitForTimeout(400);
  const box = await page.locator('.sticker-container').boundingBox();
  const buf = await page.screenshot({ clip: { x: box.x, y: box.y, width: box.width, height: box.height } });
  const s = await sharp(buf).stats();
  console.log(label.padEnd(20), 'box', Math.round(box.width) + 'x' + Math.round(box.height), 'RGB', s.channels.slice(0,3).map(c => Math.round(c.mean)).join(','));
  await sharp(buf).toFile(`qa/dev-hero/st-${label.replace(/ /g,'_')}.png`);
}
await browser.close();
