// Uso: node overnight/weight.mjs <baseUrl>
// Peso por página: bytes transferidos (após scroll completo), separados por tipo.
import { chromium } from "playwright";
const base = (process.argv[2] || "http://localhost:4173").replace(/\/$/, "");
const routes = (process.argv[3] || "/,/story,/news,/library").split(",");
const browser = await chromium.launch();
console.log("| rota | JS | CSS | imagens | fontes | outros | total | requests |");
console.log("|---|---|---|---|---|---|---|---|");
for (const route of routes) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const sizes = { js: 0, css: 0, img: 0, font: 0, other: 0 };
  let n = 0;
  page.on("response", async (res) => {
    try {
      const url = res.url();
      if (!url.startsWith(base)) return; // só o que servimos (terceiros à parte)
      const body = await res.body().catch(() => null);
      if (!body) return;
      n++;
      const ct = res.headers()["content-type"] || "";
      const k = /javascript/.test(ct) ? "js" : /css/.test(ct) ? "css" : /image|avif|webp/.test(ct) ? "img" : /font|woff/.test(ct) || /\.woff2?$/.test(url) ? "font" : "other";
      sizes[k] += body.length;
    } catch {}
  });
  await page.goto(base + route, { waitUntil: "domcontentloaded", timeout: 90000 });
  await page.waitForTimeout(2500);
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < total; y += 700) { await page.evaluate((yy) => window.scrollTo({ top: yy, behavior: "instant" }), y); await page.waitForTimeout(250); }
  await page.waitForTimeout(3000);
  const kb = (b) => (b / 1024).toFixed(0) + " kB";
  const sum = Object.values(sizes).reduce((a, b) => a + b, 0);
  console.log(`| ${route} | ${kb(sizes.js)} | ${kb(sizes.css)} | ${kb(sizes.img)} | ${kb(sizes.font)} | ${kb(sizes.other)} | **${kb(sum)}** | ${n} |`);
  await ctx.close();
}
await browser.close();
