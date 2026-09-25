import { chromium } from 'playwright';
import fs from 'node:fs';
const B = process.argv[2] || 'http://localhost:5173';
const br = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const out = {};
const slow = (p) => p.evaluate(async () => {
  const nap = (ms) => new Promise((r) => setTimeout(r, ms));
  const my = () => document.documentElement.scrollHeight - innerHeight;
  let y = 0, n = 0;
  while (y < my() && n < 400) { y = Math.min(y + 300, my()); scrollTo({ top: y, behavior: 'instant' }); n++; await nap(110); }
});
const WS = /\s+/g;

// ---------- 1440
{
  const c = await br.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await c.newPage();
  await p.goto(B + '/', { waitUntil: 'load', timeout: 60000 });
  await p.waitForTimeout(2500);

  out.stickerStage = await p.evaluate(() => {
    const s = document.querySelector('.sticker-stage');
    if (!s) return null;
    const r = s.getBoundingClientRect();
    const kids = [...s.querySelectorAll('*')].slice(0, 20).map((e) => {
      const rr = e.getBoundingClientRect(); const cs = getComputedStyle(e);
      return {
        tag: e.tagName.toLowerCase(), cls: String(e.className || '').slice(0, 60),
        src: e.getAttribute ? e.getAttribute('src') : null, alt: e.getAttribute ? e.getAttribute('alt') : null,
        rect: { x: Math.round(rr.x), y: Math.round(rr.y), w: Math.round(rr.width), h: Math.round(rr.height) },
        bg: cs.backgroundColor, bgImg: cs.backgroundImage.slice(0, 90), filter: cs.filter,
        opacity: cs.opacity, mixBlend: cs.mixBlendMode,
        naturalW: e.naturalWidth || null, complete: e.complete === undefined ? null : e.complete,
      };
    });
    return { rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }, pointerEvents: getComputedStyle(s).pointerEvents, zIndex: getComputedStyle(s).zIndex, childCount: s.children.length, kids };
  });

  await slow(p); await p.waitForTimeout(1000);
  const geo = await p.evaluate(() => {
    const e = document.querySelector('#work-experience'); const r = e.getBoundingClientRect();
    const t = r.top + scrollY; const my = document.documentElement.scrollHeight - innerHeight;
    return { s: Math.round(Math.min(t, my)), e: Math.round(Math.min(t + r.height - innerHeight, my)) };
  });
  await p.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), Math.round(geo.s + (geo.e - geo.s) * 0.5));
  await p.waitForTimeout(1200);

  out.overlaps1440 = await p.evaluate(() => {
    const lab = (e) => e.tagName.toLowerCase() + '.' + String(e.className || '').trim().split(/\s+/)[0];
    const fixed = [...document.querySelectorAll('body *')].filter((e) => {
      const cs = getComputedStyle(e); const r = e.getBoundingClientRect();
      return cs.position === 'fixed' && r.width > 20 && r.height > 20 && cs.visibility !== 'hidden' && Number(cs.opacity) > 0.05;
    });
    const cards = [...document.querySelectorAll('#work-experience li[id^=exp-] *')].filter((e) => {
      const r = e.getBoundingClientRect();
      return r.width > 250 && r.height > 90 && r.bottom > 0 && r.top < innerHeight;
    });
    const hits = [];
    for (const f of fixed) {
      const fr = f.getBoundingClientRect();
      for (const cd of cards) {
        const cr = cd.getBoundingClientRect();
        const ox = Math.max(0, Math.min(fr.right, cr.right) - Math.max(fr.left, cr.left));
        const oy = Math.max(0, Math.min(fr.bottom, cr.bottom) - Math.max(fr.top, cr.top));
        if (ox > 4 && oy > 4) hits.push({ fixed: lab(f), fixedText: (f.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40), card: (cd.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40), overlapPx: Math.round(ox) + 'x' + Math.round(oy), area: Math.round(ox * oy) });
      }
    }
    const seen = new Set();
    return {
      fixedVisible: fixed.map((f) => { const r = f.getBoundingClientRect(); return { sel: lab(f), text: (f.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 44), rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } }; }),
      hits: hits.filter((h) => { const k = h.fixed + '|' + h.card; if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 12),
    };
  });

  await p.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await p.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), geo.e);
  await p.waitForTimeout(1500);
  out.expCtaDark = await p.evaluate(() => {
    const a = document.querySelector('.exp__cta') || [...document.querySelectorAll('#work-experience a')].find((x) => /talk/i.test(x.textContent || ''));
    if (!a) return null;
    const cs = getComputedStyle(a); const r = a.getBoundingClientRect();
    const card = document.querySelector('#exp-hibeex'); const cr = card ? card.getBoundingClientRect() : null;
    return {
      sel: a.tagName.toLowerCase() + '.' + String(a.className || ''), text: (a.textContent || '').trim(),
      color: cs.color, bg: cs.backgroundColor, borderTop: cs.borderTopWidth + ' ' + cs.borderTopStyle + ' ' + cs.borderTopColor,
      zIndex: cs.zIndex, position: cs.position, opacity: cs.opacity, fontFamily: cs.fontFamily.slice(0, 40),
      rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
      hibeexCardRect: cr ? { x: Math.round(cr.x), y: Math.round(cr.y), w: Math.round(cr.width), h: Math.round(cr.height) } : null,
      overlapsCard: cr ? (r.left < cr.right && r.right > cr.left && r.top < cr.bottom && r.bottom > cr.top) : null,
      elementAtCenter: (() => { const el = document.elementFromPoint(Math.round(r.x + r.width / 2), Math.round(r.y + r.height / 2)); return el ? el.tagName.toLowerCase() + '.' + String(el.className || '').slice(0, 40) : null; })(),
    };
  });
  await p.evaluate(() => document.documentElement.setAttribute('data-theme', 'light'));
  await p.waitForTimeout(900);
  out.expCtaLight = await p.evaluate(() => {
    const a = document.querySelector('.exp__cta'); if (!a) return null;
    const cs = getComputedStyle(a); const r = a.getBoundingClientRect();
    return { color: cs.color, bg: cs.backgroundColor, borderTop: cs.borderTopWidth + ' ' + cs.borderTopStyle + ' ' + cs.borderTopColor, rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } };
  });

  const p2 = await c.newPage();
  await p2.goto(B + '/', { waitUntil: 'load', timeout: 60000 });
  await p2.waitForTimeout(3000);
  out.aboveFoldClaims1440 = await p2.evaluate(() => {
    const vis = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return { top: Math.round(r.top + scrollY), h: Math.round(r.height), opacity: cs.opacity, transform: cs.transform.slice(0, 50), visibility: cs.visibility, display: cs.display, clip: cs.clipPath.slice(0, 40) }; };
    const cards = [...document.querySelectorAll('#research .research-card, #research article')].slice(0, 6).map((e) => Object.assign({ txt: (e.textContent || '').trim().slice(0, 32) }, vis(e)));
    const numbers = document.querySelector('.numbers-and-stats');
    const tiles = [...document.querySelectorAll('#numbers [class*=tile]')].slice(0, 5).map((e) => Object.assign({ txt: (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40) }, vis(e)));
    return { researchCardCount: document.querySelectorAll('#research .research-card').length, researchCards: cards, numbersPanel: numbers ? vis(numbers) : null, numbersTiles: tiles, scrollY: Math.round(scrollY), innerHeight: innerHeight };
  });
  await c.close();
}

// ---------- 390
{
  const c = await br.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const p = await c.newPage();
  await p.goto(B + '/', { waitUntil: 'load', timeout: 60000 });
  await p.waitForTimeout(2500);
  await slow(p); await p.waitForTimeout(1000);
  const geo = await p.evaluate(() => {
    const e = document.querySelector('#work-experience'); const r = e.getBoundingClientRect();
    const t = r.top + scrollY; const my = document.documentElement.scrollHeight - innerHeight;
    return { s: Math.round(Math.min(t, my)), e: Math.round(Math.min(t + r.height - innerHeight, my)) };
  });
  await p.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), Math.round(geo.s + (geo.e - geo.s) * 0.25));
  await p.waitForTimeout(1200);
  out.overlaps390 = await p.evaluate(() => {
    const rect = (e) => { const r = e.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; };
    const inter = (a, b) => {
      if (!a || !b) return null;
      const ar = a.getBoundingClientRect(), bb = b.getBoundingClientRect();
      const ox = Math.max(0, Math.min(ar.right, bb.right) - Math.max(ar.left, bb.left));
      const oy = Math.max(0, Math.min(ar.bottom, bb.bottom) - Math.max(ar.top, bb.top));
      return { ox: Math.round(ox), oy: Math.round(oy), area: Math.round(ox * oy) };
    };
    const odo = [...document.querySelectorAll('#work-experience *')].find((e) => /exp__odo/.test(String(e.className || '')));
    const nav = document.querySelector('nav.navbar');
    const cta = document.querySelector('nav.mobile-sticky-cta');
    const covered = odo ? (() => { const r = odo.getBoundingClientRect(); const el = document.elementFromPoint(Math.round(r.x + r.width / 2), Math.round(r.y + 4)); return el ? el.tagName.toLowerCase() + '.' + String(el.className || '').slice(0, 50) : null; })() : null;
    const cards = [...document.querySelectorAll('#work-experience li[id^=exp-]')].map((e) => ({ id: e.id, rect: rect(e), clippedByCTA: cta ? inter(e, cta) : null, clippedByNav: nav ? inter(e, nav) : null }));
    return {
      odometer: odo ? { rect: rect(odo), zIndex: getComputedStyle(odo).zIndex, position: getComputedStyle(odo).position, text: (odo.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60), elementAtTopCenter: covered, overlapWithNavbar: inter(odo, nav) } : null,
      navbar: nav ? { rect: rect(nav), z: getComputedStyle(nav).zIndex } : null,
      stickyCTA: cta ? { rect: rect(cta), z: getComputedStyle(cta).zIndex, viewportSharePct: +((rect(cta).w * rect(cta).h) / (390 * 844) * 100).toFixed(1) } : null,
      cardsInView: cards.filter((c2) => c2.rect.y < 844 && c2.rect.y + c2.rect.h > 0),
    };
  });
  await c.close();
}

await br.close();
fs.writeFileSync('qa/r1/probe2.json', JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 1));
