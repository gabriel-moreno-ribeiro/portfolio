import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
for (let y = 0; y < 14000; y += 400) { await p.evaluate((v) => scrollTo(0, v), y); await p.waitForTimeout(60); }
console.log(JSON.stringify(await p.evaluate(() => {
  const s = document.querySelector('#skills');
  return { skillsHTML: s ? s.outerHTML.slice(0, 400) : null, headings: [...document.querySelectorAll('main h1, main h2, main [class*="title"]')].filter(h=>!h.closest('.featured-card')&&!h.closest('.exp__card')).map((h) => ({ tag: h.tagName, cls: String(h.className).slice(0,60), text: h.textContent.trim().slice(0, 50), sec: h.closest('[id]')?.id, align: getComputedStyle(h).textAlign, fs: getComputedStyle(h).fontSize })) };
}), null, 1));
await b.close();
