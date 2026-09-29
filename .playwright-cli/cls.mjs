// CLS per route with images delayed 400 ms, so a box that is not reserved shows up as a shift
import { chromium } from 'playwright';
const routes = process.argv.slice(2);
const browser = await chromium.launch();
for (const route of routes) {
  for (const [w, h, mobile] of [[1440, 900, false], [390, 844, true]]) {
    const page = await browser.newPage({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile });
    await page.route(/\.(webp|png|jpe?g|avif)(\?|$)/, async (r) => { await new Promise((ok) => setTimeout(ok, 400)); r.continue(); });
    await page.addInitScript(() => {
      window.__cls = 0; window.__shifts = [];
      new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) {
        window.__cls += e.value;
        window.__shifts.push({ v: +e.value.toFixed(4), n: (e.sources || []).slice(0, 2).map((s) => s.node?.className?.toString().slice(0, 40) || s.node?.nodeName) });
      } }).observe({ type: 'layout-shift', buffered: true });
    });
    await page.goto('http://localhost:5173' + route, { waitUntil: 'networkidle' });
    await page.waitForTimeout(800);
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < total; y += 500) { await page.mouse.wheel(0, 500); await page.waitForTimeout(250); }
    await page.waitForTimeout(600);
    const r = await page.evaluate(() => ({ cls: +window.__cls.toFixed(4), top: window.__shifts.sort((a, b) => b.v - a.v).slice(0, 3) }));
    console.log(route, w, JSON.stringify(r));
    await page.close();
  }
}
await browser.close();
