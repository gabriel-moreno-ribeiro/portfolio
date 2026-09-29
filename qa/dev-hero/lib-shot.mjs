import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=gl','--ignore-gpu-blocklist'] });
for (const [w,h,tag] of [[1440,900,'1440'],[390,844,'390']]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: w<500, hasTouch: w<500 });
  const p = await ctx.newPage();
  await p.goto('http://localhost:5173/library', { waitUntil: 'load' });
  await p.waitForTimeout(6000);
  await p.screenshot({ path: `qa/dev-hero/lib-${tag}.png`, clip: { x: 0, y: 0, width: w, height: Math.min(h, 320) } });
  console.log(tag, await p.evaluate(() => {
    const n = document.querySelector('.navbar');
    const nav = document.querySelector('.library__nav');
    const cs = getComputedStyle(n);
    return { navbarBg: cs.backgroundColor, color: getComputedStyle(n.querySelector('.heading')).color,
      libNav: nav ? getComputedStyle(nav).cssText.slice(0,0) || { pos: getComputedStyle(nav).position, z: getComputedStyle(nav).zIndex, bg: getComputedStyle(nav).backgroundColor, h: Math.round(nav.getBoundingClientRect().height) } : null,
      pageBg: getComputedStyle(document.body).backgroundColor, theme: document.documentElement.dataset.theme,
      siblings: [...(nav?.children||[])].map(c => c.tagName + '.' + (c.className||'').toString().slice(0,24)) };
  }));
  await ctx.close();
}
await b.close();
