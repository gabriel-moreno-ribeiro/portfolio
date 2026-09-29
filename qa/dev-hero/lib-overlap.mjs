import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=gl','--ignore-gpu-blocklist'] });
for (const [w,h] of [[1440,900],[390,844],[900,800]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: w<500, hasTouch: w<500 });
  const p = await ctx.newPage();
  await p.goto('http://localhost:5173/library', { waitUntil: 'load' });
  await p.waitForTimeout(5000);
  console.log(w, JSON.stringify(await p.evaluate(() => {
    const n = document.querySelector('.navbar').getBoundingClientRect();
    const out = { navbar: [Math.round(n.x), Math.round(n.y), Math.round(n.width), Math.round(n.height)], hits: [] };
    document.querySelectorAll('.library__nav *, .library__back, .library__title, .library__count, .library__meta, header *').forEach(e => {
      if (e.closest('.navbar')) return;
      const r = e.getBoundingClientRect();
      if (r.width && r.height && !(r.right <= n.left || r.left >= n.right || r.bottom <= n.top || r.top >= n.bottom))
        out.hits.push((e.className||e.tagName).toString().slice(0,30) + ' @' + Math.round(r.x) + ',' + Math.round(r.y) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
    });
    const top = document.elementFromPoint(n.x + 8, n.y + n.height/2);
    out.atLeftEdge = (top?.className||top?.tagName||'').toString().slice(0,40);
    return out;
  })));
  await ctx.close();
}
await b.close();
