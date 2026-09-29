// QA fb2b — mede e reporta. Saída: qa/fb2b/report.json + capturas em qa/fb2b/.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const URL = 'http://localhost:5173/';
const OUT = path.dirname(fileURLToPath(import.meta.url));
const report = { console: {}, leaks: {}, odometer: {}, d20: {}, parking: {}, titles: {} };
const b = await chromium.launch();

function track(p, bucket) {
  p.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') bucket.msgs.push(`[${bucket.phase}] ${m.type()}: ${m.text().slice(0, 300)}`);
  });
  p.on('pageerror', (e) => bucket.msgs.push(`[${bucket.phase}] pageerror: ${e.message.slice(0, 300)}`));
  p.on('requestfailed', (r) => bucket.failed.push(`[${bucket.phase}] ${r.url()} ${r.failure()?.errorText}`));
  p.on('response', (r) => { if (r.status() >= 400) bucket.failed.push(`[${bucket.phase}] HTTP ${r.status()} ${r.url()}`); });
}
const jump = (p, y) => p.evaluate((v) => scrollTo({ top: v, behavior: 'instant' }), y);
async function slowScroll(p) {
  let y = 0;
  for (;;) {
    const total = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    if (y > total) break;
    await jump(p, y); await p.waitForTimeout(90); y += 250;
  }
  await p.waitForTimeout(800);
  const total = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  for (let y2 = total; y2 >= 0; y2 -= 400) { await jump(p, y2); await p.waitForTimeout(40); }
  await jump(p, 0); await p.waitForTimeout(600);
}
async function open(w, h) {
  const ctx = await b.newContext({ viewport: { width: w, height: h } });
  const p = await ctx.newPage();
  const bucket = { phase: 'load', msgs: [], failed: [] };
  track(p, bucket);
  await p.goto(URL, { waitUntil: 'networkidle' });
  bucket.phase = 'scroll';
  await slowScroll(p);
  await p.waitForSelector('#work-experience .exp__car', { state: 'attached', timeout: 30000 });
  return { ctx, p, bucket };
}

const scanExp = (p) => p.evaluate(() => {
  const sec = document.querySelector('#work-experience');
  const sr = sec.getBoundingClientRect();
  const vh = innerHeight, vw = innerWidth;
  const effOp = (el) => { let o = 1; for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const cs = getComputedStyle(e); o *= parseFloat(cs.opacity); if (cs.visibility === 'hidden' || cs.display === 'none') return 0; } return o; };
  const out = [];
  sec.querySelectorAll('[class*="exp__"]').forEach((el) => {
    const cls = typeof el.className === 'string' ? el.className : el.className.baseVal;
    const r = el.getBoundingClientRect();
    if (!r.width && !r.height) return;
    const inView = r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw;
    const op = effOp(el);
    if (inView && op > 0) out.push({ cls, top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), opacity: +op.toFixed(2), insideSectionBox: r.top < sr.bottom && r.bottom > sr.top });
  });
  const odo = sec.querySelector('.exp__odo');
  const or = odo?.getBoundingClientRect();
  const cone = [...sec.querySelectorAll('*')].filter((e) => /cone|beam|headl|fog|mist|nevo/i.test(typeof e.className === 'string' ? e.className : e.className?.baseVal || '')).map((e) => (typeof e.className === 'string' ? e.className : e.className.baseVal));
  return {
    sectionTop: Math.round(sr.top), sectionBottom: Math.round(sr.bottom),
    contactTop: Math.round(document.querySelector('#contact').getBoundingClientRect().top),
    odo: or && { top: Math.round(or.top), bottom: Math.round(or.bottom), left: Math.round(or.left), right: Math.round(or.right), opacity: +effOp(odo).toFixed(2), cls: odo.className },
    coneFogLikeClasses: [...new Set(cone)],
    visibleExpElements: out,
  };
});

// ---------------- (2) console + resize, (3) leaks, (4) odômetro, (7) títulos ----------------
for (const [w, h] of [[1280, 800], [1440, 900], [390, 844]]) {
  const { ctx, p, bucket } = await open(w, h);
  const key = `${w}`;
  if (w === 1440) {
    bucket.phase = 'resize@top';
    for (const vw of [1280, 1440]) { await p.setViewportSize({ width: vw, height: 900 }); await p.waitForTimeout(700); }
    bucket.phase = 'resize@experience';
    await p.evaluate(() => { const s = document.querySelector('#work-experience'); scrollTo({ top: s.getBoundingClientRect().top + scrollY + s.offsetHeight * 0.5 - innerHeight / 2, behavior: 'instant' }); });
    await p.waitForTimeout(1200);
    const carBefore = await p.evaluate(() => document.querySelector('.exp__car').style.transform);
    for (const vw of [1280, 1440]) { await p.setViewportSize({ width: vw, height: 900 }); await p.waitForTimeout(1200); }
    const carAfter = await p.evaluate(() => document.querySelector('.exp__car').style.transform);
    report.console.resizeCar = { carBefore, carAfter };
    await p.screenshot({ path: path.join(OUT, 'resize-1440-after.png') });
  }
  if (w !== 1280) {
    bucket.phase = 'leak';
    for (const [label, offset] of [['contactTop0', 0], ['contactTopNav', 72]]) {
      await p.evaluate((o) => { const c = document.querySelector('#contact'); scrollTo({ top: c.getBoundingClientRect().top + scrollY - o, behavior: 'instant' }); }, offset);
      await p.waitForTimeout(1500);
      const scan = await scanExp(p);
      const shot = path.join(OUT, `leak-${w}-${label}.png`);
      await p.screenshot({ path: shot });
      report.leaks[`${w}-${label}`] = { ...scan, shot };
    }
    const sweep = [];
    const range = await p.evaluate(() => { const l = [...document.querySelectorAll('#work-experience .exp__stop')].pop().getBoundingClientRect(); const c = document.querySelector('#contact').getBoundingClientRect(); return [l.top + scrollY - innerHeight, c.top + scrollY]; });
    for (let y = range[0]; y <= range[1]; y += 60) {
      await jump(p, y); await p.waitForTimeout(420);
      const s = await p.evaluate(() => { const o = document.querySelector('.exp__odo'); const r = o.getBoundingClientRect(); const sec = document.querySelector('#work-experience').getBoundingClientRect(); const c = document.querySelector('#contact').getBoundingClientRect(); const lastCard = [...document.querySelectorAll('#work-experience .exp__card')].pop().getBoundingClientRect(); return { op: +getComputedStyle(o).opacity, top: Math.round(r.top), bottom: Math.round(r.bottom), secBottom: Math.round(sec.bottom), contactTop: Math.round(c.top), lastCardBottom: Math.round(lastCard.bottom), vh: innerHeight }; });
      if (s.op > 0.05 && s.bottom > 0 && s.top < s.vh) sweep.push({ scrollY: Math.round(y), ...s });
    }
    report.leaks[`${w}-odoSweep`] = { visibleSamples: sweep.length, worstNearContact: sweep.sort((a, c) => a.contactTop - c.contactTop).slice(0, 3), odoBelowLastCard: sweep.filter((s) => s.top > s.lastCardBottom).length };
  }
  bucket.phase = 'odometer';
  const odo = [];
  for (const f of [0.1, 0.25, 0.5, 1]) {
    await p.evaluate((fr) => { const s = document.querySelector('#work-experience'); const top = s.getBoundingClientRect().top + scrollY; scrollTo({ top: top + (s.offsetHeight - innerHeight) * fr, behavior: 'instant' }); }, f);
    await p.waitForTimeout(1500);
    const o = await p.evaluate(() => {
      const el = document.querySelector('.exp__odo');
      const trk = document.querySelector('.exp__odo-track');
      const r = el.getBoundingClientRect();
      const kids = [...el.querySelectorAll('*')].map((k) => ({ tag: k.tagName, cls: k.className, text: k.textContent.trim(), display: getComputedStyle(k).display }));
      const cards = [...document.querySelectorAll('#work-experience .exp__card')].map((c) => c.getBoundingClientRect());
      const overlapsCard = cards.some((c) => r.left < c.right && r.right > c.left && r.top < c.bottom && r.bottom > c.top);
      return { innerText: el.innerText, textContent: el.textContent.trim(), childCount: el.children.length, descendants: kids, opacity: +getComputedStyle(el).opacity, cls: el.className, rect: [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)], trackAriaHidden: trk.getAttribute('aria-hidden'), overlapsCard, fontSize: getComputedStyle(el.querySelector('.exp__odo-year')).fontSize, zTrack: getComputedStyle(trk).zIndex };
    });
    const shot = path.join(OUT, `odo-${w}-${Math.round(f * 100)}.png`);
    await p.screenshot({ path: shot });
    odo.push({ at: f, ...o, shot });
  }
  report.odometer[key] = odo;

  bucket.phase = 'titles';
  await jump(p, 0); await p.waitForTimeout(300);
  report.titles[key] = await p.evaluate(() => {
    const small = new Set(['a', 'an', 'the', 'and', 'but', 'or', 'nor', 'for', 'of', 'in', 'on', 'at', 'to', 'by', 'with', 'from', 'as', 'vs']);
    const vw = document.documentElement.clientWidth;
    const titles = [...document.querySelectorAll('h2.section-title')].map((h) => {
      const cs = getComputedStyle(h);
      const r = h.getBoundingClientRect();
      const range = document.createRange(); range.selectNodeContents(h); const tr = range.getBoundingClientRect();
      const text = h.textContent.replace(/\s+/g, ' ').trim();
      const words = text.split(' ');
      const nonTitle = words.filter((wd, i) => /^[a-z]/.test(wd) && !(i > 0 && small.has(wd)));
      const sec = h.closest('section, [id]');
      return { section: sec?.id || sec?.className, text, hasEm: !!h.querySelector('em'), emText: h.querySelector('em')?.textContent ?? null, textAlign: cs.textAlign, fontSize: cs.fontSize, fontWeight: cs.fontWeight, cls: h.className, textCenterMinusViewportCenter: Math.round((tr.left + tr.right) / 2 - vw / 2), boxCenterMinusViewportCenter: Math.round((r.left + r.right) / 2 - vw / 2), nonTitleCaseWords: nonTitle, endsWithPeriod: /\.$/.test(text) };
    });
    const allH2 = [...document.querySelectorAll('main h2')].filter((h) => !h.classList.contains('sr-only') && !h.classList.contains('section-title')).map((h) => ({ text: h.textContent.trim().slice(0, 60), cls: h.className, section: h.closest('[id]')?.id }));
    const work = document.querySelector('#work');
    const cards = work ? [...work.querySelectorAll('.featured-card')].map((c) => { const hd = c.querySelector('h1,h2,h3,h4,h5,h6'); return { heading: hd?.tagName ?? null, text: (hd ?? c.querySelector('[class*="title"]'))?.textContent.trim() ?? null }; }) : null;
    const workHeadings = work ? [...work.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((hh) => `${hh.tagName}:${hh.textContent.trim().slice(0, 40)}`) : null;
    return { titles, otherH2InMain: allH2, workCards: cards, workHeadings };
  });

  report.console[key] = { msgs: bucket.msgs, failed: bucket.failed };
  await ctx.close();
}

function measureD20() {
  const sec = document.querySelector('#work-experience');
  const sr = sec.getBoundingClientRect();
  const note = sec.querySelector('.exp__d20');
  const text = sec.querySelector('.exp__d20-text');
  if (!note || !text) return { missing: true };
  const range = document.createRange(); range.selectNodeContents(text);
  const lines = [...range.getClientRects()];
  const tr = text.getBoundingClientRect();
  const glyph = { left: Math.min(...lines.map((r) => r.left)), right: Math.max(...lines.map((r) => r.right)), top: Math.min(...lines.map((r) => r.top)), bottom: Math.max(...lines.map((r) => r.bottom)) };
  const bed = sec.querySelector('.exp__road-bed');
  const lane = parseFloat(bed.getAttribute('stroke-width'));
  const edgeHalf = parseFloat(sec.querySelector('.exp__road-edge').getAttribute('stroke-width')) / 2;
  const L = bed.getTotalLength();
  let minGap = Infinity, atY = null;
  const roadXs = [];
  for (let s = 0; s <= L; s += 1) {
    const pt = bed.getPointAtLength(s);
    const y = pt.y + sr.top, x = pt.x + sr.left;
    if (y >= glyph.top && y <= glyph.bottom) {
      roadXs.push(x);
      const gap = x < glyph.left ? glyph.left - (x + edgeHalf) : x > glyph.right ? (x - edgeHalf) - glyph.right : -(Math.min(x - glyph.left, glyph.right - x));
      if (gap < minGap) { minGap = gap; atY = Math.round(y); }
    }
  }
  const card = sec.querySelector('.exp__stop .exp__card').getBoundingClientRect();
  const lead = sec.querySelector('.exp__d20-lead').getBoundingClientRect();
  const cs = getComputedStyle(note);
  return {
    cls: note.className, opacity: +cs.opacity, visibility: cs.visibility,
    textBox: [Math.round(tr.left), Math.round(tr.top), Math.round(tr.right), Math.round(tr.bottom)],
    glyphBox: [Math.round(glyph.left), Math.round(glyph.top), Math.round(glyph.right), Math.round(glyph.bottom)],
    lineCount: lines.length,
    laneWidth: lane, edgeHalf,
    roadXRangeAtTextRows: roadXs.length ? [Math.round(Math.min(...roadXs)), Math.round(Math.max(...roadXs))] : null,
    horizontalGapToAsphaltPx: minGap === Infinity ? null : +minGap.toFixed(1), gapMeasuredAtY: atY,
    cardTop: Math.round(card.top), cardLeft: Math.round(card.left),
    verticalGapTextBoxToCardPx: +(card.top - tr.bottom).toFixed(1),
    verticalGapGlyphsToCardPx: +(card.top - glyph.bottom).toFixed(1),
    textRightEdgeToViewportPx: +(innerWidth - glyph.right).toFixed(1),
    textOverlapsCardHoriz: glyph.right > card.left && glyph.left < card.right,
    lead: [Math.round(lead.left), Math.round(lead.top), Math.round(lead.right), Math.round(lead.bottom)],
    viewportTopToGlyphTop: Math.round(glyph.top),
  };
}

// ---------------- (5) D-20 em 390 ----------------
{
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  const p = await ctx.newPage();
  await p.goto(URL, { waitUntil: 'networkidle' });
  await slowScroll(p);
  await p.evaluate(() => { const c = document.querySelector('#work-experience .exp__stop .exp__card').getBoundingClientRect(); scrollTo({ top: c.top + scrollY + c.height / 2 - innerHeight / 2, behavior: 'instant' }); });
  await p.waitForTimeout(2500);
  const shotA = path.join(OUT, 'd20-390-stop1-centered.png');
  await p.screenshot({ path: shotA });
  const m1 = await p.evaluate(measureD20);
  await p.evaluate(() => { const s = document.querySelector('#work-experience'); scrollTo({ top: s.getBoundingClientRect().top + scrollY, behavior: 'instant' }); });
  await p.waitForTimeout(2500);
  const shotB = path.join(OUT, 'd20-390-section-top.png');
  await p.screenshot({ path: shotB });
  const m2 = await p.evaluate(measureD20);
  report.d20 = { stop1Centered: { ...m1, shot: shotA }, sectionTop: { ...m2, shot: shotB } };
  await ctx.close();
}

// ---------------- (6) estacionamento em 1280 ----------------
{
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
  const p = await ctx.newPage();
  await p.goto(URL, { waitUntil: 'networkidle' });
  await slowScroll(p);
  const ids = await p.evaluate(() => [...document.querySelectorAll('#work-experience li[id^="exp-"]')].map((l) => l.id));
  const rows = [];
  for (const [i, id] of ids.entries()) {
    await p.evaluate((s) => { const c = document.querySelector(`#${s} .exp__card`).getBoundingClientRect(); scrollTo({ top: c.top + scrollY + c.height / 2 - innerHeight / 2, behavior: 'instant' }); }, id);
    await p.waitForTimeout(2500);
    const m = await p.evaluate(([s, idx]) => {
      const car = document.querySelector('#work-experience .exp__car').getBoundingClientRect();
      const km = document.querySelectorAll('#work-experience .exp__km')[idx];
      const kl = km.querySelector('line').getBoundingClientRect();
      const kmText = km.querySelector('text')?.textContent ?? null;
      const card = document.querySelector(`#${s} .exp__card`).getBoundingClientRect();
      const li = document.getElementById(s);
      const carCy = (car.top + car.bottom) / 2, kmCy = (kl.top + kl.bottom) / 2;
      return { carCenterY: +carCy.toFixed(1), kmY: +kmCy.toFixed(1), dyCarToKm: +(carCy - kmCy).toFixed(1), dxCarToKmLine: +(((car.left + car.right) / 2) - ((kl.left + kl.right) / 2)).toFixed(1), cardCenterY: +((card.top + card.bottom) / 2).toFixed(1), viewportCenterY: innerHeight / 2, isLit: li.classList.contains('is-lit'), kmText, kmOpacity: km.style.opacity };
    }, [id, i]);
    const shot = path.join(OUT, `park-1280-${i + 1}-${id}.png`);
    await p.screenshot({ path: shot });
    rows.push({ id, ...m, shot });
  }
  report.parking = rows;
  await ctx.close();
}

await b.close();
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
console.log('ok');
