// check 7: dark theme screenshots + automated contrast / white-box scan
import fs from 'node:fs';
import { launch, BASE, OUT, VPS, slowScroll, shotFull } from './common.mjs';
const browser = await launch(); const res = {};
for (const [vn, vp] of Object.entries(VPS)) {
  const ctx = await browser.newContext({ viewport: vp, isMobile: vn === 'mobile', hasTouch: vn === 'mobile' });
  await ctx.addInitScript(() => { try { localStorage.setItem('darkMode', 'true'); } catch {} });
  const page = await ctx.newPage();
  await page.goto(BASE + '/', { waitUntil: 'load', timeout: 60000 });
  await page.waitForTimeout(3500);
  const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  await slowScroll(page, 300, 150);
  await page.evaluate(() => scrollTo({ top: 0, behavior: 'instant' })); await page.waitForTimeout(1200);
  await shotFull(page, OUT + `dark-${vn}-full.png`);
  res[vn] = { theme, ...(await page.evaluate(() => {
    const lum = (c) => { const [r, g, b] = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
    const parse = (s) => { const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return { c: p.slice(0, 3), a: p[3] ?? 1 }; };
    const bgOf = (e) => { let n = e; while (n) { const p = parse(getComputedStyle(n).backgroundColor); if (p && p.a > 0.9) return p.c; n = n.parentElement; } return [20, 16, 13]; };
    const low = []; const white = [];
    for (const e of document.querySelectorAll('body *')) {
      const r = e.getBoundingClientRect(); const s = getComputedStyle(e);
      if (r.width < 4 || r.height < 4 || s.visibility === 'hidden' || s.display === 'none' || +s.opacity < 0.1) continue;
      const bg = parse(s.backgroundColor);
      if (bg && bg.a > 0.9 && lum(bg.c) > 0.7 && r.width > 40 && r.height > 20) white.push(e.tagName.toLowerCase() + '.' + String(e.className).split(' ')[0] + ` ${Math.round(r.width)}x${Math.round(r.height)} @y${Math.round(r.top + scrollY)} bg=${s.backgroundColor}`);
      const own = [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
      if (!own) continue;
      const fg = parse(s.color); if (!fg) continue;
      const b = bgOf(e); const L1 = lum(fg.c), L2 = lum(b); const cr = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
      const fs_ = parseFloat(s.fontSize); const large = fs_ >= 24 || (fs_ >= 18.66 && +s.fontWeight >= 700);
      if (cr < (large ? 3 : 4.5) && fg.a > 0.5) low.push({ s: e.tagName.toLowerCase() + '.' + String(e.className).split(' ')[0], txt: e.textContent.trim().slice(0, 30), cr: +cr.toFixed(2), fg: s.color, bg: `rgb(${b})`, y: Math.round(r.top + scrollY) });
    }
    return { lowContrast: low.slice(0, 40), lowContrastCount: low.length, whiteBoxes: white.slice(0, 30), whiteBoxCount: white.length, bodyBg: getComputedStyle(document.body).backgroundColor };
  })) };
  console.log(vn, 'theme', theme, 'lowContrast', res[vn].lowContrastCount, 'white', res[vn].whiteBoxCount);
  await ctx.close();
}
await browser.close();
fs.writeFileSync(OUT + 'dark.json', JSON.stringify(res, null, 2));
