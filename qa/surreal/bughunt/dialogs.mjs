// Every dialog: opens by keyboard, traps Tab, Escape closes, focus returns to the opener.
import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const W = +(process.env.W || 1440);
const ctx = await b.newContext({ viewport: { width: W, height: 900 } });
await ctx.addInitScript(() => sessionStorage.setItem('showedToast', 'true'));
const p = await ctx.newPage();
const errs = [];
p.on('pageerror', e => errs.push('PE ' + e.message));
p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 160)); });
const act = () => p.evaluate(() => {
  const e = document.activeElement;
  return (e?.tagName + '.' + String(e?.className).split(' ')[0] + ' ' + (e?.getAttribute('aria-label') || e?.textContent || '').trim().slice(0, 30));
});
const openDialogs = () => p.evaluate(() => [...document.querySelectorAll('[role=dialog],[aria-modal=true],dialog[open]')].filter(d => {
  const cs = getComputedStyle(d); const r = d.getBoundingClientRect();
  return cs.visibility !== 'hidden' && cs.display !== 'none' && r.width > 0 && parseFloat(cs.opacity) > 0.1;
}).map(d => (d.getAttribute('aria-label') || d.className.toString()).slice(0, 40)));

async function check(name, url, opener) {
  if (process.env.ONLY && !process.env.ONLY.split(',').includes(name)) return;
  if (!(await p.$(opener).catch(() => null)) && false) return;
  await p.goto('http://localhost:5173' + url, { waitUntil: 'load' });
  await p.waitForTimeout(3500);
  const el = await p.$(opener);
  if (!el || !(await el.isVisible())) { console.log(name, 'opener missing/hidden', opener); return; }
  await el.scrollIntoViewIfNeeded();
  await p.waitForTimeout(500);
  await el.focus();
  const who = await act();
  await p.keyboard.press('Enter');
  await p.waitForTimeout(900);
  const opened = await openDialogs();
  const inside = await act();
  const tabs = [];
  for (let i = 0; i < 12; i++) { await p.keyboard.press('Tab'); await p.waitForTimeout(60); tabs.push(await p.evaluate(() => !!document.activeElement?.closest('[role=dialog],[aria-modal=true],dialog'))); }
  await p.screenshot({ path: `qa/surreal/bughunt/dialog-${name}-${W}.png` });
  await p.keyboard.press('Escape');
  await p.waitForTimeout(900);
  const after = await openDialogs();
  const back = await act();
  console.log(JSON.stringify({ name, opener: who, opened, focusInside: inside, tabStaysInside: tabs.every(Boolean) ? 'yes' : tabs.map(t => t ? 1 : 0).join(''), afterEscape: after, focusBack: back }));
}
await check('medal', '/#work', 'button[aria-label$="Open large"]');
await check('portrait', '/#work', '.gold-frame');
await check('wardrobe', '/#wardrobe', '#wardrobe button');
await check('project-photo', '/work/candela', 'main button[aria-label*="arge"], main figure button, main .project__gallery button');
await check('terminal', '/', '.terminal-fab');
await check('handsfree', '/', '.handsfree-button');
if (W < 1100) await check('navmenu', '/', 'nav button, .navbar button');
console.log('errs', [...new Set(errs)]);
await b.close();
