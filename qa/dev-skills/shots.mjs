/** Capturas extra da seção Skills: mobile assentado, tema escuro e o chip ligado. */
import { chromium } from 'playwright';
import path from 'node:path';
const OUT = path.resolve('qa/dev-skills');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const b = await chromium.launch();

for (const [name, opts, dark, chip] of [
  ['mobile-settled', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }, false, false],
  ['dark-chip', { viewport: { width: 1440, height: 900 } }, true, true],
  ['light-chip-rm', { viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }, false, true],
]) {
  const ctx = await b.newContext(opts);
  if (dark) await ctx.addInitScript('localStorage.setItem("darkMode","true")');
  const p = await ctx.newPage();
  await p.goto('http://localhost:5173', { waitUntil: 'load' });
  await p.locator('#skills').scrollIntoViewIfNeeded();
  await sleep(6000);
  if (chip) { await p.locator('.skills__chip').click(); await sleep(600); }
  await p.locator('#skills').screenshot({ path: path.join(OUT, `shot-${name}.png`) });
  await ctx.close();
}
await b.close();
console.log('ok');
