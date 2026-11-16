// check 5: Tab through Home top to bottom
import fs from 'node:fs';
import { launch, BASE, OUT, VPS } from './common.mjs';
const vn = process.argv[2] || 'desktop';
const browser = await launch();
const ctx = await browser.newContext({ viewport: VPS[vn] });
const page = await ctx.newPage();
const errs = []; page.on('pageerror', (e) => errs.push(String(e)));
await page.goto(BASE + '/', { waitUntil: 'load', timeout: 60000 });
await page.waitForTimeout(3000);
const desc = () => page.evaluate(() => {
  const e = document.activeElement; if (!e || e === document.body) return null;
  const r = e.getBoundingClientRect(); const cs = getComputedStyle(e);
  const sel = e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : '');
  const fv = e.matches(':focus-visible');
  const ol = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0;
  const bs = cs.boxShadow !== 'none';
  return { sel, text: (e.getAttribute('aria-label') || e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40), href: e.getAttribute('href'), pressed: e.getAttribute('aria-pressed'), fv, outline: ol ? `${cs.outlineWidth} ${cs.outlineStyle} ${cs.outlineColor}` : null, shadow: bs, inView: r.bottom > 0 && r.top < innerHeight && r.width > 0, y: Math.round(scrollY), rect: [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)] };
});
const stops = []; let last = null, repeat = 0;
for (let i = 0; i < (+process.env.QA_MAX || 400); i++) {
  await page.keyboard.press('Tab');
  await page.waitForTimeout(+process.env.QA_WAIT || 60);
  const d = await desc();
  if (!d) { stops.push({ i, none: true }); if (stops.filter((s) => s.none).length > 3) break; continue; }
  stops.push({ i, ...d });
  if (last && d.sel === last.sel && d.text === last.text && d.y === last.y) { repeat++; if (repeat > 3) break; } else repeat = 0;
  last = d;
  if (d.sel.includes('footer') && stops.length > 30 && /Retry|retry/.test(d.text)) {}
}
fs.writeFileSync(OUT + `keyboard-${vn}-tab.json`, JSON.stringify({ count: stops.length, stops, errs }, null, 2));
const noFocus = stops.filter((s) => s.sel && !s.none && !s.fv && !s.outline && !s.shadow);
console.log('stops', stops.length, 'noVisibleFocusIndicator', noFocus.length);
for (const s of stops) console.log(String(s.i).padStart(3), s.none ? 'BODY' : `${s.sel.slice(0, 45).padEnd(45)} "${s.text}" ${s.inView ? '' : '[OFFSCREEN]'} ${s.fv ? '' : '[!fv]'}${s.outline ? '' : ' [no outline]'}`);
await browser.close();
