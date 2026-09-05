// Uso: node overnight/extract-text.mjs <baseUrl> > overnight/palavras-raw.md
// Extrai todo texto visível e de metadados de cada rota e imprime uma tabela markdown.
import { chromium } from "playwright";

const base = (process.argv[2] || "http://localhost:4173").replace(/\/$/, "");
const routes = (process.argv[3] || "/,/story,/news,/library,/blog,/contact,/obrigado,/privacy,/terms,/rota-que-nao-existe").split(",");

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();

const esc = (s) => String(s).replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
const rows = [];
const seen = new Set();
const add = (route, where, text) => {
  const t = esc(text);
  if (!t) return;
  const k = route + "|" + where + "|" + t;
  if (seen.has(k)) return;
  seen.add(k);
  rows.push([t, `${route} · ${where}`]);
};

for (const route of routes) {
  await page.goto(base + route, { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(1500);
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < total; y += 700) {
    await page.evaluate((yy) => window.scrollTo({ top: yy, behavior: "instant" }), y);
    await page.waitForTimeout(80);
  }
  const data = await page.evaluate(() => {
    const out = [];
    const q = (sel) => Array.from(document.querySelectorAll(sel));
    out.push(["title", document.title]);
    for (const m of q("meta[name],meta[property]")) {
      const n = m.getAttribute("name") || m.getAttribute("property");
      if (/description|title|og:|twitter:/.test(n)) out.push([`meta ${n}`, m.getAttribute("content")]);
    }
    for (const h of q("h1,h2,h3,h4,h5,h6")) out.push([h.tagName.toLowerCase() + (h.id ? "#" + h.id : ""), h.innerText]);
    for (const p of q("p,li,blockquote,figcaption,dt,dd,td,th,summary,small,time,legend,label")) {
      if (p.closest("nav")) continue;
      const t = p.innerText;
      if (t && t.length > 1 && !p.querySelector("p,li")) out.push([p.tagName.toLowerCase(), t]);
    }
    for (const a of q("a")) out.push([`a[href=${a.getAttribute("href")}]`, a.innerText || a.getAttribute("aria-label") || a.getAttribute("title") || ""]);
    for (const b of q("button")) out.push(["button", b.innerText || b.getAttribute("aria-label") || b.getAttribute("title") || ""]);
    for (const i of q("input,textarea,select")) out.push([`${i.tagName.toLowerCase()} placeholder/aria`, i.getAttribute("placeholder") || i.getAttribute("aria-label") || ""]);
    for (const img of q("img")) out.push([`img alt (src=${(img.getAttribute("src") || "").split("/").pop()})`, img.getAttribute("alt") ?? "(SEM ALT)"]);
    for (const el of q("[aria-label]")) if (!/^(a|button|input|textarea)$/i.test(el.tagName)) out.push([`aria-label <${el.tagName.toLowerCase()}>`, el.getAttribute("aria-label")]);
    for (const el of q("[title]")) if (!/^(a|button)$/i.test(el.tagName)) out.push([`title attr <${el.tagName.toLowerCase()}>`, el.getAttribute("title")]);
    for (const t of q("svg text,svg title")) out.push(["svg text", t.textContent]);
    for (const s of q("span,div")) {
      // texto solto em span/div sem filhos de bloco (labels de UI)
      if (s.children.length === 0 && s.innerText && s.innerText.trim().length > 1 && s.innerText.trim().length < 140) {
        if (s.closest("p,li,h1,h2,h3,h4,h5,h6,a,button,label")) continue;
        out.push([`${s.tagName.toLowerCase()}.${(s.className && typeof s.className === "string" ? s.className.split(" ")[0] : "")}`, s.innerText]);
      }
    }
    return out;
  });
  for (const [where, text] of data) add(route, where, text);
}
await browser.close();

console.log("| # | texto | onde aparece | problema | proposta |");
console.log("|---|---|---|---|---|");
rows.forEach(([t, w], i) => console.log(`| ${i + 1} | ${t} | ${w} | | |`));
console.error(`${rows.length} strings`);
