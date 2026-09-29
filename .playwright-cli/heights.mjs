import { chromium } from 'playwright';
const browser = await chromium.launch();
for (const [w, h, mobile] of [[1440, 900, false], [390, 844, true]]) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: mobile ? 2 : 1 });
  await page.goto('http://localhost:4173/#contact', { waitUntil: 'networkidle' }); // deep link monta tudo
  await page.waitForTimeout(2500);
  const r = await page.evaluate(() => Object.fromEntries(['background','work','numbers','research','skills','work-experience','contact'].map(id => [id, Math.round(document.getElementById(id)?.getBoundingClientRect().height ?? -1)])));
  console.log(w + ':', JSON.stringify(r));
  await page.close();
}
await browser.close();
