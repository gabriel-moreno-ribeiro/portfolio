import { chromium } from 'playwright';
const OUT = 'qa/fb2-critic';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await p.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
const total = await p.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < total + 6000; y += 600) { await p.evaluate((v) => scrollTo(0, v), y); await p.waitForTimeout(80); }
await p.waitForTimeout(1500);
for (const id of ['work','numbers']) { await p.evaluate((id)=>{const e=document.getElementById(id); scrollTo(0,e.getBoundingClientRect().top+scrollY-80);}, id); await p.waitForTimeout(1200); await p.screenshot({ path: `${OUT}/sec-${id}.png`, scale:'css' }); }
async function goExp(f){ for (let t=0;t<6;t++){ const off = await p.evaluate((f)=>{const r=document.querySelector('#work-experience').getBoundingClientRect();const want=-f*(r.height-innerHeight);scrollTo(0,Math.max(0,r.top+scrollY+f*(r.height-innerHeight)));return Math.abs(r.top-want);},f); await p.waitForTimeout(450); if(off<4)break;} await p.waitForTimeout(900); }
await goExp(0.02);
await p.screenshot({ path: `${OUT}/z-caption.png`, clip: { x: 600, y: 330, width: 380, height: 260 } });
await p.screenshot({ path: `${OUT}/z-odo.png`, clip: { x: 1150, y: 60, width: 230, height: 110 } });
await p.screenshot({ path: `${OUT}/z-fade.png`, clip: { x: 500, y: 380, width: 800, height: 520 } });
const info = await p.evaluate(()=>{ const s=document.querySelector('#work-experience'); const cap=[...s.querySelectorAll('*')].find(e=>/grandfather/.test(e.textContent)&&e.children.length<3); const cs=cap&&getComputedStyle(cap); return {cap: cap?.outerHTML.slice(0,600), capFont: cs?.fontFamily, capColor: cs?.color, odoFont: getComputedStyle(document.querySelector('.exp__odo-year')).fontFamily, odoOrg: getComputedStyle(document.querySelector('.exp__odo-org')).fontFamily, odoPos: getComputedStyle(document.querySelector('.exp__odo')).position}; });
console.log(JSON.stringify(info,null,1));
// end of experience: odometer leaking?
await goExp(1); await p.evaluate(()=>scrollBy(0,500)); await p.waitForTimeout(1000);
await p.screenshot({ path: `${OUT}/exp-after.png`, scale:'css' });
console.log('odo visible after section:', await p.evaluate(()=>{const r=document.querySelector('.exp__odo').getBoundingClientRect(); const cs=getComputedStyle(document.querySelector('.exp__odo')); return {top:r.top, op: cs.opacity, vis: cs.visibility};}));
await b.close();
