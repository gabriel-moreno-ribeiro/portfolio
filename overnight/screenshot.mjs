// Uso: node overnight/screenshot.mjs <baseUrl> <outDir> [rota1,rota2,...]
// Abre cada rota em 3 larguras (390, 768, 1440), rola a página inteira para disparar
// animações de entrada, e salva screenshot de página inteira (com fallback para
// captura por viewport quando o headless trava com WebGL fora da tela).
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const base = (process.argv[2] || "http://localhost:4173").replace(/\/$/, "");
const outDir = process.argv[3] || "overnight/screenshots/before";
const routes = (process.argv[4] || "/,/story,/news,/library,/blog,/contact,/obrigado,/privacy,/terms,/rota-que-nao-existe").split(",");
const widths = [390, 768, 1440];

mkdirSync(outDir, { recursive: true });

const slug = (r) => (r === "/" ? "home" : r.replace(/^\//, "").replace(/[^a-z0-9-]/gi, "-"));

const browser = await chromium.launch();
const consoleLog = {};

for (const route of routes) {
  for (const width of widths) {
    const height = width < 768 ? 844 : width < 1440 ? 1024 : 900;
    const ctx = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, reducedMotion: "no-preference" });
    const page = await ctx.newPage();
    const key = `${route} @${width}`;
    consoleLog[key] = [];
    page.on("console", (m) => { if (["error", "warning"].includes(m.type())) consoleLog[key].push(`${m.type()}: ${m.text().slice(0, 200)}`); });
    page.on("pageerror", (e) => consoleLog[key].push(`pageerror: ${String(e).slice(0, 200)}`));
    try {
      await page.goto(base + route, { waitUntil: "load", timeout: 60000 });
      await page.waitForTimeout(1500);
      // Rola em passos para disparar reveals por IntersectionObserver
      const total = await page.evaluate(() => document.documentElement.scrollHeight);
      for (let y = 0; y < total; y += Math.floor(height * 0.8)) {
        await page.evaluate((yy) => window.scrollTo({ top: yy, behavior: "instant" }), y);
        await page.waitForTimeout(120);
      }
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      await page.waitForTimeout(800);
      const file = join(outDir, `${slug(route)}-${width}.png`);
      try {
        await page.screenshot({ path: file, fullPage: true, timeout: 45000 });
      } catch {
        // fallback: captura por viewport em sequência
        const total2 = await page.evaluate(() => document.documentElement.scrollHeight);
        let i = 0;
        for (let y = 0; y < total2; y += height) {
          await page.evaluate((yy) => window.scrollTo({ top: yy, behavior: "instant" }), y);
          await page.waitForTimeout(300);
          await page.screenshot({ path: join(outDir, `${slug(route)}-${width}-part${String(i++).padStart(2, "0")}.png`), timeout: 20000 });
        }
      }
      // overflow horizontal?
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      const status = await page.evaluate(() => document.title);
      console.log(`${key}: ok | title="${status}" | overflowX=${overflow}px | console=${consoleLog[key].length}`);
    } catch (e) {
      console.log(`${key}: FALHOU ${String(e).slice(0, 150)}`);
    }
    await ctx.close();
  }
}
await browser.close();

const withConsole = Object.entries(consoleLog).filter(([, v]) => v.length);
if (withConsole.length) {
  console.log("\n--- console (erros/avisos) ---");
  for (const [k, v] of withConsole) for (const line of [...new Set(v)].slice(0, 8)) console.log(`${k}: ${line}`);
}
