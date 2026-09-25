import { chromium } from 'playwright';
import crypto from 'node:crypto';
const browser = await chromium.launch({ args: ['--use-gl=angle','--use-angle=gl','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForSelector('.robot-canvas canvas');
await page.waitForTimeout(4000);
const shot = async () => crypto.createHash('md5').update(await page.locator('.robot-canvas canvas').screenshot()).digest('hex').slice(0,10);
const awake = await shot();
console.log('awake', awake);
await page.waitForTimeout(33000);
const asleep = await shot();
console.log('after 33s idle', asleep, asleep === awake ? 'NO CHANGE (fail)' : 'changed (sleeping)');
await page.mouse.move(700, 400);
await page.waitForTimeout(1500);
const woke = await shot();
console.log('after input', woke, woke === asleep ? 'NO CHANGE (fail)' : 'changed (awake)');

// marquee gate
console.log('moments class at top:', await page.evaluate(() => document.querySelector('.moments')?.className));
await page.evaluate(() => window.scrollTo(0, 4000));
await page.waitForTimeout(800);
console.log('moments class scrolled away:', await page.evaluate(() => document.querySelector('.moments')?.className));
await browser.close();
