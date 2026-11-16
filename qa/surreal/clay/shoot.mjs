// Screenshots of the clay stories from the live dev server, with a real GPU.
// Run: node qa/surreal/clay/shoot.mjs [slug=candela] [theme=light] [outDir=qa/surreal/clay] [mids]
// Without `mids` it shoots every step once it has settled. `mids` is a list of travels caught
// part-way, e.g. "0>1@0.5,2>3@0.4" (from>to@fraction of the travel).
// PAGE=harness shoots the section alone (qa/surreal/clay/harness.html) instead of the Home.
import { chromium } from 'playwright';
import path from 'node:path';

const [slug = 'candela', theme = 'light', outDir = 'qa/surreal/clay', mids] = process.argv.slice(2);
const BASE = process.env.BASE || 'http://localhost:5173';
const STEPS = 5;
const TRAVEL_MS = 1400;
const [W, H] = (process.env.SIZE || '1440x900').split('x').map(Number);

const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
await ctx.addInitScript((t) => { try { localStorage.setItem('darkMode', String(t === 'dark')); } catch {} }, theme);
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 300)));
page.on('pageerror', (e) => errors.push('pageerror: ' + String(e).slice(0, 300)));
const harness = process.env.PAGE === 'harness';
await page.goto(BASE + (harness ? `/qa/surreal/clay/harness.html${theme === 'dark' ? '?dark' : ''}` : '/#work'), { waitUntil: 'load' });
const row = page.locator(`[data-clay="${slug}"]`);
await row.waitFor({ timeout: 20000 });
// The home keeps re-aligning to the hash target until the visitor scrolls: tell it we did.
await page.waitForTimeout(harness ? 300 : 1500);
await page.evaluate(() => window.dispatchEvent(new WheelEvent('wheel')));
await row.evaluate((el) => el.scrollIntoView({ block: 'center', behavior: 'instant' }));
await row.locator('.clay-stage--live, .clay-stage--failed').waitFor({ timeout: 20000 }).catch(() => errors.push('stage never went live'));

const seg = (i) => row.locator('.clay-ctl__segs button').nth(i);
const shoot = (name) => page.screenshot({ path: path.join(outDir, name + '.png') });
const shots = [];
if (mids) {
  for (const m of mids.split(',')) {
    const [, from, to, frac] = m.match(/(\d)>(\d)@([\d.]+)/);
    await seg(Number(from)).click();
    await page.waitForTimeout(TRAVEL_MS + 900);
    await seg(Number(to)).click();
    await page.waitForTimeout(TRAVEL_MS * Number(frac));
    shots.push(`${slug}-travel-${from}to${to}-${frac}-${theme}`);
    await shoot(shots.at(-1));
  }
} else {
  for (let i = 0; i < STEPS; i++) {
    await seg(i).click();
    await page.waitForTimeout(TRAVEL_MS + 1300);
    shots.push(`${slug}-step${i + 1}-${theme}`);
    await shoot(shots.at(-1));
  }
}
console.log(JSON.stringify({ shots, errors: [...new Set(errors)] }, null, 1));
await browser.close();
