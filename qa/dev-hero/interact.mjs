import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--use-gl=angle','--use-angle=gl','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', e => errs.push(e.message.slice(0,160)));
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForTimeout(3000);

const count = () => page.evaluate(() => ({
  r1: document.querySelectorAll('.moments__row:not(.moments__row--reverse) .moments__item').length,
  r2: document.querySelectorAll('.moments__row--reverse .moments__item').length,
  caps: [...document.querySelectorAll('.moments__row:not(.moments__row--reverse) figcaption')].slice(0,3).map(f=>f.textContent),
  pressed: [...document.querySelectorAll('.moments__filter')].filter(b=>b.getAttribute('aria-pressed')==='true').map(b=>b.textContent),
}));

for (const city of ['Fortaleza','Salvador','São Paulo','Missão Velha']) {
  await page.getByRole('button', { name: city, exact: true }).click();
  await page.waitForTimeout(200);
  console.log(city, JSON.stringify(await count()));
}
// keyboard: focus the All filter and press Enter
await page.getByRole('button', { name: 'All', exact: true }).focus();
await page.keyboard.press('Enter');
await page.waitForTimeout(200);
console.log('after Enter on All', JSON.stringify(await count()));

// globe section: scroll in, check clock + accordion focus
await page.evaluate(() => document.getElementById('background')?.scrollIntoView({ block: 'center' }));
await page.waitForTimeout(3000);
console.log('city time:', await page.evaluate(() => document.querySelector('.city-panel__time')?.textContent));
console.log('poster hidden after paint:', await page.evaluate(() => document.querySelector('.globe-poster')?.getAttribute('data-hidden')));
const panels = page.locator('.ag-panel');
const n = await panels.count();
if (n > 1) {
  await panels.nth(2).focus();
  await page.waitForTimeout(700);
  console.log('focus opens panel 2:', await panels.nth(2).getAttribute('aria-current'));
}
// timeline click pins the tour
await page.locator('.city-timeline__dot').nth(2).click();
await page.waitForTimeout(400);
console.log('after timeline click:', await page.evaluate(() => document.querySelector('.city-panel__location')?.textContent));
await page.screenshot({ path: 'qa/dev-hero/globe.png' });
console.log('pageerrors:', errs);
await browser.close();
