import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=gl','--ignore-gpu-blocklist'] });
for (const [w,h] of [[1440,900],[390,844]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: w<500, hasTouch: w<500 });
  const p = await ctx.newPage();
  await p.goto('http://localhost:5173/library', { waitUntil: 'load' });
  await p.waitForTimeout(5000);
  console.log('\n==', w, '==');
  console.log(await p.evaluate(() => [...document.querySelectorAll('body *')]
    .map(e => ({ e, r: e.getBoundingClientRect(), cs: getComputedStyle(e) }))
    .filter(({ r, cs }) => r.top < 90 && r.bottom > 0 && r.width > 8 && r.height > 8 && cs.visibility !== 'hidden' && cs.display !== 'none')
    .filter(({ e }) => !e.querySelector || [...e.children].length === 0 || e.classList.contains('navbar'))
    .map(({ e, r, cs }) => `${e.tagName}.${(e.className||'').toString().slice(0,26)} @${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)} z=${cs.zIndex} pos=${cs.position} "${(e.textContent||'').trim().slice(0,22)}"`)
    .join('\n')));
  await ctx.close();
}
await b.close();
