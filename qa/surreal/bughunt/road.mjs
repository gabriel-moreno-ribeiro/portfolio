// Experience road: scroll through slowly, press every control, watch errors and the egg counter.
import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const W = +(process.env.W || 1440);
const ctx = await b.newContext({ viewport: { width: W, height: 900 } });
await ctx.addInitScript(() => sessionStorage.setItem('showedToast', 'true'));
const p = await ctx.newPage();
const errs = [];
p.on('pageerror', e => errs.push('PE ' + e.message));
p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text().slice(0, 160)); });
p.on('response', r => { if (r.status() >= 400) errs.push(r.status() + ' ' + r.url()); });
await p.goto('http://localhost:5173/#work-experience', { waitUntil: 'load' });
await p.waitForTimeout(4000);
const top = await p.evaluate(() => document.getElementById('work-experience').getBoundingClientRect().top + scrollY);
const h = await p.evaluate(() => document.getElementById('work-experience').offsetHeight);
for (let y = top - 400; y < top + h; y += 120) { await p.mouse.wheel(0, 120); await p.waitForTimeout(60); }
await p.waitForTimeout(1500);
const counter = () => p.evaluate(() => [...document.querySelectorAll('#work-experience *')].map(e => e.childNodes.length === 1 && e.textContent).find(t => t && /found \d+ of \d+/.test(t)));
console.log('counter after drive', await counter());
const btns = await p.$$('#work-experience button');
console.log('buttons', btns.length);
for (const bt of btns) {
  const label = await bt.evaluate(e => e.getAttribute('aria-label') || e.textContent.trim().slice(0, 30));
  if (!(await bt.isVisible())) { console.log('  hidden', label); continue; }
  await bt.scrollIntoViewIfNeeded().catch(() => {});
  await bt.click({ timeout: 3000 }).catch(e => console.log('  click fail', label, e.message.slice(0, 80)));
  await p.waitForTimeout(500);
  console.log('  clicked', label);
}
await p.waitForTimeout(1000);
console.log('counter after clicks', await counter());
await p.screenshot({ path: `qa/surreal/bughunt/road-${W}.png` });
console.log('errs', [...new Set(errs)].filter(e => !e.includes('GL Driver')));
await b.close();
