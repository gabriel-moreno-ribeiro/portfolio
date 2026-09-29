import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=gl','--ignore-gpu-blocklist'] });
for (const [w,h] of [[1440,900],[390,844]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: w < 500, hasTouch: w < 500 });
  for (const route of ['/', '/library', '/news', '/story']) {
    const p = await ctx.newPage();
    await p.goto('http://localhost:5173' + route, { waitUntil: 'load' });
    await p.waitForTimeout(2500);
    const r = await p.evaluate(() => {
      const n = document.querySelector('.navbar'); if (!n) return null;
      const b = n.getBoundingClientRect();
      const parent = n.parentElement;
      const el = document.elementFromPoint(b.x + b.width/2, b.y + b.height/2);
      return { x: Math.round(b.x), right: Math.round(innerWidth - b.right), w: Math.round(b.width), top: Math.round(b.y),
        parent: parent.tagName + '.' + (parent.className||'').toString().slice(0,28),
        parentLeft: Math.round(parent.getBoundingClientRect().x), topEl: el?.className?.toString().slice(0,30) };
    });
    console.log(w, route.padEnd(9), JSON.stringify(r));
    await p.close();
  }
  await ctx.close();
}
await b.close();
