/**
 * shots.mjs — prova visual antes/depois da Home.
 *
 * Para 1440x900 e 390x844: monta a página inteira, e captura o viewport no topo e em 3 pontos
 * da rolagem (25%, 50%, 75%). Faz duas séries:
 *   motion  — movimento normal (para olho humano; marquee/slideshow variam de quadro a quadro)
 *   still   — prefers-reduced-motion (estado final parado: comparável pixel a pixel)
 * Na série still grava também a geometria e as cores de cada elemento com classe (geo-*.json).
 *
 * Uso: node qa/smooth/shots.mjs <rotulo>
 */
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const LABEL = process.argv[2] ?? 'before';
const URL = 'http://localhost:5173/';
const OUT = path.join(HERE, 'shots', LABEL);
fs.mkdirSync(OUT, { recursive: true });

const VIEWPORTS = {
  1440: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  390: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
};

async function mountAll(page) {
  let y = 0;
  let last = -1;
  for (let i = 0; i < 200; i++) {
    const at = await page.evaluate((v) => { window.scrollTo({ top: v, behavior: 'instant' }); return Math.round(window.scrollY); }, y);
    await page.waitForTimeout(150);
    if (at === last && at < y) break;
    last = at;
    y += 500;
  }
  await page.waitForTimeout(1500);
}

const browser = await chromium.launch();
const errors = {};
for (const vp of [1440, 390]) {
  for (const series of ['still', 'motion']) {
    const ctx = await browser.newContext({ ...VIEWPORTS[vp], reducedMotion: series === 'still' ? 'reduce' : 'no-preference' });
    const page = await ctx.newPage();
    const errs = [];
    page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 300)); });
    page.on('pageerror', (e) => errs.push(`pageerror: ${String(e).slice(0, 300)}`));
    await page.goto(URL, { waitUntil: 'load' });
    await page.waitForTimeout(2000);
    await mountAll(page);
    await mountAll(page);
    const max = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    const points = [0, 0.25, 0.5, 0.75].map((f) => Math.round(max * f));
    for (let i = 0; i < points.length; i++) {
      await page.evaluate((v) => window.scrollTo({ top: v, behavior: 'instant' }), points[i]);
      await page.waitForTimeout(1200);
      await page.screenshot({ path: path.join(OUT, `${vp}-${series}-${i}.png`) });
    }
    if (series === 'still') {
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await page.waitForTimeout(800);
      const geo = await page.evaluate(() => {
        const rows = [];
        const seen = new Map();
        for (const el of document.querySelectorAll('.app [class], .app [id]')) {
          if (el.closest('svg') && el.tagName !== 'svg') continue;
          const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).slice(0, 3).join('.') : '';
          const name = `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${cls ? '.' + cls : ''}`;
          const n = seen.get(name) ?? 0;
          seen.set(name, n + 1);
          const r = el.getBoundingClientRect();
          const cs = getComputedStyle(el);
          rows.push({
            key: `${name}[${n}]`,
            x: Math.round(r.left + scrollX),
            y: Math.round(r.top + scrollY),
            w: Math.round(r.width),
            h: Math.round(r.height),
            color: cs.color,
            bg: cs.backgroundColor,
            opacity: cs.opacity,
            font: `${cs.fontSize}/${cs.fontWeight}`,
            display: cs.display,
            visibility: cs.visibility,
          });
        }
        return { height: document.documentElement.scrollHeight, width: document.documentElement.scrollWidth, rows };
      });
      fs.writeFileSync(path.join(OUT, `geo-${vp}.json`), JSON.stringify(geo));
      console.log(`${vp} still: altura=${geo.height} largura=${geo.width} elementos=${geo.rows.length} pontos=${points.join(',')}`);
    }
    errors[`${vp}-${series}`] = errs;
    await ctx.close();
  }
}
fs.writeFileSync(path.join(OUT, 'console-errors.json'), JSON.stringify(errors, null, 2));
console.log('erros de console:', JSON.stringify(Object.fromEntries(Object.entries(errors).map(([k, v]) => [k, v.length]))));
await browser.close();
