// O carro passando POR BAIXO do viaduto do trevo e entrando no túnel: procura a rolagem em que
// ele está no ponto e fotografa (1440-light-clover-under.png, 1440-light-tunnel-mouth.png).
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:5173/#work-experience');
await page.waitForSelector('#work-experience .exp__car');
await page.waitForTimeout(4000);
await page.evaluate(() => window.dispatchEvent(new Event('wheel')));
const info = await page.evaluate(() => {
  const s = document.querySelector('section.exp');
  const t = s.getBoundingClientRect().top + scrollY;
  const ys = [...s.querySelectorAll('.exp__stop')].map((li) => { const r = li.getBoundingClientRect(); return r.top + scrollY - t + r.height / 2; });
  const covers = [...s.querySelectorAll('.exp__cover')].map((c) => ({ x: parseFloat(c.style.left) + c.width.baseVal.value / 2, y: parseFloat(c.style.top) + c.height.baseVal.value / 2, w: c.width.baseVal.value }));
  return { t, ys, covers };
});
const car = () => page.evaluate(() => { const c = document.querySelector('.exp__car'); const m = /translate3d\(([-\d.]+)px, ([-\d.]+)px/.exec(c.style.transform); return [+m[1] + c.offsetWidth / 2, +m[2] + c.offsetHeight / 2]; });
// [nome, trecho, índice da cobertura, deslocamento em x do alvo a partir do centro dela, u inicial]
for (const [name, seg, k, dx, from] of [['tunnel-mouth', 4, 0, -info.covers[0].w / 2 + 20, 0.1], ['clover-under', 5, 1, 0, 0.45]]) {
  const target = { x: info.covers[k].x + dx, y: info.covers[k].y };
  let best = [Infinity, 0];
  for (let u = from; u < 0.95; u += 0.01) {
    await page.evaluate((v) => scrollTo({ top: v, behavior: 'instant' }), info.t + info.ys[seg] + (info.ys[seg + 1] - info.ys[seg]) * u - 450);
    await page.waitForTimeout(700);
    const [x, y] = await car();
    const d = Math.hypot(x - target.x, name === 'clover-under' ? y - target.y : 0);
    if (d < best[0]) best = [d, u];
    else if (best[0] < 30) break;
  }
  await page.evaluate((v) => scrollTo({ top: v, behavior: 'instant' }), info.t + info.ys[seg] + (info.ys[seg + 1] - info.ys[seg]) * best[1] - 450);
  await page.waitForTimeout(1200);
  const over = await page.evaluate((i) => document.querySelectorAll('.exp__cover')[i].classList.contains('is-over'), k);
  await page.screenshot({ path: path.join(HERE, `1440-light-${name}.png`) });
  console.log(name, 'u', best[1].toFixed(2), 'dist', best[0].toFixed(0), 'cover is-over:', over);
}
await browser.close();
