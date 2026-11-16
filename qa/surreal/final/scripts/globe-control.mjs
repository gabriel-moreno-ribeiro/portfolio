import { launch, BASE, VPS, slowScroll } from './common.mjs';
const b = await launch(); const c = await b.newContext({ viewport: VPS.desktop }); const p = await c.newPage();
await p.addInitScript(() => { window.__gl = 0; for (const P of [WebGLRenderingContext.prototype, window.WebGL2RenderingContext?.prototype].filter(Boolean)) for (const f of ['drawArrays', 'drawElements', 'drawArraysInstanced', 'drawElementsInstanced']) { const o = P[f]; if (o) P[f] = function (...a) { window.__gl++; return o.apply(this, a); }; } });
await p.goto(BASE + '/'); await p.waitForTimeout(3500);
await p.evaluate(() => document.querySelector('#background').scrollIntoView({ block: 'center', behavior: 'instant' }));
for (let i = 0; i < 6; i++) { const a = await p.evaluate(() => window.__gl); await p.waitForTimeout(2000); console.log('control t+' + (i + 1) * 2 + 's draws/s', ((await p.evaluate(() => window.__gl)) - a) / 2, 'poster', await p.evaluate(() => { const e = document.querySelector('.globe-poster, [class*=globe] img'); return e ? getComputedStyle(e).opacity : 'none'; })); }
await b.close();
