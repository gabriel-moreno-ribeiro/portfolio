import { chromium } from 'playwright';
const b = await chromium.launch();
const out = [];
for (const w of [1440, 390]) {
  const p = await b.newPage({ viewport: { width: w, height: 900 } });
  const errs = [];
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await p.evaluate(() => document.querySelector('#work-experience')?.scrollIntoView());
  for (let i=0;i<8;i++){ await p.mouse.wheel(0,400); await p.waitForTimeout(300);} await p.evaluate(() => document.querySelector('#work-experience')?.scrollIntoView()); await p.waitForTimeout(2500);
  const roles = await p.$$eval('.exp__card-role', els => els.map(e => e.textContent));
  await p.evaluate(() => { const c = [...document.querySelectorAll('.exp__card-role')].find(e => e.textContent === 'Builder'); c?.scrollIntoView({ block: 'center' }); });
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `qa/fb2-repair/content-experience-${w}.png` });
  out.push({ w, schemaErrors: errs.filter(e => e.includes('schema')), errors: errs, roles });
}
console.log(JSON.stringify(out, null, 1));
await b.close();
