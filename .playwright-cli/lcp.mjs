import { chromium } from 'playwright';
const browser = await chromium.launch();
for (const vp of [{ width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }, { width: 1440, height: 900 }]) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: !!vp.isMobile, hasTouch: !!vp.hasTouch, deviceScaleFactor: vp.deviceScaleFactor || 1 });
  const page = await ctx.newPage();
  await page.addInitScript(() => {
    window.__lcp = [];
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) {
        const el = e.element;
        window.__lcp.push({ t: Math.round(e.startTime), size: e.size, tag: el?.tagName, id: el?.id, cls: (el?.className || '').toString().slice(0, 60), src: el?.currentSrc || el?.src || '', text: (el?.textContent || '').trim().slice(0, 50) });
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });
  });
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);
  const lcp = await page.evaluate(() => window.__lcp);
  const paint = await page.evaluate(() => performance.getEntriesByType('paint').map((p) => p.name + ':' + Math.round(p.startTime)).join(' '));
  console.log(`\n== ${vp.width}x${vp.height} ==  ${paint}`);
  lcp.forEach((e) => console.log('  LCP candidate t+' + e.t + ' size ' + e.size + '  <' + e.tag + (e.id ? '#' + e.id : '') + '.' + e.cls + '>  ' + (e.src ? e.src.replace(/^https?:\/\/[^/]+/, '') : JSON.stringify(e.text))));
  await ctx.close();
}
await browser.close();
