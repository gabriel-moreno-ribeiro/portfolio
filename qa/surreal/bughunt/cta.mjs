// Mobile "Get in Touch" from a subpage and from the home: lands on the contact form.
import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
const p = await ctx.newPage();
for (const start of ['/work/hibeex', '/files', '/']) {
  await p.goto('http://localhost:5173' + start, { waitUntil: 'load' });
  await p.waitForTimeout(2000);
  await p.evaluate(() => scrollTo(0, 900));
  await p.waitForTimeout(800);
  await p.tap('.mobile-sticky-cta__btn').catch(e => console.log('tap fail', e.message.slice(0, 80)));
  await p.waitForTimeout(5000);
  console.log(start, '->', await p.evaluate(() => ({ url: location.pathname + location.hash, contactTop: Math.round(document.getElementById('contact')?.getBoundingClientRect().top ?? -1), title: document.querySelector('#contact h2')?.getBoundingClientRect().top | 0 })));
}
await b.close();
