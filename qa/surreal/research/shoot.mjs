// Research section: one bklit chart per paper. Shots, hover, reveal, reduced motion, heights, console.
// Run: node qa/surreal/research/shoot.mjs   (dev server on :5173)
import { chromium } from 'playwright';
const BASE = 'http://localhost:5173';
const OUT = new URL('./', import.meta.url).pathname;
const KINDS = ['kinetics', 'candela', 'rct']; // the order on the page
const report = { order: null, heights: {}, shift: {}, errors: {}, figures: {}, rct: {}, reduced: {} };
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
    order: [...s.querySelectorAll('.research-card__title')].map(t => t.textContent.slice(0, 22)),
    figures: [...s.querySelectorAll('.research-figure')].map(f => ({
      plot: [f.querySelector('.research-figure__plot')].map(p => `${Math.round(p.clientWidth)}x${p.clientHeight}`)[0],
      svg: !!f.querySelector('.research-figure__plot svg'),
      // smallest text in the figure, chart labels included
      minFont: Math.min(...[...f.querySelectorAll('strong,span,b,li,figcaption,button,text')].filter(e => e.textContent.trim() && !e.closest('.sr-only') && e.offsetParent !== null).map(e => parseFloat(getComputedStyle(e).fontSize))),
      wider: f.scrollWidth - f.clientWidth,
    })),
  };
});
const fig = (page, kind) => page.locator(`.research-figure--${kind}`);
const card = (page, kind) => page.locator('.research-card', { has: fig(page, kind) });
const centre = (page, kind) => fig(page, kind).evaluate(e => e.scrollIntoView({ block: 'center' }));
const settle = async (page, ms) => { for (const k of KINDS) { await centre(page, k); await page.waitForTimeout(ms); } };
const legend = page => fig(page, 'rct').locator('.research-figure__legend').innerText().then(t => t.replace(/\s+/g, ' '));

for (const [w, h] of [[1440, 900], [390, 844]]) for (const theme of ['light', 'dark']) {
  const { ctx, page, errors } = await open(w, h, theme);
  const before = await measure(page);
  report.order = before.order;
  await settle(page, 2200);
  for (const [i, k] of KINDS.entries()) {
    await card(page, k).scrollIntoViewIfNeeded();
    await page.waitForTimeout(300);
    await card(page, k).screenshot({ path: `${OUT}card${i + 1}-${w}-${theme}.png` });
  }
  await page.locator('#research').screenshot({ path: `${OUT}research-${w}-${theme}.png` });
  const m = await measure(page);
  report.figures[`${w}-${theme}`] = m.figures;
  report.shift[`${w}-${theme}`] = m.height - before.height; // 0: the boxes were reserved
  report.errors[`${w}-${theme}`] = [...new Set(errors)];
  if (m.overflowX > 0) report.errors[`${w}-${theme}-overflowX`] = m.overflowX;

  // Hover (desktop) or a held finger (phone) on each plot.
  for (const [i, k] of KINDS.entries()) {
    await fig(page, k).locator('.research-figure__plot').scrollIntoViewIfNeeded();
    const box = await fig(page, k).locator('.research-figure__plot').boundingBox();
    const [x, y] = [box.x + box.width * (k === 'candela' ? 0.86 : 0.5), box.y + box.height * 0.45];
    const cdp = w < 500 ? await ctx.newCDPSession(page) : null;
    const touch = (type, tx) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x: tx, y }] });
    if (cdp) { await touch('touchStart', x - 12); await touch('touchMove', x - 6); await touch('touchMove', x); }
    else { await page.mouse.move(x - 30, y); await page.mouse.move(x, y, { steps: 6 }); }
    await page.waitForTimeout(700);
    if (k === 'rct') report.rct[`${w}-${theme}-held`] = await legend(page);
    await card(page, k).screenshot({ path: `${OUT}card${i + 1}-${w}-${theme}-hover.png` });
    if (cdp) await touch('touchEnd'); else await page.mouse.move(5, 5);
  }
  if (theme === 'light') {
    await centre(page, 'kinetics');
    await page.locator('.research-figure__toggle button', { hasText: '100' }).click();
    await page.waitForTimeout(1800);
    await card(page, 'kinetics').screenshot({ path: `${OUT}card1-${w}-${theme}-100x.png` });
    report.figures[`${w}-stat-100x`] = await fig(page, 'kinetics').locator('.research-figure__stat').innerText();
  }
  await ctx.close();
}

// The economics chart under a real pointer, at 1440 and 1920: every month, then in and out quickly.
for (const [w, theme] of [[1440, 'light'], [1440, 'dark'], [1920, 'light'], [1920, 'dark']]) {
  const { ctx, page, errors } = await open(w, 1000, theme);
  await centre(page, 'rct');
  await page.waitForTimeout(2400);
  const rest = await legend(page);
  const b = await fig(page, 'rct').locator('.research-figure__plot').boundingBox();
  const y = b.y + b.height * 0.5;
  await page.mouse.move(b.x + 2, y);
  for (const [name, f] of [['baseline', 0.07], ['aug', 0.3], ['sep', 0.55], ['oct', 0.8]]) {
    await page.mouse.move(b.x + b.width * f, y, { steps: 10 });
    await page.waitForTimeout(500);
    await fig(page, 'rct').screenshot({ path: `${OUT}rct-${w}-${theme}-hover-${name}.png` });
    report.rct[`${w}-${theme}-${name}`] = await legend(page);
  }
  for (let i = 0; i < 8; i++) { await page.mouse.move(b.x + b.width * (0.1 + 0.09 * i), y, { steps: 2 }); await page.mouse.move(b.x + b.width / 2, b.y - 80, { steps: 2 }); }
  await page.waitForTimeout(1200);
  await fig(page, 'rct').screenshot({ path: `${OUT}rct-${w}-${theme}-after-leave.png` });
  // back at rest: October in the legend, no crosshair or hover dots left in the plot
  report.rct[`${w}-${theme}-back-to-rest`] = (await legend(page)) === rest && (await fig(page, 'rct').locator('.research-figure__plot svg').count()) === 1;
  report.errors[`${w}-${theme}-rct`] = [...new Set(errors)];
  await ctx.close();
}

// First reveal of the economics chart: scrolled to from above, frame by frame; then a resize.
{
  const { ctx, page, errors } = await open(1440, 900, 'light');
  await centre(page, 'kinetics'); await page.waitForTimeout(500);
  report.rct['mounted-before-arriving'] = await fig(page, 'rct').locator('svg').count() > 0;
  await centre(page, 'rct');
  const t0 = Date.now();
  for (const t of [150, 450, 800, 1200, 2200]) {
    await page.waitForTimeout(Math.max(0, t - (Date.now() - t0)));
    await fig(page, 'rct').screenshot({ path: `${OUT}rct-1440-reveal-${t}.png` });
  }
  await page.setViewportSize({ width: 1100, height: 900 }); await page.waitForTimeout(900);
  await centre(page, 'rct'); await page.waitForTimeout(600);
  await fig(page, 'rct').screenshot({ path: `${OUT}rct-resized-1100.png` });
  report.errors['reveal'] = [...new Set(errors)];
  await ctx.close();
}

// Reduced motion: 150ms after the chart mounts it must already be whole (compare with 2s later).
{
  const { ctx, page, errors } = await open(1440, 900, 'light', 'reduce');
  for (const [i, k] of KINDS.entries()) {
    await centre(page, k);
    await fig(page, k).locator('.research-figure__plot svg').first().waitFor();
    await page.waitForTimeout(150);
    const early = await fig(page, k).screenshot({ path: `${OUT}card${i + 1}-1440-light-reduced.png` });
    await page.waitForTimeout(2000);
    report.reduced[`${k}-same-at-150ms`] = early.equals(await fig(page, k).screenshot());
  }
  report.errors['1440-reduced'] = [...new Set(errors)];
  await ctx.close();
}

// Heights, and the economics chart at every width.
for (const [w, h] of [[1920, 1080], [1680, 1050], [1440, 900], [1280, 800], [1024, 768], [768, 1024], [390, 844]]) {
  const { ctx, page, errors } = await open(w, h, 'light');
  await settle(page, 1600);
  const m = await measure(page);
  report.heights[w] = m.height;
  await fig(page, 'rct').screenshot({ path: `${OUT}rct-${w}-light.png` });
  report.errors[`${w}-heights`] = [...new Set(errors)];
  if (m.overflowX > 0) report.errors[`${w}-overflowX`] = m.overflowX;
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(report, null, 1));
