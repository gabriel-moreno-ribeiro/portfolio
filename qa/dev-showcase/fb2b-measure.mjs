import { chromium } from 'playwright';
const b = await chromium.launch();
for (const w of [1440, 390]) {
  const p = await b.newPage({ viewport: { width: w, height: w === 390 ? 844 : 900 } });
  await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(1200);
  const sels = { work: ['#work .featured-card', '#work > h2.section-title'], numbers: ['#numbers h2.section-title', '#numbers h2'], research: ['#research .research-card', '#research > h2.section-title'] };
  for (const [k, [sec, s]] of Object.entries(sels)) {
    for (let i = 0; i < 40 && !(await p.$(sec)); i++) { await p.mouse.wheel(0, 700); await p.waitForTimeout(250); }
    if (k === 'work') {
      // Medal counter while the medals card is still below the viewport.
      await p.evaluate(() => document.querySelector('#work > h2.section-title').scrollIntoView({ block: 'start' }));
      await p.waitForTimeout(400);
      const below = await p.evaluate(() => { const e = document.querySelector('.project-live__counts'); const r = e.getBoundingClientRect(); return { top: Math.round(r.top), vh: innerHeight, text: e.textContent.trim() }; });
      console.log(w, 'medals-before', JSON.stringify(below));
      const cards = await p.$$eval('.featured-card__body > :first-child', (els) => els.map((e) => e.tagName + ':' + e.textContent.trim() + ':' + getComputedStyle(e).fontSize));
      console.log(w, 'cards', JSON.stringify(cards));
    }
    await p.evaluate((s) => document.querySelector(s).scrollIntoView({ block: 'center' }), s);
    await p.waitForTimeout(1500);
    const el = p.locator(s).first();
    const info = await el.evaluate((e) => { const c = getComputedStyle(e); const r = e.getBoundingClientRect(); const range = document.createRange(); range.selectNodeContents(e); const t = range.getBoundingClientRect(); return { tag: e.tagName, cls: e.className, text: e.textContent.trim(), fs: c.fontSize, ta: c.textAlign, textCenterOffset: Math.round((t.left + t.width / 2) - innerWidth / 2), boxCenterOffset: Math.round((r.left + r.width / 2) - innerWidth / 2) }; });
    console.log(w, k, JSON.stringify(info));
    const box = await el.boundingBox();
    await p.screenshot({ path: `qa/dev-showcase/fb2b-${k}-${w}.png`, clip: { x: 0, y: Math.max(0, box.y - 40), width: w, height: box.height + 140 } });
    if (k === 'work') {
      await p.evaluate(() => document.querySelector('.project-live__counts').scrollIntoView({ block: 'center' }));
      await p.waitForTimeout(80);
      const mid = await p.$eval('.project-live__counts', (e) => e.textContent.trim());
      await p.waitForTimeout(1600);
      const end = await p.$eval('.project-live__counts', (e) => e.textContent.trim());
      console.log(w, 'medals-during/after', JSON.stringify({ mid, end }));
      const card = p.locator('.featured-card--chips');
      await card.screenshot({ path: `qa/dev-showcase/fb2b-medals-${w}.png` });
    }
  }
  await p.close();
}
await b.close();
