import { chromium } from 'playwright';
import fs from 'node:fs';

const out = '.playwright-cli/exp';
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch();

async function shoot(theme, width, height, tag) {
  const page = await browser.newPage({ viewport: { width, height }, isMobile: width < 600, hasTouch: width < 600 });
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await page.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < total; y += 500) { await page.evaluate((v) => window.scrollTo(0, v), y); await page.waitForTimeout(40); }
  const box = await page.evaluate(() => {
    const el = document.getElementById('work-experience');
    const r = el.getBoundingClientRect();
    return { top: r.top + window.scrollY, height: r.height };
  });
  const range = box.height - height;
  for (const pct of [25, 50, 100]) {
    const y = box.top + (range * pct) / 100;
    await page.evaluate((v) => window.scrollTo(0, v), y - 200);
    await page.waitForTimeout(150);
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${out}/exp-${tag}-${theme}-${pct}.png` });
  }
  // skills e numbers, viewport, depois de assentar
  for (const id of ['skills', 'numbers']) {
    const sel = id === 'numbers' ? '.numbers-and-stats' : '#skills';
    const top = await page.evaluate((s) => document.querySelector(s).getBoundingClientRect().top + window.scrollY, sel);
    await page.evaluate((v) => window.scrollTo(0, v), top - 60);
    await page.waitForTimeout(id === 'skills' ? 7000 : 2500);
    await page.screenshot({ path: `${out}/${id}-${tag}-${theme}.png` });
  }
  await page.close();
}

await shoot('light', 1440, 900, 'd');
await shoot('dark', 1440, 900, 'd');
await shoot('light', 390, 844, 'm');
await browser.close();
console.log(fs.readdirSync(out).join('\n'));
