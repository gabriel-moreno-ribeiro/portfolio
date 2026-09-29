// qa/story/axe.mjs - @axe-core/playwright scan of /story in both themes, after a full scroll.
// Usage: node qa/story/axe.mjs <before|after> [baseUrl]
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
import path from 'node:path';

const TAG = process.argv[2] || 'before';
const BASE = process.argv[3] || 'http://localhost:5173';
const OUT = path.resolve('qa/story');
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const report = { tag: TAG, generatedAt: new Date().toISOString(), runs: [] };

for (const vp of [{ w: 1440, h: 900 }, { w: 390, h: 844 }]) {
  for (const theme of ['light', 'dark']) {
    const ctx = await browser.newContext({ viewport: { width: vp.w, height: vp.h }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.goto(BASE + '/story', { waitUntil: 'load', timeout: 60000 });
    try { await page.waitForLoadState('networkidle', { timeout: 15000 }); } catch { /* keep going */ }
    await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
    await page.evaluate(async () => {
      const nap = (ms) => new Promise((r) => setTimeout(r, ms));
      const maxY = () => document.documentElement.scrollHeight - window.innerHeight;
      let y = 0, steps = 0;
      while (y < maxY() && steps < 400) { y = Math.min(y + 350, maxY()); window.scrollTo({ top: y, behavior: 'instant' }); steps++; await nap(140); }
      await nap(1200);
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
    await page.waitForTimeout(4500);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'])
      .analyze();
    const violations = results.violations.map((v) => ({
      id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length,
      selectors: v.nodes.slice(0, 8).map((n) => [].concat(n.target).join(' ')),
      summary: v.nodes[0] ? String(v.nodes[0].failureSummary || '').replace(/\s+/g, ' ').slice(0, 260) : null,
    }));
    const count = (impact) => violations.filter((v) => v.impact === impact).length;
    const run = {
      viewport: `${vp.w}x${vp.h}`, theme,
      critical: count('critical'), serious: count('serious'), moderate: count('moderate'), minor: count('minor'),
      violations,
    };
    report.runs.push(run);
    console.log(run.viewport, theme, 'critical', run.critical, 'serious', run.serious, 'moderate', run.moderate, 'minor', run.minor);
    for (const v of violations) console.log('   ', v.impact, v.id, 'x' + v.nodes, v.selectors.slice(0, 3).join(' | '));
    await ctx.close();
  }
}

await browser.close();
fs.writeFileSync(path.join(OUT, `${TAG}-axe.json`), JSON.stringify(report, null, 2));
