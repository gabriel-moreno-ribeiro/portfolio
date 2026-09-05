// temp measurement helper — deleted after use
import { chromium } from 'playwright';
const base = 'http://localhost:5199';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('console', m => { if (m.text().startsWith('BBOX')) console.log(m.text()); });
await page.goto(base + '/', { waitUntil: 'load' });
await page.waitForTimeout(3000);
const robot = await page.evaluate(() => {
  const c = document.querySelector('.robot-canvas');
  const r = c?.getBoundingClientRect();
  const nav = document.querySelector('.navbar')?.getBoundingClientRect();
  return { canvas: r && { top: r.top, height: r.height, width: r.width }, navbar: nav && { top: nav.top, bottom: nav.bottom } };
});
console.log('ROBOT', JSON.stringify(robot));
const we = await page.evaluate(() => {
  const el = document.getElementById('work-experience');
  window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY);
  return null;
});
await page.waitForTimeout(2500);
const info = await page.evaluate(() => {
  const el = document.getElementById('work-experience');
  const r = el.getBoundingClientRect();
  const top = r.top + window.scrollY;
  const wh = window.innerHeight;
  const total = r.height - wh;
  const secs = [...document.querySelectorAll('.work-experience-section')].map(s => {
    const sr = s.getBoundingClientRect();
    const sTop = sr.top + window.scrollY - top; // offset within container
    return {
      title: s.querySelector('.job-title').textContent.trim().slice(0, 40),
      // progress when the section's top reaches the viewport middle
      pAtMiddle: +((sTop - wh * 0.5) / total).toFixed(3),
      // progress when the section's top reaches 85% (fade-in trigger)
      pAtTrigger: +((sTop - wh * 0.85) / total).toFixed(3),
    };
  });
  const canvas = document.querySelector('.parts-assembling')?.getBoundingClientRect();
  return { height: r.height, wh, total, secs, canvas: canvas && { w: canvas.width, h: canvas.height } };
});
console.log('WE', JSON.stringify(info, null, 1));
await browser.close();
