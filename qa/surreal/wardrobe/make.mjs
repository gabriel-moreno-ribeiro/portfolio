// Builds the wardrobe artwork in public/wardrobe from the owner's photos (pasted on 2026-11-16, not in the repo):
//   node qa/surreal/wardrobe/make.mjs <dir with spider-cut.png (background already removed) and taqtile.png>
// Every piece is one SVG on the rail's 200 x 310 canvas (hook top at y = 0, garment below), rasterised x4, front and back.
// The Spider-Man tee is the real cut-out; the other four are drawn from the photos (they show the clothes being worn),
// with the bee from public/hibeex.webp and the taqtile wordmark lifted from the photo.
import sharp from 'sharp';

const src = process.argv[2];
if (!src) { console.error('usage: node qa/surreal/wardrobe/make.mjs <dir with the shirt photos>'); process.exit(1); }
const OUT = 'public/wardrobe';
const K = 4;
const uri = (buf) => `data:image/png;base64,${buf.toString('base64')}`;

// ── Path helpers ─────────────────────────────────────────────────────────────
// A silhouette is written as its left half, from the top centre down to the bottom centre (M, L, C only); this mirrors it.
function sym(half) {
  const cmds = half.trim().match(/[MLC][^MLC]*/g).map((t) => [t[0], t.slice(1).trim().split(/[\s,]+/).map(Number)]);
  let cur = cmds[0][1];
  const back = [];
  for (const [c, n] of cmds.slice(1)) {
    for (let i = 0; i < n.length; i += c === 'C' ? 6 : 2) {
      if (c === 'C') { back.push(`C${200 - n[i + 2]},${n[i + 3]} ${200 - n[i]},${n[i + 1]} ${200 - cur[0]},${cur[1]}`); cur = [n[i + 4], n[i + 5]]; }
      else { back.push(`L${200 - cur[0]},${cur[1]}`); cur = [n[i], n[i + 1]]; }
    }
  }
  return `${half} ${back.reverse().join(' ')} Z`;
}
const flip = (svg) => `<g transform="matrix(-1 0 0 1 200 0)">${svg}</g>`;
const both = (fn) => fn() + flip(fn());

// ── Fabric ───────────────────────────────────────────────────────────────────
// sh/hi: shadow and highlight colours of the cloth; so/ho: how strong they read on it.
const TONES = {
  red: { base: '#b9252b', sh: '#3a0508', so: 0.9, hi: '#ff9a8c', ho: 0.3, streak: 0.5, grain: 0.1 },
  navy: { base: '#1e2946', sh: '#04060f', so: 1, hi: '#9db1e6', ho: 0.32, streak: 0.5, grain: 0.06 },
  cotton: { base: '#f4f3ef', sh: '#48526a', so: 0.6, hi: '#ffffff', ho: 1, streak: 0.14, grain: 0.03 },
  pique: { base: '#f0efea', sh: '#565c6b', so: 0.56, hi: '#ffffff', ho: 1, streak: 0.2, grain: 0.03, tex: 'pq' },
  fleece: { base: '#202024', sh: '#000000', so: 1, hi: '#d3d3de', ho: 0.2, streak: 0.4, grain: 0.07, blotch: 0.3 },
};

const hex = (c) => [1, 3, 5].map((i) => (parseInt(c.slice(i, i + 2), 16) / 255).toFixed(3));
const noise = (id, freq, octaves, seed, color, gain, bias) => {
  const [r, g, b] = hex(color);
  return `<filter id="${id}" filterUnits="userSpaceOnUse" x="0" y="0" width="200" height="310" color-interpolation-filters="sRGB"><feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="${octaves}" seed="${seed}"/><feColorMatrix values="0 0 0 0 ${r}  0 0 0 0 ${g}  0 0 0 0 ${b}  ${gain} 0 0 0 ${bias}"/></filter>`;
};
const defs = (t, sil, extra = '') => `<defs>
  ${[['b1', 0.6], ['b2', 1.3], ['b3', 2.4], ['b5', 4.5], ['b9', 9]].map(([id, s]) => `<filter id="${id}" filterUnits="userSpaceOnUse" x="-30" y="-30" width="260" height="370"><feGaussianBlur stdDeviation="${s}"/></filter>`).join('')}
  ${noise('streakD', '0.05 0.005', 3, 4, t.sh, 5, -2.6)}
  ${noise('streakL', '0.045 0.006', 3, 11, t.hi, 5, -2.6)}
  ${noise('blotch', '0.035 0.03', 2, 21, t.sh, 4, -2.1)}
  ${noise('grainD', '1.3', 2, 7, '#000000', 3, -1.1)}
  ${noise('grainL', '1.1', 2, 13, '#ffffff', 3, -1.2)}
  <filter id="warp" filterUnits="userSpaceOnUse" x="-10" y="-10" width="220" height="330"><feTurbulence type="fractalNoise" baseFrequency="0.014 0.011" numOctaves="2" seed="9" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="5" xChannelSelector="R" yChannelSelector="G"/></filter>
  <linearGradient id="vol" gradientUnits="userSpaceOnUse" x1="0" x2="200" y1="0" y2="0">
    <stop offset="0" stop-color="${t.sh}" stop-opacity="${0.3 * t.so}"/><stop offset="0.13" stop-color="${t.sh}" stop-opacity="${0.1 * t.so}"/><stop offset="0.3" stop-color="${t.hi}" stop-opacity="${0.16 * t.ho}"/>
    <stop offset="0.52" stop-color="${t.hi}" stop-opacity="0"/><stop offset="0.86" stop-color="${t.sh}" stop-opacity="${0.14 * t.so}"/><stop offset="1" stop-color="${t.sh}" stop-opacity="${0.4 * t.so}"/>
  </linearGradient>
  <linearGradient id="drape" gradientUnits="userSpaceOnUse" x1="0" x2="0" y1="30" y2="245">
    <stop offset="0" stop-color="${t.hi}" stop-opacity="${0.3 * t.ho}"/><stop offset="0.25" stop-color="${t.hi}" stop-opacity="0"/><stop offset="0.7" stop-color="${t.sh}" stop-opacity="${0.06 * t.so}"/><stop offset="1" stop-color="${t.sh}" stop-opacity="${0.34 * t.so}"/>
  </linearGradient>
  <linearGradient id="chrome" gradientUnits="userSpaceOnUse" x1="98.5" x2="101.6" y1="0" y2="0"><stop offset="0" stop-color="#8d9199"/><stop offset="0.3" stop-color="#ffffff"/><stop offset="0.72" stop-color="#6d7178"/><stop offset="1" stop-color="#b9bcc2"/></linearGradient>
  <linearGradient id="ferrule" gradientUnits="userSpaceOnUse" x1="96.4" x2="103.6" y1="0" y2="0"><stop offset="0" stop-color="#7d8189"/><stop offset="0.28" stop-color="#f6f7f9"/><stop offset="0.7" stop-color="#666a72"/><stop offset="1" stop-color="#a9adb4"/></linearGradient>
  <linearGradient id="wood" gradientUnits="userSpaceOnUse" x1="0" x2="0" y1="32" y2="47"><stop offset="0" stop-color="#e0b684"/><stop offset="0.35" stop-color="#c08a52"/><stop offset="1" stop-color="#7c4f27"/></linearGradient>
  <radialGradient id="gold" cx="0.36" cy="0.3" r="0.85"><stop offset="0" stop-color="#fff6c4"/><stop offset="0.3" stop-color="#ecc44e"/><stop offset="0.72" stop-color="#b98a1e"/><stop offset="1" stop-color="#6f4f0e"/></radialGradient>
  <pattern id="rib" width="1.25" height="8" patternUnits="userSpaceOnUse"><rect width="0.55" height="8" fill="${t.sh}" fill-opacity="${0.42 * t.so}"/><rect x="0.7" width="0.3" height="8" fill="${t.hi}" fill-opacity="${0.3 * t.ho}"/></pattern>
  <mask id="sil" maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="310"><g fill="#fff">${sil}</g></mask>
  ${extra}
</defs>`;

let ids = 0;
// One panel of cloth: its shadow on what is underneath, the fill, then (clipped to it) whatever is printed or folded on it and a soft dark edge that rounds it.
function piece(t, d, { fill = t.base, inner = '', cast = 1, edge = 1, edgeW = 5 } = {}) {
  const id = `c${++ids}`;
  return `${cast ? `<g mask="url(#sil)"><path d="${d}" fill="${t.sh}" fill-opacity="${Math.min(1, 0.42 * cast * t.so)}" filter="url(#b3)" transform="translate(1.3 2.8)"/></g>` : ''}
  <path d="${d}" fill="${fill}"/><clipPath id="${id}"><path d="${d}"/></clipPath>
  <g clip-path="url(#${id})">${inner}
    <path d="${d}" fill="none" stroke="${t.sh}" stroke-opacity="${Math.min(1, 0.5 * edge * t.so)}" stroke-width="${edgeW}" filter="url(#b3)"/>
    <path d="${d}" fill="none" stroke="${t.hi}" stroke-opacity="${0.55 * t.ho}" stroke-width="1" filter="url(#b1)" transform="translate(0.7 0.8)"/>
  </g><path d="${d}" fill="none" stroke="${t.sh}" stroke-opacity="${Math.min(1, 0.55 * t.so)}" stroke-width="0.45" stroke-linejoin="round"/>`;
}
// Soft folds: a blurred shadow with its lit flank on the left. Each: [path, width, strength].
const folds = (t, list, blur = 'b3') => `<g fill="none" stroke-linecap="round" filter="url(#${blur})">${list.map(([d, w = 5, o = 1]) => `<path d="${d}" stroke="${t.sh}" stroke-opacity="${Math.min(1, 0.42 * o * t.so)}" stroke-width="${w}"/><path d="${d}" stroke="${t.hi}" stroke-opacity="${Math.min(1, 0.5 * o * t.ho)}" stroke-width="${w * 0.6}" transform="translate(${-w * 0.75} 0)"/>`).join('')}</g>`;
const seam = (t, d, o = 1) => `<path d="${d}" fill="none" stroke="${t.sh}" stroke-opacity="${Math.min(1, 0.6 * o * t.so)}" stroke-width="0.55" stroke-linecap="round"/><path d="${d}" fill="none" stroke="${t.hi}" stroke-opacity="${0.4 * t.ho}" stroke-width="0.4" stroke-linecap="round" transform="translate(0.5 0.6)"/>`;
const stitch = (t, d, o = 1) => `<path d="${d}" fill="none" stroke="${t.sh}" stroke-opacity="${Math.min(1, 0.55 * o * t.so)}" stroke-width="0.42" stroke-dasharray="1.3 0.9" stroke-linecap="round"/>`;
const shade = (t, d, w, o, blur = 'b3') => `<path d="${d}" fill="none" stroke="${t.sh}" stroke-opacity="${Math.min(1, o * t.so)}" stroke-width="${w}" stroke-linecap="round" filter="url(#${blur})"/>`;
const ribbed = (t, d, opts = {}) => piece(t, d, { ...opts, inner: `<rect width="200" height="310" fill="url(#rib)"/>${opts.inner ?? ''}` });
// The whole-garment pass: vertical drape streaks, the roundness of a body of cloth, weave grain.
const finish = (t) => `<g mask="url(#sil)">
  <rect width="200" height="310" filter="url(#streakD)" opacity="${t.streak}"/><rect width="200" height="310" filter="url(#streakL)" opacity="${t.streak * t.ho}"/>
  ${t.blotch ? `<rect width="200" height="310" filter="url(#blotch)" opacity="${t.blotch}"/>` : ''}${t.tex ? `<rect width="200" height="310" fill="url(#${t.tex})"/>` : ''}
  <rect width="200" height="310" fill="url(#vol)"/><rect width="200" height="310" fill="url(#drape)"/>
  <rect width="200" height="310" filter="url(#grainD)" opacity="${t.grain}"/><rect width="200" height="310" filter="url(#grainL)" opacity="${t.grain * 0.6}"/>
</g>`;

// A long sleeve hanging from the shoulder tip (sx, sy), over the body from the armpit (ax, ay) down, gathered into a cuff c0..c1 wide that ends at cy.
const hang = (sx, sy, ax, ay, c0, c1, cy, ch) => {
  const top = cy - ch;
  return {
    sleeve: `M${sx},${sy} C${sx - 9},${sy + 4} ${sx - 17},${sy + 16} ${sx - 19},${sy + 38} C${sx - 21},${sy + 80} ${c0 - 4},${top - 50} ${c0 - 2.5},${top} C${c0 + 5},${top + 2.6} ${c1 - 5},${top + 2.6} ${c1 + 3},${top} C${c1 + 4},${top - 40} ${ax + 1.5},${ay + 40} ${ax},${ay} C${ax - 0.5},${ay - 20} ${sx + 6},${sy + 20} ${sx},${sy} Z`,
    cuff: `M${c0 - 0.6},${top - 4} L${c1 + 0.6},${top - 4} L${c1},${cy - 2.4} C${c1},${cy - 0.8} ${c1 - 1},${cy} ${c1 - 3},${cy + 0.2} C${c1 - 7},${cy + 1} ${c0 + 7},${cy + 1} ${c0 + 3},${cy + 0.2} C${c0 + 1},${cy} ${c0},${cy - 0.8} ${c0},${cy - 2.4} Z`,
    // the light down the roll of the sleeve
    roll: (t) => `<path d="M${sx - 7},${sy + 16} C${sx - 10},${sy + 70} ${c0 + 5},${top - 60} ${c0 + 6},${top - 4}" fill="none" stroke="${t.hi}" stroke-opacity="${0.5 * t.ho}" stroke-width="7" stroke-linecap="round" filter="url(#b5)"/>`,
  };
};

// ── Hanger ───────────────────────────────────────────────────────────────────
const HOOK = `<path d="M100,31 V2.4" fill="none" stroke="#000" stroke-opacity="0.3" stroke-width="3.3" stroke-linecap="round" transform="translate(0.9 0.7)" filter="url(#b1)"/>
  <path d="M100,31 V2" fill="none" stroke="url(#chrome)" stroke-width="2.8" stroke-linecap="round"/><path d="M99.4,30 V2.2" fill="none" stroke="#fff" stroke-opacity="0.8" stroke-width="0.5" stroke-linecap="round"/>
  <rect x="96.4" y="28.6" width="7.2" height="7.4" rx="1.7" fill="url(#ferrule)"/><rect x="97.4" y="29.6" width="1.5" height="5.4" rx="0.75" fill="#fff" fill-opacity="0.65"/><rect x="96.4" y="34.4" width="7.2" height="1.6" rx="0.8" fill="#000" fill-opacity="0.25"/>`;
const ARMS = 'M30,59 Q68,40.5 100,37.6 Q132,40.5 170,59';
const WOOD = `<path d="${ARMS}" fill="none" stroke="#000" stroke-opacity="0.45" stroke-width="9.6" stroke-linecap="round" transform="translate(0.6 1.8)" filter="url(#b2)"/>
  <path d="${ARMS}" fill="none" stroke="url(#wood)" stroke-width="8.6" stroke-linecap="round"/>
  <path d="${ARMS}" fill="none" stroke="#fff" stroke-opacity="0.42" stroke-width="1" stroke-linecap="round" transform="translate(0 -2.7)" filter="url(#b1)"/>
  <path d="${ARMS}" fill="none" stroke="#4a2b10" stroke-opacity="0.35" stroke-width="0.35" transform="translate(0 0.6)"/><path d="${ARMS}" fill="none" stroke="#4a2b10" stroke-opacity="0.3" stroke-width="0.3" transform="translate(0 2.3)"/>`;

// The cloth is warped a little so no edge is ruler-straight; the hook stays straight, behind a back and in front of a front's open neck.
async function render(name, t, sil, body, { extra = '', back = false, over = '' } = {}) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 200 310" width="${200 * K}" height="${310 * K}">${defs(t, sil, extra)}${back ? HOOK : ''}<g filter="url(#warp)">${body}${finish(t)}${over}</g>${back ? '' : HOOK}</svg>`;
  const file = `${OUT}/${name}.webp`;
  const info = await sharp(Buffer.from(svg), { unlimited: true }).webp({ quality: 88, alphaQuality: 95, effort: 6 }).toFile(file);
  console.log(file, `${info.width}x${info.height}`, Math.round(info.size / 1024) + ' KB');
}

// ── 1. Spider-Man tee (up to 10): the real cut-out, its sleeves let down as they hang on a hanger ──────────────────
{
  const t = TONES.red;
  const PW = 1248, PH = 1044, S = 0.15, X0 = 100 - 615 * S, Y0 = 31.5; // photo px -> canvas units; 615 is the middle of the neck
  const photo = await sharp(`${src}/spider-cut.png`).resize({ width: Math.round(PW * S * K * 1.25) }).modulate({ saturation: 1.1 }).linear(1.1, -10).sharpen({ sigma: 0.7 }).png().toBuffer();
  // The back has no photo: the same shirt with the print and the collar painted out from the red around them.
  const raw = await sharp(`${src}/spider-cut.png`).raw().toBuffer({ resolveWithObject: true });
  const { width: w, height: h } = raw.info;
  const good = Buffer.alloc(w * h), pre = Buffer.alloc(w * h * 3);
  const reds = [[], [], []];
  for (let p = 0; p < w * h; p += 37) { const [r, g, b, a] = raw.data.subarray(p * 4, p * 4 + 4); if (a > 250 && r > 150 && g < 62 && b < 70) { reds[0].push(r); reds[1].push(g); reds[2].push(b); } }
  const [mr, mg, mb] = reds.map((v) => v.sort((x, y) => x - y)[v.length >> 1]);
  for (let p = 0; p < w * h; p++) {
    const [r, g, b, a] = raw.data.subarray(p * 4, p * 4 + 4), x = p % w, y = (p / w) | 0;
    const collar = ((x - 615) / 190) ** 2 + ((y - 60) / 112) ** 2 < 1;
    if (a > 250 && !collar && Math.abs(r - mr) < 30 && Math.abs(g - mg) < 16 && Math.abs(b - mb) < 18) { good[p] = 255; pre[p * 3] = r; pre[p * 3 + 1] = g; pre[p * 3 + 2] = b; }
  }
  const keep = await sharp(good, { raw: { width: w, height: h, channels: 1 } }).blur(5).threshold(252).extractChannel(0).raw().toBuffer(); // pull back from the print's edges
  for (let p = 0; p < w * h; p++) if (!keep[p]) { good[p] = 0; pre[p * 3] = pre[p * 3 + 1] = pre[p * 3 + 2] = 0; }
  const back = Buffer.from(raw.data);
  for (let pass = 0, left = 1; pass < 40 && left; pass++) {
    const bp = await sharp(pre, { raw: { width: w, height: h, channels: 3 } }).blur(18).raw().toBuffer();
    const bm = await sharp(good, { raw: { width: w, height: h, channels: 1 } }).blur(18).extractChannel(0).raw().toBuffer();
    left = 0;
    for (let p = 0; p < w * h; p++) {
      if (good[p]) continue;
      if (bm[p] < 70) { left++; continue; }
      good[p] = 255;
      for (let c = 0; c < 3; c++) back[p * 4 + c] = pre[p * 3 + c] = Math.min(255, (bp[p * 3 + c] * 255) / bm[p]);
    }
  }
  const soft = await sharp(back, { raw: { width: w, height: h, channels: 4 } }).removeAlpha().blur(30).raw().toBuffer();
  for (let p = 0; p < w * h; p++) if (!keep[p]) for (let c = 0; c < 3; c++) back[p * 4 + c] = soft[p * 3 + c];
  const plain = await sharp(back, { raw: { width: w, height: h, channels: 4 } }).resize({ width: Math.round(PW * S * K * 1.25) }).modulate({ saturation: 1.1 }).linear(1.1, -10).png().toBuffer();

  const px = (svg) => `<g transform="translate(${X0} ${Y0}) scale(${S})">${svg}</g>`;
  const L = [272, 60, 262, 418], R = [957, 48, 1000, 402]; // armhole seams: shoulder tip to armpit
  const bodyClip = `M${L[0] + 2},-40 L${L[0]},${L[1]} L${L[2]},${L[3]} L${L[2] - 2},1100 L${R[2] + 12},1100 L${R[2]},${R[3]} L${R[0]},${R[1]} L${R[0] - 2},-40 Z`;
  const tee = (img, drop = 17) => `<defs><image id="ph" width="${PW}" height="${PH}" xlink:href="${uri(img)}" href="${uri(img)}"/>
      <clipPath id="sl"><path d="M${L[0] + 30},-40 L${L[0] + 26},${L[1]} L${L[2] + 26},${L[3]} L${L[2] + 26},640 L-60,640 L-60,-40 Z"/></clipPath>
      <clipPath id="sr"><path d="M${R[0] - 30},-40 L${R[0] - 26},${R[1]} L${R[2] - 26},${R[3]} L${R[2] - 26},640 L1310,640 L1310,-40 Z"/></clipPath>
      <clipPath id="bd"><path d="${bodyClip}"/></clipPath></defs>
    <g transform="rotate(${-drop} ${L[0]} ${L[1]})"><use xlink:href="#ph" href="#ph" clip-path="url(#sl)"/></g>
    <g transform="rotate(${drop} ${R[0]} ${R[1]})"><use xlink:href="#ph" href="#ph" clip-path="url(#sr)"/></g>
    <g filter="url(#b9px)" fill="none" stroke="#2a0306" stroke-linecap="round"><path d="M${L[0] - 14},${L[1] + 30} L${L[2] - 16},${L[3] + 70}" stroke-opacity="0.55" stroke-width="34"/><path d="M${R[0] + 14},${R[1] + 30} L${R[2] + 16},${R[3] + 70}" stroke-opacity="0.6" stroke-width="34"/></g>
    <use xlink:href="#ph" href="#ph" clip-path="url(#bd)"/>`;
  const extra = `<filter id="b9px" filterUnits="userSpaceOnUse" x="-100" y="-100" width="1500" height="1300"><feGaussianBlur stdDeviation="12"/></filter>
    <filter id="round" x="-5%" y="-5%" width="110%" height="110%"><feComponentTransfer in="SourceAlpha" result="out"><feFuncA type="table" tableValues="1 0"/></feComponentTransfer><feGaussianBlur in="out" stdDeviation="3.2"/><feOffset dx="-0.6" dy="-1"/><feComposite in2="SourceAlpha" operator="in" result="edge"/><feFlood flood-color="${t.sh}" flood-opacity="0.5"/><feComposite in2="edge" operator="in" result="dark"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="dark"/></feMerge></filter>
    <clipPath id="neck"><path d="M60,-10 L140,-10 L140,${Y0 + 3} L124.5,${Y0 + 3} C116,${Y0 + 20.5} 84,${Y0 + 20.5} 75.5,${Y0 + 3} L60,${Y0 + 3} Z"/></clipPath>`;
  // The cut-out carries its own cloth, so it skips the drawn shading: only the rounded edge, so it sits with the others.
  const kidHanger = `<g clip-path="url(#neck)">${WOOD}</g>`;
  const draw = async (name, img, over = '') => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 200 310" width="${200 * K}" height="${310 * K}">${defs(t, '', extra)}<g filter="url(#round)">${px(tee(img))}${over}</g></svg>`;
    return sharp(Buffer.from(svg), { unlimited: true }).png().toBuffer();
  };
  const save = async (name, layers) => {
    const info = await sharp({ create: { width: 200 * K, height: 310 * K, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite(layers).webp({ quality: 88, alphaQuality: 95, effort: 6 }).toFile(`${OUT}/${name}.webp`);
    console.log(`${OUT}/${name}.webp`, Math.round(info.size / 1024) + ' KB');
  };
  const overlay = (body) => sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 310" width="${200 * K}" height="${310 * K}">${defs(t, '', extra)}${body}</svg>`)).png().toBuffer();
  await save('spider-man', [{ input: await draw('front', photo) }, { input: await overlay(`${kidHanger}<g clip-path="url(#neck)">${HOOK}</g>`) }]);
  // Back: the neck closed with a ribbed band, mirrored so it lines up when the piece turns.
  const backNeck = `<path d="M75,${Y0 + 3.2} C84,${Y0 - 0.6} 116,${Y0 - 0.6} 125,${Y0 + 3.2} C124,${Y0 + 12} 76,${Y0 + 12} 75,${Y0 + 3.2} Z" fill="${t.base}"/>`;
  const band = `M75,${Y0 + 3.2} C84,${Y0 - 0.6} 116,${Y0 - 0.6} 125,${Y0 + 3.2} L126,${Y0 + 8} C116,${Y0 + 4.4} 84,${Y0 + 4.4} 74,${Y0 + 8} Z`;
  const backImg = await sharp(await draw('back', plain, backNeck + ribbed(t, band, { cast: 0, edge: 0.7, edgeW: 3 }))).flop().toBuffer();
  await save('spider-man-back', [{ input: await overlay(`<g clip-path="url(#neck)">${HOOK}</g>`) }, { input: backImg }]);
}

// ── 2. Colégio Militar tunic (10 to 16): white cotton, blue shoulder boards and collar tabs, gold buttons ──────────
{
  const t = TONES.cotton;
  const BLUE = '#2b5ca6', RED = '#b8242c';
  const gold = (x, y, r = 2.7) => `<circle cx="${x + 0.5}" cy="${y + 1}" r="${r + 0.4}" fill="${t.sh}" fill-opacity="0.5" filter="url(#b1)"/><circle cx="${x}" cy="${y}" r="${r}" fill="url(#gold)"/><circle cx="${x}" cy="${y}" r="${r - 0.2}" fill="none" stroke="#6f4f0e" stroke-opacity="0.75" stroke-width="0.35"/><circle cx="${x}" cy="${y}" r="${r * 0.52}" fill="none" stroke="#7d5a10" stroke-opacity="0.5" stroke-width="0.3"/><ellipse cx="${x - r * 0.32}" cy="${y - r * 0.36}" rx="${r * 0.34}" ry="${r * 0.2}" fill="#fff" fill-opacity="0.85" transform="rotate(-32 ${x - r * 0.32} ${y - r * 0.36})"/>`;
  const star = (cx, cy, r) => Array.from({ length: 10 }, (_, i) => { const a = -Math.PI / 2 + (i * Math.PI) / 5, q = i % 2 ? r * 0.42 : r; return `${(cx + q * Math.cos(a)).toFixed(2)},${(cy + q * Math.sin(a)).toFixed(2)}`; }).join(' ');
  const SIDE = 'C67,37.5 53,42.5 40,49 C38.5,66 37.5,86 38,104 C38.5,150 36.5,200 35.5,236 C55,239.4 80,238.4 100,238.8';
  const { sleeve, cuff, roll } = hang(41.5, 48.5, 48, 104, 25, 44.5, 211, 12);
  const board = 'M41.5,44.6 L71.5,34.5 L78,37.2 L74.5,43.2 L44.5,53.4 Z';
  const sil = (body) => `<path d="${body}"/>${[sleeve, cuff, board].map((d) => `<path d="${d}"/><path d="${d}" transform="matrix(-1 0 0 1 200 0)"/>`).join('')}`;
  const boards = () => both(() => `${piece(t, board, { fill: BLUE, cast: 1.2, edge: 0.5, edgeW: 3, inner: `<path d="M41.5,44.6 L71.5,34.5 L78,37.2" fill="none" stroke="#fff" stroke-opacity="0.35" stroke-width="2.4" filter="url(#b1)"/>` })}
    <path d="${board}" fill="none" stroke="${RED}" stroke-width="1.15" stroke-linejoin="round"/><path d="M44.2,46.4 L71.4,37.2 L74.6,38.6 L72.6,41.6 L46,50.6 Z" fill="none" stroke="#0e2a57" stroke-opacity="0.45" stroke-width="0.3"/>${gold(70.6, 39.4, 2.2)}`);
  const sleeves = () => both(() => `${piece(t, cuff, { cast: 0.5, edge: 0.6, edgeW: 3 })}${stitch(t, 'M25.6,203.4 C31,204.8 38,204.8 43.8,203.4')}${piece(t, sleeve, { cast: 1.2, edge: 1.1, inner: `${roll(t)}
    ${folds(t, [['M31,62 C28,92 31,122 29,152', 5, 0.7], ['M41,112 C39,142 42,170 40,197', 4, 0.6]])}
    ${folds(t, [['M25,120 C31,126 39,128 47,124', 2.6, 0.7], ['M25,136 C31,139 38,139 46,134', 2.2, 0.5], ['M31,70 C35,80 41,88 47,92', 3, 0.6]], 'b2')}
    <path d="M33,74 L39.6,79.4 L39.6,89.4 L26.4,89.4 L26.4,79.4 Z" fill="#faf9f5" stroke="#b98a1e" stroke-width="0.75" stroke-linejoin="round"/><path d="M33,77.4 L37.4,80.8 L37.4,87.2 L28.6,87.2 L28.6,80.8 Z" fill="none" stroke="#caa03a" stroke-opacity="0.8" stroke-width="0.4" stroke-linejoin="round"/><path d="M30.4,83 H35.6 M30.4,85 H35.6" stroke="#caa03a" stroke-opacity="0.75" stroke-width="0.5"/>` })}
`);

  // front
  {
    const body = sym(`M100,47 L80,33.5 ${SIDE}`);
    const pocket = (x, y, wide, tall) => {
      const l = x - wide / 2, r = x + wide / 2;
      const bag = `M${l + 1},${y + 3} L${r - 1},${y + 3} L${r - 1},${y + tall - 3} C${r - 1},${y + tall - 1} ${r - 2.5},${y + tall} ${r - 4},${y + tall} L${l + 4},${y + tall} C${l + 2.5},${y + tall} ${l + 1},${y + tall - 1} ${l + 1},${y + tall - 3} Z`;
      const flap = `M${l},${y} L${r},${y} L${r},${y + 8.6} L${x},${y + 14} L${l},${y + 8.6} Z`;
      return `${piece(t, bag, { cast: 0.55, edge: 0.45, edgeW: 3, inner: folds(t, [[`M${x - 2.6},${y + 12} V${y + tall}`, 1.6, 0.8], [`M${x + 2.6},${y + 12} V${y + tall}`, 1.6, 0.6]], 'b1') })}
        ${stitch(t, `M${l + 2.2},${y + 9} L${l + 2.2},${y + tall - 3} C${l + 2.2},${y + tall - 1.6} ${l + 3.2},${y + tall - 1.2} ${l + 4.4},${y + tall - 1.2} L${r - 4.4},${y + tall - 1.2} C${r - 3.2},${y + tall - 1.2} ${r - 2.2},${y + tall - 1.6} ${r - 2.2},${y + tall - 3} L${r - 2.2},${y + 9}`)}
        ${piece(t, flap, { cast: 1.1, edge: 0.5, edgeW: 2.6 })}${stitch(t, `M${l + 1.2},${y + 1.2} L${l + 1.2},${y + 7.9} L${x},${y + 12.6} L${r - 1.2},${y + 7.9} L${r - 1.2},${y + 1.2}`)}${gold(x, y + 8.4, 2.2)}`;
    };
    const leaf = 'M100,46 C94,43.5 86,38.5 80.5,32.3 C77.5,33 75.4,35.2 74.4,37.8 C76.5,46.5 80.5,55 86,62.8 C90.5,57 95.5,51 100,46 Z';
    const collar = () => `${piece(t, leaf, { cast: 1.3, edge: 0.55, edgeW: 4, inner: shade(t, 'M80.5,32.3 C86,38.5 94,43.5 100,46', 3, 0.25) })}${stitch(t, 'M76.4,38.6 C78.4,46 81.8,53.2 86.2,59.8 C90,55 94,50.4 97.6,46.8')}
      <g transform="rotate(-24 85.6 50.2)"><path d="M85.6,44 L90,50.2 L85.6,56.4 L81.2,50.2 Z" fill="${BLUE}" stroke="${RED}" stroke-width="0.8" stroke-linejoin="round"/></g><polygon points="${star(85.6, 50.3, 2.5)}" fill="${RED}" stroke="#e8c04a" stroke-width="0.3"/><circle cx="85.6" cy="50.3" r="0.6" fill="#ecc44e"/>`;
    const inner = `
      ${folds(t, [['M46,58 C56,80 60,110 58,150', 6, 0.7], ['M154,58 C144,82 140,112 143,150', 6, 0.8], ['M58,128 C54,160 60,196 55,236', 6, 0.9], ['M82,140 C79,172 84,206 80,237', 5, 0.6], ['M120,138 C123,172 117,206 121,237', 5, 0.7], ['M144,126 C148,160 141,198 146,236', 6, 0.9]])}
      ${folds(t, [['M48,138 C60,146 76,148 92,143', 3, 0.28], ['M108,150 C124,156 140,154 152,146', 3, 0.3], ['M50,62 C58,70 66,74 76,74', 3, 0.3], ['M150,62 C142,70 134,74 124,74', 3, 0.3]], 'b2')}
      ${pocket(67, 82, 31, 40)}${pocket(133, 82, 31, 40)}${pocket(69, 176, 35, 50)}${pocket(131, 176, 35, 50)}
      ${shade(t, 'M94.2,50 C94,110 94.6,180 94,240', 3.4, 0.5, 'b2')}<path d="M95.6,48 C95.4,110 96,180 95.4,240" fill="none" stroke="${t.sh}" stroke-opacity="0.5" stroke-width="0.5"/>${stitch(t, 'M97.4,50 C97.2,110 97.8,180 97.2,238')}${stitch(t, 'M104.8,52 C104.6,110 105.2,180 104.6,238', 0.6)}
      ${shade(t, 'M36,237 C55,240 80,239 100,239.4 C120,239 145,240 164,237', 5, 0.42)}${stitch(t, 'M37.6,232.4 C56,235.6 80,234.6 100,235 C120,234.6 144,235.6 162.4,232.4')}
      ${[66, 99, 132, 165, 198].map((y) => gold(100.2, y, 2.8)).join('')}`;
    const back = 'M80.5,32.3 C88,28 112,28 119.5,32.3 L100,46.5 Z';
    await render('colegio-militar', t, sil(body) + `<path d="${leaf}"/><path d="${leaf}" transform="matrix(-1 0 0 1 200 0)"/><path d="${back}"/>`,
      `<path d="${back}" fill="#d6d6d3"/><path d="M80.5,32.3 C88,28 112,28 119.5,32.3 L118,35.4 C110,31.6 90,31.6 82,35.4 Z" fill="#e6e5e1"/>${shade(t, 'M82,36 L100,47 L118,36', 4, 0.5)}
       <g clip-path="url(#open)">${WOOD}</g>${piece(t, body, { cast: 0, inner })}${sleeves()}${both(collar)}`,
      { over: boards(), extra: `<clipPath id="open"><path d="${back}"/></clipPath>` });
  }
  // back
  {
    const body = sym(`M100,31.6 C92,31.6 85,32.2 80,33.5 ${SIDE}`);
    const fall = 'M78.6,34.6 C86,27.4 114,27.4 121.4,34.6 C121,38.6 119.6,41.2 118,42.8 C110,39 90,39 82,42.8 C80.4,41.2 79,38.6 78.6,34.6 Z';
    const inner = `
      ${folds(t, [['M46,58 C56,84 62,112 60,150', 6, 0.7], ['M154,58 C144,84 138,112 141,150', 6, 0.8], ['M62,120 C58,160 64,198 59,236', 6, 0.9], ['M82,90 C79,150 84,200 80,237', 5, 0.5], ['M119,90 C122,150 117,200 121,237', 5, 0.6], ['M140,120 C144,160 137,198 142,236', 6, 0.9]])}
      ${seam(t, 'M39.4,62 C60,68.6 140,68.6 160.6,62')}${stitch(t, 'M39.2,63.8 C60,70.4 140,70.4 160.8,63.8')}
      ${seam(t, 'M100,67 C100.4,110 99.6,150 100,188')}${shade(t, 'M99,188 C99.4,205 98.8,222 99,240', 3.2, 0.5, 'b2')}<path d="M100.2,188 C100.6,205 100,222 100.2,240" fill="none" stroke="${t.sh}" stroke-opacity="0.55" stroke-width="0.5"/>${stitch(t, 'M96,186.6 L103.4,186.6')}
      ${shade(t, 'M36,237 C55,240 80,239 100,239.4 C120,239 145,240 164,237', 5, 0.42)}${stitch(t, 'M37.6,232.4 C56,235.6 80,234.6 100,235 C120,234.6 144,235.6 162.4,232.4')}`;
    await render('colegio-militar-back', t, sil(body) + `<path d="${fall}"/>`,
      `${piece(t, body, { cast: 0, inner })}${sleeves()}${piece(t, fall, { cast: 1.2, edge: 0.5, edgeW: 3.4 })}${stitch(t, 'M80.6,40.4 C82,39.8 90,37.2 100,37.2 C110,37.2 118,39.8 119.4,40.4')}`,
      { back: true, over: boards() });
  }
}

// ── 3. Ari de Sá tee (17 to 18): navy, gold wings and the crest on the wearer's right, the school mark on the left ─
{
  const t = TONES.navy;
  const SIDE = 'C62,38.5 48,43.5 36,50 C34,68 32.5,88 33,106 C34,150 32,196 33,231 C52,235.5 78,233.5 100,235';
  const sleeve = 'M37.5,49 C29,54 18,74 7.5,98.5 C6.6,100.8 7.4,102.6 9.4,103.6 C17,108 26,111.6 35.5,113.6 C36,95 35,70 39,50 Z';
  const sil = (body) => `<path d="${body}"/><path d="${sleeve}"/><path d="${sleeve}" transform="matrix(-1 0 0 1 200 0)"/>`;
  const sleeves = () => both(() => piece(t, sleeve, { cast: 0, inner: `
    ${folds(t, [['M31,58 C25,72 19,86 14,99', 4, 0.8], ['M35,72 C31,84 27,96 24,107', 4, 0.6]])}${shade(t, 'M38,52 C35.4,72 36,95 35.8,114', 6, 0.5)}
    ${shade(t, 'M8,100.6 C17,106 26,109.6 36,111.8', 3, 0.4, 'b2')}${stitch(t, 'M10.4,95.6 C18.4,100.4 27,104 35.8,105.8', 1.2)}${stitch(t, 'M11,94.2 C19,99 27.6,102.6 35.8,104.4', 1.2)}` }));
  const hem = `${shade(t, 'M33,232 C52,236.5 78,234.5 100,236 C122,234.5 148,236.5 167,232', 5, 0.5)}${stitch(t, 'M34,224.4 C52,228.9 78,226.9 100,228.4 C122,226.9 148,228.9 166,224.4', 1.2)}${stitch(t, 'M34,225.9 C52,230.4 78,228.4 100,229.9 C122,228.4 148,230.4 166,225.9', 1.2)}`;
  // front
  {
    const body = sym(`M100,52.5 C90,52.5 81,47 76,35 ${SIDE}`);
    const open = 'M76,35 C84,30.4 116,30.4 124,35 C119,47 110,52.5 100,52.5 C90,52.5 81,47 76,35 Z';
    const rib = 'M76,35 C81,47 90,52.5 100,52.5 C110,52.5 119,47 124,35 L129.6,36.4 C124,51.5 112,58.8 100,58.8 C88,58.8 76,51.5 70.4,36.4 Z';
    const wing = 'M-2.4,-1.3 C-5.5,-4.8 -10.5,-5.8 -15.8,-4.3 C-14.2,-3.5 -13.3,-2.7 -12.9,-1.8 C-11.7,-2.2 -10.8,-1.9 -10.2,-1 C-9.1,-1.4 -8.2,-1.1 -7.6,-0.2 C-6.5,-0.5 -5.5,-0.1 -4.9,0.8 C-3.9,0.7 -3,1.1 -2.4,1.9 Z';
    const feathers = 'M-13,-3.4 C-10,-3.6 -6.6,-2.8 -3.4,-0.6 M-10.4,-2 C-8.2,-2 -5.8,-1.2 -3.6,0.4 M-7.8,-0.6 C-6.4,-0.4 -5,0.2 -3.6,1.2';
    const shield = 'M-7.2,-9 C-4.2,-8 -1.6,-8.6 0,-9.8 C1.6,-8.6 4.2,-8 7.2,-9 V1 C7.2,5.8 3.7,8.8 0,10.6 C-3.7,8.8 -7.2,5.8 -7.2,1 Z';
    const prints = `
      <g transform="translate(71.5 88.5) scale(1.04)"><g fill="#000" fill-opacity="0.45" filter="url(#b1)" transform="translate(0.4 0.7)"><path d="${wing}"/><path d="${wing}" transform="scale(-1 1)"/></g>
        ${[1, -1].map((k) => `<g transform="scale(${k} 1)"><path d="${wing}" fill="#e2b03a"/><path d="${wing}" fill="none" stroke="#8a6412" stroke-width="0.3"/><path d="${feathers}" fill="none" stroke="#8a6412" stroke-opacity="0.8" stroke-width="0.32" stroke-linecap="round"/><path d="M-14.6,-4.3 C-10.4,-5.3 -6,-4.4 -3,-1.6" fill="none" stroke="#fff3b8" stroke-opacity="0.7" stroke-width="0.4"/></g>`).join('')}
        <circle r="3.3" fill="#e2b03a" stroke="#8a6412" stroke-width="0.3"/><circle r="2.3" fill="#2f66b3"/><circle r="0.9" fill="#dfe6f2"/></g>
      <g transform="translate(71.5 115.5)"><path d="${shield}" fill="#000" fill-opacity="0.45" filter="url(#b1)" transform="translate(0.4 0.8)"/><path d="${shield}" fill="#e6eaf1"/>
        <clipPath id="crest"><path d="${shield}" transform="scale(0.84)"/></clipPath><g clip-path="url(#crest)"><rect x="-8" y="-10" width="16" height="6.6" fill="#c0282f"/><rect x="-8" y="-3.4" width="16" height="15" fill="#2f66b3"/><rect x="-1.5" y="-3.4" width="3" height="15" fill="#dfe8f4"/><rect x="-4.6" y="-3.4" width="0.9" height="15" fill="#dfe8f4" fill-opacity="0.75"/><rect x="3.7" y="-3.4" width="0.9" height="15" fill="#dfe8f4" fill-opacity="0.75"/><rect x="-8" y="-3.8" width="16" height="0.8" fill="#e6eaf1"/></g>
        <path d="${shield}" fill="none" stroke="#8d95a6" stroke-width="0.3"/></g>
      <g transform="translate(125 84.5) scale(1.16)" fill="none" stroke="#f4f5f7" stroke-linecap="round" stroke-linejoin="round"><circle cx="-6.4" cy="0" r="5.1" fill="#f4f5f7" stroke="none"/><path d="M-9.1,2.9 L-6.4,-3.4 L-3.7,2.9 M-8.1,0.9 H-4.7" stroke="${t.base}" stroke-width="1.25"/>
        <path d="M1.4,3.2 V-1.7 M1.4,0 C2.2,-1.3 3.3,-1.8 4.6,-1.5" stroke-width="1.5"/><path d="M7.4,3.2 V-1.6" stroke-width="1.5"/><circle cx="7.4" cy="-3.9" r="0.85" fill="#f4f5f7" stroke="none"/></g>`;
    const inner = `${prints}
      ${folds(t, [['M41,56 C53,80 66,102 77,130', 7, 0.9], ['M159,56 C148,82 136,106 125,136', 7, 1], ['M60,140 C56,172 63,206 58,234', 7, 1], ['M84,152 C81,182 86,212 83,235', 5, 0.7], ['M117,148 C120,178 114,210 118,235', 5, 0.8], ['M141,138 C145,172 138,206 143,234', 7, 1]])}
      ${folds(t, [['M36,106 C44,110 50,118 55,130', 3, 0.8], ['M164,106 C156,110 150,118 146,130', 3, 0.8], ['M78,64 C88,72 112,72 122,64', 4, 0.5]], 'b2')}${shade(t, 'M70,38 C76,54 88,61.5 100,61.5 C112,61.5 124,54 130,38', 3.4, 0.4, 'b2')}
      ${seam(t, 'M77.4,38.2 C63,41.8 49,46.8 37.6,53.2', 0.7)}${hem}`;
    await render('ari-de-sa', t, sil(body) + `<path d="${open}"/>`,
      `<path d="${open}" fill="#121a2e"/>${ribbed(t, 'M76,35 C84,30.4 116,30.4 124,35 L122.6,39.4 C114,35.8 86,35.8 77.4,39.4 Z', { fill: '#18213a', cast: 0, edge: 0.6, edgeW: 2 })}
       <g clip-path="url(#open)">${WOOD}${shade(t, 'M76,37 C81,49 90,54.5 100,54.5 C110,54.5 119,49 124,37', 3, 0.6, 'b2')}</g>${sleeves()}${piece(t, body, { cast: 1, inner })}${ribbed(t, rib, { cast: 0.5, edge: 0.7, edgeW: 2.2 })}`,
      { extra: `<clipPath id="open"><path d="${open}"/></clipPath>` });
  }
  // back
  {
    const body = sym(`M100,31.4 C91,31.4 82,32.6 76,35 ${SIDE}`);
    const inner = `${folds(t, [['M41,56 C53,82 64,106 72,136', 7, 0.9], ['M159,56 C148,84 138,108 130,140', 7, 1], ['M62,130 C58,168 65,204 60,234', 7, 1], ['M86,120 C83,170 88,208 85,235', 5, 0.6], ['M115,116 C118,170 112,208 116,235', 5, 0.7], ['M139,130 C143,168 136,204 141,234', 7, 1]])}
      ${folds(t, [['M36,106 C44,110 50,118 55,130', 3, 0.8], ['M164,106 C156,110 150,118 146,130', 3, 0.8]], 'b2')}${shade(t, 'M72,37 C84,43.6 116,43.6 128,37', 3.4, 0.4, 'b2')}${hem}`;
    await render('ari-de-sa-back', t, sil(body),
      `${sleeves()}${piece(t, body, { cast: 1, inner })}${ribbed(t, 'M76,35 C82,32.6 91,31.4 100,31.4 C109,31.4 118,32.6 124,35 L125.4,39.8 C115,36.2 85,36.2 74.6,39.8 Z', { cast: 0.4, edge: 0.7, edgeW: 2 })}`,
      { back: true });
  }
}

// ── 4. HIBEEX quarter-zip (18 to now): off-white piqué, fold-down collar, short dark zip, the bee on the wearer's left
{
  const t = TONES.pique;
  const bee = await sharp('public/hibeex.webp').resize({ width: 240 }).png().toBuffer();
  const SIDE = 'C65,37.5 49,43.5 34,50.5 C32,68 31,88 31.5,106 C32,150 31,190 32,209 C32.4,212.6 33.6,214.6 35.4,215.4 L36,228 C54,231.2 78,230.8 100,231.2';
  const { sleeve, cuff, roll } = hang(35, 50, 46, 104, 21, 40, 217, 15);
  const band = sym('M100,217.6 C78,217.2 54,217.2 35.4,215 L36,228 C54,231.2 78,230.8 100,231.2');
  const extra = `<pattern id="pq" width="1.5" height="1.5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="0.75" cy="0.75" r="0.46" fill="${t.sh}" fill-opacity="0.13"/><circle cx="0.45" cy="0.45" r="0.2" fill="#fff" fill-opacity="0.7"/></pattern>`;
  const sil = (body) => `<path d="${body}"/>${[sleeve, cuff].map((d) => `<path d="${d}"/><path d="${d}" transform="matrix(-1 0 0 1 200 0)"/>`).join('')}`;
  const sleeves = () => both(() => `${ribbed(t, cuff, { cast: 0.7, edge: 0.7, edgeW: 2.6 })}${piece(t, sleeve, { cast: 1.3, edge: 1.15, inner: `${roll(t)}
    ${folds(t, [['M25,64 C21,94 25,126 22,158', 5, 0.7], ['M38,112 C35,142 39,172 37,198', 4, 0.6]])}
    ${folds(t, [['M18,122 C25,129 34,131 44,126', 2.6, 0.6], ['M18,140 C25,144 33,144 43,139', 2.2, 0.45], ['M25,72 C30,82 37,90 45,94', 3, 0.55]], 'b2')}${shade(t, 'M19,202 C26,205 35,205 43,202', 4, 0.4, 'b2')}` })}`);
  const hemBand = () => ribbed(t, band, { cast: 0.4, edge: 0.6, edgeW: 3 });
  // front
  {
    const body = sym(`M100,45 L79.5,33 ${SIDE}`);
    const back = 'M79.5,32 C88,27.2 112,27.2 120.5,32 L100,45.6 Z';
    const leaf = 'M100,45 C93,43 85,38 79.5,31.8 C76,32.8 73.4,35.6 72.4,38.6 C74.6,48 78.6,57.6 83.8,66.4 C89.8,60.2 95.6,52.6 100,45 Z';
    const collar = () => `${piece(t, leaf, { cast: 1.4, edge: 0.55, edgeW: 4, inner: `<rect width="200" height="310" fill="url(#pq)"/>${shade(t, 'M79.5,31.8 C85,38 93,43 100,45', 3.4, 0.22)}` })}${stitch(t, 'M74.4,39.4 C76.6,47.6 80,56 84.2,63.4 C89,58 94,51.6 97.8,45.6', 0.8)}`;
    const zip = `${shade(t, 'M100,47 V100', 7, 0.16)}<path d="M96.2,46.6 V100.4 H103.8 V46.6" fill="none" stroke="${t.sh}" stroke-opacity="0.34" stroke-width="0.42" stroke-dasharray="1.3 0.9"/>
      <path d="M100,45.6 V97.6" stroke="#d9d7d0" stroke-width="3.5"/><path d="M100,45.6 V97.6" stroke="#35373c" stroke-width="1.7"/><path d="M100,45.6 V97.6" stroke="#9da0a8" stroke-width="1.7" stroke-dasharray="0.45 0.75"/>
      <rect x="98.3" y="96.8" width="3.4" height="2.2" rx="0.5" fill="#55585f"/>
      <rect x="98.1" y="48" width="3.8" height="4.6" rx="1" fill="url(#ferrule)" stroke="#3d4046" stroke-width="0.3"/><path d="M100,52.2 V58.6" stroke="#4a4d54" stroke-width="2.2" stroke-linecap="round"/><path d="M99.7,53 V58.2" stroke="#b9bcc2" stroke-width="0.6" stroke-linecap="round"/>`;
    const inner = `<image x="111.5" y="74.5" width="28" height="28" xlink:href="${uri(bee)}" href="${uri(bee)}" opacity="0.94"/>
      ${folds(t, [['M40,58 C52,84 60,112 58,150', 7, 0.7], ['M160,58 C148,86 141,114 143,150', 7, 0.8], ['M60,130 C56,162 62,192 58,216', 6, 0.9], ['M83,142 C80,170 85,196 82,217', 5, 0.6], ['M119,140 C122,170 116,196 120,217', 5, 0.7], ['M142,128 C146,160 139,192 144,216', 6, 0.9]])}
      ${folds(t, [['M46,140 C60,148 76,150 92,145', 3, 0.26], ['M108,152 C124,158 140,156 154,148', 3, 0.28], ['M46,62 C56,72 66,76 78,76', 3, 0.28], ['M154,62 C144,72 134,76 122,76', 3, 0.28]], 'b2')}${zip}`;
    await render('hibeex', t, sil(body) + `<path d="${leaf}"/><path d="${leaf}" transform="matrix(-1 0 0 1 200 0)"/><path d="${back}"/>`,
      `<path d="${back}" fill="#d3d2cd"/><path d="M79.5,32 C88,27.2 112,27.2 120.5,32 L118.6,35.6 C110,31.4 90,31.4 81.4,35.6 Z" fill="#e2e1dc"/>${shade(t, 'M81,35.6 L100,46.6 L119,35.6', 4, 0.5)}
       <g clip-path="url(#open)">${WOOD}</g>${piece(t, body, { cast: 0, inner })}${hemBand()}${sleeves()}${both(collar)}`,
      { extra: extra + `<clipPath id="open"><path d="${back}"/></clipPath>` });
  }
  // back
  {
    const body = sym(`M100,31.4 C92,31.4 85,32 79.5,33 ${SIDE}`);
    const fall = 'M77.6,34.2 C86,26.2 114,26.2 122.4,34.2 C122,39.4 120.4,43.2 118.6,45.2 C110,40.8 90,40.8 81.4,45.2 C79.6,43.2 78,39.4 77.6,34.2 Z';
    const inner = `${folds(t, [['M40,58 C52,86 62,114 60,150', 7, 0.7], ['M160,58 C148,88 139,116 141,150', 7, 0.8], ['M62,124 C58,160 64,192 60,216', 6, 0.9], ['M84,96 C81,150 86,192 83,217', 5, 0.5], ['M117,94 C120,150 114,192 118,217', 5, 0.6], ['M140,124 C144,160 137,192 142,216', 6, 0.9]])}`;
    await render('hibeex-back', t, sil(body) + `<path d="${fall}"/>`,
      `${piece(t, body, { cast: 0, inner })}${hemBand()}${sleeves()}${piece(t, fall, { cast: 1.3, edge: 0.5, edgeW: 3.4, inner: '<rect width="200" height="310" fill="url(#pq)"/>' })}${stitch(t, 'M79.8,41.8 C82,40.6 90,38.6 100,38.6 C110,38.6 118,40.6 120.2,41.8', 0.8)}`,
      { back: true, extra });
  }
}

// ── 5. Taqtile zip hoodie (18 to now): black fleece, hood with drawcords, full zip, the wordmark on the wearer's left
{
  const t = TONES.fleece;
  // The wordmark, lifted from the photo (a mirrored selfie, so flipped back).
  const crop = await sharp(`${src}/taqtile.png`).extract({ left: 300, top: 1220, width: 360, height: 170 }).flop().rotate(-8.5, { background: '#000' }).greyscale().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = crop.info;
  const rgba = Buffer.alloc(width * height * 4);
  for (let i = 0; i < width * height; i++) { rgba[i * 4] = rgba[i * 4 + 1] = rgba[i * 4 + 2] = 244; rgba[i * 4 + 3] = Math.max(0, Math.min(255, (crop.data[i] - 95) * 2.4)); }
  const markImg = sharp(rgba, { raw: { width, height, channels: 4 } }).trim({ threshold: 20 });
  const mark = await markImg.png().toBuffer({ resolveWithObject: true });
  const MW = 33, MH = (MW * mark.info.height) / mark.info.width;

  const SIDE = 'C64,38.5 47,44.5 32,51.5 C30,69 29,89 29.5,107 C30,150 29,190 30,210 C30.4,214 31.6,216 33.4,216.8 L34,230 C52,233.6 78,233.2 100,233.6';
  const { sleeve, cuff, roll } = hang(33, 51, 44.5, 106, 19, 39, 219, 16);
  const band = sym('M100,219 C78,218.6 54,218.6 33.4,216.4 L34,230 C52,233.6 78,233.2 100,233.6');
  const sil = (body) => `<path d="${body}"/>${[sleeve, cuff].map((d) => `<path d="${d}"/><path d="${d}" transform="matrix(-1 0 0 1 200 0)"/>`).join('')}`;
  const sleeves = () => both(() => `${ribbed(t, cuff, { cast: 0.8, edge: 0.7, edgeW: 2.6 })}${piece(t, sleeve, { cast: 1.5, edge: 1.1, edgeW: 6, inner: `${roll(t)}
    ${folds(t, [['M23,66 C19,96 23,128 20,160', 6, 0.8], ['M36,114 C33,146 37,176 35,200', 5, 0.7]], 'b5')}
    ${folds(t, [['M16,124 C23,131 33,133 43,128', 3, 0.7], ['M16,142 C23,146 32,146 42,141', 2.6, 0.5], ['M23,76 C28,86 36,94 44,98', 3.4, 0.6]])}${shade(t, 'M17,204 C25,207 34,207 42,204', 4, 0.5, 'b2')}` })}`);
  const hemBand = () => ribbed(t, band, { cast: 0.5, edge: 0.7, edgeW: 3 });
  // front
  {
    const body = sym(`M100,48 L80,35 ${SIDE}`);
    const back = 'M76,37 C82,25.4 118,25.4 124,37 L100,49 Z';
    const mound = 'M62,46 C56,35 62,22.5 79,18.8 C91,16.4 109,16.4 121,18.8 C138,22.5 144,35 138,46 C122,38.5 78,38.5 62,46 Z';
    const leaf = 'M100,47.5 C92,45.6 82,40.4 75.4,32.6 C70.6,33.4 66.4,36.8 64,41.6 C69.4,51 83.4,59.6 98.8,63.6 C99.6,58 100,52 100,47.5 Z';
    const rim = () => `${piece(t, leaf, { cast: 1.6, edge: 0.9, edgeW: 5, inner: `${folds(t, [['M68,43 C77,51 89,57 99,59.6', 2.6, 0.7]], 'b2')}<path d="M77,36 C83,43 91,47.6 98,49.6" fill="none" stroke="${t.hi}" stroke-opacity="0.16" stroke-width="2.4" filter="url(#b2)"/>` })}${stitch(t, 'M72.6,36.2 C79,44.6 89,50.2 98.2,52.6', 0.9)}
      <circle cx="89.6" cy="53.4" r="1.3" fill="#0c0c0e" stroke="#8a8a92" stroke-width="0.5"/>`;
    const cord = (d, x, y) => `<path d="${d}" fill="none" stroke="#000" stroke-opacity="0.55" stroke-width="3" stroke-linecap="round" filter="url(#b1)" transform="translate(0.8 0.9)"/><path d="${d}" fill="none" stroke="#2e2e33" stroke-width="2" stroke-linecap="round"/><path d="${d}" fill="none" stroke="#6a6a72" stroke-opacity="0.7" stroke-width="0.5" stroke-linecap="round" transform="translate(-0.5 0)"/>
      <rect x="${x - 1.2}" y="${y - 0.6}" width="2.4" height="5.2" rx="0.8" fill="#8f9098"/><rect x="${x - 0.8}" y="${y - 0.2}" width="0.6" height="4.4" rx="0.3" fill="#fff" fill-opacity="0.6"/>`;
    const pocket = () => `${shade(t, 'M63.4,151 C58,162 52,178 50.4,197', 4.6, 0.75, 'b2')}<path d="M95.4,150 L62,150 C57,160 51.4,176 49,196 L49,217" fill="none" stroke="#000" stroke-opacity="0.7" stroke-width="0.55"/><path d="M95.4,150 L62,150 C57,160 51.4,176 49,196" fill="none" stroke="${t.hi}" stroke-opacity="0.22" stroke-width="0.45" transform="translate(0.7 0.8)"/>
      <path d="M93.6,152.2 L63.6,152.2 C59,161.6 53.6,176.6 51.2,196.2" fill="none" stroke="${t.hi}" stroke-opacity="0.26" stroke-width="0.4" stroke-dasharray="1.3 0.9"/>`;
    const zip = `${shade(t, 'M100,50 V232', 6, 0.5)}<path d="M100,48.6 V233.4" stroke="#0b0b0d" stroke-width="2.6"/><path d="M100,48.6 V233.4" stroke="#3b3b42" stroke-width="1.2" stroke-dasharray="0.5 0.6"/>
      <path d="M97.2,50 V232.6 M102.8,50 V232.6" fill="none" stroke="${t.hi}" stroke-opacity="0.24" stroke-width="0.4" stroke-dasharray="1.3 0.9"/>
      <rect x="98" y="52.6" width="4" height="4.8" rx="1" fill="#7a7b84" stroke="#27272b" stroke-width="0.3"/><path d="M100,57 V64.4" stroke="#6a6b74" stroke-width="2.4" stroke-linecap="round"/><path d="M99.6,57.8 V64" stroke="#c4c5cc" stroke-width="0.6" stroke-linecap="round"/><rect x="98.4" y="230.4" width="3.2" height="3" rx="0.5" fill="#55565e"/>`;
    const inner = `<image x="114.5" y="${90 - MH / 2}" width="${MW}" height="${MH}" xlink:href="${uri(mark.data)}" href="${uri(mark.data)}"/>
      ${folds(t, [['M38,60 C50,86 58,114 56,152', 8, 0.9], ['M162,60 C150,88 143,116 145,152', 8, 1], ['M60,126 C56,160 62,194 58,217', 7, 1], ['M82,120 C79,164 84,196 81,218', 6, 0.7], ['M120,122 C123,164 117,196 121,218', 6, 0.8], ['M143,126 C147,160 140,194 145,217', 7, 1]], 'b5')}
      ${folds(t, [['M44,140 C58,148 74,150 90,145', 3.4, 0.6], ['M110,138 C126,146 142,144 156,136', 3.4, 0.6], ['M44,64 C54,74 64,78 76,78', 3.4, 0.5], ['M156,64 C146,74 136,78 124,78', 3.4, 0.5]])}
      ${both(pocket)}${zip}`;
    await render('taqtile', t, sil(body) + `<path d="${leaf}"/><path d="${leaf}" transform="matrix(-1 0 0 1 200 0)"/><path d="${back}"/><path d="${mound}"/>`,
      `${piece(t, mound, { fill: '#17171a', cast: 0, edge: 1, edgeW: 6, inner: folds(t, [['M70,26 C68,32 68,38 70,44', 4, 0.8], ['M130,26 C132,32 132,38 130,44', 4, 0.8]]) })}<path d="${back}" fill="#070708"/>
       <g clip-path="url(#open)">${WOOD}${shade(t, 'M77,37 L100,49.6 L123,37', 4, 0.7)}</g>${piece(t, body, { cast: 0, inner })}${hemBand()}${sleeves()}${both(rim)}${cord('M89.6,54 C88.6,68 90.4,84 89,99', 89, 99)}${cord('M110.4,54 C111.6,70 109.6,88 111.2,105', 111.2, 105)}`,
      { extra: `<clipPath id="open"><path d="${back}"/></clipPath>` });
  }
  // back: the hood hangs down it
  {
    const body = sym(`M100,33 C92,33 86,34 80,35 ${SIDE}`);
    const hood = 'M72,37 C63,58 73,98 100,115 C127,98 137,58 128,37 C120,28.6 80,28.6 72,37 Z';
    const inner = `${folds(t, [['M38,60 C50,88 60,116 58,152', 8, 0.9], ['M162,60 C150,90 141,118 143,152', 8, 1], ['M62,124 C58,160 64,194 60,217', 7, 1], ['M84,122 C81,164 86,196 83,218', 6, 0.6], ['M117,120 C120,164 114,196 118,218', 6, 0.7], ['M140,124 C144,160 137,194 142,217', 7, 1]], 'b5')}`;
    await render('taqtile-back', t, sil(body) + `<path d="${hood}"/>`,
      `${piece(t, body, { cast: 0, inner })}${hemBand()}${sleeves()}${piece(t, hood, { cast: 1.8, edge: 0.9, edgeW: 7, inner: `${folds(t, [['M84,44 C82,66 88,88 98,104', 6, 0.9], ['M116,44 C119,66 113,88 104,104', 6, 0.9]], 'b5')}${seam(t, 'M100,30.6 V114', 1.2)}` })}${stitch(t, 'M74.6,41 C84,34.8 116,34.8 125.4,41', 0.9)}`,
      { back: true });
  }
}
