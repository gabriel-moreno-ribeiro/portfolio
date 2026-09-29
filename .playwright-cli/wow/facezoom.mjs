// Folhas de contato com zoom no rosto para julgar olhos/boca/nitidez
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(OUT, process.argv[2] || 'dense');
const prefix = process.argv[3] || 'fsheet';
const from = process.argv[4] || '0000';
const to = process.argv[5] || '9999';
const COLS = 6;
const ROWS = 3;
const T = 330;
const box = { left: 110, top: 230, width: 400, height: 400 };
const files = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith('.png'))
  .sort()
  .filter((f) => {
    const k = f.replace(/\D/g, '');
    return k >= from && k <= to;
  });
const per = COLS * ROWS;

for (let s = 0; s * per < files.length; s++) {
  const chunk = files.slice(s * per, (s + 1) * per);
  const comps = [];
  for (let i = 0; i < chunk.length; i++) {
    const f = chunk[i];
    const label = f.replace(/\.png$/, '').replace(/^frame-/, '');
    const thumb = await sharp(path.join(dir, f)).extract(box).resize(T, T).toBuffer();
    const svg = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="110" height="30"><rect width="110" height="30" fill="black" fill-opacity="0.75"/><text x="6" y="23" font-family="Arial" font-size="22" font-weight="bold" fill="#ffe14d">${label}</text></svg>`,
    );
    const left = (i % COLS) * T;
    const top = Math.floor(i / COLS) * T;
    comps.push({ input: thumb, left, top });
    comps.push({ input: svg, left, top });
  }
  const name = `${prefix}-${String(s + 1).padStart(2, '0')}.jpg`;
  await sharp({ create: { width: COLS * T, height: ROWS * T, channels: 3, background: '#111' } })
    .composite(comps)
    .jpeg({ quality: 84 })
    .toFile(path.join(OUT, name));
  console.log(name, chunk[0], '..', chunk[chunk.length - 1]);
}
