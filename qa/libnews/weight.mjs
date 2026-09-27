// Transfer breakdown per route (dev server, unbundled) + engine diagnostics + reduced-motion card check.
import { chromium } from 'playwright';
import fs from 'node:fs';
const b = await chromium.launch({ args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=swiftshader'] });
const out = {};
for (const route of ['/library', '/news']) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  await cdp.send('Network.enable');
  await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  const urls = {}; const sizes = {};
  cdp.on('Network.responseReceived', (e) => { urls[e.requestId] = { url: e.response.url, type: e.type }; });
  cdp.on('Network.loadingFinished', (e) => { sizes[e.requestId] = e.encodedDataLength; });
  await p.goto('http://localhost:5173' + route, { waitUntil: 'load' });
  if (route === '/library') await p.waitForSelector('.library--ready', { timeout: 60000 });
  await p.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 100)); } });
  await p.waitForTimeout(3000);
  const rows = Object.entries(sizes).map(([id, s]) => ({ url: (urls[id]?.url || id).replace('http://localhost:5173', ''), type: urls[id]?.type, kb: Math.round(s / 1024) }));
  const byType = {}; for (const r of rows) byType[r.type] = (byType[r.type] || 0) + r.kb;
  const r = { totalKB: rows.reduce((a, x) => a + x.kb, 0), requests: rows.length, byType, top: rows.sort((a, b) => b.kb - a.kb).slice(0, 12) };
  if (route === '/library') {
    r.diag = await p.evaluate(() => ({ ...document.querySelector('.library__canvas').dataset }));
    r.reducedCardOpacity = await p.evaluate(() => getComputedStyle(document.querySelector('.library__caption-body')).opacity);
  } else {
    r.reducedHiddenText = await p.evaluate(() => [...document.querySelectorAll('main h1, main h2, main h3, main h4, main p')].filter(e => +getComputedStyle(e).opacity < 1 || +getComputedStyle(e.closest('[style]') || e).opacity < 1).length);
  }
  out[route] = r;
  console.log(route, JSON.stringify(r));
  await ctx.close();
}
fs.writeFileSync('C:/portfolio-gabriel/qa/libnews/weight.json', JSON.stringify(out, null, 2));
await b.close();
