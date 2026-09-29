import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
for (const [w,h] of [[1440,900],[390,844]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: w<500, hasTouch: w<500 });
  const p = await ctx.newPage();
  await p.goto('http://localhost:5173/library', { waitUntil: 'load' });
  await p.waitForTimeout(5000);
  const pos = async () => p.evaluate(() => { const r = document.querySelector('.navbar').getBoundingClientRect(); return [Math.round(r.x), Math.round(r.y)]; });
  console.log(w, 'start', await pos(), 'scrollX', await p.evaluate(() => [scrollX, scrollY, document.documentElement.scrollWidth]));
  await p.mouse.move(w/2, h/2);
  for (let i = 0; i < 12; i++) { await p.mouse.wheel(0, 400); await p.waitForTimeout(120); }
  await p.waitForTimeout(1200);
  console.log(w, 'after wheel', await pos(), 'scroll', await p.evaluate(() => [Math.round(scrollX), Math.round(scrollY)]));
  // open a book (click a spine) and re-measure
  await p.mouse.click(w/2, h*0.6).catch(()=>{});
  await p.waitForTimeout(1500);
  console.log(w, 'after click', await pos(), 'panelOpen', await p.evaluate(() => !!document.querySelector('.library__panel')));
  await ctx.close();
}
await b.close();
