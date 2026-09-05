// Uso: node overnight/spots.mjs <baseUrl> <outDir>
// Screenshots de viewport em pontos específicos (seletor rolado até o centro), claro e escuro, 1440 e 390.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const base = (process.argv[2] || "http://localhost:4173").replace(/\/$/, "");
const outDir = process.argv[3] || "overnight/screenshots/after/spots";
mkdirSync(outDir, { recursive: true });

const spots = [
  { route: "/", sel: "#work", name: "cool-things", wait: 2500 },
  { route: "/", sel: ".city-panel", name: "globe-panel", wait: 2500 },
  { route: "/", sel: "#research", name: "research", wait: 1500 },
  { route: "/", sel: "#contact", name: "contact", wait: 1500 },
  { route: "/story", sel: ".scale__ring--garage", name: "story-scale", wait: 3000 },
  { route: "/story", sel: ".repos", name: "story-repos", wait: 3000 },
  { route: "/library", sel: ".library__index-bar", name: "library-bar", wait: 2500 },
];

const browser = await chromium.launch();
for (const dark of [false, true]) {
  for (const width of [1440, 390]) {
    const ctx = await browser.newContext({ viewport: { width, height: width < 768 ? 844 : 900 } });
    if (dark) await ctx.addInitScript(() => localStorage.setItem("darkMode", "true"));
    const page = await ctx.newPage();
    let current = null;
    for (const s of spots) {
      try {
        if (current !== s.route) {
          await page.goto(base + s.route, { waitUntil: "domcontentloaded", timeout: 90000 });
          await page.waitForTimeout(2500);
          current = s.route;
        }
        const el = await page.$(s.sel);
        if (!el) { console.log(`${s.name}@${width}${dark ? " dark" : ""}: seletor não encontrado`); continue; }
        await el.evaluate((e) => e.scrollIntoView({ block: "start", behavior: "instant" }));
        await page.evaluate(() => window.scrollBy({ top: -80, behavior: "instant" }));
        await page.waitForTimeout(s.wait);
        await page.screenshot({ path: join(outDir, `${s.name}-${width}${dark ? "-dark" : ""}.png`), timeout: 30000 });
        console.log(`${s.name}@${width}${dark ? " dark" : ""}: ok`);
      } catch (e) {
        console.log(`${s.name}@${width}${dark ? " dark" : ""}: FALHOU ${String(e).slice(0, 120)}`);
      }
    }
    await ctx.close();
  }
}
await browser.close();
