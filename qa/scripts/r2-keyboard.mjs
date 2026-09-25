/**
 * qa/scripts/r2-keyboard.mjs - characterises the tab order now that sections below
 * the fold mount lazily. capture.mjs already reported "sections reached"; this asks
 * the sharper question: can a keyboard-only user who never scrolls with a mouse
 * reach the contact form, and if not, does a second pass fix it?
 *
 * Usage: node qa/scripts/r2-keyboard.mjs <outDir> [baseUrl]
 * Writes r2-keyboard.json.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve(process.argv[2] || 'qa/r2');
const BASE = process.argv[3] || 'http://localhost:5173';
fs.mkdirSync(OUT, { recursive: true });

const DESC = `(() => {
  const el = document.activeElement;
  if (!el || el === document.body) return { body: true, scrollY: Math.round(window.scrollY) };
  const sec = el.closest('section,[id],footer,nav,main');
  const r = el.getBoundingClientRect();
  return {
    body: false,
    tag: el.tagName.toLowerCase(),
    id: el.id || null,
    cls: String(el.className || '').split(' ').filter(Boolean).slice(0, 2).join('.') || null,
    text: (el.textContent || el.getAttribute('aria-label') || '').replace(/\\s+/g, ' ').trim().slice(0, 30),
    owner: sec ? (sec.id ? '#' + sec.id : sec.tagName.toLowerCase() + (sec.className ? '.' + String(sec.className).split(' ')[0] : '')) : null,
    scrollY: Math.round(window.scrollY),
    onScreen: r.top < window.innerHeight && r.bottom > 0 && r.width > 1,
    outlineWidth: getComputedStyle(el).outlineWidth,
  };
})()`;

const MOUNTS = `(() => ['background','work','research','skills','work-experience','contact'].map((id) => {
  const el = document.getElementById(id);
  if (!el) return id + ':missing';
  return id + ':' + ((el.textContent || '').replace(/\\s+/g, '').length > 40 ? 'mounted' : 'reserved');
}))()`;

const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto(BASE + '/', { waitUntil: 'load', timeout: 60000 });
try { await page.waitForLoadState('networkidle', { timeout: 20000 }); } catch { /* ignore */ }
await page.waitForTimeout(1800);

const out = { generatedAt: new Date().toISOString(), baseUrl: BASE, viewport: '1440x900' };
out.mountsAtStart = await page.evaluate(MOUNTS);

await page.evaluate(() => { window.scrollTo({ top: 0, behavior: 'instant' }); document.body.focus(); });
const pass = [];
let loopedAt = null;
for (let i = 1; i <= 140; i++) {
  await page.keyboard.press('Tab');
  await page.waitForTimeout(70);
  const d = await page.evaluate(DESC);
  pass.push(Object.assign({ tab: i }, d));
  if (d.body && i > 3) { loopedAt = i; break; }
}
out.pass1 = { tabs: pass.length, loopedBackAtTab: loopedAt, owners: [...new Set(pass.map((p) => p.owner).filter(Boolean))] };
out.pass1.reachedContactField = pass.some((p) => ['contact-name', 'contact-email', 'contact-message'].includes(p.id));
out.pass1.reachedExperienceStop = pass.some((p) => p.owner === '#work-experience' || (p.owner || '').startsWith('#exp-'));
out.pass1.offScreenFocus = pass.filter((p) => p.onScreen === false).map((p) => ({ tab: p.tab, owner: p.owner, id: p.id, cls: p.cls, scrollY: p.scrollY }));
out.pass1.maxScrollYReached = Math.max(...pass.map((p) => p.scrollY || 0));
out.pass1.order = pass.map((p) => (p.body ? 'BODY' : (p.owner || '?') + ' ' + p.tag + (p.id ? '#' + p.id : p.cls ? '.' + p.cls : '') + ' "' + p.text + '"'));
out.mountsAfterPass1 = await page.evaluate(MOUNTS);

// second pass, from wherever focus now is: does the freshly mounted middle become reachable?
const pass2 = [];
for (let i = 1; i <= 140; i++) {
  await page.keyboard.press('Tab');
  await page.waitForTimeout(60);
  const d = await page.evaluate(DESC);
  pass2.push(Object.assign({ tab: i }, d));
  if (d.body && i > 3) break;
}
out.pass2 = {
  tabs: pass2.length,
  owners: [...new Set(pass2.map((p) => p.owner).filter(Boolean))],
  reachedContactField: pass2.some((p) => ['contact-name', 'contact-email', 'contact-message'].includes(p.id)),
  reachedExperienceStop: pass2.some((p) => p.owner === '#work-experience' || (p.owner || '').startsWith('#exp-')),
};

// and the control: after a real scroll to the bottom and back, pass 3 from the top
await page.evaluate(async () => {
  const nap = (t) => new Promise((r) => setTimeout(r, t));
  const maxY = () => document.documentElement.scrollHeight - window.innerHeight;
  let y = 0;
  while (y < maxY()) { y = Math.min(y + 400, maxY()); window.scrollTo({ top: y, behavior: 'instant' }); await nap(90); }
  await nap(800);
  window.scrollTo({ top: 0, behavior: 'instant' });
});
await page.waitForTimeout(1200);
await page.evaluate(() => { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); document.body.focus(); });
const pass3 = [];
for (let i = 1; i <= 160; i++) {
  await page.keyboard.press('Tab');
  await page.waitForTimeout(55);
  const d = await page.evaluate(DESC);
  pass3.push(Object.assign({ tab: i }, d));
  if (d.body && i > 3) break;
}
out.pass3AfterFullScroll = {
  tabs: pass3.length,
  owners: [...new Set(pass3.map((p) => p.owner).filter(Boolean))],
  reachedContactField: pass3.some((p) => ['contact-name', 'contact-email', 'contact-message'].includes(p.id)),
  reachedExperienceStop: pass3.some((p) => p.owner === '#work-experience' || (p.owner || '').startsWith('#exp-')),
  noOutline: pass3.filter((p) => p.outlineWidth === '0px').map((p) => (p.owner || '?') + ' ' + p.tag + (p.id ? '#' + p.id : p.cls ? '.' + p.cls : '')).slice(0, 20),
};
out.mountsAfterFullScroll = await page.evaluate(MOUNTS);

fs.writeFileSync(path.join(OUT, 'r2-keyboard.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify({
  mountsAtStart: out.mountsAtStart,
  pass1: { tabs: out.pass1.tabs, owners: out.pass1.owners, contact: out.pass1.reachedContactField, exp: out.pass1.reachedExperienceStop, offScreen: out.pass1.offScreenFocus.length },
  pass2: out.pass2,
  pass3: { tabs: out.pass3AfterFullScroll.tabs, contact: out.pass3AfterFullScroll.reachedContactField, exp: out.pass3AfterFullScroll.reachedExperienceStop, owners: out.pass3AfterFullScroll.owners.length, noOutline: out.pass3AfterFullScroll.noOutline.length },
}, null, 1));
await browser.close();
