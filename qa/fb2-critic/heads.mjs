import { chromium } from 'playwright';
const OUT = 'qa/fb2-critic';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
const total = await p.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < total + 6000; y += 600) { await p.evaluate((v) => scrollTo(0, v), y); await p.waitForTimeout(80); }
await p.waitForTimeout(1500);
const heads = await p.evaluate(() => [...document.querySelectorAll('h1,h2,h3,.section-title')].map((h,i) => { h.setAttribute('data-hq', i); const cs=getComputedStyle(h); return { i, tag:h.tagName, sec: h.closest('section,[id]')?.id, text: h.textContent.trim().slice(0,80), cls: h.className, font: cs.fontFamily.slice(0,30), size: cs.fontSize, weight: cs.fontWeight, html: h.innerHTML.slice(0,200) }; }));
console.log(JSON.stringify(heads.filter(h=>/section-title|title/i.test(h.cls)||h.tag!=='H3'), null, 0).replace(/},{/g,'},\n{'));
for (const h of heads.filter(h=>/section-title/.test(h.cls))) { const el = await p.$(`[data-hq="${h.i}"]`); await el.evaluate(e=>{const r=e.getBoundingClientRect(); scrollTo(0, r.top+scrollY-160);}); await p.waitForTimeout(1000); await p.screenshot({ path: `${OUT}/title-${h.i}.png` }); }
await b.close();
