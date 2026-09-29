import { chromium } from 'playwright';
const browser = await chromium.launch();
const base = 'http://localhost:4173/';
// 1) trilho: clique em Experience e em Contact a partir do topo
for (const label of ['Experience', 'Contact']) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.click(`nav[aria-label="Page sections"] >> text=${label}`);
  await page.waitForTimeout(3500);
  const id = label === 'Experience' ? 'work-experience' : 'contact';
  const r = await page.evaluate((id) => { const el = document.getElementById(id); const t = el?.getBoundingClientRect().top; return { top: Math.round(t ?? -9999), tag: el?.tagName, onScreen: t != null && t > -50 && t < 400 }; }, id);
  console.log('rail ' + label.padEnd(10), JSON.stringify(r));
  await page.close();
}
// 2) Tab: primeira passada alcança #contact-name?
{
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  let reached = false, tabs = 0, seenExp = false;
  for (let i = 0; i < 140; i++) {
    await page.keyboard.press('Tab'); tabs++;
    const a = await page.evaluate(() => { const e = document.activeElement; return { id: e?.id || '', inExp: !!e?.closest?.('#work-experience') }; });
    if (a.inExp) seenExp = true;
    if (a.id === 'contact-name') { reached = true; break; }
    if (i > 5 && (await page.evaluate(() => document.activeElement === document.body))) break;
  }
  console.log('tab: reached #contact-name =', reached, '| tabs =', tabs, '| passou pela Experience =', seenExp);
  await page.close();
}
// 3) CLS em rolagem rápida @390
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await page.addInitScript(() => { window.__cls = 0; window.__worst = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) { window.__cls += e.value; window.__worst = Math.max(window.__worst, e.value); } }).observe({ type: 'layout-shift', buffered: true }); });
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < total + 4000; y += 900) { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(60); }
  await page.waitForTimeout(2500);
  const r = await page.evaluate(() => ({ cls: +window.__cls.toFixed(4), worst: +window.__worst.toFixed(4), doc: document.documentElement.scrollHeight }));
  console.log('cls fast-scroll @390:', JSON.stringify(r));
  await page.close();
}
await browser.close();
