import { chromium } from 'playwright';
const browser = await chromium.launch({ args: ['--use-gl=angle','--use-angle=gl','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
for (const dark of [false, true]) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  await ctx.addInitScript(`localStorage.setItem('darkMode', ${dark})`);
  for (const route of ['/library', '/news', '/story', '/files', '/work/hibeex']) {
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', e => errs.push(e.message.slice(0, 120)));
    await page.goto('http://localhost:5173' + route, { waitUntil: 'load', timeout: 45000 });
    await page.waitForTimeout(1500);
    const info = await page.evaluate(() => ({
      nav: document.querySelector('.navbar')?.tagName,
      navW: Math.round(document.querySelector('.navbar')?.getBoundingClientRect().width ?? 0),
      status: document.querySelector('.navbar__status-text')?.textContent?.slice(0, 20),
      footer: !!document.querySelector('.footer__freshness'),
      overflow: document.documentElement.scrollWidth > window.innerWidth,
    }));
    console.log((dark ? 'dark ' : 'light'), route.padEnd(14), JSON.stringify(info), errs.length ? 'ERR ' + errs[0] : '');
    await page.close();
  }
  await ctx.close();
}
// dark home + globe
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.addInitScript(`localStorage.setItem('darkMode', true)`);
const page = await ctx.newPage();
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.evaluate(() => document.getElementById('background')?.scrollIntoView({ block: 'center' }));
await page.waitForTimeout(3000);
await page.screenshot({ path: 'qa/dev-hero/dark-globe.png' });
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await page.waitForTimeout(1200);
await page.screenshot({ path: 'qa/dev-hero/dark-footer.png' });
await browser.close();
