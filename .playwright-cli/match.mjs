import { chromium } from 'playwright';
const boxes = [
  [5, 864, 328, 288, 132], [6, 870, 259, 483, 98], [7, 304, 140, 1112, 510],
  [8, 296, 422, 1118, 158], [9, 376, 203, 923, 437], [10, 276, 101, 1158, 150],
];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:5173/#contact', { waitUntil: 'networkidle' });
await page.waitForTimeout(2500);
const els = await page.evaluate(() => {
  const out = [];
  const secOf = (el) => el.closest('section, .numbers-and-stats, .background-section, .hero-section, #moments, footer, .find-my-work, .research-section, .skills, #work-experience')?.id || el.closest('section, div[class]')?.className?.toString().slice(0, 30) || '?';
  for (const el of document.querySelectorAll('main *')) {
    const r = el.getBoundingClientRect();
    if (r.width < 60 || r.height < 30 || r.width > 1300) continue;
    if (!el.className || typeof el.className !== 'string') continue;
    out.push({ w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.left), y: Math.round(r.top + window.scrollY), tag: el.tagName, cls: el.className.split(' ').slice(0, 2).join('.'), sec: secOf(el), text: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 50) });
  }
  return out;
});
for (const [n, X, Y, W, H] of boxes) {
  const cands = els.map((e) => ({ e, score: Math.abs(e.w - W) + Math.abs(e.h - H) + Math.abs(e.x - X) * 0.5 })).sort((a, b) => a.score - b.score).slice(0, 4);
  console.log(`\n#${n} box ${W}x${H} @x${X}:`);
  cands.forEach(({ e, score }) => console.log(`   ${String(Math.round(score)).padStart(4)}  ${e.w}x${e.h} @x${e.x} y${e.y}  <${e.tag.toLowerCase()}.${e.cls}> [${e.sec}] "${e.text}"`));
}
await browser.close();
