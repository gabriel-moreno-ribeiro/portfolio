// qa/fb2-repair/exp-dark.mjs - dark theme + 390 note after nowrap fix.
import { chromium } from 'playwright';
const BASE = process.argv[2] || 'http://localhost:5173';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ headless: true });
for (const vp of [{ w: 1280, h: 800, dark: true }, { w: 390, h: 844, m: true }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, isMobile: !!vp.m, hasTouch: !!vp.m, deviceScaleFactor: vp.m ? 2 : 1 });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'load' });
  if (vp.dark) await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await sleep(1200);
  for (let i = 0; i < 400; i++) {
    const done = await page.evaluate(() => { window.scrollBy(0, Math.round(innerHeight * 0.35)); return scrollY + innerHeight >= document.documentElement.scrollHeight - 2; });
    await sleep(100);
    if (done) break;
  }
  await sleep(2000);
  if (vp.dark) {
    await page.evaluate(() => document.getElementById('exp-estudar').scrollIntoView({ block: 'center', behavior: 'instant' }));
    await sleep(2000);
    await page.screenshot({ path: `qa/fb2-repair/exp-${vp.w}-dark-stop3.png` });
  } else {
    await page.evaluate(() => { const s = document.getElementById('work-experience'); document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, s.getBoundingClientRect().top + scrollY - 40); });
    await sleep(2000);
    await page.screenshot({ path: `qa/fb2-repair/exp-${vp.w}-note.png` });
  }
  await ctx.close();
}
await browser.close();
