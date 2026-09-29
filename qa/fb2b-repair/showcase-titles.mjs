// Mede o espaço sob cada título de seção e captura cada um. Uso: node qa/fb2b-repair/showcase-titles.mjs <tag>
import { chromium } from 'playwright';
const tag = process.argv[2] ?? 'after';
const OUT = 'qa/fb2b-repair';
const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
const total = await page.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < total; y += 600) { await page.evaluate((v) => scrollTo(0, v), y); await page.waitForTimeout(80); }
await page.waitForSelector('#research .research-grid', { timeout: 30000 });
await page.waitForSelector('#work-experience .exp__car', { timeout: 30000 });
await page.waitForTimeout(1200);
const ids = ['#work', '#numbers', '#research', '#work-experience'];
const res = await page.evaluate((ids) => ids.map((id) => {
  const s = document.querySelector(id); if (!s) return { id, missing: true };
  const h = s.querySelector('h2.section-title') ?? s.querySelector('h2'); const hb = h.getBoundingClientRect();
  // próximo elemento visível abaixo do título
  let next = h.nextElementSibling ?? h.parentElement.nextElementSibling;
  const nb = next?.getBoundingClientRect();
  const before = getComputedStyle(s, '::before');
  return { id, title: h.textContent.trim(), mb: getComputedStyle(h).marginBottom,
    next: next ? `${next.tagName.toLowerCase()}.${next.className}` : null, nextText: next?.textContent.trim().slice(0, 50),
    gap: nb ? Math.round(nb.top - hb.bottom) : null, beforeBg: before.content !== 'none' ? before.backgroundImage.slice(0, 40) : 'none',
    orcid: !!s.querySelector('[href*="orcid"]'), pill: !!s.querySelector('.terminal-launch') };
}), ids);
console.log(JSON.stringify(res, null, 1));
for (const id of ids) {
  const h = page.locator(`${id} h2.section-title`).first();
  await h.scrollIntoViewIfNeeded(); await page.evaluate(() => scrollBy(0, -200)); await page.waitForTimeout(600);
  await page.screenshot({ path: `${OUT}/showcase-${tag}-${id.slice(1)}.png` });
}
const orcid = page.locator('#research a[href*="orcid"]');
if (await orcid.count()) { await orcid.scrollIntoViewIfNeeded(); await page.evaluate(() => scrollBy(0, 300)); await page.waitForTimeout(600); await page.screenshot({ path: `${OUT}/showcase-${tag}-research-end.png` }); }
await b.close();
