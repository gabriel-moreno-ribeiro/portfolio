// axe-core on every route, light and dark, after mounting the whole home.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const axe = readFileSync('node_modules/axe-core/axe.min.js', 'utf8');
const b = await chromium.launch();
const routes = (process.env.R || '/,/work/hibeex,/work/candela,/library,/news,/blog,/blog/drake-equation,/files,/one-pager,/obrigado,/story').split(',');
const W = +(process.env.W || 1440);
for (const dark of [false, true]) for (const r of routes) {
  const ctx = await b.newContext({ viewport: { width: W, height: 900 }, reducedMotion: 'reduce' });
  await ctx.addInitScript(d => { sessionStorage.setItem('showedToast', 'true'); if (d) localStorage.setItem('darkMode', 'true'); }, dark);
  const p = await ctx.newPage();
  await p.goto('http://localhost:5173' + r, { waitUntil: 'load' });
  await p.waitForTimeout(2000);
  let h = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h + 1500; y += 800) { await p.evaluate(y => scrollTo({ top: y, behavior: 'instant' }), y); await p.waitForTimeout(150); h = await p.evaluate(() => document.documentElement.scrollHeight); }
  await p.waitForTimeout(1500);
  await p.addScriptTag({ content: axe });
  const res = await p.evaluate(async () => {
    const out = await window.axe.run(document, { resultTypes: ['violations'], runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'best-practice'] } });
    return out.violations.map(v => ({ id: v.id, impact: v.impact, n: v.nodes.length, nodes: v.nodes.slice(0, 4).map(n => n.target.join(' ').slice(0, 70) + (n.any[0]?.data?.contrastRatio ? ` ${n.any[0].data.contrastRatio}:1 fg${n.any[0].data.fgColor} bg${n.any[0].data.bgColor} ${n.any[0].data.fontSize}` : '')) }));
  });
  console.log(`== ${r} ${dark ? 'dark' : 'light'}`);
  for (const v of res) console.log(`  ${v.impact} ${v.id} x${v.n}: ${v.nodes.join(' | ')}`);
  await ctx.close();
}
await b.close();
