import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
const errs = [];
p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 140)); });
p.on('pageerror', e => errs.push('pageerror: ' + String(e).slice(0, 140)));
await p.goto('http://localhost:5173', { waitUntil: 'networkidle' });
await p.waitForTimeout(1500);
await p.locator('#numbers').scrollIntoViewIfNeeded();
await p.waitForTimeout(1200);
const first = await p.locator('.card-text').textContent();
await p.waitForTimeout(5600);
const second = await p.locator('.card-text').textContent();
const info = await p.evaluate(() => {
  const el = document.querySelector('#numbers');
  const t = document.querySelector('.card-text');
  return { cls: el?.className, live: t?.getAttribute('aria-live'), card: !!document.querySelector('.card-container .card-content .icon-img'),
    tags: [...document.querySelectorAll('.featured-card')].map(c => ({ t: c.querySelector('h2')?.textContent, n: c.querySelectorAll('.featured-tags span').length, live: !!c.querySelector('.project-live') })) };
});
await p.screenshot({ path: 'C:/portfolio-gabriel/qa/dev-showcase/numbers-restored-1440.png' });
// off-screen gate
await p.evaluate(() => window.scrollTo(0, 0));
await p.waitForTimeout(400);
const a = await p.locator('.card-text').textContent();
await p.waitForTimeout(6000);
const c = await p.locator('.card-text').textContent();
console.log(JSON.stringify({ rotates: first !== second, first: first.trim().slice(0,40), second: second.trim().slice(0,40), gatedOffscreen: a === c, info, errs }, null, 1));
await b.close();
