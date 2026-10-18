// Prints /one-pager to the A4 PDF behind its download button.
// Usage: node scripts/one-pager-pdf.mjs [url]   (default: the dev server on 5173)
// Needs the page served: `npm run dev -- --port 5173` or `npm run preview`.
import { chromium } from 'playwright';

const url = process.argv[2] ?? 'http://localhost:5173/one-pager';
const out = 'public/files/gabriel-moreno-ribeiro-hibeex.pdf';

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || undefined,
  args: process.env.CHROME_ARGS ? process.env.CHROME_ARGS.split(' ') : [],
});
const page = await browser.newPage({ viewport: { width: 1100, height: 1400 } });
// Reduced motion: the numbers land on their final value at once, no entrances.
await page.emulateMedia({ media: 'print', reducedMotion: 'reduce' });
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForSelector('.op__head');
await page.waitForFunction(() => !document.getElementById('preloader'));
await page.evaluate(() => document.fonts.ready);
await page.pdf({ path: out, format: 'A4', printBackground: true, preferCSSPageSize: true });
await browser.close();
console.log(`wrote ${out}`);
