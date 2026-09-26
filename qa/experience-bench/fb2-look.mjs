import { chromium } from 'playwright';
const w = Number(process.argv[2] ?? 1280);
const sel = process.argv[3] ?? '#exp-olympic-club';
const out = process.argv[4] ?? 'C:/Users/gabri/AppData/Local/Temp/claude/c--portfolio-gabriel/4e06bb4a-bc95-43f9-bfd0-6bdcdd0e9909/scratchpad/look.png';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: w, height: w < 600 ? 844 : 800 } });
await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
const total = await p.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < total; y += 600) { await p.evaluate((v) => scrollTo(0, v), y); await p.waitForTimeout(50); }
await p.waitForSelector('#work-experience .exp__car');
await p.evaluate((s) => { const el = document.querySelector(s); const r = el.getBoundingClientRect(); scrollTo(0, r.top + scrollY + r.height / 2 - innerHeight * 0.45); }, sel);
await p.waitForTimeout(3500);
console.log(JSON.stringify(await p.evaluate(() => {
  const s = document.querySelector('#work-experience').getBoundingClientRect();
  const par = document.querySelector('#work-experience').parentElement.getBoundingClientRect();
  return { secL: s.left, secW: s.width, parL: par.left, parW: par.width, vw: innerWidth };
})));
await p.screenshot({ path: out });
await b.close();
