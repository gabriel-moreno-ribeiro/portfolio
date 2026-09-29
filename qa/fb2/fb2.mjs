// qa/fb2/fb2.mjs - feedback round 2 checks. Usage: node qa/fb2/fb2.mjs [baseUrl]
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
const OUT = path.resolve('qa/fb2');
const BASE = process.argv[2] || 'http://localhost:5173';
const VPS = [
  { w: 1280, h: 800, mobile: false },
  { w: 1440, h: 900, mobile: false },
  { w: 390, h: 844, mobile: true },
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const result = {};
const browser = await chromium.launch({ headless: true });
for (const vp of VPS) {
  const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: vp.mobile ? 2 : 1, isMobile: vp.mobile, hasTouch: vp.mobile });
  const page = await ctx.newPage();
  const cons = [], failed = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') cons.push({ level: m.type(), text: m.text().slice(0, 600), url: (m.location() || {}).url }); });
  page.on('pageerror', (e) => cons.push({ level: 'pageerror', text: String(e.message).slice(0, 600) }));
  page.on('requestfailed', (r) => failed.push({ url: r.url(), err: r.failure()?.errorText }));
  page.on('response', (r) => { if (r.status() >= 400) failed.push({ url: r.url(), status: r.status() }); });
  await page.goto(BASE + '/', { waitUntil: 'load', timeout: 60000 });
  try { await page.waitForLoadState('networkidle', { timeout: 20000 }); } catch {}
  await sleep(1500);
  // slow scroll to bottom so lazy sections mount
  for (let i = 0; i < 400; i++) {
    const done = await page.evaluate(() => { window.scrollBy(0, Math.round(window.innerHeight * 0.35)); return window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2; });
    await sleep(120);
    if (done) break;
  }
  await sleep(1500);
  const dom = await page.evaluate(() => {
    const q = (s) => document.querySelectorAll(s).length;
    const clean = (e) => e.textContent.replace(/\s+/g, ' ').trim();
    const heads = [...document.querySelectorAll('h1, h2')]
      .filter((e) => !e.classList.contains('sr-only') && !e.closest('.featured-card'))
      .map((e) => {
        const sec = e.closest('section[id], div[id]');
        const txt = clean(e);
        return { tag: e.tagName, sectionId: sec ? sec.id : null, className: e.className, text: txt, html: e.innerHTML.replace(/\s+/g, ' ').trim().slice(0, 200), hasEm: !!e.querySelector('em'), sectionTitle: e.classList.contains('section-title'), endsWithDot: /\.\s*$/.test(txt), rendered: e.getClientRects().length > 0 };
      });
    const allH2 = [...document.querySelectorAll('h2')].map((e) => ({ className: e.className, text: clean(e).slice(0, 80), rendered: e.getClientRects().length > 0 }));
    const expTitle = document.querySelector('#work-experience h2');
    const skillsCap = document.querySelector('#skills p');
    return {
      horizontalSkillsParent: q('div.horizontal-skills-parent'),
      contactClock: q('p.contact-section__clock'),
      contactEyebrow: q('p.contact-section__eyebrow'),
      expTitle: expTitle ? clean(expTitle) : null,
      expTitleEndsWithDot: expTitle ? /\.\s*$/.test(clean(expTitle)) : null,
      skillsCaption: skillsCap ? { className: skillsCap.className, text: clean(skillsCap) } : null,
      headings: heads,
      allH2,
    };
  });
  // Experience: card vs asphalt gap
  await page.evaluate(() => document.getElementById('work-experience').scrollIntoView({ block: 'start' }));
  await sleep(1500);
  const gaps = await page.evaluate(() => {
    const svg = document.querySelector('#work-experience svg.exp__road');
    if (!svg) return { error: 'no svg.exp__road' };
    const edge = svg.querySelector('path.exp__road-edge') || svg.querySelector('path');
    const bed = svg.querySelector('path.exp__road-bed');
    const half = Math.max(parseFloat(edge.getAttribute('stroke-width')), bed ? parseFloat(bed.getAttribute('stroke-width')) : 0) / 2;
    const m = edge.getScreenCTM();
    const scale = Math.hypot(m.a, m.b);
    const halfPx = half * scale;
    const L = edge.getTotalLength();
    const pts = [];
    for (let s = 0; s <= L; s += 1) {
      const p = edge.getPointAtLength(s);
      pts.push({ x: m.a * p.x + m.c * p.y + m.e, y: m.b * p.x + m.d * p.y + m.f });
    }
    const nearest = (y) => pts.reduce((a, p) => (Math.abs(p.y - y) < Math.abs(a.y - y) ? p : a), pts[0]);
    const cards = [...document.querySelectorAll('#work-experience li[id^="exp-"]')].map((li) => {
      const c = li.querySelector('article.exp__card').getBoundingClientRect();
      const cy = (c.top + c.bottom) / 2;
      const inRange = pts.filter((p) => p.y >= c.top && p.y <= c.bottom);
      const pc = nearest(cy);
      const side = (c.left + c.right) / 2 < pc.x ? 'card-left-of-road' : 'card-right-of-road';
      const g = (p) => (side === 'card-left-of-road' ? (p.x - halfPx) - c.right : c.left - (p.x + halfPx));
      const min = inRange.length ? Math.min(...inRange.map(g)) : null;
      let euclidMin = Infinity;
      for (const p of pts) {
        const dx = Math.max(c.left - p.x, 0, p.x - c.right);
        const dy = Math.max(c.top - p.y, 0, p.y - c.bottom);
        euclidMin = Math.min(euclidMin, Math.hypot(dx, dy) - halfPx);
      }
      const r1 = (v) => Math.round(v * 10) / 10;
      return {
        id: li.id, liClass: li.className, side,
        card: { left: Math.round(c.left), right: Math.round(c.right), topPage: Math.round(c.top + scrollY), h: Math.round(c.height) },
        roadXAtCenter: Math.round(pc.x),
        gapAtCenterPx: r1(g(pc)),
        minGapOverCardHeightPx: min === null ? null : r1(min),
        minEuclidGapPx: r1(euclidMin),
      };
    });
    return { asphaltHalfWidthPx: Math.round(halfPx * 10) / 10, svgRect: svg.getBoundingClientRect().toJSON(), cards };
  });
  const shots = [];
  if (vp.w === 1280 || vp.w === 390) {
    const ids = await page.$$eval('#work-experience li[id^="exp-"]', (els) => els.map((e) => e.id));
    for (let i = 0; i < ids.length; i++) {
      await page.evaluate((id) => document.getElementById(id).scrollIntoView({ block: 'center' }), ids[i]);
      await sleep(2000);
      const f = `exp-${vp.w}-stop${i + 1}-${ids[i]}.png`;
      await page.screenshot({ path: path.join(OUT, f) });
      shots.push(f);
    }
  }
  if (vp.w === 1440) {
    await page.evaluate(() => window.scrollTo(0, 0));
    await sleep(800);
    await page.evaluate(() => { const s = document.getElementById('work-experience'); window.scrollTo(0, s.getBoundingClientRect().top + scrollY - 40); });
    await sleep(2500);
    const f = 'exp-1440-start.png';
    await page.screenshot({ path: path.join(OUT, f) });
    shots.push(f);
    result.startVis1440 = await page.evaluate(() => {
      const r = (s) => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return { top: Math.round(b.top), left: Math.round(b.left), w: Math.round(b.width), h: Math.round(b.height), opacity: cs.opacity, visibility: cs.visibility, display: cs.display, text: e.textContent.trim().slice(0, 120) }; };
      return { d20: r('.exp__d20'), odo: r('.exp__odo'), odoYear: r('.exp__odo-year'), odoOrg: r('.exp__odo-org'), title: r('#work-experience h2') };
    });
  }
  result[vp.w] = { console: cons, failed, dom, gaps, shots };
  await ctx.close();
}
await browser.close();
fs.writeFileSync(path.join(OUT, 'fb2-report.json'), JSON.stringify(result, null, 2));
console.log('ok');
