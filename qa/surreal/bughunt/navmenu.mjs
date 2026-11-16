// Mobile nav pill: tap open, tap outside closes, Escape closes, link navigates.
import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
await ctx.addInitScript(() => sessionStorage.setItem('showedToast', 'true'));
const p = await ctx.newPage();
await p.goto('http://localhost:5173/', { waitUntil: 'load' });
await p.waitForTimeout(2500);
const st = () => p.evaluate(() => ({ open: document.querySelector('nav.navbar')?.classList.contains('is-open'), w: Math.round(document.querySelector('nav.navbar')?.getBoundingClientRect().width), url: location.pathname, active: document.activeElement?.tagName + '.' + String(document.activeElement?.className).slice(0, 20) }));
await p.tap('nav.navbar .heading');
await p.waitForTimeout(800);
console.log('after tap pill', await st());
await p.screenshot({ path: 'qa/surreal/bughunt/navmenu-open-390.png' });
await p.touchscreen.tap(200, 600);
await p.waitForTimeout(800);
console.log('after tap outside', await st());
await p.tap('nav.navbar .heading');
await p.waitForTimeout(800);
console.log('reopened', await st());
await p.keyboard.press('Escape');
await p.waitForTimeout(800);
console.log('after Escape', await st());
const lib = await p.$('nav.navbar a[href="/library"]');
if (!(await st()).open) { await p.tap('nav.navbar .heading'); await p.waitForTimeout(800); }
await lib.tap();
await p.waitForTimeout(1500);
console.log('after tap Library', await st());
await b.close();
