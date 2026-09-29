// qa/fb2-repair/exp-repair.mjs - Experience repair checks (note gap, car at stops, odometer exit, road end).
// Usage: node qa/fb2-repair/exp-repair.mjs [baseUrl]
import { chromium } from 'playwright';
import fs from 'node:fs';
const BASE = process.argv[2] || 'http://localhost:5173';
const OUT = 'qa/fb2-repair';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const out = {};
const browser = await chromium.launch({ headless: true });
for (const vp of [{ w: 390, h: 844, m: true }, { w: 1280, h: 800 }, { w: 1440, h: 900 }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, isMobile: !!vp.m, hasTouch: !!vp.m, deviceScaleFactor: vp.m ? 2 : 1 });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e.message)));
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 300)); });
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await sleep(1500);
  for (let i = 0; i < 400; i++) {
    const done = await page.evaluate(() => { window.scrollBy(0, Math.round(innerHeight * 0.35)); return scrollY + innerHeight >= document.documentElement.scrollHeight - 2; });
    await sleep(100);
    if (done) break;
  }
  await sleep(2500);
  const r = { errs };
  // rAF rate in this browser
  r.rafHz = await page.evaluate(() => new Promise((res) => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 1000) requestAnimationFrame(f); else res(n); }; requestAnimationFrame(f); }));
  // D-20 note vs road and card
  await page.evaluate(() => { const s = document.getElementById('work-experience'); document.documentElement.style.scrollBehavior = 'auto'; scrollTo(0, s.getBoundingClientRect().top + scrollY - 40); });
  await sleep(2500);
  r.note = await page.evaluate(() => {
    const t = document.querySelector('.exp__d20-text');
    if (!t) return null;
    const n = t.getBoundingClientRect();
    const edge = document.querySelector('svg.exp__road path.exp__road-edge');
    const m = edge.getScreenCTM();
    const half = (parseFloat(edge.getAttribute('stroke-width')) / 2) * Math.hypot(m.a, m.b);
    const L = edge.getTotalLength();
    let minX = Infinity, maxX = -Infinity;
    for (let s = 0; s <= L; s++) { const p = edge.getPointAtLength(s); const y = m.b * p.x + m.d * p.y + m.f; const x = m.a * p.x + m.c * p.y + m.e; if (y >= n.top && y <= n.bottom) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); } }
    const card = document.querySelector('li[id^="exp-"] article.exp__card').getBoundingClientRect();
    const side = document.querySelector('.exp__d20').className;
    return {
      side,
      gapNoteLeftToAsphaltRight: Math.round((n.left - (maxX + half)) * 10) / 10,
      gapNoteBottomToCard1Top: Math.round((card.top - n.bottom) * 10) / 10,
      noteRightVsViewport: Math.round(innerWidth - n.right),
    };
  });
  await page.screenshot({ path: `${OUT}/exp-${vp.w}-note.png` });
  // Car vs stop after scrollIntoView center
  const ids = await page.evaluate(() => [...document.querySelectorAll('#work-experience li[id^="exp-"]')].map((l) => l.id));
  r.stops = [];
  for (let i = 0; i < ids.length; i++) {
    await page.evaluate((id) => document.getElementById(id).scrollIntoView({ block: 'center', behavior: 'instant' }), ids[i]);
    const samples = [];
    for (const t of [300, 700, 1200, 2000]) {
      await sleep(t - (samples.length ? [300, 700, 1200, 2000][samples.length - 1] : 0));
      samples.push(await page.evaluate((id) => {
        const li = document.getElementById(id);
        const lr = li.getBoundingClientRect();
        const car = document.querySelector('.exp__car').getBoundingClientRect();
        return { t: 0, carMinusStop: Math.round((car.top + car.height / 2) - (lr.top + lr.height / 2)), lit: li.classList.contains('is-lit'), year: document.querySelector('.exp__odo-year').textContent };
      }, ids[i]));
    }
    r.stops.push({ id: ids[i], at300: samples[0].carMinusStop, at700: samples[1].carMinusStop, at1200: samples[2].carMinusStop, at2000: samples[3].carMinusStop, lit: samples[3].lit, year: samples[3].year });
    await page.screenshot({ path: `${OUT}/exp-${vp.w}-stop${i + 1}-${ids[i]}.png` });
  }
  // Road end vs last card bottom; odometer after section
  r.end = await page.evaluate(() => {
    const edge = document.querySelector('svg.exp__road path.exp__road-edge');
    const m = edge.getScreenCTM();
    const p = edge.getPointAtLength(edge.getTotalLength());
    const endY = m.b * p.x + m.d * p.y + m.f;
    const cards = document.querySelectorAll('#work-experience article.exp__card');
    const last = cards[cards.length - 1].getBoundingClientRect();
    const sec = document.getElementById('work-experience').getBoundingClientRect();
    return { roadEndMinusLastCardBottom: Math.round(endY - last.bottom), sectionBottomMinusLastCardBottom: Math.round(sec.bottom - last.bottom) };
  });
  await page.evaluate(() => document.getElementById('contact')?.scrollIntoView({ block: 'start', behavior: 'instant' }));
  await sleep(1200);
  r.afterContact = await page.evaluate(() => {
    const o = document.querySelector('.exp__odo-year').getBoundingClientRect();
    const c = document.querySelector('#contact h2')?.getBoundingClientRect();
    return { odoBottom: Math.round(o.bottom), odoVisible: o.bottom > 0 && o.top < innerHeight, contactTitleTop: c ? Math.round(c.top) : null };
  });
  await page.screenshot({ path: `${OUT}/exp-${vp.w}-contact.png` });
  // Experience end: last card near top, look at road end and Contact
  await page.evaluate(() => { const c = document.querySelectorAll('#work-experience article.exp__card'); const l = c[c.length - 1]; scrollTo(0, l.getBoundingClientRect().bottom + scrollY - innerHeight * 0.55); });
  await sleep(1500);
  r.endView = await page.evaluate(() => {
    const o = document.querySelector('.exp__odo-year').getBoundingClientRect();
    const sec = document.getElementById('work-experience').getBoundingClientRect();
    return { odoBottom: Math.round(o.bottom), sectionBottom: Math.round(sec.bottom) };
  });
  await page.screenshot({ path: `${OUT}/exp-${vp.w}-end.png` });
  // heading
  await page.evaluate(() => { const s = document.getElementById('work-experience'); scrollTo(0, s.getBoundingClientRect().top + scrollY - 80); });
  await sleep(800);
  r.head = await page.evaluate(() => { const h = document.querySelector('#work-experience h2'); const b = h.getBoundingClientRect(); return { text: h.textContent, align: getComputedStyle(h).textAlign, centerOffset: Math.round((b.left + b.right) / 2 - innerWidth / 2) }; });
  await page.screenshot({ path: `${OUT}/exp-${vp.w}-head.png` });
  out[vp.w] = r;
  await ctx.close();
}
await browser.close();
fs.writeFileSync(`${OUT}/exp-repair.json`, JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 1));
