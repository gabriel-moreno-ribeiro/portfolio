import { chromium } from 'playwright';
const b = await chromium.launch({ headless: true, args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
for (const vp of [{w:1440,h:900},{w:390,h:844,isMobile:true,hasTouch:true,deviceScaleFactor:2}]) {
  const ctx = await b.newContext({ viewport:{width:vp.w,height:vp.h}, isMobile:vp.isMobile, hasTouch:vp.hasTouch, deviceScaleFactor:vp.deviceScaleFactor||1 });
  const p = await ctx.newPage();
  await p.goto('http://localhost:4173/', { waitUntil: 'load' });
  await p.waitForTimeout(1500);
  // walk down, stop when #numbers exists, then park its top at 20% of the viewport
  await p.evaluate(async () => { const nap=(t)=>new Promise(r=>setTimeout(r,t)); const maxY=()=>document.documentElement.scrollHeight-window.innerHeight; let y=0;
    while(y<maxY()){ y=Math.min(y+300,maxY()); window.scrollTo({top:y,behavior:'instant'}); await nap(70);
      const n=document.getElementById('numbers'); if(n&&(n.textContent||'').length>80) break; } });
  await p.waitForTimeout(400);
  await p.evaluate(async () => { const n=document.getElementById('numbers'); if(!n) return; const t=n.getBoundingClientRect().top+window.scrollY; window.scrollTo({top:Math.max(0,t-window.innerHeight*0.2),behavior:'instant'}); });
  const s=[];
  for (const w of [0,300,600,1200,2500,4000]) { if(w) await p.waitForTimeout(w===300?300:(w===600?300:(w===1200?600:(w===2500?1300:1500))));
    s.push({at:w, v: await p.evaluate(()=>[...document.querySelectorAll('#numbers [class*="value"], #numbers [class*="stat-tile"] strong')].map(e=>(e.textContent||'').trim()).slice(0,8))}); }
  console.log(vp.w+':', JSON.stringify(s));
  await p.screenshot({ path: `qa/r2/numbers-parked-${vp.w}.png` });
  await ctx.close();
}
await b.close();
