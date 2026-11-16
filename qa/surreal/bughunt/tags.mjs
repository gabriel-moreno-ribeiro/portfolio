// Screenshots of the Cool Things tag lines (stray leading dot check).
import { chromium } from 'playwright';
const b = await chromium.launch();
for (const W of [1440, 1024, 390]) {
  const p = await b.newPage({ viewport: { width: W, height: 900 } });
  await p.goto('http://localhost:5173/#work', { waitUntil: 'load' });
  await p.waitForTimeout(9000);
  const metas = await p.$$('.work-row__meta');
  let i = 0;
  for (const m of metas) {
    await m.scrollIntoViewIfNeeded();
    await p.waitForTimeout(1500);
    await m.screenshot({ path: `qa/surreal/bughunt/after-tags-${W}-${i++}.png` });
  }
  await p.close();
}
await b.close();
