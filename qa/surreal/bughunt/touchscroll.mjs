// Touch: a vertical swipe starting on each interactive block must still scroll the page.
import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const W = +(process.env.W || 390);
const ctx = await b.newContext({ viewport: { width: W, height: 844 }, hasTouch: true, isMobile: true });
await ctx.addInitScript(() => sessionStorage.setItem('showedToast', 'true'));
const p = await ctx.newPage();
await p.goto('http://localhost:5173/#contact', { waitUntil: 'load' });
await p.waitForTimeout(5000);
const cdp = await ctx.newCDPSession(p);
const targets = ['.moments__row', '.globe-wrap, .globe-canvas, .globe-poster', '#background .photo-stage__viewport', '#wardrobe', '.gold-frame', '.clay-stage', '#work .photo-stage__viewport', '.ns-case', '.ns-map', '.desmos__frame', '.research-figure__plot, .research-figure', '#skills', '.exp__road, #work-experience svg, #work-experience', '.contact-section__card'];
for (const sel of targets) {
  const el = await p.$(sel);
  if (!el) { console.log('missing', sel); continue; }
  await el.scrollIntoViewIfNeeded();
  await p.evaluate(() => window.scrollBy(0, -200));
  await p.waitForTimeout(700);
  const bb = await el.boundingBox();
  if (!bb) { console.log('no box', sel); continue; }
  const x = Math.round(bb.x + bb.width / 2), y = Math.round(Math.min(Math.max(bb.y + Math.min(bb.height / 2, 200), 150), 700));
  const y0 = await p.evaluate(() => scrollY);
  await cdp.send('Input.synthesizeScrollGesture', { x, y, yDistance: -300, gestureSourceType: 'touch', speed: 800 });
  await p.waitForTimeout(600);
  const y1 = await p.evaluate(() => scrollY);
  const x0 = await p.evaluate(() => scrollX);
  console.log((y1 - y0 > 150 ? 'ok  ' : 'TRAP') + ' ' + sel + ' dy=' + (y1 - y0) + ' scrollX=' + x0);
}
await b.close();
