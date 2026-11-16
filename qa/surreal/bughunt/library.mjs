// Library: arrows, deep link, bad id, index drawer, Escape.
import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const W = +(process.env.W || 1440);
const ctx = await b.newContext({ viewport: { width: W, height: 900 } });
const p = await ctx.newPage();
const errs = [];
p.on('pageerror', e => errs.push('PE ' + e.message));
p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text().slice(0, 160)); });
p.on('response', r => { if (r.status() >= 400) errs.push(r.status() + ' ' + r.url()); });
const info = () => p.evaluate(() => ({ url: location.pathname, title: document.title, h: document.querySelector('main h2, main h1')?.textContent, book: document.querySelector('[class*="title"]')?.textContent?.slice(0, 40), active: document.activeElement?.tagName + '.' + String(document.activeElement?.className).slice(0, 30) }));
await p.goto('http://localhost:5173/library', { waitUntil: 'load' });
await p.waitForTimeout(3000);
console.log('start', await info());
await p.keyboard.press('ArrowRight'); await p.waitForTimeout(1200);
console.log('after ArrowRight', await info());
await p.keyboard.press('ArrowRight'); await p.waitForTimeout(1200);
console.log('after ArrowRight 2', await info());
await p.goBack(); await p.waitForTimeout(1200);
console.log('after back', await info());
await p.goto('http://localhost:5173/library/does-not-exist', { waitUntil: 'load' });
await p.waitForTimeout(2500);
console.log('bad id', await info());
await p.screenshot({ path: `qa/surreal/bughunt/library-badid-${W}.png` });
// open the index ("All books")
await p.goto('http://localhost:5173/library', { waitUntil: 'load' });
await p.waitForTimeout(2500);
const all = await p.$('text=All books');
if (all) {
  await all.click(); await p.waitForTimeout(900);
  console.log('drawer open', await p.evaluate(() => ({ dialog: !!document.querySelector('[role=dialog]'), active: document.activeElement?.tagName + ' ' + (document.activeElement?.textContent || '').slice(0, 30) })));
  await p.screenshot({ path: `qa/surreal/bughunt/library-drawer-${W}.png` });
  await p.keyboard.press('Escape'); await p.waitForTimeout(700);
  console.log('after Escape', await p.evaluate(() => ({ dialog: !!document.querySelector('[role=dialog]'), active: document.activeElement?.tagName + ' ' + (document.activeElement?.textContent || '').slice(0, 30) })));
}
console.log('errs', [...new Set(errs)].filter(e => !e.includes('GL Driver')));
await b.close();
