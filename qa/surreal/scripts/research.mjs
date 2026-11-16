// Research section: one bklit chart per paper. Shots (reduced motion), heights, label alignment, console.
// Run: node qa/surreal/scripts/research.mjs   (dev server on :5173)
import { chromium } from 'playwright';
const BASE = 'http://localhost:5173';
const OUT = new URL('../research/', import.meta.url).pathname;
const report = { heights: {}, errors: {}, align: {} };
const browser = await chromium.launch();
async function open(width, height, theme, reducedMotion) {
  const mobile = width < 500;
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile, reducedMotion });
  await ctx.addInitScript(t => { try { localStorage.setItem('darkMode', String(t === 'dark')); } catch {} }, theme);
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => m.type() === 'error' && errors.push(m.text().slice(0, 200)));
  page.on('pageerror', e => errors.push('pageerror: ' + String(e).slice(0, 200)));
  await page.goto(BASE + '/#research', { waitUntil: 'load' });
  await page.waitForTimeout(5000);
  await page.keyboard.press('Shift'); // a keypress ends Home's hash re-alignment loop
  return { ctx, page, errors };
}
const measure = page => page.evaluate(() => {
  const s = document.querySelector('#research');
  return {
    height: Math.round(s.getBoundingClientRect().height),
    overflowX: document.documentElement.scrollWidth - innerWidth,
    figures: [...s.querySelectorAll('.research-figure')].map(f => {
      const bars = [...f.querySelectorAll('.research-figure__plot svg rect')].map(r => r.getBoundingClientRect()).filter(r => r.width > 2 && r.width < 80);
      const lis = [...f.querySelectorAll('li')].map(l => l.getBoundingClientRect());
      return {
        bars: bars.length,
        // px between each bar centre and its label centre
        offset: lis.map((l, i) => bars[i] ? +((bars[i].x + bars[i].width / 2) - (l.x + l.width / 2)).toFixed(1) : null),
        barH: bars.map(b => +b.height.toFixed(1)),
        minFont: Math.min(...[...f.querySelectorAll('strong,span,figcaption')].map(e => parseFloat(getComputedStyle(e).fontSize))),
        clipped: [...f.querySelectorAll('li span, li strong')].filter(e => e.scrollWidth > e.parentElement.clientWidth + 1).map(e => e.textContent),
      };
    }),
  };
});
for (const [w, h] of [[1440, 900], [390, 844]]) for (const theme of ['light', 'dark']) {
  const { ctx, page, errors } = await open(w, h, theme, 'reduce');
  for (const [i, card] of (await page.locator('.research-card').all()).entries()) {
    await card.locator('.research-figure').scrollIntoViewIfNeeded(); // mounts the lazy chart
    await page.waitForTimeout(900);
    await card.screenshot({ path: `${OUT}card${i + 1}-${w}-${theme}.png` });
  }
  await page.locator('#research').screenshot({ path: `${OUT}research-${w}-${theme}.png` });
  const m = await measure(page);
  report.align[`${w}-${theme}`] = m.figures;
  report.errors[`${w}-${theme}-reduced`] = [...new Set(errors)];
  if (m.overflowX > 0) report.errors[`${w}-${theme}-overflowX`] = m.overflowX;
  await ctx.close();
}
for (const [w, h] of [[1440, 900], [768, 1024], [390, 844]]) { // heights, with motion on
  const { ctx, page, errors } = await open(w, h, 'light', 'no-preference');
  for (const card of await page.locator('.research-card').all()) { await card.scrollIntoViewIfNeeded(); await page.waitForTimeout(1600); }
  const m = await measure(page);
  report.heights[w] = m.height;
  report.errors[`${w}-motion`] = [...new Set(errors)];
  report.align[`${w}-motion`] = m.figures.map(f => f.bars);
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(report, null, 1));
