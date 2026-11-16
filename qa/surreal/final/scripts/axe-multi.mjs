import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
import { launch, BASE, OUT, VPS, slowScroll } from './common.mjs';
const PAGES = ['/', '/work/hibeex', '/work/candela', '/work/gsat', '/story', '/blog'];
const res = {};
const browser = await launch();
for (const [vn, vp] of Object.entries(VPS)) for (const theme of ['light', 'dark']) for (const path of PAGES) {
  const ctx = await browser.newContext({ viewport: vp, isMobile: vn === 'mobile', hasTouch: vn === 'mobile' });
  await ctx.addInitScript((t) => { try { localStorage.setItem('darkMode', String(t === 'dark')); } catch {} }, theme);
  const page = await ctx.newPage();
  await page.goto(BASE + path, { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(2500);
  await slowScroll(page, 300, 120);
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForTimeout(800);
  const theme_ = await page.evaluate(() => document.documentElement.getAttribute('data-theme') || document.body.getAttribute('data-theme'));
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).analyze();
  res[`${vn} ${theme} ${path}`] = { dataTheme: theme_, violations: r.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, sel: v.nodes.slice(0, 5).map((n) => [].concat(n.target).join(' ')), summary: String(v.nodes[0]?.failureSummary || '').replace(/\s+/g, ' ').slice(0, 250) })), incomplete: r.incomplete.map((v) => v.id) };
  console.log(`${vn} ${theme} ${path}`.padEnd(32), 'theme=' + theme_, 'violations', r.violations.length, r.violations.map((v) => v.id + ':' + v.nodes.length).join(','));
  await ctx.close();
}
await browser.close();
fs.writeFileSync(OUT + 'axe.json', JSON.stringify(res, null, 2));
