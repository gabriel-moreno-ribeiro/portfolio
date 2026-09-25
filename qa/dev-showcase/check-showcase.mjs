import { chromium } from 'playwright';

const BASE = 'http://localhost:5173';
const OUT = 'C:/portfolio-gabriel/qa/dev-showcase';
const out = {};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 200)); });
page.on('pageerror', (e) => errors.push('pageerror: ' + String(e).slice(0, 200)));

await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);

async function sectionInfo(sel) {
  return page.evaluate((s) => {
    const el = document.querySelector(s);
    if (!el) return { found: false };
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
    return { found: true, w: Math.round(r.width), h: Math.round(r.height), opacity: cs.opacity, display: cs.display, chars: text.length, sample: text.slice(0, 120) };
  }, sel);
}

// 1. Scroll each section into view and measure
for (const [name, sel] of [['numbers', 'div.numbers-and-stats'], ['research', '#research'], ['work', '.find-my-work']]) {
  await page.locator(sel).scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  out[name] = await sectionInfo(sel);
}

// 2. Hidden-by-animation audit across the whole page
out.hiddenByAnim = await page.evaluate(() => {
  const bad = [];
  for (const el of document.querySelectorAll('.numbers-and-stats *, #research *, .find-my-work *')) {
    const cs = getComputedStyle(el);
    if (parseFloat(cs.opacity) === 0 && el.getAttribute('aria-hidden') !== 'true' && !el.classList.contains('research-card__preview') && cs.position !== 'absolute') {
      bad.push(el.className + '|' + (el.textContent || '').slice(0, 30));
    }
  }
  return bad.slice(0, 12);
});

// 3. Numbers panel details
await page.locator('div.numbers-and-stats').scrollIntoViewIfNeeded();
await page.waitForTimeout(1500);
out.numbersPanel = await page.evaluate(() => {
  const tiles = [...document.querySelectorAll('.stat-tile')].map((t) => ({
    cls: t.className.replace('hl-reveal ', ''),
    value: t.querySelector('.stat-tile__value')?.textContent?.trim(),
  }));
  const now = [...document.querySelectorAll('.now-tile')].map((t) => (t.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 70));
  return { tiles, now, pulse: document.querySelector('.numbers-head__pulse')?.textContent, live: document.querySelector('.numbers-and-stats p.sr-only')?.textContent };
});
await page.screenshot({ path: `${OUT}/numbers-1440.png` });

// 4. Cool Things: thumbnails size + live rows
await page.locator('.find-my-work').scrollIntoViewIfNeeded();
await page.waitForTimeout(800);
out.coolThings = await page.evaluate(() => {
  const thumbs = [...document.querySelectorAll('.carousel-thumb')].map((b) => {
    const r = b.getBoundingClientRect();
    return { w: Math.round(r.width), h: Math.round(r.height), label: b.getAttribute('aria-label'), current: b.getAttribute('aria-current') };
  });
  const live = [...document.querySelectorAll('.project-live')].map((p) => (p.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 90));
  const imgsNoDims = [...document.querySelectorAll('.find-my-work img, #research img, .numbers-and-stats img')]
    .filter((i) => !i.getAttribute('width') || !i.getAttribute('height'))
    .map((i) => i.getAttribute('src'));
  const bar = document.querySelector('.failure-bar__fill');
  return { thumbs: thumbs.slice(0, 10), thumbCount: thumbs.length, live, imgsNoDims, barTransform: bar && getComputedStyle(bar).transform };
});
await page.screenshot({ path: `${OUT}/cool-things-1440.png` });

// 5. Research
await page.locator('#research').scrollIntoViewIfNeeded();
await page.waitForTimeout(800);
out.research = await page.evaluate(() => ({
  cards: [...document.querySelectorAll('.research-card')].map((c) => ({
    opacity: getComputedStyle(c).opacity,
    latest: !!c.querySelector('.research-card__latest'),
    link: c.querySelector('.research-card__link')?.getAttribute('href'),
    target: c.querySelector('.research-card__link')?.getAttribute('target'),
    rel: c.querySelector('.research-card__link')?.getAttribute('rel'),
  })),
  roleButtons: document.querySelectorAll('#research [role="button"]').length,
}));
await page.screenshot({ path: `${OUT}/research-1440.png` });

// 6. Terminal: Ctrl+K with uppercase K, help, new commands, Escape from xterm
await page.evaluate(() => window.scrollTo(0, 0));
await page.locator('.terminal-launch').scrollIntoViewIfNeeded();
await page.locator('.terminal-launch').focus();
await page.keyboard.press('Control+K');
await page.waitForTimeout(1200);
out.terminal = await page.evaluate(() => {
  const w = document.querySelector('.draggable-window');
  return w ? { role: w.getAttribute('role'), modal: w.getAttribute('aria-modal'), label: w.getAttribute('aria-label') } : { open: false };
});

async function run(cmd) {
  await page.keyboard.type(cmd);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(600);
  return page.evaluate(() => {
    const rows = [...document.querySelectorAll('.xterm-rows > div')].map((d) => (d.textContent || '').replace(/\u00a0/g, ' ').trimEnd());
    return rows.filter((r) => r.trim()).slice(-18);
  });
}
await page.waitForTimeout(1500);
out.help = await run('help');
out.now = await run('now');
out.stats = await run('stats');
out.projectsCmd = await run('projects');
out.sound = await run('sound');

out.focusBefore = await page.evaluate(() => document.activeElement?.className || document.activeElement?.tagName);
await page.keyboard.press('Escape');
await page.waitForTimeout(800);
out.afterEscape = await page.evaluate(() => ({
  open: !!document.querySelector('.draggable-window'),
  focus: document.activeElement?.className || document.activeElement?.tagName,
  focusText: document.activeElement?.textContent?.trim().slice(0, 30),
}));

// 7. Mobile
const mob = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mob.goto(BASE, { waitUntil: 'networkidle' });
await mob.waitForTimeout(1200);
await mob.locator('div.numbers-and-stats').scrollIntoViewIfNeeded();
await mob.waitForTimeout(1200);
out.mobileNumbers = await mob.evaluate(() => {
  const el = document.querySelector('div.numbers-and-stats');
  const r = el.getBoundingClientRect();
  const thumbs = [...document.querySelectorAll('.carousel-thumb')].map((b) => { const t = b.getBoundingClientRect(); return `${Math.round(t.width)}x${Math.round(t.height)}`; });
  return { h: Math.round(r.height), chars: el.textContent.trim().length, thumb: thumbs[0], overflow: document.documentElement.scrollWidth > 390 };
});
await mob.screenshot({ path: `${OUT}/numbers-390.png` });

out.consoleErrors = errors.slice(0, 10);
console.log(JSON.stringify(out, null, 2));
await browser.close();
