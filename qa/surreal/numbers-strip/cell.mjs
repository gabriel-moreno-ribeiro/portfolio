// Crops of one fact, settled: node qa/surreal/numbers-strip/cell.mjs <prefix> [selector]
// Writes <prefix>-<width>-<theme>.png for 1440 and 390, light and dark.
import { chromium } from 'playwright';
const [prefix, sel = '.numbers-strip__cell--medals'] = process.argv.slice(2);
const OUT = new URL('./', import.meta.url).pathname;
const browser = await chromium.launch();
for (const w of [1440, 390]) for (const theme of ['light', 'dark']) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
  await ctx.addInitScript(t => { try { localStorage.setItem('darkMode', String(t === 'dark')); } catch {} }, theme);
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => m.type() === 'error' && errors.push(m.text().slice(0, 200)));
  await page.goto('http://localhost:5173/', { waitUntil: 'load' });
  for (let i = 0; i < 80 && !(await page.locator(sel).count()); i++) { await page.mouse.wheel(0, 900); await page.waitForTimeout(250); }
  await page.locator(sel).scrollIntoViewIfNeeded();
  await page.waitForTimeout(900);
  await page.addStyleTag({ content: 'nav, header, [class*="bottom-bar"], [class*="mobile-cta"], [class*="fixed"], [class*="progress"] { visibility: hidden !important; }' });
  await page.locator(sel).screenshot({ path: `${OUT}${prefix}-${w}-${theme}.png` });
  console.log(prefix, w, theme, Math.round((await page.locator(sel).boundingBox()).height), errors.join(' | '));
  await ctx.close();
}
await browser.close();
