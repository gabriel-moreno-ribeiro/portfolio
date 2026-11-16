// check 5b: new controls work with Enter/Space; medal tooltip + Escape; D-20 rail; heatmap retry; trap test
import fs from 'node:fs';
import { launch, BASE, OUT, VPS, slowScroll } from './common.mjs';
const vn = process.argv[2] || 'desktop';
const browser = await launch();
const ctx = await browser.newContext({ viewport: VPS[vn] });
const page = await ctx.newPage();
const res = {};
await page.goto(BASE + '/', { waitUntil: 'load', timeout: 60000 });
await page.waitForTimeout(3000);
await slowScroll(page, 300, 120);
await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
await page.waitForTimeout(800);
const press = async (loc, key) => { await loc.scrollIntoViewIfNeeded(); await loc.focus(); await page.keyboard.press(key); await page.waitForTimeout(700); };
async function t(name, fn) { try { res[name] = await fn(); } catch (e) { res[name] = { error: String(e).slice(0, 250) }; } console.log(name, JSON.stringify(res[name])); }

await t('hero-see-work-Enter', async () => { const b = page.getByRole('button', { name: /See Work/ }).first(); const y0 = await page.evaluate(() => scrollY); await press(b, 'Enter'); await page.waitForTimeout(1200); return { scrolled: (await page.evaluate(() => scrollY)) - y0 }; });
await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
await t('hero-links', async () => page.evaluate(() => [...document.querySelectorAll('.hero-link')].map((a) => ({ t: a.textContent.trim(), href: a.getAttribute('href'), target: a.target }))));
await t('graph-buttons', async () => {
  const seg = page.locator('.gow__seg-btn'); const n = await seg.count(); const out = [];
  for (const key of ['Enter', 'Space']) for (let i = 0; i < n; i++) { await press(seg.nth(i), key); out.push({ key, i, current: await seg.nth(i).getAttribute('aria-current'), label: (await seg.nth(i).textContent()).trim() }); }
  return out;
});
await t('graph-pinned-keyboard-scroll', async () => page.evaluate(() => ({ cls: document.querySelector('#graph')?.className })));
await t('cool-things-toggle', async () => {
  const group = page.locator('.work-view').first(); await group.scrollIntoViewIfNeeded();
  const btns = group.locator('button'); const out = [];
  for (const key of ['Enter', 'Space']) { await press(btns.nth(1), key); const p1 = await btns.nth(1).getAttribute('aria-pressed'); await press(btns.nth(0), key); const p0 = await btns.nth(0).getAttribute('aria-pressed'); out.push({ key, photosPressed: p1, howPressed: p0 }); }
  return out;
});
await t('medal-group-by', async () => {
  const g = page.locator('.medal-sort button'); const n = await g.count(); const out = [];
  for (const key of ['Enter', 'Space']) for (let i = 0; i < n; i++) { await press(g.nth(i), key); await page.waitForTimeout(900); out.push({ key, i, pressed: await g.nth(i).getAttribute('aria-pressed'), label: (await g.nth(i).textContent()).trim() }); }
  return out;
});
await t('medal-tooltip-escape', async () => {
  const m = page.locator('.medal-group button').first(); await m.scrollIntoViewIfNeeded(); await m.focus(); await page.waitForTimeout(500);
  const shown = await page.locator('#medal-tip').count(); const dby = await m.getAttribute('aria-describedby');
  await page.keyboard.press('Escape'); await page.waitForTimeout(400);
  const after = await page.locator('#medal-tip').count();
  const stillFocus = await page.evaluate(() => document.activeElement?.className);
  // Enter opens viewer, Escape closes
  await page.keyboard.press('Enter'); await page.waitForTimeout(1500);
  const dlg = await page.locator('[role=dialog]').count();
  await page.keyboard.press('Escape'); await page.waitForTimeout(800);
  const dlgAfter = await page.locator('[role=dialog]').count();
  const back = await page.evaluate(() => document.activeElement?.getAttribute('aria-label')?.slice(0, 40));
  return { tipOnFocus: shown, describedby: dby, tipAfterEsc: after, stillFocus, viewerOpen: dlg, viewerAfterEsc: dlgAfter, focusReturnedTo: back };
});
await t('globe-road-links', async () => page.evaluate(() => [...document.querySelectorAll('.city-panel__road')].map((a) => ({ href: a.getAttribute('href'), t: a.textContent.trim().slice(0, 50) }))));
await t('globe-city-controls', async () => page.evaluate(() => [...document.querySelectorAll('#globe button, .globe button, [class*=city] button')].map((b) => (b.getAttribute('aria-label') || b.textContent).trim().slice(0, 30)).slice(0, 20)));
await t('rail-d20', async () => {
  const items = page.locator('.section-rail__item'); const n = await items.count();
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' })); await page.waitForTimeout(500);
  await press(items.nth(n - 1), 'Enter'); await page.waitForTimeout(1500);
  const y = await page.evaluate(() => scrollY); const cur = await page.evaluate(() => document.querySelector('.section-rail__item[aria-current]')?.textContent.trim());
  const truck = await page.evaluate(() => { const e = document.querySelector('.section-rail__truck'); const r = e.getBoundingClientRect(); return { rect: [Math.round(r.left), Math.round(r.top)], hidden: e.getAttribute('aria-hidden') }; });
  return { items: n, y, current: cur, truck };
});
await t('footer-heatmap', async () => {
  const f = page.locator('.footer__activity-head').first(); await f.scrollIntoViewIfNeeded().catch(() => {});
  await page.waitForTimeout(2500);
  const retry = page.locator('.footer__activity-retry');
  const has = await retry.count();
  if (!has) return { retry: 0, head: (await f.textContent().catch(() => null))?.trim() };
  const before = await page.evaluate(() => document.querySelector('.footer__activity-head')?.textContent.trim());
  await retry.focus(); const outline = await retry.evaluate((e) => getComputedStyle(e).outlineStyle + ' ' + getComputedStyle(e).outlineWidth);
  await page.keyboard.press('Enter'); await page.waitForTimeout(2000);
  return { retry: has, before, outlineOnFocus: outline, after: await page.evaluate(() => document.querySelector('.footer__activity-head')?.textContent.trim()) };
});
await page.screenshot({ path: OUT + `keyboard-${vn}-end.png` });
fs.writeFileSync(OUT + `keyboard-${vn}-interact.json`, JSON.stringify(res, null, 2));
await browser.close();
