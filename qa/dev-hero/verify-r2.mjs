import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--use-gl=angle','--use-angle=gl','--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const hits = [];
page.on('request', r => { const u = r.url(); if (/\/three-|react-three|drei|robot\.glb/.test(u)) hits.push(u.split('/').pop()); });
await page.goto('http://localhost:4173/', { waitUntil: 'load' });
// (a) 6s, no interaction at all
await page.waitForTimeout(6000);
console.log('(a) 6s idle, no interaction ->', hits.length, 'requests');
// (b) scroll to #work-experience with keyboard-free, mouse-free scrolling
await page.evaluate(() => { const e = document.getElementById('work-experience'); e?.scrollIntoView({ block: 'center' }); });
await page.waitForTimeout(4000);
console.log('(b) after scrolling to #work-experience ->', hits.length, 'requests  (hero visible:',
  await page.evaluate(() => { const r = document.querySelector('.hero-section').getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; }), ')');
// (c) back to top + mouse move
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(600);
await page.mouse.move(700, 450);
await page.mouse.move(720, 460);
await page.waitForTimeout(4000);
console.log('(c) back to top + pointermove ->', hits.length, 'requests', [...new Set(hits)]);
console.log('canvas mounted:', await page.evaluate(() => !!document.querySelector('.robot-canvas canvas')));
await browser.close();
