// Uso: node overnight/sections.mjs <baseUrl> <outDir>
// Screenshots de viewport da home em pontos específicos (seções com scroll-trigger / 3D),
// em 1440 e 390, nos dois temas.
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const base = (process.argv[2] || "http://localhost:4173").replace(/\/$/, "");
const outDir = process.argv[3] || "overnight/screenshots/before/sections";
mkdirSync(outDir, { recursive: true });

// [nome, id da seção, fração da altura da seção a rolar a partir do topo dela]
const STOPS = [
  ["hero-bottomtext", "main-content", 0],
  ["skills", "skills", 0.3],
  ["workexp-20", "work-experience", 0.2],
  ["workexp-55", "work-experience", 0.55],
  ["workexp-85", "work-experience", 0.85],
  ["contact", "contact", 0],
];

const browser = await chromium.launch();
for (const dark of [false, true]) {
  for (const width of [1440, 390]) {
    const height = width < 768 ? 844 : 900;
    const ctx = await browser.newContext({ viewport: { width, height } });
    if (dark) await ctx.addInitScript(() => localStorage.setItem("darkMode", "true"));
    const page = await ctx.newPage();
    await page.goto(base + "/", { waitUntil: "load", timeout: 60000 });
    await page.waitForTimeout(2500);
    const total = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < total; y += 600) { await page.evaluate((yy) => window.scrollTo({ top: yy, behavior: "instant" }), y); await page.waitForTimeout(150); }
    for (const [name, id, frac] of STOPS) {
      const y = await page.evaluate(([id, frac]) => {
        const el = document.getElementById(id);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return window.scrollY + r.top + r.height * frac;
      }, [id, frac]);
      if (y == null) { console.log(`${name}: #${id} não encontrado`); continue; }
      await page.evaluate((yy) => window.scrollTo({ top: yy, behavior: "instant" }), y);
      await page.waitForTimeout(name.startsWith("workexp") ? 2500 : 1800);
      const file = join(outDir, `${name}-${width}${dark ? "-dark" : ""}.png`);
      await page.screenshot({ path: file, timeout: 30000 }).catch((e) => console.log(`${name}@${width}: screenshot falhou ${String(e).slice(0, 80)}`));
      console.log(`${name}@${width}${dark ? " dark" : ""}: ok`);
    }
    await ctx.close();
  }
}
await browser.close();
