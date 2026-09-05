// Uso: node overnight/wide.mjs <baseUrl> <rota> <largura> — lista elementos que passam da borda direita da viewport
import { chromium } from "playwright";
const [base, route, w] = [process.argv[2] || "http://localhost:4173", process.argv[3] || "/", Number(process.argv[4] || 768)];
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: w, height: 1024 } });
await page.goto(base + route, { waitUntil: "domcontentloaded", timeout: 90000 });
await page.waitForTimeout(3000);
const total = await page.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < total; y += 800) { await page.evaluate((yy) => window.scrollTo({ top: yy, behavior: "instant" }), y); await page.waitForTimeout(100); }
await page.waitForTimeout(1500);
const out = await page.evaluate((vw) => {
  const res = [];
  for (const el of document.querySelectorAll("body *")) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && r.right > vw + 2 && r.left < vw) {
      const cs = getComputedStyle(el);
      res.push(`${el.tagName.toLowerCase()}.${(el.className && typeof el.className === "string" ? el.className.split(" ").slice(0, 2).join(".") : "")} left=${Math.round(r.left)} width=${Math.round(r.width)} right=${Math.round(r.right)} pos=${cs.position} ov=${cs.overflowX}`);
    }
  }
  return { scrollWidth: document.documentElement.scrollWidth, res: res.slice(0, 40) };
}, w);
console.log("scrollWidth", out.scrollWidth); console.log(out.res.join("\n"));
await browser.close();
