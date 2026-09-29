import { chromium } from 'playwright';
const b = await chromium.launch();
const lum = c => { const [r,g,b2] = c.match(/[\d.]+/g).slice(0,3).map(Number).map(v => { v/=255; return v<=0.03928? v/12.92 : ((v+0.055)/1.055)**2.4; }); return 0.2126*r+0.7152*g+0.0722*b2; };
for (const dark of [false, true]) {
  const ctx = await b.newContext({ viewport: { width: 1280, height: 800 } });
  await ctx.addInitScript(`localStorage.setItem('darkMode', ${dark})`);
  const p = await ctx.newPage();
  await p.goto('http://localhost:5173/', { waitUntil: 'load' });
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await p.waitForTimeout(2500);
  const r = await p.evaluate(() => {
    const t = document.querySelector('.footer .hl-live__text'); if (!t) return null;
    const f = document.querySelector('.footer');
    // composite the footer's rgba over the page background
    const fb = getComputedStyle(f).backgroundColor, pb = getComputedStyle(document.body).backgroundColor;
    const n = s => s.match(/[\d.]+/g).map(Number);
    const [fr,fg,fbl,fa=1] = n(fb), [pr,pg,pbl] = n(pb);
    const mix = [fr*fa+pr*(1-fa), fg*fa+pg*(1-fa), fbl*fa+pbl*(1-fa)].map(Math.round);
    const [tr,tg,tb,ta=1] = n(getComputedStyle(t).color);
    const text = [tr*ta+mix[0]*(1-ta), tg*ta+mix[1]*(1-ta), tb*ta+mix[2]*(1-ta)].map(Math.round);
    return { footerBg: `rgb(${mix})`, text: `rgb(${text})` };
  });
  const [x,y] = [lum(r.text), lum(r.footerBg)].sort((a,c)=>c-a);
  console.log(dark ? 'dark ' : 'light', r.footerBg, 'vs', r.text, '=', (((x+0.05)/(y+0.05))).toFixed(2)+':1');
  await ctx.close();
}
await b.close();
