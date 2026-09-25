import { chromium } from 'playwright';
import sass from 'sass';
const css = sass.compile('src/styles/components/home/sectionRail.scss', { silenceDeprecations: ['import','global-builtin','color-functions'] }).css;
const SECTIONS = [['main-content','Top'],['background','Origins'],['work','Cool Things'],['research','Research'],['skills','Skills'],['work-experience','Experience'],['contact','Contact']];
const html = `<nav class="section-rail" aria-label="Page sections">
<span class="section-rail__track" aria-hidden="true"><span class="section-rail__fill" style="transform:scaleY(0.45)"></span></span>
<ul class="section-rail__list">${SECTIONS.map(([id,l],i)=>`<li><button type="button" class="section-rail__item ${i===2?'section-rail__item--active':''}"${i===2?' aria-current="true"':''}><span class="section-rail__dot" aria-hidden="true"></span><span class="section-rail__label">${l}</span></button></li>`).join('')}</ul></nav>`;
const browser = await chromium.launch();
for (const dark of [false, true]) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(`localStorage.setItem('darkMode', ${dark})`);
  const page = await ctx.newPage();
  await page.goto('http://localhost:5173/', { waitUntil: 'load' });
  await page.waitForTimeout(2000);
  await page.evaluate(({ css, html }) => {
    document.querySelector('.home-sidenav')?.remove();
    const s = document.createElement('style'); s.textContent = css; document.head.append(s);
    document.body.insertAdjacentHTML('beforeend', html);
  }, { css, html });
  await page.waitForTimeout(400);
  const probe = await page.evaluate(() => {
    const a = document.querySelector('.section-rail__item--active .section-rail__label');
    const i = document.querySelector('.section-rail__item:not(.section-rail__item--active) .section-rail__label');
    const r = document.querySelector('.section-rail').getBoundingClientRect();
    return { active: getComputedStyle(a).color, idle: getComputedStyle(i).color, bg: getComputedStyle(document.body).backgroundColor,
      box: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } };
  });
  const lum = c => { const [r,g,b] = c.match(/\d+/g).map(Number).map(v => { v/=255; return v<=0.03928? v/12.92 : ((v+0.055)/1.055)**2.4; }); return 0.2126*r+0.7152*g+0.0722*b; };
  const ratio = (a,b) => { const [x,y]=[lum(a),lum(b)].sort((m,n)=>n-m); return ((x+0.05)/(y+0.05)).toFixed(2); };
  console.log(dark?'dark':'light', probe.box, 'active', probe.active, ratio(probe.active, probe.bg), '| idle', ratio(probe.idle, probe.bg));
  await page.locator('.section-rail').screenshot({ path: `qa/dev-hero/rail-${dark?'dark':'light'}.png` });
  await ctx.close();
}
await browser.close();
