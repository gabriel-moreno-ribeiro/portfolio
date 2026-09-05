import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.on('console', m => { if (m.text().startsWith('BBOX')) console.log(m.text()); });
await page.goto('http://localhost:5199/', { waitUntil: 'load' });
await page.waitForTimeout(2000);
await page.evaluate(() => { const el = document.getElementById('work-experience'); window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY); });
await page.waitForTimeout(8000);
await browser.close();
