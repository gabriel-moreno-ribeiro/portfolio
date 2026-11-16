// CLS during a real wheel scroll down the home, plus the RESERVE vs real heights.
import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
for (const W of (process.env.W || '1440,768,390').split(',').map(Number)) {
  const ctx = await b.newContext({ viewport: { width: W, height: 900 } });
  await ctx.addInitScript(() => { sessionStorage.setItem('showedToast', 'true'); window.__ls = []; new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput && e.value > 0.001) window.__ls.push({ v: +e.value.toFixed(4), t: Math.round(e.startTime), y: scrollY, src: e.sources?.map(s => (s.node?.id || s.node?.className?.toString?.() || s.node?.nodeName || '').slice(0, 40) + ` ${Math.round(s.previousRect.y)}→${Math.round(s.currentRect.y)} h${Math.round(s.previousRect.height)}→${Math.round(s.currentRect.height)}`).slice(0, 3) }); }).observe({ type: 'layout-shift', buffered: true }); });
  const p = await ctx.newPage();
  await p.goto('http://localhost:5173/', { waitUntil: 'load' }); await p.waitForTimeout(2500);
  for (let i = 0; i < 400; i++) { await p.mouse.wheel(0, 120); await p.waitForTimeout(40); if (i % 20 === 0 && await p.evaluate(() => scrollY + innerHeight >= document.documentElement.scrollHeight - 2)) break; }
  await p.waitForTimeout(1500);
  const r = await p.evaluate(() => ({ ls: window.__ls, total: window.__ls.reduce((a, e) => a + e.v, 0).toFixed(4), heights: ['background', 'wardrobe', 'work', 'research', 'skills', 'work-experience', 'contact'].map(id => id + ':' + Math.round(document.getElementById(id)?.getBoundingClientRect().height)) }));
  console.log(W, 'CLS', r.total, r.heights.join(' ')); r.ls.filter(e => e.v > 0.005).slice(0, 10).forEach(e => console.log('  ', JSON.stringify(e)));
  await ctx.close();
}
await b.close();
