// QA fb2b-repair — odômetro no mobile não cruza card nem carro. Saída: odo.json + capturas.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const URL = 'http://localhost:5173/';
const OUT = path.dirname(fileURLToPath(import.meta.url));
const b = await chromium.launch();
const out = {};
for (const [w, h, theme] of [[390, 844, 'light'], [390, 844, 'dark'], [360, 740, 'light'], [740, 360, 'light'], [1440, 900, 'light']]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  const p = await ctx.newPage();
  await p.goto(URL, { waitUntil: 'networkidle' });
  await p.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
  // Monta as seções lazy no caminho.
  for (let y = 0; y < 30000; y += 400) { await p.evaluate((v) => scrollTo({ top: v, behavior: 'instant' }), y); await p.waitForTimeout(40); }
  const rows = [];
  for (const f of [0.1, 0.25, 0.5, 0.75, 1]) {
    await p.evaluate((fr) => { const s = document.querySelector('#work-experience'); const top = s.getBoundingClientRect().top + scrollY; scrollTo({ top: top + (s.offsetHeight - innerHeight) * fr, behavior: 'instant' }); }, f);
    await p.waitForTimeout(1500);
    const o = await p.evaluate(() => {
      const el = document.querySelector('.exp__odo');
      const y = el.querySelector('.exp__odo-year').getBoundingClientRect();
      const hit = (a, c) => a.left < c.right && a.right > c.left && a.top < c.bottom && a.bottom > c.top;
      const cards = [...document.querySelectorAll('#work-experience .exp__card')].map((c) => c.getBoundingClientRect());
      const car = document.querySelector('.exp__car')?.getBoundingClientRect();
      const nav = document.querySelector('nav')?.getBoundingClientRect();
      const visible = +getComputedStyle(el).opacity > 0.05 && y.bottom > 0 && y.top < innerHeight;
      return { year: el.textContent.trim(), visible, rect: [y.left, y.top, y.right, y.bottom].map(Math.round), overlapsCard: cards.some((c) => hit(y, c)), overlapsCar: !!car && hit(y, car), overlapsNav: !!nav && hit(y, nav), inViewportX: y.left >= 0 && y.right <= innerWidth };
    });
    const shot = path.join(OUT, `odo-${w}x${h}-${theme}-${Math.round(f * 100)}.png`);
    await p.screenshot({ path: shot });
    rows.push({ at: f, ...o, shot: path.basename(shot) });
  }
  out[`${w}x${h}-${theme}`] = rows;
  await ctx.close();
}
await b.close();
fs.writeFileSync(path.join(OUT, 'odo.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, (k, v) => (k === 'shot' ? undefined : v)));
