import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await p.waitForTimeout(1500);
const sels = { work: ['#work', '#work > h2'], numbers: ['#numbers', '#numbers .center-text > *'], research: ['#research', '#research > h2'] };
const shoot = process.argv[2] === 'shoot';
for (const [k, [sec, s]] of Object.entries(sels)) {
  for (let i = 0; i < 40 && !(await p.$(sec)); i++) { await p.mouse.wheel(0, 700); await p.waitForTimeout(250); }
  await p.locator(sec).scrollIntoViewIfNeeded();
  await p.waitForTimeout(600);
  const el = p.locator(s).first();
  await el.scrollIntoViewIfNeeded();
  await p.evaluate((s) => document.querySelector(s).scrollIntoView({ block: 'center' }), s);
  await p.waitForTimeout(1500);
  const info = await el.evaluate((e) => { const c = getComputedStyle(e); const r = e.getBoundingClientRect(); const em = e.querySelector('em'); return { tag: e.tagName, html: e.innerHTML.trim(), fs: c.fontSize, fw: c.fontWeight, color: c.color, ff: c.fontFamily.slice(0,30), mt: c.marginTop, mb: c.marginBottom, h: r.height, ta: c.textAlign, em: em ? getComputedStyle(em).color + ' | ' + getComputedStyle(em).fontFamily.slice(0,30) : null }; });
  console.log(k, JSON.stringify(info));
  if (shoot) {
    const box = await el.boundingBox();
    await p.screenshot({ path: `qa/dev-showcase/fb2-titles-${k}.png`, clip: { x: 0, y: Math.max(0, box.y - 60), width: 1440, height: box.height + 160 } });
  }
}
await b.close();
