import { chromium } from 'playwright';
const OUT = 'qa/fb2-critic';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
const total = await p.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < total + 4000; y += 600) { await p.evaluate((v) => scrollTo(0, v), y); await p.waitForTimeout(80); }
await p.waitForSelector('#work-experience .exp__car', { timeout: 30000 });
await p.waitForTimeout(1200);
async function goExp(f){
  for (let t=0;t<6;t++){
    const off = await p.evaluate((f)=>{const r=document.querySelector('#work-experience').getBoundingClientRect();const want=-f*(r.height-innerHeight);scrollTo(0,Math.max(0,r.top+scrollY+f*(r.height-innerHeight)));return Math.abs(r.top-want);},f);
    await p.waitForTimeout(450); if(off<4)break;
  }
  await p.waitForTimeout(900);
}
for (const f of [0, 0.03, 0.08, 0.15, 0.3, 0.6, 1]) { await goExp(f); await p.screenshot({ path: `${OUT}/exp-${Math.round(f*100)}.png` }); }
// headings
const heads = await p.evaluate(() => [...document.querySelectorAll('main section h2, section h2')].map(h => ({ id: h.closest('section')?.id, text: h.textContent.trim(), cls: h.className, font: getComputedStyle(h).fontFamily, size: getComputedStyle(h).fontSize, style: getComputedStyle(h).fontStyle, weight: getComputedStyle(h).fontWeight, html: h.innerHTML.slice(0,300) })));
console.log(JSON.stringify(heads, null, 1));
let i=0;
for (const h of await p.$$('section h2')) { await h.scrollIntoViewIfNeeded(); await p.evaluate(()=>scrollBy(0,-120)); await p.waitForTimeout(900); await p.screenshot({ path: `${OUT}/head-${i++}.png` }); }
const contact = await p.$('#contact, section.contact');
if (contact) { await contact.scrollIntoViewIfNeeded(); await p.waitForTimeout(1000); await p.screenshot({ path: `${OUT}/contact.png` }); await contact.screenshot({ path: `${OUT}/contact-el.png` }); console.log('contact text:', (await contact.innerText()).slice(0,800)); }
const odo = await p.$('.exp__odo'); if (odo) console.log('odo html:', (await odo.evaluate(e=>e.outerHTML)).slice(0,1500));
await b.close();
