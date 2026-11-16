// First-screen shots of the Home hero + CLS/console check. Run: node qa/surreal/scripts/shoot-hero.mjs
import { chromium } from 'playwright';
const OUT = new URL('../hero/', import.meta.url).pathname;
const VPS = { '1440x900': [1440, 900], '1280x720': [1280, 720], '390x844': [390, 844] };
const browser = await chromium.launch();
for (const [vp, [width, height]] of Object.entries(VPS))
  for (const theme of ['light', 'dark'])
    for (const reduced of [false, true]) {
      if (reduced && theme === 'dark') continue;
      const mobile = width < 600;
      const ctx = await browser.newContext({ viewport: { width, height }, isMobile: mobile, hasTouch: mobile, reducedMotion: reduced ? 'reduce' : 'no-preference' });
      await ctx.addInitScript((t) => {
        try { localStorage.setItem('darkMode', String(t === 'dark')); } catch {}
        window.__cls = [];
        new PerformanceObserver((l) => l.getEntries().forEach((e) => !e.hadRecentInput && window.__cls.push({ v: e.value, s: e.sources?.map((x) => x.node?.className || x.node?.nodeName) }))).observe({ type: 'layout-shift', buffered: true });
      }, theme);
      const page = await ctx.newPage();
      // SpotifyCard.tsx (another agent's file) calls a hook behind `&&` and crashes the page.
      // Patched in the browser only, so the hero can be shot; delete once the file is fixed.
      await page.route('**/Home/SpotifyCard.tsx*', async (route) => {
        const res = await route.fetch();
        const body = (await res.text()).replace('useVisible(ref) && usePageVisible()', '[useVisible(ref), usePageVisible()].every(Boolean)');
        await route.fulfill({ response: res, body });
      });
      const errors = [];
      page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 160)));
      page.on('pageerror', (e) => errors.push('pageerror: ' + String(e).slice(0, 160)));
      await page.goto('http://localhost:5173/', { waitUntil: 'load' });
      if (!reduced && theme === 'light') { await page.waitForTimeout(1900); await page.screenshot({ path: `${OUT}${vp}-${theme}-entrance.png` }); }
      await page.waitForTimeout(3500);
      const key = `${vp}-${theme}${reduced ? '-reduced' : ''}`;
      await page.screenshot({ path: `${OUT}${key}.png` });
      const m = await page.evaluate(() => {
        const b = (s) => { const r = document.querySelector(s)?.getBoundingClientRect(); return r ? [Math.round(r.top), Math.round(r.bottom)] : null; };
        return { stats: b('.ranked-stats'), cta: b('.hero-section .btn-flex'), spotify: b('.spotify-card'), hScroll: document.documentElement.scrollWidth > innerWidth,
          text: document.querySelector('.ranked-stats')?.innerText.replace(/\s+/g, ' '), cls: window.__cls };
      });
      console.log(key, JSON.stringify(m), 'errors:', JSON.stringify([...new Set(errors)]));
      await ctx.close();
    }
await browser.close();
