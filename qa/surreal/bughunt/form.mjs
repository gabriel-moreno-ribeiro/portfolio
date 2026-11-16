import { chromium } from 'playwright';
const b = await chromium.launch();
for (const dark of [false, true]) {
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
if (dark) await ctx.addInitScript(() => localStorage.setItem('darkMode', 'true'));
const p = await ctx.newPage();
const errs = []; p.on('pageerror', e => errs.push('PE ' + e.message)); p.on('console', m => { if (m.type()==='error') errs.push(m.text().slice(0,150)); });
await p.goto('http://localhost:5173/#contact', { waitUntil: 'load' }); await p.waitForTimeout(4000);
const f = () => p.evaluate(() => ({ active: document.activeElement?.id || document.activeElement?.tagName + '.' + document.activeElement?.className, alerts: [...document.querySelectorAll('.contact-section__error')].map(e => e.textContent) }));
await p.click('.contact-section__submit'); await p.waitForTimeout(300); console.log('empty submit', await f());
await p.screenshot({ path: `qa/surreal/bughunt/form-errors-${dark?'dark':'light'}.png`, clip: await p.$eval('#contact', e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y + scrollY, width: r.width, height: Math.min(r.height, 900) }; }), fullPage: true });
await p.fill('#contact-name', 'QA'); await p.fill('#contact-email', 'bad@'); await p.click('.contact-section__submit'); await p.waitForTimeout(200); console.log('bad email', await f());
await p.fill('#contact-email', 'qa@example.com'); await p.fill('#contact-message', 'short'); await p.click('.contact-section__submit'); await p.waitForTimeout(200); console.log('short msg', await f());
await p.fill('#contact-message', 'This is a long enough message.'); await p.click('.contact-section__submit'); await p.waitForTimeout(100);
console.log('submitting', await p.textContent('.contact-section__submit'));
await p.waitForTimeout(1200); console.log('sent', await f(), await p.textContent('.contact-section__card'));
await p.screenshot({ path: `qa/surreal/bughunt/form-sent-${dark?'dark':'light'}.png`, clip: await p.$eval('#contact', e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y + scrollY, width: r.width, height: Math.min(r.height, 900) }; }), fullPage: true });
await p.click('.contact-section__link-btn'); await p.waitForTimeout(300); console.log('reset', await f());
// error path
await p.route('**/api/contact', r => r.fulfill({ status: 500, body: '{}' }));
await p.fill('#contact-name', 'QA'); await p.fill('#contact-email', 'qa@example.com'); await p.fill('#contact-message', 'This is a long enough message.');
await p.click('.contact-section__submit'); await p.waitForTimeout(800); console.log('500', await f());
console.log('errs', errs);
await ctx.close();
}
await b.close();
