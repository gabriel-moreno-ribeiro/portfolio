import fs from 'node:fs';
import sharp from 'sharp';
const s = fs.readFileSync('src/components/Home/Experience/carSprites.ts', 'utf8');
const m = JSON.parse(s.match(/= (\{.*\}) as const/s)[1]);
const tiles = [];
for (const i of [0, 6, 12, 24, 36]) {
  const f = m.frames[i], a = f.anchors;
  const hx = 128 + 80 * Math.cos((f.heading * Math.PI) / 180);
  const hy = 128 + 80 * Math.sin((f.heading * Math.PI) / 180);
  const svg = `<svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
<line x1="128" y1="128" x2="${hx}" y2="${hy}" stroke="#e000e0" stroke-width="5"/>
<circle cx="${a.nose.x}" cy="${a.nose.y}" r="7" fill="#00b000"/>
<circle cx="${a.tailL.x}" cy="${a.tailL.y}" r="5" fill="#0040ff"/>
<circle cx="${a.tailR.x}" cy="${a.tailR.y}" r="5" fill="#0040ff"/>
<text x="6" y="20" font-size="15" fill="#000">yaw ${f.yaw} h ${f.heading}</text></svg>`;
  const base = await sharp(`public/assets/car/${f.file}`).flatten({ background: '#dddddd' }).png().toBuffer();
  tiles.push(await sharp(base).composite([{ input: Buffer.from(svg) }]).png().toBuffer());
}
await sharp({ create: { width: 256 * tiles.length, height: 256, channels: 3, background: '#dddddd' } })
  .composite(tiles.map((b, i) => ({ input: b, left: i * 256, top: 0 })))
  .png().toFile(new URL('./shots/sprite-orientation.png', import.meta.url).pathname.slice(1));
console.log('ok (verde = nose/+z, azul = lanternas/−z, magenta = heading gravado)');
