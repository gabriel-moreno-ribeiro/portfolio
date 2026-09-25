/**
 * render-car-sprites.mjs — pré-renderiza a D-20 (`scripts/assets/d20.glb`) como uma
 * sequência de sprites WebP, um por ângulo de yaw, para a seção Experience.
 *
 * Roda o three.js dentro do Chromium do Playwright. Não sobe servidor: intercepta uma
 * origem falsa (`http://sprites.local/`) com `page.route` e serve `node_modules/three/**`
 * e o GLB direto do disco.
 *
 * Uso:
 *   node scripts/render-car-sprites.mjs --inspect   # só dumpa o grafo de cena / bbox
 *   node scripts/render-car-sprites.mjs             # renderiza os 48 frames
 *
 * Saída:
 *   public/assets/car/car-00.webp … car-47.webp
 *   src/components/Home/Experience/carSprites.ts   (manifesto: yaw, heading de tela, âncoras)
 */
import { chromium } from 'playwright';
import sharp from 'sharp';
import { readFile, writeFile, mkdir, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const ORIGIN = 'http://sprites.local';

// ── Parâmetros de render ──────────────────────────────────────────────────────
const FRAMES = 48; // 360 / 48 = 7,5° por frame
// Frame quadrado, não 320×200: o carro gira 360°, e com a câmera a 40° a extensão vertical
// projetada chega a L·cos φ·sin(40°) + H·cos(40°) ≈ 33,7 unidades (L=33,64 W=13,58 H=13,53),
// praticamente igual à horizontal máxima (hypot(L,W) = 36,3). Um frame 16:10 cortaria o carro
// quando ele aponta para cima/baixo na tela.
const CSS_W = 128;
const CSS_H = 128;
const DPR = 2;
const HALF_EXTENT = 19.5; // unidades do modelo, metade da largura/altura enquadrada
const ELEVATION_DEG = 40; // câmera elevada olhando para o centro do carro
const QUALITY = 86;

// Âncoras em coordenadas do modelo (antes do recentramento do pivô), derivadas das bboxes
// dumpadas por --inspect. O nó `roda_dianteira_direita` na verdade traz as QUATRO rodas
// (largura 12,488 centrada em x≈0; z 26,573 centrado em 1,856; altura 5,68 → raio 2,84).
// Frente = +z: a cabine (interior z≈5,12 / janelas z≈4,05) fica à frente do centro do corpo
// (z 0,704) e a roda dianteira (z≈12,3) fica adiante dela.
const WHEEL_R = 2.84;
const TRACK = 5.1; // |x| do centro de cada roda
const Z_FRONT = 12.3;
const Z_REAR = -8.6;
const MODEL_ANCHORS = {
  wheelFL: [-TRACK, WHEEL_R, Z_FRONT],
  wheelFR: [TRACK, WHEEL_R, Z_FRONT],
  wheelRL: [-TRACK, WHEEL_R, Z_REAR],
  wheelRR: [TRACK, WHEEL_R, Z_REAR],
  lampL: [-4.4, 5.6, 16.9],
  lampR: [4.4, 5.6, 16.9],
  nose: [0, 5.2, 17.4],
  tailL: [-5.2, 6.4, -15.9],
  tailR: [5.2, 6.4, -15.9],
  ground: [0, 0, 1.2],
};
const FORWARD = [0, 0, 1];

const INSPECT = process.argv.includes('--inspect');

const MIME = {
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.wasm': 'application/wasm',
  '.glb': 'model/gltf-binary',
  '.json': 'application/json',
  '.html': 'text/html',
};

const PAGE_HTML = `<!doctype html><html><head><meta charset="utf-8">
<style>html,body{margin:0;background:transparent}canvas{display:block}</style>
<script type="importmap">
{"imports":{"three":"/three/build/three.module.js","three/addons/":"/three/examples/jsm/"}}
</script></head><body></body></html>`;

// Módulo ES avaliado dentro da página: monta a cena e expõe window.__car.
const SCENE_MODULE = `
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const cfg = window.__cfg;
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(cfg.dpr);
renderer.setSize(cfg.cssW, cfg.cssH, false);
renderer.setClearAlpha(0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.25;
renderer.domElement.width = cfg.cssW * cfg.dpr;
renderer.domElement.height = cfg.cssH * cfg.dpr;
renderer.domElement.style.width = cfg.cssW + 'px';
renderer.domElement.style.height = cfg.cssH + 'px';
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture; // neutro, sem HDR

const key = new THREE.DirectionalLight(0xffffff, 2.2);
key.position.set(4, 8, 6);
scene.add(key);
const fill = new THREE.DirectionalLight(0xffffff, 0.8);
fill.position.set(-5, 3, -4);
scene.add(fill);
scene.add(new THREE.HemisphereLight(0xffffff, 0x666666, 0.5));

const draco = new DRACOLoader();
draco.setDecoderPath('/three/examples/jsm/libs/draco/');
const loader = new GLTFLoader();
loader.setDRACOLoader(draco);

const gltf = await loader.loadAsync('/model.glb');
const model = gltf.scene;

// Grafo de cena e bboxes, para inspeção.
const graph = [];
model.updateWorldMatrix(true, true);
model.traverse((o) => {
  if (!o.isMesh) { graph.push({ name: o.name, type: o.type, mesh: false }); return; }
  const b = new THREE.Box3().setFromObject(o);
  const s = new THREE.Vector3(); b.getSize(s);
  const c = new THREE.Vector3(); b.getCenter(c);
  const mats = (Array.isArray(o.material) ? o.material : [o.material]).map((m) => ({
    name: m.name, type: m.type, transparent: !!m.transparent,
    maps: Object.keys(m).filter((k) => k.endsWith('ap') && m[k] && m[k].isTexture),
  }));
  graph.push({
    name: o.name, type: o.type, mesh: true,
    tris: o.geometry.index ? o.geometry.index.count / 3 : o.geometry.attributes.position.count / 3,
    size: s.toArray().map((n) => +n.toFixed(3)),
    center: c.toArray().map((n) => +n.toFixed(3)),
    mats,
  });
});

// Pivô: recentra o modelo na origem e cria um grupo que gira em torno de Y.
const box = new THREE.Box3().setFromObject(model);
const center = new THREE.Vector3(); box.getCenter(center);
const size = new THREE.Vector3(); box.getSize(size);
model.position.sub(center);            // centro geométrico na origem
model.position.y += size.y / 2;        // chão em y = 0
const pivot = new THREE.Group();
pivot.add(model);
scene.add(pivot);

// Câmera ortográfica: projeção estável, sem distorção de perspectiva entre frames.
const radius = Math.hypot(size.x, size.z) / 2;
const elev = THREE.MathUtils.degToRad(cfg.elevationDeg);
const dist = radius * 8;
const half = cfg.halfExtent;
const camera = new THREE.OrthographicCamera(-half, half, half, -half, 0.1, dist * 4);
const target = new THREE.Vector3(0, size.y * 0.42, 0);
camera.position.set(0, target.y + Math.sin(elev) * dist, Math.cos(elev) * dist);
camera.lookAt(target);
camera.updateProjectionMatrix();

// Projeta um ponto do mundo para pixels do sprite (origem: canto superior esquerdo).
const toSprite = (v) => {
  const p = v.clone().project(camera);
  return {
    x: +(((p.x + 1) / 2) * cfg.cssW * cfg.dpr).toFixed(2),
    y: +(((1 - p.y) / 2) * cfg.cssH * cfg.dpr).toFixed(2),
  };
};

window.__car = {
  graph,
  info: {
    size: size.toArray().map((n) => +n.toFixed(3)),
    center: center.toArray().map((n) => +n.toFixed(3)),
    radius: +radius.toFixed(3),
    pxPerUnit: +((cfg.cssW * cfg.dpr) / (half * 2)).toFixed(3),
    animations: gltf.animations.map((a) => a.name),
  },
  // Renderiza um yaw e devolve o PNG (dataURL) + âncoras projetadas em px do sprite.
  // As âncoras vêm em coordenadas do MODELO, então usamos model.matrixWorld (que já inclui
  // o recentramento) em vez de pivot.matrixWorld.
  render(yawDeg, anchors) {
    pivot.rotation.y = THREE.MathUtils.degToRad(yawDeg);
    pivot.updateMatrixWorld(true);
    renderer.render(scene, camera);
    const out = {};
    const depth = [];
    for (const [k, a] of Object.entries(anchors)) {
      const v = new THREE.Vector3(a[0], a[1], a[2]).applyMatrix4(model.matrixWorld);
      out[k] = toSprite(v);
      // Profundidade em espaço de câmera: quanto maior, mais perto do observador.
      depth.push([k, -v.clone().applyMatrix4(camera.matrixWorldInverse).z]);
    }
    // As duas rodas mais próximas da câmera são as que aparecem por cima do corpo no sprite;
    // só nelas o overlay 2D de giro pode ser desenhado sem atravessar a carroceria.
    const nearWheels = depth
      .filter(([k]) => k.startsWith('wheel'))
      .sort((a, b) => a[1] - b[1])
      .slice(0, 2)
      .map(([k]) => k);
    return { png: renderer.domElement.toDataURL('image/png'), anchors: out, nearWheels };
  },
  // Direção de tela (graus, 0 = +x, cresce horário/para baixo) do eixo "frente" do carro
  // para um dado yaw. Usado para casar a tangente do path com o sprite certo.
  screenHeading(yawDeg, forward) {
    pivot.rotation.y = THREE.MathUtils.degToRad(yawDeg);
    pivot.updateMatrixWorld(true);
    const o = new THREE.Vector3(0, 0, 0).applyMatrix4(model.matrixWorld);
    const f = new THREE.Vector3(forward[0], forward[1], forward[2]).applyMatrix4(model.matrixWorld);
    const a = toSprite(o); const b = toSprite(f);
    return +((Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI).toFixed(3);
  },
};
window.__ready = true;
`;

async function serveFromDisk(route, url) {
  const rel = decodeURIComponent(new URL(url).pathname);
  let file;
  if (rel === '/' || rel === '/index.html') {
    return route.fulfill({ status: 200, contentType: 'text/html', body: PAGE_HTML });
  }
  if (rel === '/model.glb') file = path.join(ROOT, 'scripts/assets/d20.glb');
  else if (rel.startsWith('/three/')) file = path.join(ROOT, 'node_modules/three', rel.slice('/three/'.length));
  else return route.fulfill({ status: 404, body: 'not found' });

  if (!existsSync(file)) return route.fulfill({ status: 404, body: 'missing ' + file });
  const body = await readFile(file);
  return route.fulfill({
    status: 200,
    contentType: MIME[path.extname(file)] ?? 'application/octet-stream',
    headers: { 'access-control-allow-origin': '*' },
    body,
  });
}

async function main() {
  const browser = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  const page = await browser.newPage({ viewport: { width: 800, height: 600 } });
  page.on('console', (m) => { if (m.type() === 'error') console.error('[page]', m.text()); });
  page.on('pageerror', (e) => console.error('[pageerror]', e.message));
  await page.route(`${ORIGIN}/**`, (route) => serveFromDisk(route, route.request().url()));

  await page.goto(`${ORIGIN}/`);
  await page.evaluate((cfg) => { window.__cfg = cfg; }, {
    cssW: CSS_W, cssH: CSS_H, dpr: DPR, elevationDeg: ELEVATION_DEG, halfExtent: HALF_EXTENT,
  });
  await page.addScriptTag({ type: 'module', content: SCENE_MODULE });
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });

  const info = await page.evaluate(() => window.__car.info);
  const graph = await page.evaluate(() => window.__car.graph);

  if (INSPECT) {
    console.log(JSON.stringify({ info, graph }, null, 2));
    await browser.close();
    return;
  }

  const outDir = path.join(ROOT, 'public/assets/car');
  await mkdir(outDir, { recursive: true });
  await mkdir(path.join(ROOT, 'src/components/Home/Experience'), { recursive: true });

  const frames = [];
  for (let i = 0; i < FRAMES; i++) {
    const yaw = (360 / FRAMES) * i;
    const { png, anchors, nearWheels } = await page.evaluate(
      ([y, a]) => window.__car.render(y, a),
      [yaw, MODEL_ANCHORS],
    );
    const heading = await page.evaluate(
      ([y, f]) => window.__car.screenHeading(y, f),
      [yaw, FORWARD],
    );
    const buf = Buffer.from(png.split(',')[1], 'base64');
    const name = `car-${String(i).padStart(2, '0')}.webp`;
    await sharp(buf).webp({ quality: QUALITY, alphaQuality: 90, effort: 6 }).toFile(path.join(outDir, name));
    frames.push({ file: name, yaw: +yaw.toFixed(2), heading, anchors, nearWheels });
    process.stdout.write(`\r${i + 1}/${FRAMES}`);
  }
  process.stdout.write('\n');

  const files = await readdir(outDir);
  let total = 0;
  for (const f of files) if (f.endsWith('.webp')) total += (await stat(path.join(outDir, f))).size;

  const manifest = {
    frameWidth: CSS_W * DPR,
    frameHeight: CSS_H * DPR,
    elevationDeg: ELEVATION_DEG,
    pxPerUnit: info.pxPerUnit,
    frames,
  };
  await writeFile(
    path.join(ROOT, 'src/components/Home/Experience/carSprites.ts'),
    `// GERADO por scripts/render-car-sprites.mjs. Não editar à mão.\n` +
      `// ${FRAMES} yaws da D-20 (scripts/assets/d20.glb), câmera ortográfica elevada ${ELEVATION_DEG}°.\n` +
      `// \`heading\` = direção de tela (graus, 0 = +x, horário) do eixo frontal do carro naquele yaw:\n` +
      `// o componente escolhe o frame cujo \`heading\` está mais perto da tangente do path.\n` +
      `// Âncoras em pixels do sprite (origem: canto superior esquerdo do frame).\n` +
      `export const CAR_SPRITES = ${JSON.stringify(manifest)} as const;\n` +
      `export type CarFrame = (typeof CAR_SPRITES)['frames'][number];\n`,
    'utf8',
  );

  console.log(JSON.stringify({ info, totalBytes: total, totalKB: Math.round(total / 1024), frames: FRAMES }, null, 2));
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
