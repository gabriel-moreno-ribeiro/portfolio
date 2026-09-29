// Monta folhas de contato rotuladas para revisar os quadros
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(OUT, process.argv[2] || 'frames');
const prefix = process.argv[3] || 'sheet';
const COLS = Number(process.argv[4] || 6);
const ROWS = Number(process.argv[5] || 3);
const TW = Number(process.argv[6] || 300);
const TH = Math.round((TW * 1280) / 720);
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.png')).sort();
const per = COLS * ROWS;

for (let s = 0; s * per < files.length; s++) {
  const chunk = files.slice(s * per, (s + 1) * per);
  const comps = [];
  for (let i = 0; i < chunk.length; i++) {
    const f = chunk[i];
    const label = f.replace(/\.png$/, '').replace(/^frame-/, '');
    const thumb = await sharp(path.join(dir, f)).resize(TW, TH).toBuffer();
    const svg = Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${TW}" height="34"><rect width="${TW}" height="34" fill="black" fill-opacity="0.75"/><text x="8" y="25" font-family="Arial" font-size="24" font-weight="bold" fill="#ffe14d">${label}</text></svg>`,
    );
    const left = (i % COLS) * TW;
    const top = Math.floor(i / COLS) * TH;
    comps.push({ input: thumb, left, top });
    comps.push({ input: svg, left, top });
  }
  const name = `${prefix}-${String(s + 1).padStart(2, '0')}.jpg`;
  await sharp({
    create: { width: COLS * TW, height: ROWS * TH, channels: 3, background: '#111' },
  })
    .composite(comps)
    .jpeg({ quality: 80 })
    .toFile(path.join(OUT, name));
  console.log(name, chunk[0], '..', chunk[chunk.length - 1]);
}
