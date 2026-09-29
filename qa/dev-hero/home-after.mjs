import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:5173/', { waitUntil: 'load' });
await p.waitForTimeout(4000);
await p.screenshot({ path: 'qa/dev-hero/home-after-cuts.png' });
await b.close();
