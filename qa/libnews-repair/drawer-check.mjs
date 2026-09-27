// Drawer opens with no row half under a sticky age heading, and the current row in view.
import { chromium } from 'playwright';
import fs from 'node:fs';
const b = await chromium.launch({ args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=swiftshader'] });
const out = {};
for (const [w, h] of [[1440, 900], [390, 844]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.goto('http://localhost:5173/library', { waitUntil: 'load' });
  await p.waitForSelector('.library--ready', { timeout: 60000 });
  await p.waitForTimeout(1500);
  out[w] = [];
  // Ruler clicks snap, so the current book is settled before the drawer opens
  for (const age of [0, 4, 7, 10]) {
    await p.evaluate((i) => document.querySelectorAll('.library__ages button.library__age')[i].click(), age);
    await p.waitForTimeout(1500);
    await p.click(w < 760 ? '.library__index-toggle--float' : '.library__crumb .library__index-toggle');
    await p.waitForTimeout(900);
    out[w].push(await p.evaluate(() => {
      const list = document.querySelector('.library__list');
      const lr = list.getBoundingClientRect();
      const heads = [...list.querySelectorAll('.library__group-head')].map((e) => e.getBoundingClientRect()).filter((r) => r.bottom > lr.top + 1 && r.top < lr.top + 2);
      const headBottom = heads.length ? Math.max(...heads.map((r) => r.bottom)) : lr.top;
      const rows = [...list.querySelectorAll('.library__row')].map((e) => e.getBoundingClientRect());
      const halfHidden = rows.filter((r) => r.top < headBottom - 1 && r.bottom > headBottom + 1).length;
      const cur = list.querySelector('[aria-current="true"]').getBoundingClientRect();
      return { active: document.querySelector('.library__caption-body:last-child .library__title')?.textContent, halfHidden, currentVisible: cur.top >= headBottom - 1 && cur.bottom <= lr.bottom + 1 };
    }));
    await p.keyboard.press('Escape');
    await p.waitForTimeout(700);
  }
  await p.close();
}
console.log(JSON.stringify(out));
fs.writeFileSync('C:/portfolio-gabriel/qa/libnews-repair/drawer-check.json', JSON.stringify(out, null, 2));
await b.close();
