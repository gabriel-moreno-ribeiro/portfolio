import { chromium } from 'playwright';
import fs from 'node:fs';
const B = process.argv[2] || 'http://localhost:5173';
const br = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const out = {};

// 1) count-up over time in #numbers (replaces probe-extras' broken heuristic)
for (const reduced of [false, true]) {
  const c = await br.newContext(reduced ? { viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' } : { viewport: { width: 1440, height: 900 } });
  const p = await c.newPage();
  await p.goto(B + '/', { waitUntil: 'load', timeout: 60000 });
  await p.waitForTimeout(2500);
  const top = await p.evaluate(() => { const e = document.querySelector('#numbers'); return e ? Math.round(e.getBoundingClientRect().top + scrollY) : null; });
  await p.evaluate((t) => scrollTo({ top: Math.max(0, t - 200), behavior: 'instant' }), top);
  const samples = [];
  const read = () => p.evaluate(() => {
    const hero = document.querySelector('#numbers .stat-tile--hero');
    const all = [...document.querySelectorAll('#numbers .stat-tile__value, #numbers .stat-tile [class*=value]')].slice(0, 8).map((e) => (e.textContent || '').trim());
    return { heroText: hero ? (hero.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 60) : null, values: all, t: Math.round(performance.now()) };
  });
  for (const wait of [0, 150, 300, 600, 1000, 1500, 2500, 4000]) { await p.waitForTimeout(wait === 0 ? 40 : wait - (samples.length ? samples[samples.length - 1].afterMs : 0)); samples.push(Object.assign({ afterMs: wait }, await read())); }
  out['countUp' + (reduced ? 'Reduced' : 'Normal')] = { numbersTop: top, samples };
  await c.close();
}

// 2) .exp__card-cta styling over time while the card turns on (dark + light)
for (const theme of ['light', 'dark']) {
  const c = await br.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await c.newPage();
  await p.goto(B + '/', { waitUntil: 'load', timeout: 60000 });
  await p.waitForTimeout(2000);
  await p.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
  const geo = await p.evaluate(async () => {
    const nap = (ms) => new Promise((r) => setTimeout(r, ms));
    const my = () => document.documentElement.scrollHeight - innerHeight;
    let y = 0, n = 0;
    while (y < my() && n < 400) { y = Math.min(y + 300, my()); scrollTo({ top: y, behavior: 'instant' }); n++; await nap(90); }
    scrollTo({ top: 0, behavior: 'instant' });
    await nap(600);
    const e = document.querySelector('#work-experience'); const r = e.getBoundingClientRect();
    const t = r.top + scrollY;
    return { s: Math.round(Math.min(t, my())), e: Math.round(Math.min(t + r.height - innerHeight, my())) };
  });
  const rows = [];
  for (const pct of [25, 50, 75, 100]) {
    await p.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), Math.round(geo.s + (geo.e - geo.s) * pct / 100));
    for (const wait of [80, 400, 1200]) {
      await p.waitForTimeout(wait);
      rows.push(Object.assign({ pct, afterMs: wait }, await p.evaluate(() => {
        const list = [...document.querySelectorAll('#work-experience a')].filter((a) => { const r = a.getBoundingClientRect(); return r.width > 0 && r.bottom > 0 && r.top < innerHeight; });
        return {
          links: list.map((a) => { const cs = getComputedStyle(a); const r = a.getBoundingClientRect(); return { cls: String(a.className || '').slice(0, 40), text: (a.textContent || '').trim().slice(0, 24), color: cs.color, border: cs.borderTopWidth + ' ' + cs.borderTopColor, rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } }; }),
          sectionCta: (() => { const a = document.querySelector('.exp__cta'); if (!a) return null; const cs = getComputedStyle(a); const r = a.getBoundingClientRect(); return { color: cs.color, border: cs.borderTopWidth + ' ' + cs.borderTopColor, rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } }; })(),
        };
      })));
    }
  }
  out['expLinks_' + theme] = { geo, rows };
  await c.close();
}

// 3) exact sizes of the sub-24px targets
{
  const c = await br.newContext({ viewport: { width: 1440, height: 900 } });
  const p = await c.newPage();
  await p.goto(B + '/', { waitUntil: 'load', timeout: 60000 });
  await p.waitForTimeout(2000);
  await p.evaluate(async () => { const nap = (ms) => new Promise((r) => setTimeout(r, ms)); const my = () => document.documentElement.scrollHeight - innerHeight; let y = 0, n = 0; while (y < my() && n < 400) { y = Math.min(y + 300, my()); scrollTo({ top: y, behavior: 'instant' }); n++; await nap(90); } scrollTo({ top: 0, behavior: 'instant' }); });
  await p.waitForTimeout(900);
  out.smallTargetDetail = await p.evaluate(() => {
    const sel = 'a[href],button,input:not([type=hidden]),select,textarea,[role=button],[role=link],[tabindex]:not([tabindex="-1"])';
    const rows = [];
    for (const el of document.querySelectorAll(sel)) {
      const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || r.width === 0 || r.height === 0) continue;
      if (r.width < 24 || r.height < 24) rows.push({ cls: (el.id ? '#' + el.id : '') + '.' + String(el.className || '').trim().split(/\s+/).join('.'), tag: el.tagName.toLowerCase(), size: +r.width.toFixed(1) + 'x' + +r.height.toFixed(1), text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 26), aria: el.getAttribute('aria-label') });
    }
    const groups = {};
    for (const r of rows) { const k = r.cls + ' [' + r.size + ']'; groups[k] = (groups[k] || 0) + 1; }
    return { count: rows.length, groups };
  });
  await c.close();
}
await br.close();
fs.writeFileSync('qa/r1/probe3.json', JSON.stringify(out, null, 2));
console.log('--- count-up normal ---');
for (const s of out.countUpNormal.samples) console.log('  +' + s.afterMs + 'ms hero=' + JSON.stringify(s.heroText) + ' values=' + JSON.stringify(s.values));
console.log('--- count-up reduce ---');
for (const s of out.countUpReduced.samples) console.log('  +' + s.afterMs + 'ms hero=' + JSON.stringify(s.heroText) + ' values=' + JSON.stringify(s.values));
for (const t of ['light', 'dark']) {
  console.log('--- exp links ' + t + ' (geo ' + JSON.stringify(out['expLinks_' + t].geo) + ') ---');
  for (const r of out['expLinks_' + t].rows) console.log('  ' + r.pct + '% +' + r.afterMs + 'ms sectionCta=' + JSON.stringify(r.sectionCta) + ' links=' + JSON.stringify(r.links));
}
console.log('--- small targets detail ---');
console.log(JSON.stringify(out.smallTargetDetail, null, 1));
