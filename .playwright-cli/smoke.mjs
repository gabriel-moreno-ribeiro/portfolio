import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
const failed = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 160)); });
page.on('pageerror', (e) => errors.push('PAGEERROR ' + String(e).slice(0, 160)));
page.on('requestfailed', (r) => failed.push(r.url().slice(0, 120)));
page.on('response', (r) => { if (r.status() >= 400) failed.push(r.status() + ' ' + r.url().slice(0, 120)); });

await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
// rola devagar até o fim para montar tudo
const total = await page.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < total; y += 400) { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(80); }
await page.waitForTimeout(1500);

const info = await page.evaluate(() => {
  const q = (s) => document.querySelector(s);
  const sec = (id) => { const el = document.getElementById(id); return el ? Math.round(el.getBoundingClientRect().height) : null; };
  return {
    rail: !!q('nav[aria-label="Page sections"]'),
    railItems: document.querySelectorAll('nav[aria-label="Page sections"] a, nav[aria-label="Page sections"] button').length,
    heights: { background: sec('background'), work: sec('work'), research: sec('research'), skills: sec('skills'), experience: sec('work-experience'), contact: sec('contact') },
    expStops: document.querySelectorAll('#work-experience ol li').length,
    expPoster: !!q('#work-experience img[src*="/assets/car/"]'),
    expIndex: !!q('nav[aria-label="Experience stops"]'),
    numbersTiles: document.querySelectorAll('.numbers-and-stats [class*="tile"], .numbers-and-stats li').length,
    skillsGrid: document.querySelectorAll('#skills li').length,
    canvases: document.querySelectorAll('canvas').length,
    heroStatus: q('.hero-section [aria-live]')?.textContent?.trim().slice(0, 60) ?? null,
    footerLive: q('footer')?.textContent?.match(/last commit[^·]*/)?.[0]?.trim() ?? null,
    imgsNoDims: [...document.querySelectorAll('img')].filter((i) => !i.getAttribute('width') || !i.getAttribute('height')).length,
    docHeight: document.documentElement.scrollHeight,
  };
});
console.log(JSON.stringify(info, null, 1));
console.log('console errors:', errors.length); errors.slice(0, 8).forEach((e) => console.log('  ' + e));
console.log('failed/4xx:', failed.length); failed.slice(0, 8).forEach((e) => console.log('  ' + e));
await browser.close();
