// Research section: one bklit chart per paper. Shots, hover, reduced motion, heights, console.
// Run: node qa/surreal/research/shoot.mjs   (dev server on :5173)
import { chromium } from 'playwright';
const BASE = 'http://localhost:5173';
const OUT = new URL('./', import.meta.url).pathname;
const report = { heights: {}, shift: {}, errors: {}, figures: {}, reduced: {} };
const browser = await chromium.launch();
async function open(width, height, theme, reducedMotion = 'no-preference') {
  const mobile = width < 500;
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: mobile ? 2 : 1, isMobile: mobile, hasTouch: mobile, reducedMotion });
  await ctx.addInitScript(t => { try { localStorage.setItem('darkMode', String(t === 'dark')); } catch {} }, theme);
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => m.type() === 'error' && errors.push(m.text().slice(0, 300)));
  page.on('pageerror', e => errors.push('pageerror: ' + String(e).slice(0, 300)));
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
    figures: [...s.querySelectorAll('.research-figure')].map(f => ({
      plot: [f.querySelector('.research-figure__plot')].map(p => `${Math.round(p.clientWidth)}x${p.clientHeight}`)[0],
      svg: !!f.querySelector('.research-figure__plot svg'),
      // smallest text in the figure, chart labels included
      minFont: Math.min(...[...f.querySelectorAll('strong,span,b,li,figcaption,button,text')].filter(e => e.textContent.trim() && !e.closest('.sr-only')).map(e => parseFloat(getComputedStyle(e).fontSize))),
      wider: f.scrollWidth - f.clientWidth,
    })),
  };
});
const settle = async (page, ms) => {
  for (const fig of await page.locator('.research-figure').all()) { await fig.scrollIntoViewIfNeeded(); await page.waitForTimeout(ms); }
};

for (const [w, h] of [[1440, 900], [390, 844]]) for (const theme of ['light', 'dark']) {
  const { ctx, page, errors } = await open(w, h, theme);
  const before = (await measure(page)).height;
  await settle(page, 2200);
  for (const [i, card] of (await page.locator('.research-card').all()).entries()) {
    await card.scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await card.screenshot({ path: `${OUT}card${i + 1}-${w}-${theme}.png` });
  }
  await page.locator('#research').screenshot({ path: `${OUT}research-${w}-${theme}.png` });
  const m = await measure(page);
  report.figures[`${w}-${theme}`] = m.figures;
  report.shift[`${w}-${theme}`] = m.height - before; // 0: the boxes were reserved
  report.errors[`${w}-${theme}`] = [...new Set(errors)];
  if (m.overflowX > 0) report.errors[`${w}-${theme}-overflowX`] = m.overflowX;

  // Hover (desktop) or touch (phone) on each plot, then the 100× ratio.
  for (const [i, fig] of (await page.locator('.research-figure').all()).entries()) {
    const plot = fig.locator('.research-figure__plot');
    await plot.scrollIntoViewIfNeeded();
    const box = await plot.boundingBox();
    const [x, y] = [box.x + box.width * (i === 2 ? 0.86 : 0.62), box.y + box.height * 0.45];
    // On the phone the tooltip lives while the finger is down: press, drag a little, hold.
    const cdp = w < 500 ? await ctx.newCDPSession(page) : null;
    const touch = (type, tx) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x: tx, y }] });
    if (cdp) { await touch('touchStart', x - 12); await touch('touchMove', x - 6); await touch('touchMove', x); }
    else { await page.mouse.move(x - 30, y); await page.mouse.move(x, y, { steps: 6 }); }
    await page.waitForTimeout(700);
    if (cdp) {
      const tip = fig.locator('.research-tip');
      const b = (await tip.count()) ? await tip.boundingBox() : null;
      report.figures[`${w}-${theme}-tip${i + 1}`] = b ? `left ${Math.round(b.x)} right ${Math.round(b.x + b.width)} of ${w}` : 'none';
    }
    await page.locator('.research-card').nth(i).screenshot({ path: `${OUT}card${i + 1}-${w}-${theme}-hover.png` });
    if (cdp) await touch('touchEnd'); else await page.mouse.move(5, 5);
  }
  if (theme === 'light') {
    const toggle = page.locator('.research-figure__toggle button', { hasText: '100' });
    await toggle.click();
    await page.waitForTimeout(1800);
    await page.locator('.research-card').nth(1).screenshot({ path: `${OUT}card2-${w}-${theme}-100x.png` });
    report.figures[`${w}-stat-100x`] = await page.locator('.research-figure__stat').nth(1).innerText();
  }
  await ctx.close();
}

// Reduced motion: 150ms after the chart mounts it must already be whole (compare with 2s later).
{
  const { ctx, page, errors } = await open(1440, 900, 'light', 'reduce');
  for (const [i, fig] of (await page.locator('.research-figure').all()).entries()) {
    await fig.scrollIntoViewIfNeeded();
    await fig.locator('.research-figure__plot svg').first().waitFor();
    await page.waitForTimeout(150);
    const early = await fig.screenshot({ path: `${OUT}card${i + 1}-1440-light-reduced.png` });
    await page.waitForTimeout(2000);
    const late = await fig.screenshot();
    report.reduced[`figure${i + 1}-same-at-150ms`] = early.equals(late);
  }
  report.errors['1440-reduced'] = [...new Set(errors)];
  await ctx.close();
}

for (const [w, h] of [[1440, 900], [768, 1024], [390, 844]]) {
  const { ctx, page, errors } = await open(w, h, 'light');
  await settle(page, 1600);
  const m = await measure(page);
  report.heights[w] = m.height;
  report.errors[`${w}-heights`] = [...new Set(errors)];
  if (m.overflowX > 0) report.errors[`${w}-overflowX`] = m.overflowX;
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(report, null, 1));
