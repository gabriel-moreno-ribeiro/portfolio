// Nothing inside the strip may stick out of its own cell, at any width.
import { chromium } from 'playwright';
const browser = await chromium.launch();
for (const w of [320, 390, 601, 768, 900, 1024, 1440]) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
  await page.goto('http://localhost:5173/', { waitUntil: 'load' });
  for (let i = 0; i < 80 && !(await page.locator('.numbers-strip').count()); i++) { await page.mouse.wheel(0, 900); await page.waitForTimeout(250); }
  await page.locator('.numbers-strip').scrollIntoViewIfNeeded();
  const out = await page.evaluate(() => {
    const bad = [];
    for (const li of document.querySelectorAll('.numbers-strip > li')) {
      const box = li.getBoundingClientRect();
      for (const el of li.querySelectorAll('*')) { const r = el.getBoundingClientRect(); if (r.right > box.right + 0.5 || r.left < box.left - 0.5) bad.push(el.tagName + '.' + (el.className?.baseVal ?? el.className) + (el.parentElement.className?.baseVal ?? el.parentElement.className) + ':' + Math.round(Math.max(r.right - box.right, box.left - r.left))); }
    }
    return { strip: Math.round(document.querySelector('.numbers-strip').getBoundingClientRect().height), overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth, bad: [...new Set(bad)] };
  });
  console.log(w, JSON.stringify(out));
  if (w === 768) await page.locator('.numbers-strip').screenshot({ path: new URL('./after-768-light-final.png', import.meta.url).pathname });
  await page.close();
}
await browser.close();
