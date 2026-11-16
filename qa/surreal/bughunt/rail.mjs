// Hero "See Work" and every rail item land on their section (top under the navbar).
import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const W = +(process.env.W || 1440);
const ctx = await b.newContext({ viewport: { width: W, height: 900 } });
await ctx.addInitScript(() => sessionStorage.setItem('showedToast', 'true'));
const p = await ctx.newPage();
await p.goto('http://localhost:5173/', { waitUntil: 'load' });
await p.waitForTimeout(2500);
const where = id => p.evaluate(id => Math.round(document.getElementById(id).getBoundingClientRect().top), id);
await p.click('button.btn:has-text("See Work")');
await p.waitForTimeout(3500);
console.log('See Work -> #work top =', await where('work'));
const items = await p.$$('.section-rail__item');
const ids = ['main-content', 'background', 'wardrobe', 'work', 'research', 'skills', 'work-experience', 'contact'];
for (let i = items.length - 1; i >= 0; i--) {
  if (!(await items[i].isVisible())) { console.log('rail hidden'); break; }
  await items[i].click();
  await p.waitForTimeout(3000);
  const label = await items[i].textContent();
  console.log('rail', label.trim().padEnd(12), '->', ids[i], 'top =', await where(ids[i]), 'active =', await p.evaluate(() => document.querySelector('.section-rail__item[aria-current]')?.textContent?.trim()));
}
await b.close();
