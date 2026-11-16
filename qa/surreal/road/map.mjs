// Mapeamento rolagem → estrada: por trecho, quanto o carro fica acima/abaixo do meio da tela
// e o pico de velocidade (px de estrada por px de rolagem). Usa o geometry.ts servido pelo Vite.
import { chromium } from 'playwright';
const browser = await chromium.launch();
for (const width of (process.argv[2] ?? '1440,768').split(',').map(Number)) {
  const page = await browser.newPage({ viewport: { width, height: 900 } });
  await page.goto('http://localhost:5173/#work-experience');
  await page.waitForSelector('#work-experience .exp__car');
  await page.waitForTimeout(3500);
  const out = await page.evaluate(async () => {
    const g = await import('/src/components/Home/Experience/geometry.ts');
    const s = document.querySelector('section.exp');
    const box = s.getBoundingClientRect();
    const narrow = matchMedia('(max-width: 760px)').matches;
    const reach = (narrow ? g.CARD_GAP.narrow : g.CARD_GAP.wide) + g.roadHalf(narrow);
    const stops = [], cards = [];
    [...s.querySelectorAll('.exp__stop')].forEach((li, i) => {
      const r = li.getBoundingClientRect();
      const c = li.querySelector('.exp__card').getBoundingClientRect();
      const left = !narrow && g.cardSide(i) === 'left';
      stops.push({ x: left ? c.right - box.left + reach : c.left - box.left - reach, y: r.top - box.top + r.height / 2 });
      cards.push({ left: c.left - box.left, right: c.right - box.left, top: c.top - box.top, bottom: c.bottom - box.top });
    });
    const plan = g.buildRoad(s.clientWidth, s.clientHeight, stops, cards, narrow, cards[cards.length - 1].bottom);
    const look = g.roadLookup(plan);
    const ys = stops.map((p) => p.y);
    const rows = [];
    for (let i = 0; i < ys.length - 1; i++) {
      let up = 0, down = 0, peak = 0, prev = null;
      for (let c = ys[i]; c <= ys[i + 1]; c += 1) {
        const at = g.carTargetS(c, ys, look.stopS);
        const p = look.at(at);
        up = Math.min(up, p.y - c); down = Math.max(down, p.y - c);
        if (prev !== null) peak = Math.max(peak, at - prev);
        prev = at;
      }
      rows.push(`trecho ${i + 1}→${i + 2}: estrada ${Math.round(look.stopS[i + 1] - look.stopS[i])} / rolagem ${Math.round(ys[i + 1] - ys[i])} · pico ${peak.toFixed(2)}×  · carro vs meio da tela ${Math.round(up)}..+${Math.round(down)} px`);
    }
    return { length: Math.round(look.length), bridge: plan.bridge && [plan.bridge.x, plan.bridge.y].map(Math.round), hairpin: plan.hairpin, rows };
  });
  console.log(width, JSON.stringify(out, null, 1));
  await page.close();
}
await browser.close();
