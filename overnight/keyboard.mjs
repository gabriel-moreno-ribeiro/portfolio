// Uso: node overnight/keyboard.mjs <baseUrl> <rota>
// Percorre a página com Tab e registra a ordem de foco, se o elemento focado está visível e se tem outline.
import { chromium } from "playwright";
const base = (process.argv[2] || "http://localhost:4173").replace(/\/$/, "");
const route = process.argv[3] || "/";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(base + route, { waitUntil: "domcontentloaded", timeout: 90000 });
await page.waitForTimeout(3000);
const seen = [];
for (let i = 0; i < 80; i++) {
  await page.keyboard.press("Tab");
  await page.waitForTimeout(60);
  const info = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el || el === document.body) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    const visible = r.width > 0 && r.height > 0 && cs.visibility !== "hidden" && Number(cs.opacity) > 0.05;
    const outline = cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0;
    const label = (el.getAttribute("aria-label") || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40);
    return `${el.tagName.toLowerCase()}${el.className && typeof el.className === "string" ? "." + el.className.split(" ")[0] : ""} "${label}" ${visible ? "" : "INVISÍVEL"} ${outline ? "" : "SEM-OUTLINE"} y=${Math.round(r.top + window.scrollY)}`;
  });
  if (!info) { seen.push("(body)"); continue; }
  if (seen.length && seen[seen.length - 1] === info) break; // loop fechado
  seen.push(info);
}
console.log(`${route}: ${seen.length} paradas de Tab`);
console.log(seen.join("\n"));
await browser.close();
