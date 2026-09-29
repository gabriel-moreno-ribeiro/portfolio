// qa/fb2/fb2-extra.mjs - D-20 note vs road/card gap; contact mount at 1440.
import { chromium } from 'playwright';
import fs from 'node:fs';
const BASE = process.argv[2] || 'http://localhost:5173';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const out = {};
const browser = await chromium.launch({ headless: true });
for (const vp of [{ w: 1280, h: 800 }, { w: 1440, h: 900 }, { w: 390, h: 844, m: true }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, isMobile: !!vp.m, hasTouch: !!vp.m, deviceScaleFactor: vp.m ? 2 : 1 });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await sleep(1500);
  for (let i = 0; i < 400; i++) {
    const done = await page.evaluate(() => { window.scrollBy(0, Math.round(innerHeight * 0.35)); return scrollY + innerHeight >= document.documentElement.scrollHeight - 2; });
    await sleep(120);
    if (done) break;
  }
  await sleep(4000);
  const contact = await page.evaluate(() => ({
    contactH2: [...document.querySelectorAll('#contact h2')].map((e) => ({ cls: e.className, html: e.innerHTML.trim() })),
    clock: document.querySelectorAll('p.contact-section__clock').length,
    eyebrow: document.querySelectorAll('p.contact-section__eyebrow').length,
  }));
  await page.evaluate(() => { const s = document.getElementById('work-experience'); scrollTo(0, s.getBoundingClientRect().top + scrollY - 40); });
  await sleep(2500);
  const note = await page.evaluate(() => {
    const t = document.querySelector('.exp__d20-text');
    if (!t) return null;
    const n = t.getBoundingClientRect();
    const svg = document.querySelector('svg.exp__road');
    const edge = svg.querySelector('path.exp__road-edge');
    const m = edge.getScreenCTM();
    const half = (parseFloat(edge.getAttribute('stroke-width')) / 2) * Math.hypot(m.a, m.b);
    const L = edge.getTotalLength();
    let minX = Infinity, maxX = -Infinity;
    for (let s = 0; s <= L; s++) { const p = edge.getPointAtLength(s); const y = m.b * p.x + m.d * p.y + m.f; const x = m.a * p.x + m.c * p.y + m.e; if (y >= n.top && y <= n.bottom) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); } }
    const card = document.querySelector('li[id^="exp-"] article.exp__card').getBoundingClientRect();
    const odo = document.querySelector('.exp__odo-org').getBoundingClientRect();
    return {
      noteRect: { l: Math.round(n.left), r: Math.round(n.right), t: Math.round(n.top), b: Math.round(n.bottom) },
      roadXRangeAtNote: [Math.round(minX), Math.round(maxX)], half,
      gapNoteLeftToAsphaltRight: Math.round((n.left - (maxX + half)) * 10) / 10,
      gapNoteBottomToCard1Top: Math.round((card.top - n.bottom) * 10) / 10,
      noteRightVsViewport: Math.round(innerWidth - n.right),
      odoOrgRect: { l: Math.round(odo.left), r: Math.round(odo.right), t: Math.round(odo.top) },
    };
  });
  out[vp.w] = { contact, note };
  await ctx.close();
}
await browser.close();
fs.writeFileSync('qa/fb2/fb2-extra.json', JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 1));
