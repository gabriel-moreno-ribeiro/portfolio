/**
 * qa/scripts/axe.mjs - @axe-core/playwright scan of the Home page at 1440x900,
 * run AFTER a full slow scroll so lazy sections are mounted.
 * Usage: node qa/scripts/axe.mjs <outDir> [baseUrl]
 * Ex.:   node qa/scripts/axe.mjs qa/baseline http://localhost:5173
 */
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve(process.argv[2] || 'qa/baseline');
const BASE = process.argv[3] || process.env.QA_BASE_URL || 'http://localhost:5173';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
const notes = [];

await page.goto(BASE + '/', { waitUntil: 'load', timeout: 60000 });
try { await page.waitForLoadState('networkidle', { timeout: 25000 }); } catch { notes.push('networkidle did not settle within 25s'); }
await page.waitForTimeout(1500);

await page.evaluate(async () => {
  const nap = (ms) => new Promise((r) => setTimeout(r, ms));
  const maxY = () => Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) - window.innerHeight;
  let y = 0, steps = 0;
  while (y < maxY() && steps < 500) { y = Math.min(y + 300, maxY()); window.scrollTo({ top: y, behavior: 'instant' }); steps++; await nap(120); }
});
await page.waitForTimeout(1500);
await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
await page.waitForTimeout(1000);

const results = await new AxeBuilder({ page })
  .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
  .analyze();

const byImpact = { critical: [], serious: [], moderate: [], minor: [], null: [] };
for (const v of results.violations) {
  (byImpact[v.impact || 'null'] = byImpact[v.impact || 'null'] || []).push({
    id: v.id, impact: v.impact, help: v.help, helpUrl: v.helpUrl,
    nodes: v.nodes.length,
    exampleSelector: v.nodes[0] ? [].concat(v.nodes[0].target).join(' ') : null,
    exampleHtml: v.nodes[0] ? String(v.nodes[0].html).slice(0, 200) : null,
    allSelectors: v.nodes.slice(0, 12).map((n) => [].concat(n.target).join(' ')),
    failureSummary: v.nodes[0] ? String(v.nodes[0].failureSummary || '').replace(/\s+/g, ' ').slice(0, 300) : null,
  });
}

const out = {
  generatedAt: new Date().toISOString(), url: BASE + '/', viewport: '1440x900',
  state: 'after full slow scroll, back at top',
  axeVersion: results.testEngine ? results.testEngine.version : null,
  tags: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'],
  counts: {
    violations: results.violations.length,
    violationNodes: results.violations.reduce((s, v) => s + v.nodes.length, 0),
    passes: results.passes.length, incomplete: results.incomplete.length,
    critical: byImpact.critical.length, serious: byImpact.serious.length,
    moderate: byImpact.moderate.length, minor: byImpact.minor.length,
  },
  byImpact,
  incomplete: results.incomplete.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, exampleSelector: v.nodes[0] ? [].concat(v.nodes[0].target).join(' ') : null })),
  notes,
  raw: results.violations,
};
fs.writeFileSync(path.join(OUT, 'axe.json'), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out.counts, null, 1));
for (const imp of ['critical', 'serious', 'moderate', 'minor']) {
  for (const v of byImpact[imp]) console.log(imp.toUpperCase() + '  ' + v.id + '  nodes=' + v.nodes + '  ' + v.exampleSelector);
}
await browser.close();
