import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const ctx = await b.newContext({ viewport: { width: 1000, height: 800 } });
for (const w of [1440, 1200, 1024, 900, 820, 768]) {
  const p = await ctx.newPage();
  await p.setViewportSize({ width: w, height: 800 });
  await p.goto('http://localhost:5173/library', { waitUntil: 'load' });
  await p.waitForTimeout(4000);
  console.log(w, JSON.stringify(await p.evaluate(() => {
    const nav = document.querySelector('.navbar');
    const n = nav.getBoundingClientRect();
    const hits = [];
    document.querySelectorAll('body *').forEach(e => {
      if (nav.contains(e) || e.contains(nav) || e.children.length) return;
      const cs = getComputedStyle(e);
      if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) return;
      const t = (e.textContent || '').trim(); if (!t) return;
      const r = e.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) return;
      if (!(r.right <= n.left || r.left >= n.right || r.bottom <= n.top || r.top >= n.bottom))
        hits.push(t.slice(0, 18) + ' @' + Math.round(r.x) + '-' + Math.round(r.right));
    });
    return { pill: [Math.round(n.x), Math.round(n.right), Math.round(n.width)], hits };
  })));
  await p.close();
}
await b.close();
