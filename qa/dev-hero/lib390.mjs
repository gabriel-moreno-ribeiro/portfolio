import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const p = await ctx.newPage();
await p.goto('http://localhost:5173/library', { waitUntil: 'load' });
await p.waitForTimeout(7000);
await p.screenshot({ path: 'qa/dev-hero/lib-390.png', clip: { x: 0, y: 0, width: 390, height: 200 } });
await b.close();
