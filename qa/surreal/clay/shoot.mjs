// Screenshots of the clay stories from the live dev server, with a real GPU.
// Run: node qa/surreal/clay/shoot.mjs [slug=candela] [theme=light] [outDir=qa/surreal/clay] [progress list, e.g. 0.3,0.5]
// Without a progress list it shoots every step at the middle of its hold.
// PAGE=harness shoots the section alone (qa/surreal/clay/harness.html) instead of the Home.
import { chromium } from 'playwright';
import path from 'node:path';

const [slug = 'candela', theme = 'light', outDir = 'qa/surreal/clay', list] = process.argv.slice(2);
const BASE = process.env.BASE || 'http://localhost:5173';
const HOLD = 0.42;
const STEPS = 5;

const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
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
await page.waitForTimeout(1500);
await page.evaluate(() => window.dispatchEvent(new WheelEvent('wheel')));

const goTo = (p) => page.evaluate(([slug, p]) => {
  const el = document.querySelector(`[data-clay="${slug}"]`);
  const top = el.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({ top: top + (el.offsetHeight - window.innerHeight) * p, behavior: 'instant' });
}, [slug, p]);

const shots = list
  ? list.split(',').map((p) => ({ p: Number(p), name: `${slug}-p${p}-${theme}` }))
  : Array.from({ length: STEPS }, (_, i) => ({ p: (i + HOLD / 2) / STEPS, name: `${slug}-step${i + 1}-${theme}` }));

await goTo(shots[0].p);
await row.locator('.clay-stage--live, .clay-stage--failed').waitFor({ timeout: 20000 }).catch(() => errors.push('stage never went live'));
for (const s of shots) {
  await goTo(s.p);
  await page.waitForTimeout(1700);
  await page.screenshot({ path: path.join(outDir, s.name + '.png') });
}
console.log(JSON.stringify({ shots: shots.map((s) => s.name), errors: [...new Set(errors)] }, null, 1));
await browser.close();
