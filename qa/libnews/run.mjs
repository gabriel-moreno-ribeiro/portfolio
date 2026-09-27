// QA libnews: /library and /news, 1440/390, light/dark. Measures only.
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
const OUT = 'C:/portfolio-gabriel/qa/libnews';
const BASE = 'http://localhost:5173';
const b = await chromium.launch({ args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=swiftshader'] });
const results = [];

async function slowScroll(p) {
  await p.evaluate(async () => {
    const step = 300;
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 120)); }
    window.scrollTo(0, document.documentElement.scrollHeight); await new Promise(r => setTimeout(r, 600));
    window.scrollTo(0, 0); await new Promise(r => setTimeout(r, 400));
  });
}

const labelsAndPills = () => {
  const vis = (e) => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none' && parseFloat(cs.opacity) > 0.05; };
  const ownText = (e) => [...e.childNodes].filter(n => n.nodeType === 3).map(n => n.textContent).join('').trim();
  const eyebrows = [], pills = [];
  for (const e of document.querySelectorAll('body *')) {
    if (!vis(e)) continue;
    const cs = getComputedStyle(e);
    const fz = parseFloat(cs.fontSize); const ls = parseFloat(cs.letterSpacing) || 0;
    const t = (e.innerText || '').trim();
    if (cs.textTransform === 'uppercase' && ls / fz >= 0.05 && ownText(e) && t.length < 60) {
      const next = e.nextElementSibling || e.parentElement?.nextElementSibling;
      const headingAfter = !!(next && (/^H[1-6]$/.test(next.tagName) || next.querySelector?.('h1,h2,h3,h4')));
      eyebrows.push({ cls: e.className?.toString().slice(0, 60), tag: e.tagName, text: t.slice(0, 40), headingAfter });
    }
    const r = e.getBoundingClientRect();
    const br = parseFloat(cs.borderTopLeftRadius) || 0;
    const hasBox = (cs.borderTopWidth !== '0px' && cs.borderTopStyle !== 'none') || (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && cs.backgroundColor !== 'transparent');
    if (t && r.height <= 48 && r.height >= 14 && br >= r.height / 2 - 1 && hasBox && r.width < 400) pills.push({ cls: e.className?.toString().slice(0, 60), tag: e.tagName, text: t.slice(0, 30) });
  }
  return { eyebrows, pills };
};

const clsNow = (p) => p.evaluate(() => new Promise(res => { let c = 0; new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) c += e.value; }).observe({ type: 'layout-shift', buffered: true }); setTimeout(() => res(+c.toFixed(4)), 200); }));

for (const route of ['/library', '/news']) for (const w of [1440, 390]) for (const theme of ['light', 'dark']) {
  const h = w === 1440 ? 900 : 844;
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, isMobile: w === 390, hasTouch: w === 390 });
  await ctx.addInitScript((d) => { try { localStorage.setItem('darkMode', JSON.stringify(d)); } catch {} }, theme === 'dark');
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  await cdp.send('Network.enable');
  let bytes = 0; cdp.on('Network.loadingFinished', (e) => { bytes += e.encodedDataLength; });
  const consoleMsgs = [], failed = [], bad = [];
  p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) consoleMsgs.push({ type: m.type(), text: m.text().slice(0, 300) }); });
  p.on('pageerror', (e) => consoleMsgs.push({ type: 'pageerror', text: String(e).slice(0, 300) }));
  p.on('requestfailed', (r) => failed.push({ url: r.url().slice(0, 200), err: r.failure()?.errorText }));
  p.on('response', (r) => { if (r.status() >= 400) bad.push({ url: r.url().slice(0, 200), status: r.status() }); });
  const t0 = Date.now();
  await p.goto(BASE + route, { waitUntil: 'load' });
  await p.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
  const r = { route, w, theme };
  if (route === '/library') {
    r.readyMs = await p.waitForSelector('.library--ready, .library--no3d', { timeout: 60000 }).then(() => Date.now() - t0).catch(() => null);
    r.no3d = await p.locator('.library--no3d').count() > 0;
    await p.waitForTimeout(2500);
  } else {
    r.iframesOnLoad = await p.locator('iframe').count();
    await p.waitForTimeout(1500);
    r.docHeight = await p.evaluate(() => document.documentElement.scrollHeight);
    r.imgs = await p.evaluate(() => { const a = [...document.querySelectorAll('main img')]; return { total: a.length, withWH: a.filter(i => i.getAttribute('width') && i.getAttribute('height')).length, without: a.filter(i => !(i.getAttribute('width') && i.getAttribute('height'))).map(i => i.src.slice(-60)) }; });
    r.clsAtLoad = await clsNow(p);
  }
  const tag = `${route.slice(1)}-${w}-${theme}`;
  await p.screenshot({ path: `${OUT}/${tag}-viewport.png` });
  await slowScroll(p);
  if (route === '/news') {
    r.iframesAfterScroll = await p.locator('iframe').count();
    r.docHeightAfterScroll = await p.evaluate(() => document.documentElement.scrollHeight);
    r.clsTotal = await clsNow(p);
    r.dashes = await p.evaluate(() => {
      const out = []; const tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let n; while ((n = tw.nextNode())) { if (/[\u2014\u2013]/.test(n.textContent)) { const el = n.parentElement; const rr = el.getBoundingClientRect(); const cs = getComputedStyle(el); if (rr.width > 0 && cs.visibility !== 'hidden' && !el.closest('[aria-hidden="true"]')) out.push({ sel: el.tagName + '.' + (el.className || '').toString().split(' ')[0], text: n.textContent.trim().slice(0, 140) }); } }
      return out;
    });
    r.opacity0Blocks = await p.evaluate(() => [...document.querySelectorAll('main *')].filter(e => getComputedStyle(e).opacity === '0' && e.innerText?.trim()).map(e => e.className?.toString().slice(0, 50)).slice(0, 10));
  } else {
    r.dashes = await p.evaluate(() => document.querySelector('main').innerText.match(/.{0,40}[\u2014\u2013].{0,40}/g) || []);
  }
  await p.screenshot({ path: `${OUT}/${tag}-full.png`, fullPage: true });
  Object.assign(r, await p.evaluate(labelsAndPills));
  r.eyebrowCount = r.eyebrows.length; r.pillCount = r.pills.length;
  const axe = await new AxeBuilder({ page: p }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze().catch(e => ({ violations: [], err: String(e) }));
  r.axe = axe.violations.filter(v => ['serious', 'critical'].includes(v.impact)).map(v => ({ id: v.id, impact: v.impact, n: v.nodes.length, targets: v.nodes.slice(0, 6).map(n => n.target.join(' ')), summary: v.nodes[0]?.failureSummary?.slice(0, 220) }));
  r.axeIncompleteContrast = (axe.incomplete || []).filter(v => v.id === 'color-contrast').reduce((a, v) => a + v.nodes.length, 0);
  r.axeErr = axe.err;
  await p.waitForTimeout(500);
  r.transferKB = Math.round(bytes / 1024);
  r.console = consoleMsgs; r.failed = failed; r.http4xx5xx = bad;
  results.push(r);
  console.log(tag, 'ready', r.readyMs, 'axe', r.axe.map(v => v.id + ':' + v.n).join(','), 'console', consoleMsgs.length, 'failed', failed.length, 'KB', r.transferKB, 'eyebrows', r.eyebrowCount, 'pills', r.pillCount);
  await ctx.close();
}
fs.writeFileSync(`${OUT}/pass.json`, JSON.stringify(results, null, 2));
await b.close();
