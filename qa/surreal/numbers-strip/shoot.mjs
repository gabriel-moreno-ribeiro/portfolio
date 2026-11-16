// Screenshots + #work heights for the numbers strip. Run: node qa/surreal/numbers-strip/shoot.mjs <before|after>
import { chromium } from 'playwright';
const tag = process.argv[2] || 'after';
const OUT = new URL('./', import.meta.url).pathname;
const browser = await chromium.launch({ args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'] });
const errors = [];
const open = async (width, height, theme, reduced = false) => {
  const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2, reducedMotion: reduced ? 'reduce' : 'no-preference' });
  await ctx.addInitScript(t => { try { localStorage.setItem('darkMode', String(t === 'dark')); } catch {} }, theme);
  const page = await ctx.newPage();
  page.on('console', m => m.type() === 'error' && errors.push(m.text().slice(0, 200)));
  page.on('pageerror', e => errors.push('pageerror: ' + String(e).slice(0, 200)));
  await page.goto('http://localhost:5173/', { waitUntil: 'load' });
  await page.waitForTimeout(1500);
  // Walk the page so every lazy section mounts and the heights settle.
  for (let i = 0; i < 80; i++) {
    await page.waitForTimeout(250);
    if (await page.locator('.numbers-strip').count()) break;
    await page.mouse.wheel(0, 900);
  }
  await page.waitForSelector('.numbers-strip', { timeout: 20000 });
  return { ctx, page };
};
const toStrip = (page, gap = 140) => page.evaluate(g => {
  const r = document.querySelector('.numbers-strip').getBoundingClientRect();
  scrollTo({ top: scrollY + r.top - g, behavior: 'instant' });
}, gap);
// The strip as it sits in the viewport (no stitching, so fixed chrome stays where it is).
// On a phone the strip is taller than the screen: one shot per fact.
const shot = async (page, name) => {
  const n = page.viewportSize().width < 600 ? await page.locator('.numbers-strip > li').count() : 1;
  for (let k = 0; k < n; k++) {
    const sel = n > 1 ? `.numbers-strip > li:nth-child(${k + 1})` : '.numbers-strip';
    if (n > 1) await page.evaluate(s => { const r = document.querySelector(s).getBoundingClientRect(); scrollTo({ top: scrollY + r.top - 110, behavior: 'instant' }); }, sel);
    if (n > 1 && !name.includes('reduced')) { await page.waitForTimeout(700); if (name.includes('final')) await page.screenshot({ path: `${OUT}${tag}-${name.replace('final', 'mid')}-${k + 1}.png` }); await page.waitForTimeout(2300); }
    const r = await page.evaluate(s => { const r = document.querySelector(s).getBoundingClientRect(); return { x: 0, y: Math.max(0, r.top - 12), width: innerWidth, height: Math.min(innerHeight - Math.max(0, r.top - 12), r.height + 24) }; }, sel);
    await page.screenshot({ path: `${OUT}${tag}-${name}${n > 1 ? '-' + (k + 1) : ''}.png`, clip: r });
  }
};
const heights = {};
for (const [w, h] of [[1440, 900], [768, 1024], [390, 844]]) {
  for (const theme of w === 768 ? ['light'] : ['light', 'dark']) {
    const { ctx, page } = await open(w, h, theme);
    // Park just above the strip until the lazy rows over it stop moving, then bring it in.
    for (let k = 0; k < 6; k++) {
      await page.evaluate(() => scrollTo({ top: scrollY + document.querySelector('.numbers-strip').getBoundingClientRect().top - innerHeight - 200, behavior: 'instant' }));
      await page.waitForTimeout(700);
    }
    await toStrip(page, w < 600 ? 110 : 140);
    if (tag !== 'before') {
      await page.waitForTimeout(450);
      await page.screenshot({ path: `${OUT}${tag}-${w}-${theme}-mid.png` });
      await page.waitForTimeout(450);
      await page.screenshot({ path: `${OUT}${tag}-${w}-${theme}-mid2.png` });
    }
    await page.waitForTimeout(3200);
    await shot(page, `${w}-${theme}-final`);
    if (theme === 'light') heights[w] = await page.evaluate(() => ({
      work: Math.round(document.querySelector('#work').getBoundingClientRect().height),
      strip: Math.round(document.querySelector('.numbers-strip').getBoundingClientRect().height),
      overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      running: document.getAnimations().filter(a => a.playState === 'running' && a.effect?.target?.closest?.('.numbers-strip')).length,
    }));
    if (tag !== 'before' && w === 1440) {
      await toStrip(page);
      await page.locator('.ns-case__well').nth(6).hover({ force: true }); await page.waitForTimeout(500); await shot(page, `${w}-${theme}-hover-medal`);
      await page.locator('.ns-map__lit').nth(8).hover({ force: true }); await page.waitForTimeout(400); await shot(page, `${w}-${theme}-hover-map`);
      await page.locator('.ns-key button').first().hover(); await page.waitForTimeout(400); await shot(page, `${w}-${theme}-hover-key`);
      await page.mouse.move(5, 5);
      await page.locator('.ns-pick-box').first().focus(); for (let k = 0; k < 4; k++) await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(500); await shot(page, `${w}-${theme}-focus-medal`);
      await page.locator('.ns-pick-box').last().focus(); for (let k = 0; k < 3; k++) await page.keyboard.press('ArrowRight');
      await page.waitForTimeout(400); await shot(page, `${w}-${theme}-focus-map`);
    }
    await ctx.close();
  }
}
if (tag !== 'before') for (const [w, h] of [[1440, 900], [390, 844]]) {
  const { ctx, page } = await open(w, h, 'light', true);
  await toStrip(page, w < 600 ? 110 : 140); await page.waitForTimeout(250);
  await shot(page, `${w}-reduced`);
  await ctx.close();
}
console.log(JSON.stringify({ tag, heights, errors: [...new Set(errors)] }, null, 1));
await browser.close();
