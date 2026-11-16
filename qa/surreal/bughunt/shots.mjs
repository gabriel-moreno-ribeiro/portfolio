// Viewport screenshots stepping down the page (sticky/fixed things show as a visitor sees them).
import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const W = +(process.env.W || 1440), H = +(process.env.H || 900), dark = process.env.DARK === '1', R = process.env.R || '/';
const tag = process.env.TAG || `${R.replace(/\W/g, '_')}-${W}-${dark ? 'dark' : 'light'}`;
const ctx = await b.newContext({ viewport: { width: W, height: H }, reducedMotion: process.env.RM ? 'reduce' : 'no-preference', hasTouch: !!process.env.TOUCH, isMobile: !!process.env.TOUCH, deviceScaleFactor: 1 });
if (dark) await ctx.addInitScript(() => localStorage.setItem('darkMode', 'true'));
await ctx.addInitScript(() => sessionStorage.setItem('showedToast', 'true'));
const p = await ctx.newPage();
await p.goto('http://localhost:5173' + R, { waitUntil: 'load' }); await p.waitForTimeout(2500);
// mount everything first
let h = await p.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < h + 2000; y += 700) { await p.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), y); await p.waitForTimeout(200); h = await p.evaluate(() => document.documentElement.scrollHeight); }
await p.evaluate(() => scrollTo({ top: 0, behavior: 'instant' })); await p.waitForTimeout(1000);
h = await p.evaluate(() => document.documentElement.scrollHeight);
const step = Math.round(H * 0.9); let i = 0;
for (let y = 0; y < h && i < +(process.env.MAX || 99); y += step, i++) {
  await p.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), y); await p.waitForTimeout(+(process.env.WAIT || 900));
  await p.screenshot({ path: `qa/surreal/bughunt/shots/${tag}-${String(i).padStart(2, '0')}.png` });
}
console.log(tag, 'height', h, 'shots', i);
await b.close();
