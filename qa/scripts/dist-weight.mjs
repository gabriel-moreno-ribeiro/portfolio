/**
 * qa/scripts/dist-weight.mjs - measures the production bundle in dist/.
 * Usage: node qa/scripts/dist-weight.mjs <outDir>
 * Ex.:   node qa/scripts/dist-weight.mjs qa/baseline
 * Requires a prior `npm run build`.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const OUT = path.resolve(process.argv[2] || 'qa/baseline');
const DIST = path.resolve(process.argv[3] || 'dist');
fs.mkdirSync(OUT, { recursive: true });

function walk(dir) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

if (!fs.existsSync(DIST)) {
  console.error('no dist/ - run npm run build first');
  process.exit(1);
}

const files = walk(DIST).map((p) => {
  const bytes = fs.statSync(p).size;
  const ext = path.extname(p).toLowerCase();
  let gzip = null;
  if (['.js', '.css', '.html', '.json', '.svg'].includes(ext) && bytes < 8 * 1024 * 1024) {
    gzip = zlib.gzipSync(fs.readFileSync(p), { level: 9 }).length;
  }
  return { file: path.relative(DIST, p).replace(/\\/g, '/'), ext, bytes, kb: +(bytes / 1024).toFixed(1), gzipKB: gzip === null ? null : +(gzip / 1024).toFixed(1) };
});

const assets = files.filter((f) => f.file.startsWith('assets/'));
const byExt = {};
for (const f of files) {
  const k = f.ext || '(none)';
  if (!byExt[k]) byExt[k] = { files: 0, bytes: 0 };
  byExt[k].files++; byExt[k].bytes += f.bytes;
}
for (const k of Object.keys(byExt)) byExt[k].kb = +(byExt[k].bytes / 1024).toFixed(1);

const result = {
  generatedAt: new Date().toISOString(),
  distDir: DIST,
  distTotalBytes: files.reduce((s, f) => s + f.bytes, 0),
  distTotalMB: +(files.reduce((s, f) => s + f.bytes, 0) / 1048576).toFixed(2),
  assetsTotalBytes: assets.reduce((s, f) => s + f.bytes, 0),
  assetsTotalKB: +(assets.reduce((s, f) => s + f.bytes, 0) / 1024).toFixed(1),
  assetsTotalMB: +(assets.reduce((s, f) => s + f.bytes, 0) / 1048576).toFixed(2),
  assetsFileCount: assets.length,
  jsTotalKB: +(assets.filter((f) => f.ext === '.js').reduce((s, f) => s + f.bytes, 0) / 1024).toFixed(1),
  jsGzipTotalKB: +(assets.filter((f) => f.ext === '.js').reduce((s, f) => s + (f.gzipKB || 0) * 1024, 0) / 1024).toFixed(1),
  cssTotalKB: +(assets.filter((f) => f.ext === '.css').reduce((s, f) => s + f.bytes, 0) / 1024).toFixed(1),
  byExt,
  top10Chunks: assets.filter((f) => f.ext === '.js' || f.ext === '.css').sort((a, b) => b.bytes - a.bytes).slice(0, 10),
  top10AssetsAnyType: assets.slice().sort((a, b) => b.bytes - a.bytes).slice(0, 10),
  allAssets: assets.slice().sort((a, b) => b.bytes - a.bytes),
};
fs.writeFileSync(path.join(OUT, 'dist-weight.json'), JSON.stringify(result, null, 2));
console.log('dist/assets total: ' + result.assetsTotalKB + ' KB (' + result.assetsTotalMB + ' MB) in ' + result.assetsFileCount + ' files');
console.log('js raw ' + result.jsTotalKB + ' KB / gzip ' + result.jsGzipTotalKB + ' KB | css ' + result.cssTotalKB + ' KB');
console.log('top 10 chunks:');
for (const c of result.top10Chunks) console.log('  ' + String(c.kb).padStart(8) + ' KB  gz ' + String(c.gzipKB).padStart(7) + ' KB  ' + c.file);
