// /library behaviour checks. Measures only.
import { chromium } from 'playwright';
import fs from 'node:fs';
const OUT = 'C:/portfolio-gabriel/qa/libnews';
const b = await chromium.launch({ args: ['--enable-webgl', '--ignore-gpu-blocklist', '--use-angle=swiftshader'] });
const all = [];

const lum = (c) => { const [r, g, bb] = c.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * bb; };
const ratio = (a, c) => { const [x, y] = [lum(a), lum(c)].sort((m, n) => n - m); return +((x + 0.05) / (y + 0.05)).toFixed(2); };
const parseRGB = (s) => s.match(/[\d.]+/g).slice(0, 4).map(Number);

for (const [w, h] of [[1440, 900], [390, 844]]) for (const theme of ['light', 'dark']) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: w === 390, hasTouch: w === 390 });
  await ctx.addInitScript((d) => { localStorage.setItem('darkMode', JSON.stringify(d)); }, theme === 'dark');
  const p = await ctx.newPage();
  await p.goto('http://localhost:5173/library', { waitUntil: 'load' });
  await p.evaluate((t) => document.documentElement.setAttribute('data-theme', t), theme);
  await p.waitForSelector('.library--ready', { timeout: 60000 });
  await p.waitForTimeout(2500);
  const title = () => p.evaluate(() => document.querySelector('.library__caption-body:last-child .library__title')?.textContent);
  const r = { w, theme };
  r.topLeftEl = await p.evaluate(() => { const e = document.elementFromPoint(2, 2); const cs = e && getComputedStyle(e); return e && { tag: e.tagName, cls: e.className?.toString(), bg: cs.backgroundColor }; });
  r.review = await p.evaluate(() => { const e = document.querySelector('.library__caption-body:last-child .library__review'); return e ? { text: e.textContent, visible: e.getBoundingClientRect().height > 0 } : null; });
  r.tipVisibleWithoutHover = await p.evaluate(() => [...document.querySelectorAll('.library__age-tip')].filter(t => +getComputedStyle(t).opacity > 0.5).map(t => t.textContent));

  // Card contrast: hide card text, screenshot the card, sample median bg; compare with text colors
  const card = p.locator('.library__caption-body').last();
  const box = await card.boundingBox();
  const colors = await p.evaluate(() => { const q = (s) => { const e = document.querySelector('.library__caption-body:last-child ' + s); return e ? getComputedStyle(e).color : null; }; return { title: q('.library__title'), author: q('.library__author'), read: q('.library__read'), review: q('.library__review'), index: q('.library__index span'), fav: q('.library__index em') }; });
  const cardBg = await p.evaluate(() => { let e = document.querySelector('.library__caption'); const out = []; for (const el of [document.querySelector('.library__caption-body:last-child'), document.querySelector('.library__caption')]) { const cs = getComputedStyle(el); out.push({ bg: cs.backgroundColor, filter: cs.backdropFilter }); } return out; });
  await p.addStyleTag({ content: '.library__caption *{color:transparent!important;border-color:transparent!important}' });
  await p.waitForTimeout(100);
  const shot = await p.screenshot({ clip: { x: box.x + 4, y: box.y + 4, width: box.width - 8, height: box.height - 8 } });
  const bgPix = await p.evaluate(async (b64) => { const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode(); const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const x = c.getContext('2d'); x.drawImage(img, 0, 0); const d = x.getImageData(0, 0, c.width, c.height).data; const L = []; for (let i = 0; i < d.length; i += 4 * 7) L.push([d[i], d[i + 1], d[i + 2]]); L.sort((a, b) => (a[0] + a[1] + a[2]) - (b[0] + b[1] + b[2])); return { median: L[L.length >> 1], min: L[0], max: L[L.length - 1] }; }, shot.toString('base64'));
  await p.evaluate(() => document.querySelectorAll('style').forEach(s => { if (s.textContent.includes('color:transparent!important')) s.remove(); }));
  r.card = { cardBg, bgPixelMedian: bgPix.median, bgPixelMin: bgPix.min, bgPixelMax: bgPix.max, contrast: {} };
  for (const [k, v] of Object.entries(colors)) if (v) { const c = parseRGB(v); r.card.contrast[k] = { color: v, vsMedian: ratio(c.slice(0, 3), bgPix.median), vsLightest: ratio(c.slice(0, 3), bgPix.max), vsDarkest: ratio(c.slice(0, 3), bgPix.min) }; }

  // Ruler hover
  const ages = p.locator('.library__ages button.library__age');
  r.ageButtons = await ages.count();
  if (w === 1440) {
    const target = ages.nth(5);
    await target.hover();
    await p.waitForTimeout(450);
    r.hoverTip = await target.evaluate((el) => { const t = el.querySelector('.library__age-tip'); const cs = getComputedStyle(t); return { text: t.textContent, opacity: cs.opacity, visibility: cs.visibility }; });
    await p.screenshot({ path: `${OUT}/library-${w}-${theme}-ruler-hover.png` });
  }
  // Click an age: title changes?
  const before = await title();
  const t0 = Date.now();
  await ages.nth(6).click();
  let changedAt = null;
  for (let i = 0; i < 60; i++) { if ((await title()) !== before) { changedAt = Date.now() - t0; break; } await p.waitForTimeout(50); }
  await p.waitForTimeout(2500);
  r.ageClick = { before, after: await title(), changedMs: changedAt, ageLabel: await ages.nth(6).getAttribute('aria-label'), activeAge: await p.evaluate(() => document.querySelector('.library__age.is-active')?.getAttribute('aria-label')) };

  // Home / End timing (focus body first so window keydown handles it)
  await p.evaluate(() => { document.activeElement?.blur(); });
  const timeKey = async (key) => { const prev = await title(); const s = Date.now(); await p.keyboard.press(key); for (let i = 0; i < 40; i++) { const t = await title(); if (t !== prev) return { ms: Date.now() - s, title: t }; await p.waitForTimeout(25); } return { ms: null, title: await title() }; };
  r.end = await timeKey('End');
  await p.waitForTimeout(1500);
  r.endIndex = await p.evaluate(() => document.querySelector('.library__caption-body:last-child .library__index span')?.textContent);
  // reading now: last book is index 28 -> Made in America is 27th
  await p.keyboard.press('ArrowLeft');
  await p.waitForTimeout(1800);
  r.readingCard = await p.evaluate(() => ({ title: document.querySelector('.library__caption-body:last-child .library__title')?.textContent, read: document.querySelector('.library__caption-body:last-child .library__read')?.textContent, review: document.querySelector('.library__caption-body:last-child .library__review')?.textContent }));
  await p.screenshot({ path: `${OUT}/library-${w}-${theme}-reading.png` });
  r.home = await timeKey('Home');
  await p.waitForTimeout(1500);

  // Drawer by keyboard: Tab from top until "All books" toggle
  await p.evaluate(() => { document.activeElement?.blur(); window.scrollTo(0, 0); });
  let reached = null; const tabs = [];
  for (let i = 0; i < 25; i++) { await p.keyboard.press('Tab'); const a = await p.evaluate(() => { const e = document.activeElement; return { cls: e.className?.toString(), text: (e.innerText || e.getAttribute('aria-label') || '').trim().slice(0, 30), ring: getComputedStyle(e).outlineStyle + ' ' + getComputedStyle(e).outlineWidth + ' / ' + getComputedStyle(e).boxShadow.slice(0, 40) }; }); tabs.push(a); if (a.cls.includes('library__index-toggle')) { reached = i + 1; break; } }
  r.tabsToDrawerToggle = reached; r.tabOrder = tabs;
  await p.keyboard.press('Enter');
  await p.waitForTimeout(700);
  r.drawer = await p.evaluate(() => { const d = document.querySelector('.library__drawer'); const f = document.activeElement; return { open: d.classList.contains('is-open'), focusInside: d.contains(f), focused: f.getAttribute('aria-label') || f.textContent?.slice(0, 30), readingFlag: [...d.querySelectorAll('.library__row-flags span')].map(s => s.textContent).filter(t => /reading/i.test(t)).length }; });
  await p.screenshot({ path: `${OUT}/library-${w}-${theme}-drawer.png` });
  // Filter "Reading now"
  const readingBtn = p.locator('.library__filters button', { hasText: 'Reading now' });
  if (await readingBtn.count()) { await readingBtn.click(); await p.waitForTimeout(300); r.drawer.readingFilterRows = await p.locator('.library__drawer .library__row').count(); r.drawer.readingFilterTitles = await p.locator('.library__drawer .library__row-title').allTextContents(); await p.locator('.library__filters button', { hasText: 'All' }).first().click(); }
  // tab trap cycles
  for (let i = 0; i < 70; i++) await p.keyboard.press('Tab');
  r.drawer.focusInsideAfter70Tabs = await p.evaluate(() => document.querySelector('.library__drawer').contains(document.activeElement));
  await p.keyboard.press('Escape');
  await p.waitForTimeout(600);
  r.drawer.afterEscape = await p.evaluate(() => ({ open: document.querySelector('.library__drawer').classList.contains('is-open'), focus: document.activeElement.className?.toString() }));
  // Ctrl+K
  await p.keyboard.press('Control+k');
  await p.waitForTimeout(600);
  r.ctrlK = await p.evaluate(() => { const d = [...document.querySelectorAll('[role="dialog"], dialog[open]')].filter(e => e.getBoundingClientRect().height > 0 && getComputedStyle(e).visibility !== 'hidden' && !e.classList.contains('library__drawer')); return d.map(e => e.getAttribute('aria-label') || e.className?.toString().slice(0, 40)); });
  await p.keyboard.press('Escape');
  all.push(r);
  console.log(w, theme, JSON.stringify({ review: !!r.review, tipNoHover: r.tipVisibleWithoutHover, hover: r.hoverTip, ageClick: r.ageClick, end: r.end, home: r.home, reading: r.readingCard, tabs: r.tabsToDrawerToggle, drawer: r.drawer, ctrlK: r.ctrlK, contrast: r.card.contrast, bg: r.card.bgPixelMedian, topLeft: r.topLeftEl }));
  await ctx.close();
}
fs.writeFileSync(`${OUT}/library-checks.json`, JSON.stringify(all, null, 2));
await b.close();
