// Uso: node overnight/prodcheck.mjs [marcador] [minutosMax]
// Espera a produção servir a versão nova (procura o marcador no HTML de https://gabrielmr.com),
// depois confere status de todas as rotas, redirects www/http e meta básica.
const marker = process.argv[2] || "Founder, HIBEEX";
const maxMin = Number(process.argv[3] || 15);
const site = "https://gabrielmr.com";
const routes = ["/", "/story", "/news", "/library", "/blog", "/contact", "/obrigado", "/privacy", "/terms", "/llms.txt", "/sitemap.xml", "/robots.txt", "/og-image.png", "/hibeex.webp", "/research/projeto-candela/paper.pdf", "/rota-que-nao-existe"];

const t0 = Date.now();
let served = false;
while (Date.now() - t0 < maxMin * 60000) {
  const res = await fetch(site + "/", { headers: { "cache-control": "no-cache" } });
  const html = await res.text();
  const age = res.headers.get("age");
  const hit = html.includes(marker);
  console.log(`${new Date().toLocaleTimeString()} status=${res.status} age=${age} cf=${res.headers.get("cf-cache-status")} marcador=${hit ? "SIM" : "não"}`);
  if (hit) { served = true; break; }
  await new Promise((r) => setTimeout(r, 60000));
}
if (!served) { console.log("Produção ainda serve a versão antiga depois de", maxMin, "min"); process.exit(2); }

console.log("\n--- rotas ---");
let bad = 0;
for (const r of routes) {
  const res = await fetch(site + r, { redirect: "manual" });
  const ok = r === "/rota-que-nao-existe" ? [200, 404].includes(res.status) : res.status === 200;
  if (!ok) bad++;
  console.log(`${res.status}\t${r}\t${res.headers.get("content-type")?.split(";")[0] || ""}${ok ? "" : "\t<-- PROBLEMA"}`);
}
for (const u of ["https://www.gabrielmr.com/", "http://gabrielmr.com/"]) {
  const res = await fetch(u, { redirect: "manual" });
  console.log(`${res.status}\t${u}\t-> ${res.headers.get("location")}`);
}
const html = await (await fetch(site + "/")).text();
const pick = (re) => (html.match(re) || [])[1] || "(ausente)";
console.log("\n--- meta servida ---");
console.log("title:", pick(/<title>(.*?)<\/title>/));
console.log("description:", pick(/name="description"\s+content="(.*?)"/s).slice(0, 90) + "…");
console.log("og:image:", pick(/property="og:image"\s+content="(.*?)"/));
console.log("canonical:", pick(/rel="canonical"\s+href="(.*?)"/));
console.log("preconnect posthog:", /preconnect[^>]+posthog/.test(html) ? "sim" : "não");
console.log(bad ? `\n${bad} rota(s) com problema` : "\nTodas as rotas ok");
process.exit(bad ? 1 : 0);
