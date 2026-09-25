import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--use-gl=angle','--use-angle=gl','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(`localStorage.setItem('darkMode', true)`);
const page = await ctx.newPage();
const errs = []; page.on('pageerror', e => errs.push(e.message.slice(0,140)));
await page.goto('http://localhost:5173/', { waitUntil: 'load' });
await page.waitForTimeout(3000);
await page.screenshot({ path: 'qa/dev-hero/dark-top.png' });
await page.evaluate(() => document.getElementById('background')?.scrollIntoView({ block: 'center' }));
await page.waitForTimeout(4000);
console.log(await page.evaluate(() => {
  const p = document.querySelector('.globe-poster');
  const s = document.querySelector('.background-section');
  return { theme: document.documentElement.dataset.theme, posterSrc: p?.getAttribute('src'), posterComplete: p?.complete, naturalW: p?.naturalWidth,
    hidden: p?.getAttribute('data-hidden'), sectionTop: Math.round(s.getBoundingClientRect().top), bg: getComputedStyle(document.body).backgroundColor };
}));
await page.screenshot({ path: 'qa/dev-hero/dark-globe.png' });
console.log('errs', errs);
await browser.close();
