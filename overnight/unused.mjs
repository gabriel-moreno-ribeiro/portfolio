// Lista arquivos de src/ que nenhum outro arquivo importa (candidatos a código morto).
import { readdirSync, readFileSync, statSync } from "node:fs";
import { basename, join } from "node:path";

const files = [];
(function walk(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(tsx?|jsx?|scss|json)$/.test(f)) files.push(p.replace(/\\/g, "/"));
  }
})("src");
const all = files.map((f) => readFileSync(f, "utf8")).join("\n") + readFileSync("index.html", "utf8");
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const unused = files.filter((f) => {
  const base = basename(f).replace(/\.(tsx?|jsx?|scss|json)$/, "");
  if (["index", "vite-env.d", "App", "main"].includes(base)) return false;
  const re = new RegExp("[\\/'\"]" + esc(base) + "(\\.(scss|css|tsx?|jsx?|json))?['\"]");
  return !re.test(all);
});
console.log(unused.join("\n") || "(nenhum)");
