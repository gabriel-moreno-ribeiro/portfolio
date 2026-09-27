// Ruler keyboard + Home/End snap + crossfade checks
import { chromium } from 'playwright';
const b = await chromium.launch();
for (const reduced of [false, true]) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: reduced ? 'reduce' : 'no-preference' });
  const p = await ctx.newPage();
  await p.goto('http://localhost:5173/library', { waitUntil: 'load' });
  await p.waitForSelector('.library--ready', { timeout: 60000 });
  await p.waitForTimeout(3000);
  const counter = () => p.evaluate(() => document.querySelector('.library__caption-body:last-child .library__index span')?.textContent);
  const r = {};
  // Home/End: the card jumps without walking 28 books
  await p.locator('.library__hint').click({ force: true }).catch(() => {});
  await p.keyboard.press('End');
  await p.waitForTimeout(250);
  r.afterEnd250ms = await counter();
  await p.waitForTimeout(1500);
  r.bodiesAfterSettle = await p.locator('.library__caption-body').count();
  await p.keyboard.press('Home');
  await p.waitForTimeout(250);
  r.afterHome250ms = await counter();
  // Tab stops inside the ruler
  r.rulerTabStops = await p.evaluate(() => [...document.querySelectorAll('.library__ages [tabindex="0"]')].map((e) => e.textContent));
  await p.locator('.library__age.is-active').focus();
  await p.keyboard.press('ArrowRight');
  await p.keyboard.press('ArrowRight');
  r.focusedAfter2Right = await p.evaluate(() => document.activeElement?.getAttribute('aria-label'));
  r.tipVisible = await p.evaluate(() => getComputedStyle(document.activeElement.querySelector('.library__age-tip')).opacity);
  r.counterBeforeEnter = await counter();
  await p.keyboard.press('Enter');
  await p.waitForTimeout(3500);
  r.counterAfterEnter = await counter();
  r.readAfterEnter = await p.evaluate(() => document.querySelector('.library__caption-body:last-child .library__read')?.textContent);
  // Crossfade: two bodies mid-switch (motion), one with reduced motion
  await p.locator('.library__arrow--right').click();
  await p.waitForTimeout(60);
  r.bodiesMidSwitch = await p.locator('.library__caption-body').count();
  await p.waitForTimeout(1500);
  r.bodiesEnd = await p.locator('.library__caption-body').count();
  r.dashes = await p.evaluate(() => /[–—]/.test(document.querySelector('main').innerText));
  console.log(reduced ? 'reduced' : 'motion', JSON.stringify(r));
  await ctx.close();
}
await b.close();
