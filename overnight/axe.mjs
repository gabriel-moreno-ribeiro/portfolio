// Uso: node overnight/axe.mjs <baseUrl> [rotas]
// Injeta axe-core (node_modules/axe-core/axe.min.js) em cada rota e lista violações.
import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const base = (process.argv[2] || "http://localhost:4173").replace(/\/$/, "");
const routes = (process.argv[3] || "/,/story,/news,/library,/blog,/obrigado,/privacy,/terms,/rota-que-nao-existe").split(",");
const axeSrc = readFileSync("node_modules/axe-core/axe.min.js", "utf8");

const browser = await chromium.launch();
let total = 0;
for (const route of routes) {
  for (const width of [390, 1440]) {
    const ctx = await browser.newContext({ viewport: { width, height: width < 768 ? 844 : 900 } });
    const page = await ctx.newPage();
    await page.goto(base + route, { waitUntil: "load", timeout: 60000 });
    await page.waitForTimeout(1500);
    const total0 = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < total0; y += 700) { await page.evaluate((yy) => window.scrollTo({ top: yy, behavior: "instant" }), y); await page.waitForTimeout(60); }
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.waitForTimeout(500);
    await page.addScriptTag({ content: axeSrc });
    const res = await page.evaluate(async () => {
      // @ts-ignore
      const r = await window.axe.run(document, { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"] } });
      return r.violations.map((v) => ({ id: v.id, impact: v.impact, help: v.help, n: v.nodes.length, nodes: v.nodes.slice(0, 3).map((nd) => nd.target.join(" ")) }));
    });
    total += res.length;
    console.log(`\n## ${route} @${width}: ${res.length} violações`);
    for (const v of res) console.log(`- [${v.impact}] ${v.id} (${v.n}x): ${v.help}\n    ${v.nodes.join(" | ")}`);
    await ctx.close();
  }
}
await browser.close();
console.log(`\nTOTAL: ${total} tipos de violação`);
