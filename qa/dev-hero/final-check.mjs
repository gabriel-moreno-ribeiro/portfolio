import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const ctx = await b.newContext({ viewport: { width: 1000, height: 800 } });
// A: library pill collision across widths
for (const w of [1440, 1200, 1024, 900, 820, 768]) {
  const p = await ctx.newPage(); await p.setViewportSize({ width: w, height: 800 });
  await p.goto('http://localhost:5173/library', { waitUntil: 'load' }); await p.waitForTimeout(3500);
  console.log('lib', w, JSON.stringify(await p.evaluate(() => {
    const nav = document.querySelector('.navbar'), n = nav.getBoundingClientRect(), hits = [];
    document.querySelectorAll('body *').forEach(e => { if (nav.contains(e) || e.contains(nav) || e.children.length) return;
      const cs = getComputedStyle(e); if (cs.visibility==='hidden'||cs.display==='none'||+cs.opacity===0) return;
      const t=(e.textContent||'').trim(); if(!t) return; const r=e.getBoundingClientRect(); if(r.width<4||r.height<4) return;
      if (!(r.right<=n.left||r.left>=n.right||r.bottom<=n.top||r.top>=n.bottom)) hits.push(t.slice(0,16)); });
    return { pill: [Math.round(n.x), Math.round(n.width)], hits };
  })));
  await p.close();
}
// B: routes clean + DOM cuts
for (const route of ['/', '/library', '/news', '/story']) {
  const p = await ctx.newPage(); await p.setViewportSize({ width: 1440, height: 900 });
  const errs = []; p.on('pageerror', e => errs.push(e.message.slice(0,110)));
  p.on('console', m => { if (m.type()==='error' && !/403|favicon/.test(m.text())) errs.push(m.text().slice(0,110)); });
  await p.goto('http://localhost:5173' + route, { waitUntil: 'load' }); await p.waitForTimeout(3500);
  console.log(route.padEnd(9), JSON.stringify(await p.evaluate(() => ({
    navTag: document.querySelector('.navbar')?.tagName, navTabIndex: document.querySelector('.navbar')?.getAttribute('tabindex'),
    navW: Math.round(document.querySelector('.navbar')?.getBoundingClientRect().width ?? 0),
    status: !!document.querySelector('.navbar__status'), heroStatus: !!document.querySelector('.hero-status'),
    heroLatest: !!document.querySelector('.hero-latest'), filters: !!document.querySelector('.moments__filters'),
    eyebrow: document.querySelector('.moments__eyebrow')?.textContent, freshness: !!document.querySelector('.footer__freshness'),
    caption: document.querySelector('.moments__item figcaption')?.textContent,
  }))), errs.length ? 'ERRORS: ' + errs.slice(0,2) : 'clean');
  await p.close();
}
await b.close();
