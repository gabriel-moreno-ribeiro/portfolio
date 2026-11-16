import { chromium } from 'playwright';
export const BASE = process.env.QA_BASE_URL || 'http://localhost:4173';
export const OUT = new URL('../', import.meta.url).pathname;
export const VPS = { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } };
export const launch = () => chromium.launch({ headless: true, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
export const nap = (ms) => new Promise((r) => setTimeout(r, ms));
export async function slowScroll(page, step = 300, delay = 150) {
  await page.evaluate(async ([step, delay]) => {
    const nap = (ms) => new Promise((r) => setTimeout(r, ms));
    const maxY = () => Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) - innerHeight;
    let y = 0, n = 0;
    while (y < maxY() && n < 900) { y = Math.min(y + step, maxY()); scrollTo({ top: y, behavior: 'instant' }); n++; await nap(delay); }
  }, [step, delay]);
  await page.waitForTimeout(1500);
}
// Full-page shot; if the page is taller than the GPU texture limit (16384), save 8000px clip tiles instead.
export async function shotFull(page, file) {
  try { await page.screenshot({ path: file, fullPage: true }); return [file]; } catch {}
  const { h, w } = await page.evaluate(() => ({ h: document.documentElement.scrollHeight, w: document.documentElement.clientWidth }));
  const out = [];
  for (let y = 0, i = 0; y < h; y += 8000, i++) { const f = file.replace(/\.png$/, `-tile${i}.png`); await page.screenshot({ path: f, fullPage: true, clip: { x: 0, y, width: w, height: Math.min(8000, h - y) } }); out.push(f); }
  return out;
}
