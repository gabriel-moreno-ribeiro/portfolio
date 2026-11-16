// Research figure toggles and the medal grouping toggle.
import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(() => sessionStorage.setItem('showedToast', 'true'));
const p = await ctx.newPage();
const errs = [];
p.on('pageerror', e => errs.push('PE ' + e.message));
p.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 160)); });
await p.goto('http://localhost:5173/#research', { waitUntil: 'load' });
await p.waitForTimeout(9000);
const stat = () => p.evaluate(() => ({ stat: document.querySelector('.research-figure__stat')?.textContent?.slice(0, 60), pressed: [...document.querySelectorAll('#research button[aria-pressed]')].map(b => b.textContent + '=' + b.getAttribute('aria-pressed')).join(' ') }));
console.log('initial', await stat());
for (const t of ['10× faster', '100× faster', '2× faster']) {
  await p.click(`#research button:has-text("${t}")`);
  await p.waitForTimeout(700);
  console.log(t, await stat());
}
await p.evaluate(() => document.querySelector('.gold-frame')?.scrollIntoView({ block: 'center' }));
await p.waitForTimeout(1500);
const groups = () => p.evaluate(() => [...document.querySelectorAll('h4, [class*="group"] > span, [class*="Group"]')].map(e => e.textContent.trim()).filter(t => t && t.length < 20).slice(0, 12).join(','));
console.log('by subject', await groups());
await p.click('button:has-text("Year")');
await p.waitForTimeout(1200);
console.log('by year', await groups());
console.log('errs', errs);
await b.close();
