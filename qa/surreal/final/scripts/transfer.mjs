import fs from 'node:fs';
import { launch, BASE, OUT, VPS, slowScroll } from './common.mjs';
const b = await launch(); const out = {};
for (const [vn, vp] of Object.entries(VPS)) for (const path of ['/', '/work/hibeex']) {
  const c = await b.newContext({ viewport: vp, isMobile: vn === 'mobile', hasTouch: vn === 'mobile' }); const p = await c.newPage(); const cdp = await c.newCDPSession(p);
  await cdp.send('Network.enable'); const reqs = new Map();
  cdp.on('Network.responseReceived', (e) => reqs.set(e.requestId, { url: e.response.url, type: e.type, status: e.response.status }));
  cdp.on('Network.loadingFinished', (e) => { const r = reqs.get(e.requestId); if (r) r.bytes = e.encodedDataLength; });
  await p.goto(BASE + path, { waitUntil: 'load' }); await p.waitForTimeout(4000);
  const sum = () => { const t = {}; let tot = 0; for (const r of reqs.values()) { t[r.type] = (t[r.type] || 0) + (r.bytes || 0); tot += r.bytes || 0; } return { total: Math.round(tot / 1024), byType: Object.fromEntries(Object.entries(t).map(([k, v]) => [k, Math.round(v / 1024)])), n: reqs.size }; };
  const first = sum(); await slowScroll(p, 250, 150); await p.waitForTimeout(2000); const full = sum();
  const big = [...reqs.values()].filter((r) => (r.bytes || 0) > 150 * 1024).sort((a, b) => b.bytes - a.bytes).slice(0, 10).map((r) => r.url.replace(BASE, '') + ' ' + Math.round(r.bytes / 1024) + 'KB');
  const scripts = [...reqs.values()].filter((r) => r.type === 'Script').map((r) => r.url.split('/').pop() + ' ' + Math.round((r.bytes || 0) / 1024) + 'KB');
  out[`${vn} ${path}`] = { firstLoadKB: first, afterFullScrollKB: full, big, scripts }; console.log(vn, path, JSON.stringify(out[`${vn} ${path}`], null, 0).slice(0, 1500));
  await c.close();
}
fs.writeFileSync(OUT + 'transfer.json', JSON.stringify(out, null, 2)); await b.close();
