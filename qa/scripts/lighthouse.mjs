/**
 * qa/scripts/lighthouse.mjs - runs Lighthouse desktop + mobile and extracts a digest.
 * Usage: node qa/scripts/lighthouse.mjs <outDir> [baseUrl]
 * Ex.:   node qa/scripts/lighthouse.mjs qa/baseline http://localhost:5173
 *
 * Equivalent raw commands:
 *   npx lighthouse http://localhost:5173/ --preset=desktop --output=json --output=html \
 *     --output-path=qa/baseline/lighthouse-desktop --chrome-flags="--headless=new" --quiet
 *   npx lighthouse http://localhost:5173/ --output=json --output=html \
 *     --output-path=qa/baseline/lighthouse-mobile --chrome-flags="--headless=new" --quiet
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve(process.argv[2] || 'qa/baseline');
const BASE = process.argv[3] || process.env.QA_BASE_URL || 'http://localhost:5173';
fs.mkdirSync(OUT, { recursive: true });

const LH = path.resolve('node_modules/lighthouse/cli/index.js');
const runs = [
  { name: 'desktop', extra: ['--preset=desktop'] },
  { name: 'mobile', extra: [] },
];

function run(r) {
  const outPath = path.join(OUT, 'lighthouse-' + r.name);
  const args = [LH, BASE + '/', '--output=json', '--output=html', '--output-path=' + outPath,
    '--chrome-flags=--headless=new --no-sandbox --use-gl=angle --use-angle=swiftshader --enable-unsafe-swiftshader',
    '--quiet', '--max-wait-for-load=90000'].concat(r.extra);
  const t0 = Date.now();
  const p = spawnSync(process.execPath, args, { encoding: 'utf8', timeout: 600000, maxBuffer: 1024 * 1024 * 64 });
  const ms = Date.now() - t0;
  const jsonFile = outPath + '.report.json';
  const htmlFile = outPath + '.report.html';
  if (!fs.existsSync(jsonFile)) {
    return { name: r.name, ok: false, ms, status: p.status, stderr: String(p.stderr || '').slice(-2000) };
  }
  // normalize names: lighthouse-desktop.report.json -> lighthouse-desktop.json
  for (const [src, dst] of [[jsonFile, outPath + '.json'], [htmlFile, outPath + '.html']]) {
    if (fs.existsSync(src)) { fs.copyFileSync(src, dst); fs.rmSync(src); }
  }
  const lhr = JSON.parse(fs.readFileSync(outPath + '.json', 'utf8'));
  const c = lhr.categories || {};
  const a = lhr.audits || {};
  const num = (k) => (a[k] && a[k].numericValue != null ? Math.round(a[k].numericValue) : null);
  const disp = (k) => (a[k] ? a[k].displayValue || null : null);
  const items = (k) => (a[k] && a[k].details && a[k].details.items ? a[k].details.items : []);
  return {
    name: r.name, ok: true, ms,
    lighthouseVersion: lhr.lighthouseVersion,
    formFactor: lhr.configSettings ? lhr.configSettings.formFactor : null,
    throttling: lhr.configSettings ? lhr.configSettings.throttlingMethod : null,
    scores: {
      performance: c.performance ? Math.round(c.performance.score * 100) : null,
      accessibility: c.accessibility ? Math.round(c.accessibility.score * 100) : null,
      'best-practices': c['best-practices'] ? Math.round(c['best-practices'].score * 100) : null,
      seo: c.seo ? Math.round(c.seo.score * 100) : null,
    },
    metrics: {
      FCP: num('first-contentful-paint'), LCP: num('largest-contentful-paint'),
      CLS: a['cumulative-layout-shift'] ? +Number(a['cumulative-layout-shift'].numericValue).toFixed(3) : null,
      TBT: num('total-blocking-time'), SpeedIndex: num('speed-index'), TTI: num('interactive'),
      LCPelement: items('largest-contentful-paint-element')[0] ? String(JSON.stringify(items('largest-contentful-paint-element')[0]).slice(0, 220)) : null,
      totalByteWeight: num('total-byte-weight'), totalByteWeightDisplay: disp('total-byte-weight'),
      mainThreadWorkMs: num('mainthread-work-breakdown'),
      bootupTimeMs: num('bootup-time'),
      domSize: num('dom-size'),
    },
    unusedJavascript: items('unused-javascript').slice(0, 5).map((i) => ({ url: String(i.url || '').slice(0, 130), totalKB: +((i.totalBytes || 0) / 1024).toFixed(1), wastedKB: +((i.wastedBytes || 0) / 1024).toFixed(1), wastedPct: i.wastedPercent != null ? +Number(i.wastedPercent).toFixed(0) : null })),
    properlySizeImages: items('uses-responsive-images').slice(0, 5).map((i) => ({ url: String(i.url || '').slice(0, 130), totalKB: +((i.totalBytes || 0) / 1024).toFixed(1), wastedKB: +((i.wastedBytes || 0) / 1024).toFixed(1) })),
    unsizedImages: items('unsized-images').slice(0, 10).map((i) => String(i.url || JSON.stringify(i)).slice(0, 130)),
    offscreenImages: items('offscreen-images').slice(0, 5).map((i) => ({ url: String(i.url || '').slice(0, 130), wastedKB: +((i.wastedBytes || 0) / 1024).toFixed(1) })),
    largestResources: items('resource-summary').map((i) => ({ type: i.resourceType, requests: i.requestCount, kb: +((i.transferSize || 0) / 1024).toFixed(1) })),
    failedAudits: Object.values(a).filter((x) => x && x.score !== null && x.score < 0.9 && x.scoreDisplayMode === 'binary').map((x) => x.id),
    a11yFailures: Object.values(a).filter((x) => x && x.score === 0 && c.accessibility && c.accessibility.auditRefs.some((r2) => r2.id === x.id)).map((x) => ({ id: x.id, title: x.title, nodes: x.details && x.details.items ? x.details.items.length : 0 })),
  };
}

const digest = { generatedAt: new Date().toISOString(), url: BASE + '/', runs: {} };
for (const r of runs) {
  console.log('>> lighthouse ' + r.name);
  const res = run(r);
  digest.runs[r.name] = res;
  console.log(res.ok ? JSON.stringify({ scores: res.scores, metrics: res.metrics }, null, 1) : 'FAILED: ' + res.stderr);
}
fs.writeFileSync(path.join(OUT, 'lighthouse-digest.json'), JSON.stringify(digest, null, 2));
console.log('digest -> ' + path.join(OUT, 'lighthouse-digest.json'));
