import { chromium } from 'playwright';
const out = 'qa/libnews-critic';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=gl','--ignore-gpu-blocklist'] });
const errors = [];
for (const dark of [false, true]) for (const [w, h] of [[1440, 900], [390, 844]]) {
  const t = `${w}-${dark ? 'dark' : 'light'}`;
  const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: w < 500, hasTouch: w < 500 });
  await ctx.addInitScript((d) => localStorage.setItem('darkMode', JSON.stringify(d)), dark);
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errors.push(`${t} ${e.message}`));
  // LIBRARY
  await p.goto('http://localhost:5173/library', { waitUntil: 'load' });
  try { await p.waitForSelector('.library--ready', { timeout: 30000 }); } catch {}
  await p.waitForTimeout(4000);
  await p.screenshot({ path: `${out}/lib-${t}-top.png` });
  try {
    const age = p.locator('.library__age', { hasText: '14' }).first();
    if (w > 500) { await age.hover(); await p.waitForTimeout(400); await p.screenshot({ path: `${out}/lib-${t}-ruler-hover.png` }); }
    await p.locator('.library__age', { hasText: '18' }).first().click();
    await p.mouse.move(w/2, 200); await p.waitForTimeout(3500);
    await p.screenshot({ path: `${out}/lib-${t}-age18.png` });
    await p.locator('.library__index-toggle').first().click();
    await p.waitForTimeout(1200);
    await p.screenshot({ path: `${out}/lib-${t}-drawer.png` });
  } catch (e) { errors.push(`${t} lib interaction ${e.message.slice(0,120)}`); }
  const libInfo = await p.evaluate(() => ({ h: document.documentElement.scrollHeight, card: document.querySelector('.library__caption')?.innerText?.slice(0,600), ages: [...document.querySelectorAll('.library__age')].map(a=>a.textContent).join('|') }));
  console.log('LIB', t, JSON.stringify(libInfo));
  // NEWS
  await p.goto('http://localhost:5173/news', { waitUntil: 'load' });
  await p.waitForTimeout(3000);
  // scroll through to trigger lazy
  const H = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += h/2) { await p.evaluate((yy) => window.scrollTo(0, yy), y); await p.waitForTimeout(150); }
  await p.evaluate(() => window.scrollTo(0, 0)); await p.waitForTimeout(800);
  await p.screenshot({ path: `${out}/news-${t}-top.png` });
  await p.screenshot({ path: `${out}/news-${t}-full.png`, fullPage: true });
  const newsInfo = await p.evaluate(() => {
    const iframes = [...document.querySelectorAll('iframe')].map(f => ({ src: f.src.slice(0,80), w: f.offsetWidth, h: f.offsetHeight }));
    const pills = [...document.querySelectorAll('main *')].filter(el => { const cs = getComputedStyle(el); const r = parseFloat(cs.borderRadius); return r >= 12 && el.offsetHeight < 40 && el.offsetHeight > 0 && (cs.borderStyle !== 'none' && cs.borderWidth !== '0px' || cs.backgroundColor !== 'rgba(0, 0, 0, 0)'); }).map(el => el.className + ':' + el.textContent.slice(0,30));
    const imgs = [...document.querySelectorAll('main img')].map(i => ({ src: i.src.split('/').pop(), ok: i.complete && i.naturalWidth > 0, w: i.offsetWidth, h: i.offsetHeight }));
    return { h: document.documentElement.scrollHeight, iframes, pills: pills.slice(0,20), imgs, text: document.querySelector('main')?.innerText?.slice(0,1500) };
  });
  console.log('NEWS', t, JSON.stringify(newsInfo));
  await ctx.close();
}
await b.close();
console.log('errors', errors);
