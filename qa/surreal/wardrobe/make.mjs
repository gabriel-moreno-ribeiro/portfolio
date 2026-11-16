// Builds the wardrobe assets in public/wardrobe from the owner's photos (pasted on 2026-11-16, not in the repo):
//   node qa/surreal/wardrobe/make.mjs <dir with spider-cut.png (background already removed) and taqtile.png>
// spider-man.webp is a real cut-out; the *-print.webp files are badges drawn on the rail's own
// illustrated garments, on its 200 x 310 canvas (x4).
import sharp from 'sharp';

const src = process.argv[2];
const K = 4, W = 200 * K, H = 310 * K;
const svg = (body) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 310" width="${W}" height="${H}">${body}</svg>`);
const save = async (layers, file) => {
  const info = await sharp({ create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite(layers).webp({ quality: 90, alphaQuality: 95 }).toFile(file);
  console.log(file, Math.round(info.size / 1024) + ' KB');
};
const mirror = (pts) => pts.map(([x, y]) => [200 - x, y]);
const poly = (pts) => pts.map((p) => p.join(',')).join(' ');

// 1. Spider-Man tee: the cut-out, on the box the rail gives a photo (200 x 285.2), sized like a kid's tee.
{
  const BW = 600, BH = 856, w = 480; // 160 of 200 units wide
  const tee = await sharp(`${src}/spider-cut.png`).resize({ width: w }).toBuffer();
  const info = await sharp({ create: { width: BW, height: BH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: tee, left: (BW - w) / 2, top: 26 }]).webp({ quality: 86, alphaQuality: 95 }).toFile('public/wardrobe/spider-man.webp');
  console.log('public/wardrobe/spider-man.webp', Math.round(info.size / 1024) + ' KB');
}

// 2. Colégio Militar tunic: blue shoulder boards with red piping and a gold button, blue collar tabs with a red star.
{
  const board = [[77, 35.5], [45, 46], [47, 55], [79, 45]];
  const tab = [[74.5, 49], [84, 50.5], [85.5, 59], [76, 57.5]];
  const star = (cx, cy, r) => Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + (i * Math.PI) / 5, q = i % 2 ? r * 0.45 : r; return [(cx + q * Math.cos(a)).toFixed(2), (cy + q * Math.sin(a)).toFixed(2)]; });
  const side = (m) => `
    <polygon points="${poly(m(board))}" fill="#2c5fa5" stroke="#b12a30" stroke-width="1.1" stroke-linejoin="round"/>
    <circle cx="${m([[72.5, 41.2]])[0][0]}" cy="41.2" r="2.1" fill="#c8a12e"/><circle cx="${m([[72, 40.6]])[0][0]}" cy="40.6" r="0.7" fill="#fff" fill-opacity="0.5"/>
    <polygon points="${poly(m(tab))}" fill="#2c5fa5" stroke="#b12a30" stroke-width="0.7" stroke-linejoin="round"/>
    <polygon points="${poly(star(m([[80, 54]])[0][0], 54, 2.6))}" fill="#c62f35"/>`;
  await save([{ input: svg(side((p) => p) + side(mirror)) }], 'public/wardrobe/colegio-militar-print.webp');
}

// 3. Ari de Sá tee: wings and crest on the wearer's right, the school mark on the left.
{
  const body = `
    <g transform="translate(72 72)">
      <path d="M-11,0 C-7,-3.2 -3,-3.4 -1.6,-1.6 L1.6,-1.6 C3,-3.4 7,-3.2 11,0 C7,0.6 4,1.6 1.6,2.2 L-1.6,2.2 C-4,1.6 -7,0.6 -11,0 Z" fill="#e3b63a"/>
      <ellipse cx="0" cy="0.2" rx="2.4" ry="2.1" fill="#3b78c2"/>
    </g>
    <g transform="translate(72 86)">
      <path d="M-4.6,-5.4 H4.6 V1.2 C4.6,4 2.4,5.6 0,6.4 C-2.4,5.6 -4.6,4 -4.6,1.2 Z" fill="#e9eef5"/>
      <path d="M-4.6,-5.4 H4.6 V-2.2 H-4.6 Z" fill="#c8323a"/>
      <path d="M-3.4,-1 H3.4 V1.2 C3.4,3 1.8,4.2 0,4.9 C-1.8,4.2 -3.4,3 -3.4,1.2 Z" fill="#3b78c2"/>
    </g>
    <g transform="translate(120 70)" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="0" cy="0" r="4.4" stroke-width="0.9"/>
      <path d="M-2.3,2.4 L0,-2.9 L2.3,2.4 M-1.3,0.6 H1.3" stroke-width="1"/>
      <path d="M6.6,2.4 V-0.6 C6.6,-1.8 7.6,-2 8.4,-1.7 M10.6,2.4 V-1.8" stroke-width="1.1"/>
      <circle cx="10.6" cy="-3.6" r="0.5" fill="#fff" stroke="none"/>
    </g>`;
  await save([{ input: svg(body) }], 'public/wardrobe/ari-de-sa-print.webp');
}

// 4. HIBEEX quarter-zip: the zip and the bee on the wearer's left.
{
  const zip = svg(`<path d="M100,50 V96" stroke="#8d8a85" stroke-width="2.4" stroke-linecap="round"/><path d="M100,50 V96" stroke="#f4f3f0" stroke-width="0.8" stroke-dasharray="1.2 1.2"/><rect x="98.6" y="95" width="2.8" height="6" rx="1.1" fill="#6f6c68"/>`);
  const bee = await sharp('public/hibeex.webp').resize({ width: 15 * K }).toBuffer();
  await save([{ input: zip }, { input: bee, left: Math.round((117 - 7.5) * K), top: Math.round((80 - 7.5) * K) }], 'public/wardrobe/hibeex-print.webp');
}

// 5. Taqtile zip hoodie: the zip, and the wordmark lifted from the photo (a mirrored selfie, so flipped back).
{
  const crop = await sharp(`${src}/taqtile.png`).extract({ left: 300, top: 1220, width: 360, height: 170 }).flop().rotate(-8.5, { background: '#000' }).greyscale().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = crop.info; const px = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) { const a = Math.max(0, Math.min(255, (crop.data[i] - 95) * 2.4)); px[i * 4] = px[i * 4 + 1] = px[i * 4 + 2] = 245; px[i * 4 + 3] = a; }
  const mark = await sharp(px, { raw: { width, height, channels: 4 } }).trim({ threshold: 20 }).resize({ width: 36 * K }).png().toBuffer();
  const zip = svg(`<path d="M100,48 V230" stroke="#2c2c2e" stroke-width="2.2" stroke-linecap="round"/><path d="M100,48 V230" stroke="#4a4a4e" stroke-width="0.7" stroke-dasharray="1.2 1.2"/><rect x="98.6" y="60" width="2.8" height="6.5" rx="1.1" fill="#5a5a5e"/>`);
  await save([{ input: zip }, { input: mark, left: 110 * K, top: 84 * K }], 'public/wardrobe/taqtile-print.webp');
}
