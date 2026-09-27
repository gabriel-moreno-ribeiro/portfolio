// Library repair: viewport, a long review (Zero to One, last book), age 18, drawer; both themes, 1440 and 390.
import { chromium } from 'playwright';
const OUT = 'C:/portfolio-gabriel/qa/libnews-repair';
const b = await chromium.launch({ args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=swiftshader'] });
const only = process.argv[2];
for (const [w, h] of [[1440, 900], [390, 844]]) {
  for (const theme of ['light', 'dark']) {
    if (only && only !== `${w}-${theme}`) continue;
    const ctx = await b.newContext({ viewport: { width: w, height: h } });
    await ctx.addInitScript((t) => localStorage.setItem('darkMode', JSON.stringify(t === 'dark')), theme);
    const p = await ctx.newPage();
    await p.goto('http://localhost:5173/library', { waitUntil: 'load' });
    await p.waitForSelector('.library--ready', { timeout: 60000 });
    await p.waitForTimeout(2500);
    const tag = `${w}-${theme}`;
    await p.screenshot({ path: `${OUT}/lib-${tag}-first.png` });
    await p.evaluate(() => document.activeElement?.blur());
    await p.keyboard.press('End');
    await p.waitForTimeout(4500);
    await p.screenshot({ path: `${OUT}/lib-${tag}-end.png` });
    await p.keyboard.press('ArrowLeft');
    await p.waitForTimeout(4500);
    await p.screenshot({ path: `${OUT}/lib-${tag}-age18.png` });
    const toggle = w < 760 ? '.library__index-toggle--float' : '.library__crumb .library__index-toggle';
    await p.click(toggle);
    await p.waitForTimeout(900);
    await p.screenshot({ path: `${OUT}/lib-${tag}-drawer.png` });
    await ctx.close();
  }
}
await b.close();
