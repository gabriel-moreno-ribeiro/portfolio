/**
 * bench.mjs — medição (a) GLB vs (b) sprites para o carro da seção Experience.
 *
 * Não depende do dev server nem da Home: serve `node_modules/three/**`, o GLB e os WebP
 * por `page.route` numa origem falsa. Emulação mobile 390×844 + CDP
 * `Emulation.setCPUThrottlingRate {rate: 4}`.
 *
 * Mede, por opção:
 *   - firstFrameMs: do início do cenário até o primeiro pixel do carro na tela.
 *   - 300 atualizações de posição: tempo de trabalho por update (p50/p95/max) e
 *     quantos frames de rAF passaram de 50 ms.
 *   - transferred: bytes realmente baixados (via Network do CDP).
 *
 * Uso: node qa/experience-bench/bench.mjs
 */
import { chromium } from 'playwright';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const ORIGIN = 'http://bench.local';
const UPDATES = 300;
const THROTTLE = 4;
const MIME = { '.js': 'text/javascript', '.wasm': 'application/wasm', '.glb': 'model/gltf-binary', '.webp': 'image/webp', '.hdr': 'image/vnd.radiance' };

const HTML = `<!doctype html><html><head><meta charset="utf-8">
<style>html,body{margin:0;background:#fff8f4}canvas{display:block}</style>
<script type="importmap">{"imports":{"three":"/three/build/three.module.js","three/addons/":"/three/examples/jsm/"}}</script>
</head><body></body></html>`;

function resolveFile(pathname) {
  if (pathname.startsWith('/three/')) return path.join(ROOT, 'node_modules/three', pathname.slice(7));
  if (pathname === '/model.glb') return path.join(ROOT, 'public/assets/3d/d20.glb');
  if (pathname === '/studio.hdr') return path.join(ROOT, 'public/assets/3d/studio.hdr');
  if (pathname.startsWith('/car/')) return path.join(ROOT, 'public/assets/car', pathname.slice(5));
  return null;
}

// ── Cenário (a): three.js puro, câmera fixa, render sob demanda ───────────────
const GLB_SCENARIO = `
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
const t0 = performance.now();
const W = 180, H = 180, DPR = Math.min(1.5, devicePixelRatio);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
renderer.setPixelRatio(DPR);
renderer.setSize(W, H, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.body.appendChild(renderer.domElement);
const scene = new THREE.Scene();
scene.add(new THREE.HemisphereLight(0xffffff, 0x666666, 1.4));
const key = new THREE.DirectionalLight(0xffffff, 2.2); key.position.set(4, 8, 6); scene.add(key);
const draco = new DRACOLoader(); draco.setDecoderPath('/three/examples/jsm/libs/draco/');
const loader = new GLTFLoader(); loader.setDRACOLoader(draco);
const gltf = await loader.loadAsync('/model.glb');
const model = gltf.scene;
const box = new THREE.Box3().setFromObject(model);
const c = new THREE.Vector3(); box.getCenter(c);
const s = new THREE.Vector3(); box.getSize(s);
model.position.sub(c);
const pivot = new THREE.Group(); pivot.add(model); scene.add(pivot);
const half = 19.5;
const camera = new THREE.OrthographicCamera(-half, half, half, -half, 0.1, 400);
const elev = THREE.MathUtils.degToRad(40), dist = 160;
camera.position.set(0, Math.sin(elev) * dist, Math.cos(elev) * dist);
camera.lookAt(0, 0, 0);
renderer.render(scene, camera);              // primeiro frame do carro
const firstFrameMs = performance.now() - t0;
window.__update = (i) => {
  pivot.rotation.y = (i / ${UPDATES}) * Math.PI * 2;
  renderer.domElement.style.transform = 'translate(' + (i % 120) + 'px,' + (i % 90) + 'px)';
  renderer.render(scene, camera);
};
window.__firstFrameMs = firstFrameMs;
window.__ready = true;
`;

// ── Cenário (b): sprites em canvas 2D ────────────────────────────────────────
const SPRITE_SCENARIO = `
const t0 = performance.now();
const FRAMES = 48, SIZE = 256, DRAW = 128;
const canvas = document.createElement('canvas');
canvas.width = DRAW * 2; canvas.height = DRAW * 2;
canvas.style.width = DRAW + 'px'; canvas.style.height = DRAW + 'px';
document.body.appendChild(canvas);
const ctx = canvas.getContext('2d');
const load = (i) => new Promise((res, rej) => {
  const img = new Image();
  img.onload = () => res(img); img.onerror = rej;
  img.src = '/car/car-' + String(i).padStart(2, '0') + '.webp';
});
// Primeiro frame: só o sprite inicial precisa estar pronto (é o poster).
const first = await load(0);
ctx.drawImage(first, 0, 0, SIZE, SIZE, 0, 0, DRAW * 2, DRAW * 2);
const firstFrameMs = performance.now() - t0;
// Os outros 47 entram depois, sem bloquear.
const imgs = new Array(FRAMES); imgs[0] = first;
await Promise.all(Array.from({ length: FRAMES - 1 }, (_, k) => load(k + 1).then((im) => { imgs[k + 1] = im; })));
let wheelPhase = 0;
window.__update = (i) => {
  const idx = Math.round((i / ${UPDATES}) * FRAMES) % FRAMES;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  // sombra de contato
  ctx.save();
  ctx.globalAlpha = 0.18; ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.ellipse(canvas.width / 2, canvas.height * 0.62, 90, 26, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.drawImage(imgs[idx], 0, 0, SIZE, SIZE, 0, 0, canvas.width, canvas.height);
  // rodas 2D + lanternas por cima
  wheelPhase += 0.4;
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 3;
  for (const [wx, wy] of [[0.37, 0.75], [0.63, 0.75], [0.37, 0.4], [0.63, 0.4]]) {
    const x = wx * canvas.width, y = wy * canvas.height;
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(wheelPhase) * 10, y + Math.sin(wheelPhase) * 6);
    ctx.lineTo(x - Math.cos(wheelPhase) * 10, y - Math.sin(wheelPhase) * 6);
    ctx.stroke();
  }
  ctx.restore();
  canvas.style.transform = 'translate(' + (i % 120) + 'px,' + (i % 90) + 'px) rotate(' + (i % 360) + 'deg)';
};
window.__firstFrameMs = firstFrameMs;
window.__ready = true;
`;

const DRIVER = `
window.__run = (n) => new Promise((resolve) => {
  const work = []; const deltas = []; let i = 0; let prev = performance.now();
  const step = (ts) => {
    deltas.push(ts - prev); prev = ts;
    const a = performance.now();
    window.__update(i);
    work.push(performance.now() - a);
    if (++i < n) requestAnimationFrame(step);
    else resolve({ work, deltas: deltas.slice(1) });
  };
  requestAnimationFrame(step);
});
`;

const q = (arr, p) => { const s = [...arr].sort((a, b) => a - b); return +s[Math.min(s.length - 1, Math.floor(s.length * p))].toFixed(2); };

async function run(label, scenario, viewport) {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const context = await browser.newContext({ viewport, deviceScaleFactor: 2 });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));

  let transferred = 0;
  const perResource = {};
  await page.route(`${ORIGIN}/**`, async (route) => {
    const p = new URL(route.request().url()).pathname;
    if (p === '/' || p === '/index.html') return route.fulfill({ status: 200, contentType: 'text/html', body: HTML });
    const file = resolveFile(p);
    if (!file || !existsSync(file)) return route.fulfill({ status: 404, body: 'x' });
    const body = await readFile(file);
    transferred += body.length;
    // três.js só conta como "peso do carro" quando é o GLB/HDR/sprite; os módulos do three
    // são contabilizados à parte porque no app real vêm do bundle.
    const bucket = p.startsWith('/three/') ? 'threeModules' : 'carAssets';
    perResource[bucket] = (perResource[bucket] ?? 0) + body.length;
    return route.fulfill({ status: 200, contentType: MIME[path.extname(file)] ?? 'application/octet-stream', body });
  });

  const cdp = await context.newCDPSession(page);
  await page.goto(`${ORIGIN}/`);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: THROTTLE });

  await page.addScriptTag({ content: DRIVER });
  await page.addScriptTag({ type: 'module', content: scenario });
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 180000 });

  const firstFrameMs = await page.evaluate(() => window.__firstFrameMs);
  const { work, deltas } = await page.evaluate((n) => window.__run(n), UPDATES);

  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 1 });
  await browser.close();

  return {
    option: label,
    viewport: `${viewport.width}x${viewport.height}`,
    cpuThrottle: THROTTLE,
    firstCarFrameMs: +firstFrameMs.toFixed(1),
    updates: UPDATES,
    workMs: { p50: q(work, 0.5), p95: q(work, 0.95), max: +Math.max(...work).toFixed(2) },
    rafDeltaMs: { p50: q(deltas, 0.5), p95: q(deltas, 0.95), max: +Math.max(...deltas).toFixed(2) },
    framesOver50ms: deltas.filter((d) => d > 50).length,
    transferredBytes: transferred,
    breakdown: perResource,
    errors,
  };
}

const viewports = [{ width: 390, height: 844 }, { width: 1440, height: 900 }];
const out = [];
for (const vp of viewports) {
  out.push(await run('a-glb', GLB_SCENARIO, vp));
  out.push(await run('b-sprites', SPRITE_SCENARIO, vp));
}
console.log(JSON.stringify(out, null, 2));
