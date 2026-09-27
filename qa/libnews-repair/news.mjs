// Repair check for /news: screenshots 1440/390 light/dark + axe wcag2aa + layout gaps.
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import fs from 'node:fs';
const OUT = 'C:/portfolio-gabriel/qa/libnews-repair';
const b = await chromium.launch();
const out = [];
for (const w of [1440, 390]) for (const theme of ['light', 'dark']) {
  const ctx = await b.newContext({ viewport: { width: w, height: w === 1440 ? 900 : 844 }, isMobile: w === 390, hasTouch: w === 390 });
  await ctx.addInitScript((d) => { try { localStorage.setItem('darkMode', JSON.stringify(d)); } catch {} }, theme === 'dark');
  const p = await ctx.newPage();
  await p.goto('http://localhost:5173/news', { waitUntil: 'load' });
  await p.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
  await p.evaluate(async () => { for (let y = 0; y < document.documentElement.scrollHeight; y += 250) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 250)); } window.scrollTo(0, 0); await new Promise(r => setTimeout(r, 800)); });
  const tag = `news-${w}-${theme}`;
  await p.screenshot({ path: `${OUT}/${tag}-viewport.png` });
  await p.screenshot({ path: `${OUT}/${tag}-full.png`, fullPage: true });
  await p.evaluate(() => document.querySelector('.news__year').scrollIntoView({ block: 'start' }));
  await p.waitForTimeout(700);
  await p.screenshot({ path: `${OUT}/${tag}-2026.png` });
  await p.evaluate(() => window.scrollTo(0, 0));
  const axe = await new AxeBuilder({ page: p }).withTags(['wcag2a', 'wcag2aa']).analyze();
  const layout = await p.evaluate(() => [...document.querySelectorAll('.news__year')].map((y) => {
    const list = y.querySelector('.news__entries').getBoundingClientRect();
    const items = [...y.querySelectorAll('.news__entry')].map((e) => { const r = e.getBoundingClientRect(); return { cls: e.className, x: Math.round(r.x - list.x), w: Math.round(r.width), h: Math.round(r.height) }; });
    return { year: y.querySelector('.news__year-label').textContent, listW: Math.round(list.width), items };
  }));
  const link = await p.evaluate(() => { const e = document.querySelector('.news__featured .news__link-text'); const cs = getComputedStyle(e); return { color: cs.color, bg: getComputedStyle(document.body).backgroundColor, featuredBg: getComputedStyle(document.querySelector('.news__featured')).backgroundColor }; });
  out.push({ w, theme, violations: axe.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.map((n) => n.target.join(' ') + ' | ' + (n.any[0]?.message || '')) })), layout, link });
  await ctx.close();
}
fs.writeFileSync(`${OUT}/news.json`, JSON.stringify(out, null, 2));
console.log(JSON.stringify(out.map((o) => ({ w: o.w, t: o.theme, v: o.violations, link: o.link, y2026: o.layout[0] })), null, 1));
await b.close();
