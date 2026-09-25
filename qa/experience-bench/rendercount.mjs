import { chromium } from 'playwright';
const W = Number(process.argv[2] ?? 1440), H = W < 600 ? 844 : 900;
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: W, height: H }, isMobile: W < 600, hasTouch: W < 600 });
const p = await ctx.newPage();
const cdp = await ctx.newCDPSession(p);
await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await p.waitForSelector('#work-experience .exp__stops li');
const total = await p.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < total; y += 600) { await p.evaluate((v) => scrollTo(0, v), y); await p.waitForTimeout(60); }
await p.waitForTimeout(1500);
const geo = await p.evaluate(() => { const r = document.querySelector('#work-experience').getBoundingClientRect(); return { start: Math.round(r.top + scrollY), end: Math.round(r.top + scrollY + r.height - innerHeight) }; });
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
await p.evaluate(() => { window.__expR = 0; window.__stopR = 0; });
await p.evaluate(async ({ start, end }) => {
  const nap = (ms) => new Promise((r) => setTimeout(r, ms));
  scrollTo({ top: start, behavior: 'instant' }); await nap(300);
  for (let i = 1; i <= 40; i++) { scrollTo({ top: Math.round(start + ((end - start) * i) / 40), behavior: 'instant' }); await nap(100); }
}, geo);
console.log(W, 'renders durante o scroll da seção:', JSON.stringify(await p.evaluate(() => ({ Experience: window.__expR, Stop: window.__stopR }))));
await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
await b.close();
