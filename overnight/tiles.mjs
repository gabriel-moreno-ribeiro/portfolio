// Uso: node overnight/tiles.mjs <png> [alturaTile=900]
// Corta um screenshot de página inteira em fatias para inspeção.
import sharp from "sharp";
import { mkdirSync } from "node:fs";
import { basename, dirname, join } from "node:path";

const file = process.argv[2];
const tileH = Number(process.argv[3] || 900);
const img = sharp(file);
const { width, height } = await img.metadata();
const out = join(dirname(file), "tiles");
mkdirSync(out, { recursive: true });
const name = basename(file, ".png");
let i = 0;
for (let y = 0; y < height; y += tileH) {
  const h = Math.min(tileH, height - y);
  await sharp(file).extract({ left: 0, top: y, width, height: h }).toFile(join(out, `${name}-t${String(i++).padStart(2, "0")}.png`));
}
console.log(`${name}: ${width}x${height} → ${i} tiles em ${out}`);
