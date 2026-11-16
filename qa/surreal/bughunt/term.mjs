import { chromium } from 'playwright';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: +(process.env.W||1440), height: 900 } });
const p = await ctx.newPage();
const errs = []; p.on('console', m => { if (['error','warning'].includes(m.type())) errs.push(m.text().slice(0,200)); }); p.on('pageerror', e => errs.push('PE ' + e.message));
p.on('request', q => { if (q.url().includes('/api/')) errs.push('REQ ' + q.method() + ' ' + q.url()); });
await p.goto('http://localhost:5173/', { waitUntil: 'load' }); await p.waitForTimeout(1500);
await p.keyboard.press('Control+k'); await p.waitForTimeout(1800);
const cmds = (process.env.C || 'help|projects|open hibeex').split('|');
const dump = async () => p.evaluate(() => [...document.querySelectorAll('.xterm-rows > div')].map(d => d.textContent).join('\n'));
for (const c of cmds) {
  await p.keyboard.type(c, { delay: 5 }); await p.keyboard.press('Enter'); await p.waitForTimeout(c.startsWith('ai') ? 6000 : 900);
  console.log('=== ' + c + ' url=' + p.url()); console.log((await dump()).split('\n').filter(l => l.trim()).slice(-30).join('\n'));
  if (!(await p.$('.xterm'))) { console.log('(terminal closed)'); break; }
}
await p.screenshot({ path: 'qa/surreal/bughunt/term-' + (process.env.TAG||'x') + '.png' });
console.log('errs', errs);
await b.close();
