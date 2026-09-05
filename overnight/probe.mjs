// Sondas pontuais: contadores do /story depois da animação e elementos mais largos que a viewport na home.
import { chromium } from "playwright";
const base = (process.argv[2] || "http://localhost:4173").replace(/\/$/, "");
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

await page.goto(base + "/story", { waitUntil: "load" });
await page.waitForTimeout(1000);
for (const sel of [".fig--laptops", ".fig--repos", ".fig--town"]) {
  const el = await page.$(sel);
  if (!el) { console.log(sel, "não encontrado"); continue; }
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(4500);
  console.log(`\n[${sel}]`, (await el.innerText()).replace(/\n+/g, " | ").slice(0, 400));
}

await page.goto(base + "/", { waitUntil: "load" });
await page.waitForTimeout(2500);
const wide = await page.evaluate(() => {
  const vw = document.documentElement.clientWidth; const out = [];
  for (const el of document.querySelectorAll("body *")) {
    const r = el.getBoundingClientRect();
    if (r.width > 0 && (r.right > vw + 2 || r.left < -2) && !["CANVAS"].includes(el.tagName)) {
      const cls = typeof el.className === "string" ? el.className.split(" ").slice(0, 2).join(".") : "";
      out.push(`${el.tagName.toLowerCase()}.${cls} left=${Math.round(r.left)} right=${Math.round(r.right)} w=${Math.round(r.width)}`);
    }
  }
  return { vw, sw: document.documentElement.scrollWidth, bodySw: document.body.scrollWidth, out: out.slice(0, 25) };
});
console.log("\n[home wide]", JSON.stringify(wide, null, 1));
await browser.close();
