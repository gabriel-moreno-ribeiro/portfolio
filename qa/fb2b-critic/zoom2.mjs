import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 3 });
const p = await ctx.newPage();
await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
const total = await p.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < total; y += 500) { await p.evaluate((v) => scrollTo({ top: v, behavior: 'instant' }), y); await p.waitForTimeout(60); }
await p.waitForTimeout(800);
await p.evaluate(() => { const s = document.querySelectorAll('#work-experience .exp__stop'); const a = s[1].getBoundingClientRect(), c = s[2].getBoundingClientRect(); scrollTo({ top: (a.top + c.top) / 2 + scrollY + a.height / 2 - innerHeight / 2, behavior: 'instant' }); });
await p.waitForTimeout(1500);
const car = await p.evaluate(() => { const r = document.querySelector('.exp__car').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
await p.screenshot({ path: 'C:/portfolio-gabriel/qa/fb2b-critic/car-zoom3x.png', clip: { x: car.x - 20, y: car.y - 20, width: car.w + 40, height: car.h + 40 } });
await b.close();
