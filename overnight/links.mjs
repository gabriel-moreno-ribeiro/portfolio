// Uso: node overnight/links.mjs <baseUrl>
// Coleta todos os href/src de cada rota e testa: internos via fetch no base, externos via HEAD/GET.
import { chromium } from "playwright";

const base = (process.argv[2] || "http://localhost:4173").replace(/\/$/, "");
const routes = (process.argv[3] || "/,/story,/news,/library,/blog,/obrigado,/privacy,/terms,/rota-que-nao-existe").split(",");

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const found = new Map(); // url -> Set(rotas)
for (const route of routes) {
  await page.goto(base + route, { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(1200);
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < total; y += 800) { await page.evaluate((yy) => window.scrollTo({ top: yy, behavior: "instant" }), y); await page.waitForTimeout(60); }
  const urls = await page.evaluate(() => {
    const out = new Set();
    for (const a of document.querySelectorAll("a[href]")) out.add(a.href);
    for (const el of document.querySelectorAll("img[src],video[src],source[src],link[rel=icon][href],link[rel=manifest][href],link[rel=apple-touch-icon][href]")) out.add(el.src || el.href);
    for (const m of document.querySelectorAll("meta[property='og:image'],meta[name='twitter:image']")) out.add(m.content);
    return [...out];
  });
  for (const u of urls) { if (!found.has(u)) found.set(u, new Set()); found.get(u).add(route); }
}
// extras estáticos
for (const u of ["/sitemap.xml", "/robots.txt", "/llms.txt", "/manifest.json", "/favicon.ico", "/logo192.png", "/logo512.png", "/og-image.png", "/404.html", "/research/projeto-candela/paper.pdf"]) { if (!found.has(base + u)) found.set(base + u, new Set(["(estático)"])); }
await browser.close();

const results = [];
for (const [url, rs] of found) {
  if (url.startsWith("mailto:") || url.startsWith("javascript:") || url.startsWith("blob:") || url.startsWith("data:")) continue;
  let target = url;
  if (target.startsWith(base)) target = target; // interno
  else if (target.startsWith("http://localhost") || target.startsWith("https://gabrielmr.com")) target = base + new URL(target).pathname;
  try {
    const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 15000);
    let res = await fetch(target, { method: "HEAD", redirect: "follow", signal: ctrl.signal, headers: { "User-Agent": "Mozilla/5.0 (link-check)" } });
    if (res.status === 405 || res.status === 403 || res.status === 429) res = await fetch(target, { method: "GET", redirect: "follow", signal: ctrl.signal, headers: { "User-Agent": "Mozilla/5.0 (link-check)" } });
    clearTimeout(t);
    results.push([res.status, url, [...rs].join(",")]);
  } catch (e) {
    results.push(["ERR " + String(e.cause?.code || e.name), url, [...rs].join(",")]);
  }
}
results.sort((a, b) => String(a[0]).localeCompare(String(b[0])));
for (const [s, u, r] of results) console.log(`${s}\t${u}\t(${r})`);
const bad = results.filter(([s]) => typeof s !== "number" || s >= 400);
console.log(`\n${results.length} URLs testadas, ${bad.length} com problema`);
