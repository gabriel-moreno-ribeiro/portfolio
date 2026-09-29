import { chromium } from 'playwright';
const OUT = 'qa/fb2-repair';
const b = await chromium.launch();
for (const [w, h, theme] of [[1440, 900, 'light'], [390, 844, 'light'], [1440, 900, 'dark']]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: theme, reducedMotion: 'reduce' });
  await ctx.addInitScript((t) => localStorage.setItem('darkMode', String(t === 'dark')), theme);
  const p = await ctx.newPage();
  await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  const total = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < total + 4000; y += 700) { await p.evaluate((v) => scrollTo(0, v), y); await p.waitForTimeout(60); }
  const c = await p.waitForSelector('#contact', { timeout: 30000 });
  for (let t = 0; t < 15; t++) {
    const off = await p.evaluate(() => { const el = document.querySelector('#contact'); const top = el.getBoundingClientRect().top; window.scrollTo({ top: top + scrollY - 120, behavior: 'instant' }); return Math.abs(top - 120); });
    await p.waitForTimeout(600);
    if (off < 4) break;
  }
  await p.screenshot({ path: `${OUT}/contact-${w}-${theme}.png` });
  const info = await p.evaluate(() => {
    const ul = document.querySelector('.contact-section__channels');
    const lis = [...ul.querySelectorAll('li')].map(li => { const r = li.getBoundingClientRect(); return { t: li.innerText, top: Math.round(r.top), sep: getComputedStyle(li, '::before').content }; });
    return { lis, svgsInIntro: document.querySelectorAll('.contact-section__intro svg').length, sendSvg: document.querySelectorAll('.contact-section__submit svg').length, shadow: getComputedStyle(document.querySelector('.contact-section__card')).boxShadow };
  });
  console.log(w, theme, JSON.stringify(info));
  await p.keyboard.press('Tab');
  await p.focus('.contact-section__channel');
  if (w === 1440 && theme === 'light') await (await p.$('.contact-section__intro')).screenshot({ path: `${OUT}/contact-focus.png` });
  await ctx.close();
}
await b.close();
