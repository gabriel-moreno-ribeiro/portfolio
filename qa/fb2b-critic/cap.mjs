import { chromium } from 'playwright';
const URL = 'http://localhost:5173/';
const OUT = 'C:/portfolio-gabriel/qa/fb2b-critic';
const b = await chromium.launch();
async function open(w, h, dark) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  await ctx.addInitScript((d) => { try { localStorage.setItem('darkMode', JSON.stringify(d)); } catch {} }, dark);
  const p = await ctx.newPage();
  await p.goto(URL, { waitUntil: 'networkidle' });
  const total = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < total; y += 500) { await p.evaluate((v) => scrollTo({ top: v, behavior: 'instant' }), y); await p.waitForTimeout(60); }
  await p.waitForSelector('#work-experience .exp__car', { state: 'attached', timeout: 30000 });
  await p.waitForTimeout(800);
  return { p, ctx };
}
const jump = (p, y) => p.evaluate((v) => scrollTo({ top: v, behavior: 'instant' }), y);
const centerStop = (p, i, f = 0.5) => p.evaluate(([i, f]) => {
  const c = document.querySelectorAll('#work-experience .exp__stop')[i].getBoundingClientRect();
  scrollTo({ top: c.top + scrollY + c.height / 2 - innerHeight * f, behavior: 'instant' });
}, [i, f]);
const info = {};
for (const dark of [false, true]) {
  const t = dark ? 'dark' : 'light';
  const { p, ctx } = await open(1440, 900, dark);
  const n = await p.evaluate(() => document.querySelectorAll('#work-experience .exp__stop').length);
  info.stops = n;
  // odometer + road at several stops
  for (const i of [0, 1, 2]) {
    await centerStop(p, i); await p.waitForTimeout(1400);
    await p.screenshot({ path: `${OUT}/exp-${t}-stop${i}.png` });
  }
  // between stops 1 and 2 (car moving) - road ahead
  await p.evaluate(() => {
    const s = document.querySelectorAll('#work-experience .exp__stop');
    const a = s[1].getBoundingClientRect(), c = s[2].getBoundingClientRect();
    scrollTo({ top: (a.top + c.top) / 2 + scrollY + a.height / 2 - innerHeight / 2, behavior: 'instant' });
  });
  await p.waitForTimeout(1400);
  await p.screenshot({ path: `${OUT}/road-${t}-between.png` });
  info['odo-' + t] = await p.evaluate(() => { const o = document.querySelector('.exp__odo'); const r = o.getBoundingClientRect(); return { text: o.innerText, html: o.innerHTML.slice(0, 300), r: [r.x, r.y, r.width, r.height].map(Math.round), op: getComputedStyle(o).opacity }; });
  const car = await p.evaluate(() => { const r = document.querySelector('.exp__car').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  info['car-' + t] = car;
  await p.screenshot({ path: `${OUT}/road-${t}-zoom.png`, clip: { x: Math.max(0, car.x - 250), y: Math.max(0, car.y - 50), width: 500 + car.w, height: Math.min(850 - car.y + 50, 850) } });
  if (!dark) {
    // odometer zoom
    const o = await p.evaluate(() => { const r = document.querySelector('.exp__odo').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
    await p.screenshot({ path: `${OUT}/odo-zoom.png`, clip: { x: Math.max(0, o.x - 60), y: Math.max(0, o.y - 40), width: o.w + 120, height: o.h + 80 } });
    // caption at stop 0
    await centerStop(p, 0); await p.waitForTimeout(1500);
    const c = await p.evaluate(() => { const e = document.querySelector('.exp__d20'); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, text: e.innerText }; });
    info.caption1440 = c;
    if (c) await p.screenshot({ path: `${OUT}/caption-1440.png`, clip: { x: Math.max(0, c.x - 200), y: Math.max(0, c.y - 200), width: Math.min(1440, c.w + 400), height: c.h + 400 } });
    // contact start
    const to = await p.evaluate(() => document.querySelector('#contact').getBoundingClientRect().top + scrollY);
    for (const off of [100, 450]) { await jump(p, to - off); await p.waitForTimeout(1500); await p.screenshot({ path: `${OUT}/contact-${off}.png` }); }
    // section titles
    info.titles = [];
    for (const sel of ['#background', '#work', '#numbers', '#research', '#work-experience']) {
      await p.evaluate((s) => { const h = document.querySelector(s + ' h2'); const r = h.getBoundingClientRect(); scrollTo({ top: r.top + scrollY - 200, behavior: 'instant' }); }, sel);
      await p.waitForTimeout(1500);
      const m = await p.evaluate((s) => { const h = document.querySelector(s + ' h2'); const r = h.getBoundingClientRect(); const cs = getComputedStyle(h); const em = h.querySelector('em'); const ecs = em && getComputedStyle(em);
        return { sel: s, text: h.innerText, left: Math.round(r.left), width: Math.round(r.width), center: Math.round(r.left + r.width / 2), textAlign: cs.textAlign, font: cs.fontFamily.slice(0, 40), size: cs.fontSize, weight: cs.fontWeight, lh: cs.lineHeight, ls: cs.letterSpacing, tt: cs.textTransform, color: cs.color, emFont: ecs && ecs.fontFamily.slice(0, 40), emStyle: ecs && ecs.fontStyle, emColor: ecs && ecs.color, mb: cs.marginBottom }; }, sel);
      info.titles.push(m);
      const name = sel.slice(1);
      await p.screenshot({ path: `${OUT}/title-${name}.png`, clip: { x: 0, y: 60, width: 1440, height: 420 } });
    }
  }
  await ctx.close();
}
// mobile caption
{
  const { p, ctx } = await open(390, 844, false);
  await centerStop(p, 0); await p.waitForTimeout(1500);
  await p.screenshot({ path: `${OUT}/caption-390.png` });
  info.caption390 = await p.evaluate(() => { const e = document.querySelector('.exp__d20'); if (!e) return null; const r = e.getBoundingClientRect(); const l = e.querySelector('.exp__d20-link'); const lc = l && getComputedStyle(l); return { r: [r.x, r.y, r.width, r.height].map(Math.round), link: lc && { color: lc.color, font: lc.fontFamily.slice(0, 30), style: lc.fontStyle, deco: lc.textDecorationLine, size: lc.fontSize } }; });
  await p.evaluate(() => scrollBy(0, -150)); await p.waitForTimeout(1200);
  await p.screenshot({ path: `${OUT}/caption-390b.png` });
  await ctx.close();
}
await b.close();
console.log(JSON.stringify(info, null, 1));
