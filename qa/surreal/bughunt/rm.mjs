// Reduced motion + off-screen animation probe.
import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
for (const reduced of [true, false]) {
  const W = +(process.env.W || 1440);
  const ctx = await b.newContext({ viewport: { width: W, height: 900 }, reducedMotion: reduced ? 'reduce' : 'no-preference' });
  await ctx.addInitScript(() => sessionStorage.setItem('showedToast', 'true'));
  const p = await ctx.newPage();
  await p.goto('http://localhost:5173/', { waitUntil: 'load' }); await p.waitForTimeout(2000);
  let h = await p.evaluate(() => document.documentElement.scrollHeight);
  const hidden = new Set();
  for (let y = 0; y < h + 1000; y += 450) {
    await p.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), y); await p.waitForTimeout(reduced ? 150 : 700);
    h = await p.evaluate(() => document.documentElement.scrollHeight);
    if (reduced) (await p.evaluate(() => [...document.querySelectorAll('h2,h3,p,li,img,figure,a,button')].filter(e => {
      const r = e.getBoundingClientRect(); if (r.width < 4 || r.height < 4 || r.bottom < 0 || r.top > innerHeight) return false;
      if (e.closest('[aria-hidden="true"]')) return false;
      let n = e; while (n && n !== document.body) { const cs = getComputedStyle(n); if (parseFloat(cs.opacity) < 0.05 || cs.visibility === 'hidden') return true; n = n.parentElement; }
      return false;
    }).map(e => e.tagName + '.' + String(e.className).slice(0, 40) + ' "' + (e.innerText || e.alt || '').slice(0, 30) + '"'))).forEach(x => hidden.add(x));
  }
  await p.waitForTimeout(1500);
  await p.evaluate(() => scrollTo({ top: document.getElementById('contact').getBoundingClientRect().top + scrollY, behavior: 'instant' }));
  await p.waitForTimeout(2500);
  const anims = await p.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').map(a => {
    const t = a.effect?.target; const r = t?.getBoundingClientRect?.();
    const inView = r ? r.bottom > 0 && r.top < innerHeight : '?';
    return (a.animationName || a.transitionProperty || 'waapi') + ' @ ' + (t?.className?.baseVal ?? t?.className)?.toString().slice(0, 40) + (inView ? '' : ' OFFSCREEN');
  }));
  // rAF activity count over 1s while at contact
  const raf = await p.evaluate(() => new Promise(res => { let n = 0; const o = window.requestAnimationFrame; const t0 = performance.now(); (function f() { n++; if (performance.now() - t0 < 1000) o(f); else res(n); })(); }));
  console.log(JSON.stringify({ reduced, hiddenInView: [...hidden].slice(0, 30), runningAnimsAtContact: [...new Set(anims)] }, null, 1));
  await ctx.close();
}
await b.close();
