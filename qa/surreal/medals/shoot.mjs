import { chromium } from 'playwright';
const BASE = 'http://localhost:5173';
const OUT = new URL('./', import.meta.url).pathname;
const VPS = { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } };
const browser = await chromium.launch();
const R = {};
async function open(viewport, theme, mobile, reducedMotion) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1, isMobile: mobile, hasTouch: mobile, reducedMotion });
  await ctx.addInitScript(t => { try { localStorage.setItem('darkMode', String(t === 'dark')); } catch {} }, theme);
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => m.type() === 'error' && errors.push(m.text().slice(0, 200)));
  page.on('pageerror', e => errors.push('pageerror: ' + String(e).slice(0, 200)));
  await page.goto(BASE + '/#contact', { waitUntil: 'load' });
  await page.waitForTimeout(5000);
  await page.waitForSelector('.medal-stage', { state: 'attached', timeout: 30000 });
  await page.keyboard.press('Shift');
  await page.evaluate(() => document.querySelector('.medal-stage').scrollIntoView({ block: 'center', behavior: 'instant' }));
  await page.waitForTimeout(1500);
  return { ctx, page, errors };
}
const geo = page => page.evaluate(() => ({
  stage: Math.round(document.querySelector('.medal-stage').getBoundingClientRect().height),
  card: Math.round(document.querySelector('.medals-showcase').getBoundingClientRect().height),
  doc: document.documentElement.scrollHeight, hscroll: document.documentElement.scrollWidth > innerWidth,
  n: document.querySelectorAll('.medal-wall:not(.medal-wall--ghost) li').length,
  groups: [...document.querySelectorAll('.medal-wall:not(.medal-wall--ghost) h4')].map(h => h.textContent + ':' + h.parentElement.querySelectorAll('li').length).join(' | '),
  live: document.querySelector('.medals-showcase [aria-live]').textContent,
}));
for (const [vp, viewport] of Object.entries(VPS)) for (const theme of ['light', 'dark']) {
  const { ctx, page, errors } = await open(viewport, theme, vp === 'mobile', 'reduce');
  const k = `${vp}-${theme}`; R[k] = {};
  for (const mode of ['Subject', 'Year', 'Colour']) {
    if (mode !== 'Subject') await page.locator('.medal-sort button', { hasText: mode }).click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${OUT}${mode.toLowerCase()}-${k}-reduced.png` });
    R[k][mode] = await geo(page);
  }
  R[k].errors = [...new Set(errors)];
  await ctx.close();
}
{ // Motion on, desktop: glide, tooltip by hover / keyboard / Escape.
  const { ctx, page, errors } = await open(VPS.desktop, 'light', false, 'no-preference');
  const pos = () => page.evaluate(() => { const r = document.querySelector('.medal-wall:not(.medal-wall--ghost) img[src$="/10.webp"]').getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top)]; });
  const g = { before: await pos() };
  await page.locator('.medal-sort button', { hasText: 'Year' }).click();
  await page.waitForTimeout(250); g.mid = await pos();
  g.animating = await page.evaluate(() => [...document.querySelectorAll('.medal-wall:not(.medal-wall--ghost) li')].filter(l => l.style.transform && l.style.transform !== 'none').length);
  await page.screenshot({ path: `${OUT}glide-mid-desktop-light.png` });
  await page.waitForTimeout(1600); g.after = await pos();
  g.pressed = await page.locator('.medal-sort button[aria-pressed="true"]').textContent();
  g.geo = await geo(page);
  const b = page.locator('.medal-wall:not(.medal-wall--ghost) button').nth(3);
  await b.hover(); await page.waitForTimeout(300);
  g.hoverTip = await page.locator('.medal-tip').innerText().catch(() => null);
  await page.screenshot({ path: `${OUT}tooltip-hover-desktop-light.png` });
  await page.mouse.move(5, 5);
  await page.locator('.medal-sort button', { hasText: 'Colour' }).focus();
  await page.keyboard.press('Tab'); await page.waitForTimeout(200);
  g.focusTip = await page.locator('.medal-tip').innerText().catch(() => null);
  g.describedby = await page.evaluate(() => document.activeElement.getAttribute('aria-describedby'));
  await page.keyboard.press('Escape'); await page.waitForTimeout(100);
  g.afterEsc = await page.locator('.medal-tip').count();
  await page.keyboard.press('Enter'); await page.waitForTimeout(800);
  g.viewerOnEnter = await page.locator('[role="dialog"]').count();
  g.errors = [...new Set(errors)]; R.motion = g;
  await ctx.close();
}
{ // Touch: first tap names, second opens.
  const { ctx, page, errors } = await open(VPS.mobile, 'dark', true, 'no-preference');
  const b = page.locator('.medal-wall:not(.medal-wall--ghost) button').last();
  await b.tap(); await page.waitForTimeout(300);
  const t = { tip: await page.locator('.medal-tip').innerText().catch(() => null), viewer1: await page.locator('[role="dialog"]').count() };
  t.tipBox = await page.evaluate(() => { const r = document.querySelector('.medal-tip').getBoundingClientRect(); return [Math.round(r.left), Math.round(r.right), innerWidth]; });
  await page.screenshot({ path: `${OUT}tooltip-tap-mobile-dark.png` });
  await b.tap(); await page.waitForTimeout(800);
  t.viewer2 = await page.locator('[role="dialog"]').count();
  t.errors = [...new Set(errors)]; R.touch = t;
  await ctx.close();
}
await browser.close();
console.log(JSON.stringify(R, null, 1));
