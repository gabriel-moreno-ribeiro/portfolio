// CSS animations running while their target is outside the viewport (Home, 1440x900, visible tab)
import fs from 'node:fs';
import { launch, BASE, OUT, VPS, slowScroll } from './common.mjs';
const b = await launch(); const c = await b.newContext({ viewport: VPS.desktop }); const p = await c.newPage(); const out = {};
await p.goto(BASE + '/'); await p.waitForTimeout(3500);
const probe = () => p.evaluate(() => { const g = {}; for (const a of document.getAnimations().filter((x) => x.playState === 'running')) { const t = a.effect?.target; if (!t || !t.getBoundingClientRect) continue; const r = t.getBoundingClientRect(); const inV = r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth; const k = (typeof t.className === 'string' ? t.className.split(' ')[0] : t.tagName) + ' ' + (a.animationName || 'js') + (inV ? ' IN' : ' OFF'); g[k] = (g[k] || 0) + 1; } return g; });
out.top = await probe(); console.log('top', JSON.stringify(out.top));
await slowScroll(p, 300, 100);
for (const [n, sel] of [['graph', '#graph'], ['work', '#work'], ['research', '#research'], ['skills', '#skills'], ['experience', '#work-experience'], ['contact', '#contact']]) { await p.evaluate((s) => document.querySelector(s)?.scrollIntoView({ block: 'center', behavior: 'instant' }), sel); await p.waitForTimeout(1800); out[n] = await probe(); console.log(n, JSON.stringify(out[n])); }
fs.writeFileSync(OUT + 'offviewport-animations.json', JSON.stringify(out, null, 2)); await b.close();
