/**
 * qa/scripts/r2-rail-timeline.mjs - the rail click on "Experience" landed 1174px
 * short in r2-extras and #work-experience was not in the DOM at settle. This
 * records a 100ms timeline so the cause is a measurement, not a guess:
 * scrollY, whether getElementById(id) resolves, and where the section top is.
 *
 * Usage: node qa/scripts/r2-rail-timeline.mjs <outDir> [baseUrl]
 * Writes r2-rail-timeline.json.
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve(process.argv[2] || 'qa/r2');
const BASE = process.argv[3] || 'http://localhost:4173';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const out = { generatedAt: new Date().toISOString(), baseUrl: BASE, runs: [] };

for (const { label, id } of [{ label: 'Experience', id: 'work-experience' }, { label: 'Skills', id: 'skills' }, { label: 'Cool Things', id: 'work' }, { label: 'Contact', id: 'contact' }]) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'load', timeout: 60000 });
  try { await page.waitForLoadState('networkidle', { timeout: 20000 }); } catch { /* ignore */ }
  await page.waitForTimeout(2000);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(400);

  const timeline = await page.evaluate(async ({ lbl, sid }) => {
    const nap = (t) => new Promise((r) => setTimeout(r, t));
    const snap = () => {
      const el = document.getElementById(sid);
      const r = el ? el.getBoundingClientRect() : null;
      return {
        y: Math.round(window.scrollY),
        idInDom: !!el,
        tag: el ? el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).split(' ')[0] : '') : null,
        top: r ? Math.round(r.top) : null,
        h: r ? Math.round(r.height) : null,
        docH: document.documentElement.scrollHeight,
        onScreen: r ? (r.top < window.innerHeight - 40 && r.bottom > 40) : false,
      };
    };
    const btns = [...document.querySelectorAll('nav.section-rail button')];
    const b = btns.find((x) => (x.textContent || '').trim() === lbl);
    if (!b) return { error: 'button not found', labels: btns.map((x) => (x.textContent || '').trim()) };
    const rows = [Object.assign({ ms: 0 }, snap())];
    const t0 = performance.now();
    b.click();
    for (let i = 1; i <= 70; i++) { await nap(100); rows.push(Object.assign({ ms: Math.round(performance.now() - t0) }, snap())); }
    return { rows };
  }, { lbl: label, sid: id });

  const rows = timeline.rows || [];
  const missing = rows.filter((r) => !r.idInDom);
  const last = rows[rows.length - 1] || {};
  out.runs.push({
    label, id, error: timeline.error || null, labels: timeline.labels,
    startDocHeight: rows[0] ? rows[0].docH : null, endDocHeight: last.docH,
    finalScrollY: last.y, finalSectionTop: last.top, finalOnScreen: last.onScreen,
    shortfallPx: last.top != null ? last.top : null,
    msIdMissingFrom: missing.length ? missing[0].ms : null,
    msIdMissingUntil: missing.length ? missing[missing.length - 1].ms : null,
    msIdMissingTotal: missing.length * 100,
    scrollStoppedAtMs: (() => { for (let i = 4; i < rows.length; i++) if (rows[i].y === rows[i - 1].y && rows[i].y === rows[i - 2].y && rows[i].y === rows[i - 3].y) return rows[i].ms; return null; })(),
    timeline: rows.filter((r, i) => i % 3 === 0 || !r.idInDom).map((r) => `${r.ms}ms y=${r.y} id=${r.idInDom ? 'yes' : 'NO'} top=${r.top} docH=${r.docH}`),
  });
  await ctx.close();
}

fs.writeFileSync(path.join(OUT, 'r2-rail-timeline.json'), JSON.stringify(out, null, 2));
for (const r of out.runs) {
  console.log(`== ${r.label} (#${r.id}) docH ${r.startDocHeight} -> ${r.endDocHeight}`);
  console.log(`   scroll stopped at ${r.scrollStoppedAtMs}ms, finalY=${r.finalScrollY}, section top=${r.finalSectionTop}px, onScreen=${r.finalOnScreen}`);
  console.log(`   id absent from DOM: ${r.msIdMissingTotal}ms (from ${r.msIdMissingFrom} to ${r.msIdMissingUntil})`);
}
await browser.close();
