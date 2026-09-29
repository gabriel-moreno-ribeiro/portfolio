// Extrai janelas a 15 fps em torno dos melhores momentos e mede nitidez do rosto
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(OUT, 'refine');
fs.rmSync(dir, { recursive: true, force: true });
fs.mkdirSync(dir, { recursive: true });
const FPS = 15;
const windows = [
  [4.6, 5.4],
  [6.85, 7.15],
  [9.1, 10.2],
  [13.4, 13.9],
  [19.85, 20.4],
  [26.0, 26.45],
];
const face = { left: 170, top: 290, width: 260, height: 230 };
const rows = [];
for (const [a, b] of windows) {
  const tmp = path.join(dir, 'tmp-%03d.png');
  execFileSync('ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-y',
    '-ss', String(a), '-t', String(b - a), '-i', path.join(OUT, 'reel.mp4'),
    '-vf', `fps=${FPS}`, tmp,
  ]);
  const made = fs.readdirSync(dir).filter((f) => f.startsWith('tmp-')).sort();
  for (let i = 0; i < made.length; i++) {
    const t = a + i / FPS;
    const ms = String(Math.round(t * 1000)).padStart(5, '0');
    const name = `frame-${ms}.png`;
    fs.renameSync(path.join(dir, made[i]), path.join(dir, name));
    // nitidez: desvio padrao do laplaciano na regiao do rosto
    const { data } = await sharp(path.join(dir, name))
      .extract(face)
      .greyscale()
      .convolve({ width: 3, height: 3, kernel: [0, 1, 0, 1, -4, 1, 0, 1, 0], scale: 1, offset: 128 })
      .raw()
      .toBuffer({ resolveWithObject: true });
    let s = 0, s2 = 0;
    for (const v of data) { s += v; s2 += v * v; }
    const n = data.length;
    const sd = Math.sqrt(s2 / n - (s / n) ** 2);
    rows.push({ name, t: +t.toFixed(3), sharp: +sd.toFixed(2) });
  }
}
fs.writeFileSync(path.join(OUT, '_refine.json'), JSON.stringify(rows, null, 1));
console.log(rows.map((r) => `${r.name} t=${r.t} sharp=${r.sharp}`).join('\n'));
