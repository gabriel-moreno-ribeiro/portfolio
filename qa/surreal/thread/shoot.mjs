// D-20 thread: rail truck at each section + Contact parking spot. Run: node qa/surreal/thread/shoot.mjs
import { chromium } from 'playwright';
const OUT = 'qa/surreal/thread/';
const b = await chromium.launch();
const errors = [];
const out = [];
async function open(vw, vh, dark, reduced) {
  const ctx = await b.newContext({ viewport: { width: vw, height: vh }, reducedMotion: reduced ? 'reduce' : 'no-preference' });
  await ctx.addInitScript((d) => localStorage.setItem('darkMode', String(d)), dark);
  const p = await ctx.newPage();
  p.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  p.on('pageerror', (e) => errors.push(String(e)));
  await p.goto('http://localhost:5173/', { waitUntil: 'load' });
  await p.waitForTimeout(2500);
  return { ctx, p };
}
const rail = (p) => p.evaluate(() => {
  const t = document.querySelector('.section-rail__truck').getBoundingClientRect();
  const cur = document.querySelector('.section-rail [aria-current]');
  const d = cur.querySelector('.section-rail__dot').getBoundingClientRect();
  return { current: cur.innerText, truckCy: Math.round(t.top + t.height / 2), dotCy: Math.round(d.top + d.height / 2), dir: document.querySelector('.section-rail__truck').dataset.dir, tf: document.querySelector('.section-rail__truck').style.transform };
});
for (const dark of [false, true]) for (const reduced of [false, true]) {
  const tag = `${dark ? 'dark' : 'light'}${reduced ? '-reduced' : ''}`;
  const { ctx, p } = await open(1440, 900, dark, reduced);
  for (const id of ['main-content', 'background', 'work', 'research', 'work-experience', 'contact']) {
    await p.evaluate((id) => { const e = document.getElementById(id); scrollTo({ top: id === 'contact' ? 1e7 : e.getBoundingClientRect().top + scrollY - 60, behavior: 'instant' }); }, id);
    await p.waitForTimeout(1500);
    // layout may have shifted while lazy sections mounted; land again
    await p.evaluate((id) => { const e = document.getElementById(id); scrollTo({ top: id === 'contact' ? 1e7 : e.getBoundingClientRect().top + scrollY - 60, behavior: 'instant' }); }, id);
    await p.waitForTimeout(1200);
    out.push({ tag, id, ...(await rail(p)) });
    await p.screenshot({ path: `${OUT}1440-${tag}-${id}.png` });
    await p.screenshot({ path: `${OUT}1440-${tag}-${id}-rail.png`, clip: { x: 0, y: 300, width: 220, height: 300 } });
  }
  await p.locator('.contact-section__intro').screenshot({ path: `${OUT}1440-${tag}-contact-spot.png` });
  if (!dark) {
    // mid-way between two sections: truck between dots (or on the dot under reduced motion)
    await p.evaluate(() => { const a = document.getElementById('work'), c = document.getElementById('research'); scrollTo({ top: (a.getBoundingClientRect().top + c.getBoundingClientRect().top) / 2 + scrollY - 360, behavior: 'instant' }); });
    await p.waitForTimeout(800);
    out.push({ tag, id: 'between work/research', ...(await rail(p)) });
    await p.screenshot({ path: `${OUT}1440-${tag}-between-rail.png`, clip: { x: 0, y: 300, width: 220, height: 300 } });
    await p.mouse.wheel(0, -300); await p.waitForTimeout(600);
    out.push({ tag, id: 'after scrolling up', ...(await rail(p)) });
  }
  if (!dark && !reduced) {
    // click + keyboard navigation
    await p.locator('.section-rail__item', { hasText: 'Skills' }).click();
    await p.waitForTimeout(2500);
    out.push({ nav: 'click Skills', ...(await rail(p)) });
    await p.locator('.section-rail__item', { hasText: 'Origins' }).focus();
    await p.keyboard.press('Enter');
    await p.waitForTimeout(2500);
    out.push({ nav: 'Enter on Origins', focused: await p.evaluate(() => document.activeElement.innerText), ...(await rail(p)) });
    await p.keyboard.press('Tab');
    out.push({ nav: 'Tab', focused: await p.evaluate(() => document.activeElement.innerText) });
  }
  await ctx.close();
  const m = await open(390, 844, dark, reduced);
  await m.p.evaluate(() => scrollTo({ top: 1e7, behavior: 'instant' })); await m.p.waitForTimeout(1500);
  await m.p.evaluate(() => document.querySelector('.contact-section').scrollIntoView({ behavior: 'instant' })); await m.p.waitForTimeout(1500);
  await m.p.evaluate(() => document.querySelector('.contact-section').scrollIntoView({ behavior: 'instant' })); await m.p.waitForTimeout(1200);
  out.push({ tag, mobile: await m.p.evaluate(() => ({ rail: getComputedStyle(document.querySelector('.section-rail')).display, mode: document.querySelector('.parking-spot').dataset.mode, hscroll: document.documentElement.scrollWidth > innerWidth })) });
  await m.p.screenshot({ path: `${OUT}390-${tag}-contact.png` });
  await m.ctx.close();
}
await b.close();
console.log(out.map((o) => JSON.stringify(o)).join('\n'));
console.log('console errors:', errors.length, errors.slice(0, 5));
