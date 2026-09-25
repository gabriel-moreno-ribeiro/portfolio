import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--use-gl=angle','--use-angle=gl','--ignore-gpu-blocklist'] });

// 1) mobile: no 1920 stills at all
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const reqs = [];
  page.on('request', r => reqs.push(r.url()));
  await page.goto('http://localhost:4173/', { waitUntil: 'load' });
  await page.waitForTimeout(8000);
  const slides = reqs.filter(u => u.includes('hero-slideshow'));
  const three = reqs.filter(u => /three|react-three|drei/.test(u));
  console.log('390: slideshow requests', slides.length, '| three requests', three.length);
  await ctx.close();
}

// 2) desktop: robot chunk must not load before load+quiet; loads on interaction
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const three = [];
  page.on('request', r => { if (/three|react-three|drei|robot\.glb/.test(r.url())) three.push(r.url().split('/').pop()); });
  await page.goto('http://localhost:4173/', { waitUntil: 'load' });
  await page.waitForTimeout(1200);
  console.log('1.2s after load, 3D requests:', three.length);
  await page.mouse.move(600, 500);
  await page.waitForTimeout(3000);
  console.log('after pointermove, 3D requests:', three.length, three.slice(0, 4));
  const st = await page.evaluate(() => {
    const i = document.querySelector('.sticker-image'); const r = i.getBoundingClientRect();
    const m = document.querySelector('.menu-icon'); const mr = m.getBoundingClientRect();
    return { stickerAttrs: [i.getAttribute('width'), i.getAttribute('height')], stickerBox: [Math.round(r.width), Math.round(r.height)],
      menu: [Math.round(mr.width), Math.round(mr.height)], navW: Math.round(document.querySelector('.navbar').getBoundingClientRect().width),
      menuName: m.getAttribute('aria-label') };
  });
  console.log('sticker/menu:', JSON.stringify(st));
  await page.evaluate(() => document.getElementById('background')?.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(2500);
  const ag = await page.evaluate(() => [...document.querySelectorAll('.ag-panel')].map(p => `${p.tagName}:${p.getAttribute('aria-label')}`));
  console.log('ag panels:', ag.length, ag[0], ag[1]);
  const p = page.locator('.ag-panel').nth(1);
  await p.focus();
  await page.waitForTimeout(500);
  console.log('focus ring:', await p.evaluate(e => getComputedStyle(e).outlineWidth + ' ' + getComputedStyle(e).outlineColor), 'active:', await p.getAttribute('aria-current'));
  await ctx.close();
}
await browser.close();
