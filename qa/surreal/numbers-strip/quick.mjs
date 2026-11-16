// Fast look at the settled strip: node qa/surreal/numbers-strip/quick.mjs [width...] (reduced motion, light unless DARK=1)
import { chromium } from 'playwright';
const OUT = new URL('./', import.meta.url).pathname;
const browser = await chromium.launch();
for (const w of process.argv.slice(2).map(Number)) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
  if (process.env.DARK) await ctx.addInitScript(() => { try { localStorage.setItem('darkMode', 'true'); } catch {} });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => m.type() === 'error' && errors.push(m.text().slice(0, 200)));
  page.on('pageerror', e => errors.push('pageerror: ' + String(e).slice(0, 200)));
  await page.goto('http://localhost:5173/', { waitUntil: 'load' });
  for (let i = 0; i < 80 && !(await page.locator('.numbers-strip').count()); i++) { await page.mouse.wheel(0, 900); await page.waitForTimeout(250); }
  await page.locator('.numbers-strip').scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  await page.addStyleTag({ content: 'nav, header, [class*="bottom-bar"], [class*="mobile-cta"], [class*="fixed"] { visibility: hidden !important; }' });
  await page.locator('.numbers-strip').screenshot({ path: `${OUT}quick-${w}${process.env.DARK ? '-dark' : ''}.png` });
  console.log(w, await page.evaluate(() => {
    const heights = [...document.querySelectorAll('.numbers-strip, .numbers-strip > li')].map(e => Math.round(e.getBoundingClientRect().height)).join(' ');
    // Smallest text on screen: SVG text scaled by its drawing, HTML text as is.
    const svgText = [...document.querySelectorAll('.numbers-strip svg text')].filter(t => t.getClientRects().length).map(t => {
      const svg = t.ownerSVGElement; return [t.textContent, +(parseFloat(getComputedStyle(t).fontSize) * svg.clientWidth / svg.viewBox.baseVal.width).toFixed(1)];
    });
    const html = [...document.querySelectorAll('.numbers-strip li *:not(svg *)')].filter(e => e.childNodes[0]?.nodeType === 3 && e.getClientRects().length).map(e => parseFloat(getComputedStyle(e).fontSize));
    return { heights, minSvgText: svgText.sort((a, b) => a[1] - b[1])[0], minHtml: Math.min(...html), overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth };
  }), errors.join(' | '));
  await ctx.close();
}
await browser.close();
