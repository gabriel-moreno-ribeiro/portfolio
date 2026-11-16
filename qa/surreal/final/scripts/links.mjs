// Enter on globe "On the road" link and Experience "on the globe" links
import fs from 'node:fs';
import { launch, BASE, OUT, VPS, slowScroll } from './common.mjs';
const browser = await launch(); const ctx = await browser.newContext({ viewport: VPS.desktop }); const page = await ctx.newPage();
const res = {};
await page.goto(BASE + '/', { waitUntil: 'load' }); await page.waitForTimeout(3000); await slowScroll(page, 300, 100);
await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' })); await page.waitForTimeout(800);
const road = page.locator('a.city-panel__road').first(); await road.scrollIntoViewIfNeeded(); await road.focus();
const y0 = await page.evaluate(() => scrollY); await page.keyboard.press('Enter'); await page.waitForTimeout(2500);
const y1 = await page.evaluate(() => scrollY);
res.globeRoadLink = { y0, y1, hash: await page.evaluate(() => location.hash + ' ' + location.pathname), expTop: await page.evaluate(() => Math.round(document.querySelector('#work-experience')?.getBoundingClientRect().top ?? NaN)) };
const g = page.locator('a[aria-label$="on the globe"]').first(); await g.scrollIntoViewIfNeeded(); await g.focus(); const y2 = await page.evaluate(() => scrollY);
await page.keyboard.press('Enter'); await page.waitForTimeout(2500);
res.expToGlobe = { y2, y3: await page.evaluate(() => scrollY), href: await g.getAttribute('href').catch(() => null), hash: await page.evaluate(() => location.hash + ' ' + location.pathname), panelOpen: await page.locator('.city-panel').count() };
console.log(JSON.stringify(res)); fs.writeFileSync(OUT + 'keyboard-links.json', JSON.stringify(res, null, 2)); await browser.close();
