import { chromium } from 'playwright';
const out = 'qa/libnews-critic';
const b = await chromium.launch();
for (const dark of [false, true]) for (const [w, h] of [[1440, 900], [390, 844]]) {
  const t = `${w}-${dark ? 'dark' : 'light'}`;
  const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: w < 500, hasTouch: w < 500 });
  await ctx.addInitScript((d) => localStorage.setItem('darkMode', JSON.stringify(d)), dark);
  const p = await ctx.newPage();
  await p.goto('http://localhost:5173/news', { waitUntil: 'load' });
  await p.waitForTimeout(2500);
  const H = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += h/2) { await p.evaluate((yy) => window.scrollTo(0, yy), y); await p.waitForTimeout(200); }
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(1000);
  await p.screenshot({ path: `${out}/news-${t}-top.png` });
  await p.screenshot({ path: `${out}/news-${t}-full.png`, fullPage: true });
  for (let i = 1; i * h < H; i++) { await p.evaluate((yy) => window.scrollTo(0, yy), i*h); await p.waitForTimeout(700); await p.screenshot({ path: `${out}/news-${t}-s${i}.png` }); }
  await ctx.close();
}
await b.close();
