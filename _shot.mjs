// temp screenshot helper — deleted after use
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const OUT = 'C:/Users/gabri/AppData/Local/Temp/claude/c--portfolio-gabriel/f25a1f16-27c4-42bf-a34e-349055cf470a/scratchpad/shots3';
mkdirSync(OUT, { recursive: true });
const base = 'http://localhost:5199';

const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('pageerror', e => console.log('PAGEERROR', e.message));

const jump = (y) => page.evaluate(y => window.scrollTo({ top: y, behavior: 'instant' }), y);

await page.goto(base + '/', { waitUntil: 'load' });
await page.waitForTimeout(3500);

const info = await page.evaluate(() => {
  const el = document.getElementById('work-experience');
  const r = el.getBoundingClientRect();
  return { top: r.top + window.scrollY, height: r.height, wh: window.innerHeight };
});
const total = info.height - info.wh;
await jump(info.top - 400);
await page.waitForTimeout(6000);
for (const p of [0, 0.04, 0.1, 0.2]) {
  await jump(info.top + total * p);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${OUT}/we-${String(p).replace('.', '_')}.png` });
}

// sidenav: instant jumps, then read the active label
for (const id of ['main-content', 'background', 'skills', 'work', 'research', 'work-experience', 'contact']) {
  await page.evaluate(id => {
    const el = document.getElementById(id);
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 60, behavior: 'instant' });
  }, id);
  await page.waitForTimeout(300);
  const active = await page.evaluate(() => document.querySelector('.sidenav-item--active .sidenav-item__label')?.textContent);
  console.log('section', id, '-> active nav:', active);
}
// mid-section positions too
for (const id of ['skills', 'research']) {
  await page.evaluate(id => {
    const el = document.getElementById(id);
    const r = el.getBoundingClientRect();
    window.scrollTo({ top: r.top + window.scrollY + r.height / 2, behavior: 'instant' });
  }, id);
  await page.waitForTimeout(300);
  const active = await page.evaluate(() => document.querySelector('.sidenav-item--active .sidenav-item__label')?.textContent);
  console.log('middle of', id, '-> active nav:', active);
}

// /contact redirect on a cold load
await page.goto(base + '/contact', { waitUntil: 'load' });
await page.waitForTimeout(7000);
const r = await page.evaluate(() => document.getElementById('contact')?.getBoundingClientRect().top);
console.log('redirect url:', page.url(), 'contact top after 7s:', r);
await page.screenshot({ path: `${OUT}/contact-redirect.png` });

// navbar "Contact." link from the top of the page
await page.goto(base + '/', { waitUntil: 'load' });
await page.waitForTimeout(3000);
await page.hover('.navbar');
await page.waitForTimeout(600);
await page.click('.navbar .links p:has-text("Contact.")');
await page.waitForTimeout(2500);
console.log('navbar link -> contact top:', await page.evaluate(() => document.getElementById('contact')?.getBoundingClientRect().top), 'url:', page.url());

// mobile
const m = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
await m.goto(base + '/#contact', { waitUntil: 'load' });
await m.waitForTimeout(6000);
await m.screenshot({ path: `${OUT}/contact-mobile.png` });

await browser.close();
