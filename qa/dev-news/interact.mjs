// Photo click target, keyboard reach and reduced-motion final state on /news.
import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
const p = await ctx.newPage();
await p.goto('http://localhost:5173/news', { waitUntil: 'load' });
await p.waitForTimeout(1000);
const r = await p.evaluate(() => {
  const img = document.querySelector('.news__photo img');
  img.scrollIntoView({ block: 'center' });
  const b = img.getBoundingClientRect();
  const hit = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2);
  const hidden = [...document.querySelectorAll('.hl-reveal')].filter((e) => getComputedStyle(e).opacity !== '1').length;
  return { photoHit: hit?.closest('a')?.getAttribute('aria-label'), hiddenRevealsReduced: hidden,
    links: [...document.querySelectorAll('.news a')].map((a) => a.getAttribute('aria-label') || a.textContent.trim()).length };
});
let tabs = 0, reached = false;
for (; tabs < 40 && !reached; tabs++) { await p.keyboard.press('Tab'); reached = await p.evaluate(() => document.activeElement?.classList.contains('news__link--stretch')); }
console.log(JSON.stringify({ ...r, firstCardLinkAfterTabs: reached ? tabs : null }));
await b.close();
