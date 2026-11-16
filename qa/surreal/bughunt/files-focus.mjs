// /files: what keyboard focus looks like on a folder.
import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:5173/files', { waitUntil: 'load' });
await p.waitForTimeout(2000);
for (let i = 0; i < 11; i++) { await p.keyboard.press('Tab'); await p.waitForTimeout(120); }
await p.waitForTimeout(600);
console.log(await p.evaluate(() => document.activeElement?.getAttribute('aria-label')));
const box = await p.evaluate(() => { const r = document.activeElement.closest('.gf-card, li, div').getBoundingClientRect(); return { x: Math.max(0, r.x - 40), y: Math.max(0, r.y - 40), width: r.width + 80, height: r.height + 80 }; });
await p.screenshot({ path: 'qa/surreal/bughunt/files-focus-' + (process.env.TAG || 'before') + '.png', clip: box });
await b.close();
