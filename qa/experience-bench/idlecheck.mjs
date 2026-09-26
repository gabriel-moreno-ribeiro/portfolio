import { chromium } from 'playwright';
// a seção agora é lazy (LazySection): rola a página inteira antes de esperar pelo seletor
async function warm(page) {
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < total; y += 600) { await page.evaluate((v) => scrollTo(0, v), y); await page.waitForTimeout(70); }
  await page.waitForSelector('#work-experience .exp__car', { timeout: 30000 });
  await page.waitForTimeout(1200);
}

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await warm(p);
// vigia só o carro desta seção: qualquer desenho mexe no transform do wrapper
await p.evaluate(() => {
  window.__moves = 0;
  const el = document.querySelector('.exp__car');
  new MutationObserver(() => { window.__moves++; }).observe(el, { attributes: true, attributeFilter: ['style'] });
});
const probe = async (label) => {
  await p.evaluate(() => { window.__moves = 0; });
  await p.waitForTimeout(2500);
  console.log(label, await p.evaluate(() => window.__moves));
};
await p.evaluate(() => scrollTo(0, 0));
await p.waitForTimeout(1200);
await probe('seção fora da viewport (topo), 2,5 s parado:');
await p.evaluate(() => { const r = document.querySelector('#work-experience').getBoundingClientRect(); scrollTo(0, r.top + scrollY + 900); });
await p.waitForTimeout(6000);
await probe('seção na viewport, 6 s depois do scroll, 2,5 s parado:');
await b.close();
