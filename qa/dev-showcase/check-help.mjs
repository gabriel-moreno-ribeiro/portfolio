import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
await page.keyboard.press('Control+K');
await page.waitForTimeout(2500);
await page.keyboard.type('clear');
await page.keyboard.press('Enter');
await page.waitForTimeout(400);
await page.keyboard.type('help');
await page.keyboard.press('Enter');
await page.waitForTimeout(800);

const read = () =>
  page.evaluate(() =>
    [...document.querySelectorAll('.xterm-rows > div')]
      .map((d) => (d.textContent || '').replace(/ /g, ' ').trimEnd())
      .filter((r) => r.trim()),
  );

const bottom = await read();
for (let i = 0; i < 3; i++) { await page.keyboard.press('Shift+PageUp'); await page.waitForTimeout(120); }
await page.waitForTimeout(400);
const top = await read();

// theme command
for (let i = 0; i < 3; i++) { await page.keyboard.press('Shift+PageDown'); await page.waitForTimeout(120); }
await page.waitForTimeout(200);
await page.keyboard.type('theme dark');
await page.keyboard.press('Enter');
await page.waitForTimeout(400);
const themeAfterDark = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
await page.keyboard.type('theme light');
await page.keyboard.press('Enter');
await page.waitForTimeout(400);
const themeAfterLight = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));

console.log(JSON.stringify({ top, bottom, themeAfterDark, themeAfterLight }, null, 1));
await browser.close();
