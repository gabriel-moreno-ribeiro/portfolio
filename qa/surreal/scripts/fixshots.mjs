// Before/after shots of the sections touched by the P1/P2 fixes.
// Run: node qa/surreal/scripts/fixshots.mjs before|after
import { chromium } from 'playwright';
import fs from 'node:fs';
const TAG = process.argv[2] || 'after';
const BASE = 'http://localhost:5173';
const OUT = new URL('../fixes/', import.meta.url).pathname;
const VPS = { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } };
const SECTIONS = { hero: '.spotify-card', medals: '.medals-showcase', desmos: '.desmos', globe: '.city-timeline', skills: '#skills', contact: '.contact-section' };
const report = {};
const browser = await chromium.launch();
async function open(viewport, theme, mobile, reducedMotion) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile, reducedMotion });
  await ctx.addInitScript(t => { try { localStorage.setItem('darkMode', String(t === 'dark')); } catch {} }, theme);
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => m.type() === 'error' && errors.push(m.text().slice(0, 200)));
  page.on('pageerror', e => errors.push('pageerror: ' + String(e).slice(0, 200)));
  await page.goto(BASE + '/#contact', { waitUntil: 'load' }); // a hash mounts every lazy section
  await page.waitForTimeout(5000);
  await page.keyboard.press('Shift'); // a keypress ends Home's hash re-alignment loop
  return { ctx, page, errors };
}
const show = async (page, sel) => {
  const ok = await page.evaluate(s => { const el = document.querySelector(s); if (!el) return false; el.scrollIntoView({ block: 'center', behavior: 'instant' }); return true; }, sel);
  await page.waitForTimeout(1500);
  return ok;
};
if (process.argv[3] !== 'reduced') for (const [vp, viewport] of Object.entries(VPS)) for (const theme of ['light', 'dark']) {
  const { ctx, page, errors } = await open(viewport, theme, vp === 'mobile', 'no-preference');
  const key = `${vp}-${theme}`;
  for (const [name, sel] of Object.entries(SECTIONS)) {
    if (await show(page, sel)) await page.screenshot({ path: `${OUT}${TAG}-${name}-${key}.png` });
  }
  // Animations still running with the page parked on Contact, and targets under 24px.
  await show(page, '.contact-section');
  report[key] = await page.evaluate(() => ({
    running: document.getAnimations().filter(a => a.playState === 'running').map(a => a.animationName || a.transitionProperty || 'waapi'),
    small: [...document.querySelectorAll('a,button')].map(el => ({ el, r: el.getBoundingClientRect() })).filter(({ r }) => r.width > 0 && (r.width < 24 || r.height < 24))
      .map(({ el, r }) => `${String(el.className).split(' ')[0] || el.tagName} ${Math.round(r.width)}x${Math.round(r.height)} ${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 24)}`),
  }));
  report[key].errors = [...new Set(errors)];
  await ctx.close();
}
{ // Desmos with reduced motion: the three drawings must be there.
  const { ctx, page, errors } = await open(VPS.desktop, 'light', false, 'reduce');
  await show(page, '.desmos');
  await page.screenshot({ path: `${OUT}${TAG}-desmos-reduced-desktop-light.png` });
  report.reduced = { errors: [...new Set(errors)], videos: await page.locator('.desmos__video').count() };
  // Pressing play mounts the recording and draws it.
  await page.locator('.desmos__badge').first().click();
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${OUT}${TAG}-desmos-reduced-played-desktop-light.png` });
  report.reduced.afterPlay = await page.evaluate(() => [...document.querySelectorAll('.desmos__video')].map(v => ({ t: +v.currentTime.toFixed(1), paused: v.paused, opacity: getComputedStyle(v).opacity })));
  await ctx.close();
}
await browser.close();
if (process.argv[3] !== 'reduced') fs.writeFileSync(`${OUT}${TAG}-report.json`, JSON.stringify(report, null, 1));
console.log(JSON.stringify(report, null, 1));
