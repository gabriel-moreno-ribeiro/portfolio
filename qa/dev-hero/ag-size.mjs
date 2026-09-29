import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--use-gl=angle','--use-angle=gl','--ignore-gpu-blocklist'] });
for (const vp of [{ width: 1440, height: 900 }, { width: 390, height: 844, isMobile: true, hasTouch: true }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: !!vp.isMobile, hasTouch: !!vp.hasTouch });
  const page = await ctx.newPage();
  await page.goto('http://localhost:4173/', { waitUntil: 'load' });
  await page.evaluate(() => document.getElementById('background')?.scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(3000);
  console.log(vp.width, await page.evaluate(() => {
    const g = document.querySelector('.accordion-gallery'); if (!g) return 'no gallery';
    const gb = g.getBoundingClientRect();
    const host = g.parentElement.getBoundingClientRect();
    const w = [...g.querySelectorAll('.ag-panel')].map(p => Math.round(p.getBoundingClientRect().width));
    return { panels: w, min: Math.min(...w), galleryW: Math.round(gb.width), hostW: Math.round(host.width),
      overflowX: g.scrollWidth > Math.ceil(gb.width) + 1, docOverflow: document.documentElement.scrollWidth > innerWidth };
  }));
  await ctx.close();
}
await browser.close();
