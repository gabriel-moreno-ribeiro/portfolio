import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
await page.locator('#research').scrollIntoViewIfNeeded();
await page.waitForTimeout(600);
const card = page.locator('.research-card').last();
await card.hover();
await page.waitForTimeout(500);
const preview = await page.evaluate(() => {
  const p = document.querySelector('.research-card__preview');
  if (!p) return null;
  const cs = getComputedStyle(p);
  const r = p.getBoundingClientRect();
  return { opacity: cs.opacity, w: Math.round(r.width), h: Math.round(r.height), hidden: p.getAttribute('aria-hidden') };
});
await page.screenshot({ path: 'C:/portfolio-gabriel/qa/dev-showcase/research-hover-1440.png' });

// carousel autoplay pause on hover
await page.locator('.find-my-work').scrollIntoViewIfNeeded();
await page.waitForTimeout(400);
const box = await page.locator('.featured-card').first().boundingBox();
await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
await page.waitForTimeout(300);
const before = await page.locator('.media-carousel').first().locator('.carousel-thumb.is-active').getAttribute('aria-label');
await page.waitForTimeout(7000);
const after = await page.locator('.media-carousel').first().locator('.carousel-thumb.is-active').getAttribute('aria-label');

// repos link text
await page.locator('div.numbers-and-stats').scrollIntoViewIfNeeded();
await page.waitForTimeout(1500);
const link = await page.evaluate(() => {
  const a = document.querySelector('.now-tile__link');
  const r = a?.getBoundingClientRect();
  return a ? { text: a.textContent.trim(), h: Math.round(r.height) } : null;
});
await page.screenshot({ path: 'C:/portfolio-gabriel/qa/dev-showcase/numbers-final-1440.png' });
console.log(JSON.stringify({ preview, pauseOnHover: { before, after, paused: before === after }, link }, null, 1));
await browser.close();
