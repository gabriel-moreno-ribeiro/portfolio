import { chromium } from 'playwright';
const b = await chromium.launch();
const W = +(process.env.W || 1440);
const ctx = await b.newContext({ viewport: { width: W, height: 900 } });
const p = await ctx.newPage();
await p.goto('http://localhost:5173' + (process.env.R || '/'), { waitUntil: 'load' }); await p.waitForTimeout(2500);
const seen = []; let prev = '';
for (let i = 0; i < +(process.env.N || 260); i++) {
  await p.keyboard.press('Tab'); await p.waitForTimeout(i === 0 ? 1500 : +(process.env.GAP || 500));
  const r = await p.evaluate(() => {
    const e = document.activeElement; if (!e || e === document.body) return { id: 'BODY' };
    const cs = getComputedStyle(e); const rc = e.getBoundingClientRect();
    const ring = (cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0) || cs.boxShadow !== 'none';
    // covered by a fixed element?
    const cx = rc.left + rc.width / 2, cy = rc.top + Math.min(rc.height / 2, 10);
    const top = document.elementFromPoint(Math.max(0, Math.min(innerWidth - 1, cx)), Math.max(0, Math.min(innerHeight - 1, cy)));
    const covered = top && !e.contains(top) && !top.contains(e) ? (top.className?.toString?.() || top.tagName).slice(0, 40) : '';
    const inView = rc.bottom > 0 && rc.top < innerHeight && rc.width > 0;
    const label = (e.getAttribute('aria-label') || e.innerText || e.id || e.getAttribute('href') || '').trim().replace(/\s+/g, ' ').slice(0, 35);
    return { id: e.tagName + '.' + String(e.className).split(' ')[0].slice(0, 28), label, ring, covered, inView, y: Math.round(rc.top) };
  });
  const key = r.id + r.label;
  seen.push(r);
  if (key === prev) { console.log('STUCK?', JSON.stringify(r)); }
  prev = key;
  if (r.id === 'BODY' && i > 5) { console.log('back to body at', i); break; }
}
for (const [i, r] of seen.entries()) { const flag = (!r.ring ? ' NO-RING' : '') + (r.covered ? ' COVERED:' + r.covered : '') + (!r.inView ? ' OFFSCREEN' : ''); console.log(i, r.id, '|', r.label, flag); }
await b.close();
