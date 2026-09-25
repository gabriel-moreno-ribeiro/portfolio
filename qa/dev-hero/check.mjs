import { chromium } from 'playwright';
const GL = ['--use-gl=angle','--use-angle=gl','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'];
const browser = await chromium.launch({ args: GL });

async function run(label, { width, height, rm }) {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, reducedMotion: rm ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text().slice(0, 140)); });
  page.on('pageerror', e => errors.push('PAGEERROR ' + e.message.slice(0, 140)));
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(rm ? 2500 : 6000);
  const info = await page.evaluate(() => {
    const q = s => document.querySelector(s);
    const box = s => { const e = q(s); if (!e) return null; const r = e.getBoundingClientRect(); return { t: Math.round(r.top), h: Math.round(r.height), w: Math.round(r.width) }; };
    const overlap = (a, b) => { const A = q(a)?.getBoundingClientRect(), B = q(b)?.getBoundingClientRect(); if (!A || !B) return null; return !(A.bottom <= B.top || B.bottom <= A.top); };
    return {
      hero: box('.hero-section'),
      robotSlot: box('.hero-robot'),
      poster: !!q('.hero-robot__poster'),
      canvas: !!q('.robot-canvas canvas'),
      status: q('.hero-status__text')?.textContent,
      latest: q('.hero-latest')?.textContent?.trim().slice(0, 90),
      nameOverPoster: overlap('.hero-name', '.hero-robot'),
      filters: [...document.querySelectorAll('.moments__filter')].map(b => `${b.textContent}:${b.getAttribute('aria-pressed')}`),
      row1: document.querySelectorAll('.moments__row:not(.moments__row--reverse) .moments__item').length,
      row2: document.querySelectorAll('.moments__row--reverse .moments__item').length,
      cityText: q('.city-panel__headline')?.textContent,
      cityTime: q('.city-panel__time')?.textContent,
      globePoster: !!q('.globe-poster'),
      globeCanvas: !!q('canvas.globe-canvas'),
      navStatus: q('.navbar__status-text')?.textContent,
      navTabIndex: q('.navbar')?.getAttribute('tabindex'),
      navTag: q('.navbar')?.tagName,
      footerFresh: q('.footer__freshness')?.textContent?.trim().slice(0, 90),
      imgsNoDims: [...document.images].filter(i => !i.getAttribute('width') || !i.getAttribute('height')).map(i => i.className || i.src.slice(-30)),
    };
  });
  console.log('\n===', label, '===');
  console.log(JSON.stringify(info, null, 1));
  if (errors.length) console.log('CONSOLE ERRORS:', errors.slice(0, 6));
  await page.screenshot({ path: `qa/dev-hero/${label}.png`, fullPage: false });
  await ctx.close();
  return info;
}

const a = await run('1440-normal', { width: 1440, height: 900, rm: false });
const b = await run('1440-rm', { width: 1440, height: 900, rm: true });
console.log('\nHERO HEIGHT normal vs rm:', a.hero?.h, b.hero?.h, 'delta', Math.abs((a.hero?.h ?? 0) - (b.hero?.h ?? 0)));
await run('390-normal', { width: 390, height: 844, rm: false });
await browser.close();
