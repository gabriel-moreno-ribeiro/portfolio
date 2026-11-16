// At several scroll positions: CSS/WAAPI animations running on targets that are off screen,
// and canvases still repainting while off screen.
import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const W = +(process.env.W || 1440);
const ctx = await b.newContext({ viewport: { width: W, height: 900 } });
await ctx.addInitScript(() => sessionStorage.setItem('showedToast', 'true'));
const p = await ctx.newPage();
await p.goto('http://localhost:5173/', { waitUntil: 'load' });
await p.waitForTimeout(2000);
let h = await p.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < h + 1000; y += 700) { await p.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), y); await p.waitForTimeout(200); h = await p.evaluate(() => document.documentElement.scrollHeight); }
const ids = ['main-content', 'background', 'wardrobe', 'work', 'research', 'skills', 'work-experience', 'contact'];
for (const id of ids) {
  await p.evaluate(id => { const e = document.getElementById(id); scrollTo({ top: e.getBoundingClientRect().top + scrollY + 200, behavior: 'instant' }); }, id);
  await p.waitForTimeout(2500);
  const r = await p.evaluate(() => {
    const anims = document.getAnimations().filter(a => a.playState === 'running').map(a => {
      const t = a.effect?.target; const rc = t?.getBoundingClientRect?.();
      const off = rc && (rc.bottom < -50 || rc.top > innerHeight + 50 || (rc.width === 0 && rc.height === 0));
      const cls = (t?.className?.baseVal ?? t?.className ?? '').toString().split(' ')[0];
      return off ? (a.animationName || 'waapi') + '@' + cls : null;
    }).filter(Boolean);
    return [...new Set(anims)];
  });
  console.log(id.padEnd(16), r.length ? r.join(', ') : 'ok');
}
await b.close();
