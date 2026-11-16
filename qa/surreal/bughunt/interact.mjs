// Carousels on rapid input, theme toggle double-tap, clay story controls.
import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const W = +(process.env.W || 1440);
const touch = !!process.env.TOUCH;
const ctx = await b.newContext({ viewport: { width: W, height: 900 }, hasTouch: touch, isMobile: touch });
await ctx.addInitScript(() => sessionStorage.setItem('showedToast', 'true'));
const p = await ctx.newPage();
const errs = [];
p.on('pageerror', e => errs.push('PE ' + e.message));
p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text().slice(0, 160)); });
await p.goto('http://localhost:5173/#background', { waitUntil: 'load' });
await p.waitForTimeout(4000);
const tap = async (sel, n = 1, gap = 40) => {
  for (let i = 0; i < n; i++) {
    const el = await p.$(sel);
    if (!el) { console.log('missing ' + sel); return; }
    const act = touch ? el.tap({ force: true }) : el.click({ force: true });
    await act.catch(e => errs.push('act ' + e.message.slice(0, 80)));
    await p.waitForTimeout(gap);
  }
};
const state = () => p.evaluate(() => ({
  attr: document.documentElement.dataset.theme || 'light',
  ls: localStorage.getItem('darkMode'),
  label: document.querySelector('.toggle-button')?.getAttribute('aria-label'),
}));

// 1. city steps, rapid next
await p.$eval('#background', e => e.scrollIntoView({ block: 'start' }));
await p.waitForTimeout(800);
await tap('.city-steps__step:last-child', 7, 30);
await p.waitForTimeout(1500);
console.log('city after 7 rapid next:', await p.evaluate(() => ({
  panel: document.querySelector('.city-panel:not(.city-panel--sizer) .city-panel__location')?.textContent,
  panels: document.querySelectorAll('.city-panel:not(.city-panel--sizer)').length,
  stage: document.querySelector('#background .photo-card__label')?.textContent,
})));

// 2. photo stage, rapid bar clicks
const ps = '#background .photo-stage';
await tap(`${ps} .photo-stage__bar:nth-child(5)`);
await tap(`${ps} .photo-stage__bar:nth-child(2)`);
await tap(`${ps} .photo-stage__bar:nth-child(4)`, 1, 10);
await p.waitForTimeout(900);
console.log('photo stage:', await p.evaluate(ps => {
  const s = document.querySelector(ps);
  return {
    current: [...s.querySelectorAll('.photo-stage__bar')].findIndex(b => b.getAttribute('aria-current')),
    centerCount: s.querySelector('.photo-card:not([aria-hidden]) .photo-card__count')?.textContent,
    cards: s.querySelectorAll('.photo-card').length,
  };
}, ps));
await p.screenshot({ path: `qa/surreal/bughunt/interact-origins-${W}${touch ? '-touch' : ''}.png` });

// 3. theme toggle, double then single
const before = await state();
await tap('.toggle-button', 2, 30);
await p.waitForTimeout(1500);
console.log('theme double toggle:', before.attr, '->', await state());
await tap('.toggle-button', 1);
await p.waitForTimeout(1500);
console.log('theme single toggle:', await state());
await tap('.toggle-button', 1);
await p.waitForTimeout(1200);

// 4. clay story controls
await p.$eval('.clay-stage', e => e.scrollIntoView({ block: 'center' }));
await p.waitForTimeout(2500);
const clay = () => p.evaluate(() => {
  const r = document.querySelector('.clay-stage')?.closest('section, article, .work-row') || document;
  return {
    step: r.querySelector('button[aria-label^="Step "][aria-current], button[aria-label^="Step "][aria-pressed="true"]')?.getAttribute('aria-label'),
    play: r.querySelector('.clay-ctl__play')?.getAttribute('aria-label'),
    text: r.querySelector('.clay-row__step')?.textContent?.slice(0, 40),
    stage: r.querySelector('.clay-stage')?.getAttribute('aria-label')?.slice(0, 60),
  };
});
console.log('clay initial', JSON.stringify(await clay()));
await tap('.clay-ctl__play');
await p.waitForTimeout(400);
console.log('clay after pause', JSON.stringify(await clay()));
const steps = await p.$$('button[aria-label^="Step "]');
if (steps[4]) {
  await (touch ? steps[4].tap() : steps[4].click());
  await p.waitForTimeout(300);
  await (touch ? steps[1].tap() : steps[1].click());
  await p.waitForTimeout(1500);
}
console.log('clay after step5->step2', JSON.stringify(await clay()));
await p.waitForTimeout(6000);
console.log('clay 6s later (should hold if paused)', JSON.stringify(await clay()));
await p.screenshot({ path: `qa/surreal/bughunt/interact-clay-${W}${touch ? '-touch' : ''}.png` });
console.log('errs', [...new Set(errs)].filter(e => !e.includes('GL Driver')));
await b.close();
