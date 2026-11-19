// The laptop-repair models, in clay: the laptop (a base with thickness, a keyboard deck, a hinged lid
// with a bezel and a recessed screen), the carton, the terminal, the phone in its hand and the clay
// map of Brazil. Each model is a few merged meshes (see "Lumps"), not one mesh per box.
import { Html, Line } from '@react-three/drei';
import { useFrame, type ThreeElements } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { MAP_H, MAP_W, SALVADOR, STATES } from './brazilMap';
import { Act, ageOf, at, bump, clamp01, ease, pop, Puck, puckGeometry, settle, shown, slice, spring, useClay, type Mats, type Play, type V3 } from './kit';
import { TagMark } from './TagMark';

const HALF_PI = Math.PI / 2;
const lerp = THREE.MathUtils.lerp;

// ── Lumps ───────────────────────────────────────────────────────────────────
// Every mesh is drawn again in each pass of a frame (colour, occlusion, shadow, contact shadow), so a
// model made of one mesh per box costs four or five draw calls per box. A model that does not move
// inside itself is therefore ONE mesh: its pieces are merged once, the first time it is drawn, and the
// tone of each piece is painted into its vertices. Small and flat pieces are plain boxes (nobody sees
// their edges); only the big ones are rounded, with few segments.
export type Tone = 'clay' | 'accent' | 'mid' | 'board' | 'dark' | 'kraft' | 'desk';
/** The one material of every lump: the colour is in the vertices. */
export const PAINT = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 });
// Cardboard is the tone this story adds to the clay; the desk is a shade of the clay itself.
const KRAFT = [new THREE.Color('#dcb886'), new THREE.Color('#a9865c')];
function toneColor(mats: Mats, dark: boolean, t: Tone, out: THREE.Color) {
  if (t === 'kraft') return out.copy(KRAFT[dark ? 1 : 0]);
  if (t === 'desk') return out.copy(mats.clay.color).multiplyScalar(dark ? 0.74 : 0.86);
  return out.copy(t === 'clay' ? mats.clay.color : t === 'accent' ? mats.accent.color : mats.shade[t].color);
}
function paint(geo: THREE.BufferGeometry, c: THREE.Color) {
  const n = geo.attributes.position.count;
  const a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) a.set([c.r, c.g, c.b], i * 3);
  geo.setAttribute('color', new THREE.BufferAttribute(a, 3));
  return geo;
}
export interface Piece { geo: THREE.BufferGeometry; tone: Tone; p?: V3; r?: V3 }
interface Opt { tone?: Tone; rot?: V3; r?: number }
const rounded = ([w, h, d]: V3, r: number) => new RoundedBoxGeometry(w, h, d, 2, Math.min(r, Math.min(w, h, d) / 2 - 0.001));
/** A box, at `p`. With `r` it is rounded; without, plain. */
export const box = (size: V3, p?: V3, { tone = 'clay', rot, r }: Opt = {}): Piece => ({ geo: r ? rounded(size, r) : new THREE.BoxGeometry(...size).toNonIndexed(), tone, p, r: rot });
/** A cylinder with rounded rims, axis along Y (the kit's puck), at `p`. */
export const puck = (r: number, h: number, p?: V3, { tone = 'clay', rot, bevel, segments, hole }: Opt & { bevel?: number; segments?: number; hole?: number } = {}): Piece => ({
  geo: puckGeometry(r, h, bevel, segments, hole).toNonIndexed(),
  tone,
  p,
  r: rot,
});
/** A plain cylinder, axis along Y: for small things, where a puck's rounded rims would not be seen. */
export const cyl = (r: number, h: number, p?: V3, { tone = 'clay', rot, segments = 8 }: Opt & { segments?: number } = {}): Piece => ({ geo: new THREE.CylinderGeometry(r, r, h, segments).toNonIndexed(), tone, p, r: rot });
/** A round rod along a path. */
export const rod = (path: THREE.Curve<THREE.Vector3>, r: number, segments: number, tone: Tone = 'clay'): Piece => ({ geo: new THREE.TubeGeometry(path, segments, r, 6).toNonIndexed(), tone });
const lumps = new Map<string, THREE.BufferGeometry>();
/** The pieces merged into one painted geometry. Cached by name and theme (the tones differ between themes). */
export function lump(id: string, pieces: () => Piece[], mats: Mats, dark: boolean) {
  const key = `${id}/${dark ? 1 : 0}`;
  let out = lumps.get(key);
  if (out) return out;
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const v = new THREE.Vector3();
  const one = new THREE.Vector3(1, 1, 1);
  const c = new THREE.Color();
  const list = pieces().map(({ geo, tone, p, r }) => {
    if (p || r) geo.applyMatrix4(m.compose(v.set(p?.[0] ?? 0, p?.[1] ?? 0, p?.[2] ?? 0), q.setFromEuler(e.set(r?.[0] ?? 0, r?.[1] ?? 0, r?.[2] ?? 0)), one));
    return paint(geo, toneColor(mats, dark, tone, c));
  });
  out = mergeGeometries(list)!;
  list.forEach((g) => g.dispose());
  lumps.set(key, out);
  return out;
}
/** A model in one mesh. `id` names it: its pieces are merged once per page and theme. */
export function Lump({ id, pieces }: { id: string; pieces: () => Piece[] }) {
  const { mats, dark } = useClay();
  return <mesh geometry={lump(id, pieces, mats, dark)} material={PAINT} castShadow receiveShadow />;
}
// A single box that moves on its own (a flap, a line of code, a thumb): cheap like the pieces of a lump.
export function Bx({ size, r, tone = 'clay', ...props }: { size: V3; r?: number; tone?: Tone } & Omit<ThreeElements['mesh'], 'args' | 'ref'>) {
  const { mats, dark } = useClay();
  return <mesh geometry={lump(`bx:${size},${r},${tone}`, () => [box(size, undefined, { r, tone })], mats, dark)} material={PAINT} castShadow receiveShadow {...props} />;
}

// ── Screens ─────────────────────────────────────────────────────────────────
// What a screen can show, tone on tone like the rest of the clay. Drawn once per page.
export const SCREEN = { off: 0, on: 1, hindi: 2, portuguese: 3, sad: 4, viewfinder: 5, flash: 6, waiting: 7, terminal: 8 } as const;
// The subtitle of the tutorial ("hey guys", the owner's wording), and the same in Portuguese.
const HINDI = 'अरे दोस्तों';
const PORTUGUESE = 'Olá, pessoal';
const DEVANAGARI = '"Kohinoor Devanagari", "Devanagari Sangam MN", "Nirmala UI", "Noto Sans Devanagari", Mangal, sans-serif';
const LATIN = 'ui-sans-serif, system-ui, "Helvetica Neue", Arial, sans-serif';
/** Whether this machine has letters for Hindi: without them the subtitle is drawn as strokes instead of boxes. */
let hindiOk: boolean | undefined;
function canWriteHindi(g: CanvasRenderingContext2D) {
  if (hindiOk === undefined) {
    g.font = `600 20px ${DEVANAGARI}`;
    hindiOk = g.measureText('न').width !== g.measureText('\uE000').width;
  }
  return hindiOk;
}
/** One line of subtitle centred on (x, y), `px` high: the Hindi one, or the Portuguese one. */
function subtitle(g: CanvasRenderingContext2D, portuguese: boolean, x: number, y: number, px: number, ink: string) {
  g.fillStyle = ink;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  if (portuguese || canWriteHindi(g)) {
    g.font = `600 ${px}px ${portuguese ? LATIN : DEVANAGARI}`;
    return void g.fillText(portuguese ? PORTUGUESE : HINDI, x, y + (portuguese ? 0 : px * 0.06));
  }
  // No letters for it: a line across the top, strokes hanging from it.
  const k = px / 20;
  for (const [dx, w] of [[-94, 54], [-32, 40], [16, 76]]) {
    g.fillRect(x + dx * k, y - 8 * k, w * k, 3 * k);
    for (let i = 4; i < w - 4; i += 9) g.fillRect(x + (dx + i) * k, y - 8 * k, 3 * k, (8 + ((i * 7) % 9)) * k);
  }
}
let chips: THREE.CanvasTexture[] | undefined;
/** The subtitle on its own, to stick on the chip that flies to the script and back: [Hindi, Portuguese]. */
function chipTextures() {
  return (chips ??= [false, true].map((portuguese) => {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 128;
    subtitle(c.getContext('2d')!, portuguese, 256, 64, 62, portuguese ? '#fffaf5' : '#5f564e');
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }));
}
/** A line of subtitle in the air: a clay chip with the Hindi words, or an orange one with the Portuguese. */
export function SubtitleChip({ portuguese }: { portuguese?: boolean }) {
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ map: chipTextures()[portuguese ? 1 : 0], transparent: true, depthWrite: false }), [portuguese]);
  useEffect(() => () => mat.dispose(), [mat]);
  return (
    <group>
      <Bx tone={portuguese ? 'accent' : 'clay'} size={[0.78, 0.22, 0.04]} r={0.018} />
      <mesh position={[0, 0, 0.0215]} material={mat} userData={OVERLAY}>
        <planeGeometry args={[0.72, 0.18]} />
      </mesh>
    </group>
  );
}
const OVERLAY = { overlay: true };

let screens: THREE.CanvasTexture[] | undefined;
function screenTextures() {
  if (screens) return screens;
  const draw = (w: number, h: number, paint: (g: CanvasRenderingContext2D) => void) => {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    paint(c.getContext('2d')!);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  };
  const rect = (g: CanvasRenderingContext2D, fill: string, x: number, y: number, w: number, h: number, r = 6) => {
    g.fillStyle = fill;
    g.beginPath();
    g.roundRect(x, y, w, h, r);
    g.fill();
  };
  // A face, as old computers had: glad (eyes shut in a smile) or sad (crossed eyes, mouth down).
  const face = (g: CanvasRenderingContext2D, glad: boolean) => {
    g.strokeStyle = '#8f857b';
    g.lineWidth = 9;
    g.lineCap = 'round';
    for (const x of [116, 204]) {
      g.beginPath();
      if (glad) g.arc(x, 82, 15, Math.PI * 1.1, Math.PI * 1.9);
      else {
        g.moveTo(x - 12, 62);
        g.lineTo(x + 12, 86);
        g.moveTo(x + 12, 62);
        g.lineTo(x - 12, 86);
      }
      g.stroke();
    }
    g.beginPath();
    if (glad) g.arc(160, 98, 40, Math.PI * 0.18, Math.PI * 0.82);
    else g.arc(160, 158, 36, Math.PI * 1.22, Math.PI * 1.78);
    g.stroke();
  };
  // A tutorial video: the frame, a laptop in it, the progress bar and a subtitle line. Twice the size of the others: it has words to read.
  const video = (portuguese: boolean) =>
    draw(640, 400, (g) => {
      g.scale(2, 2);
      g.fillStyle = '#d7d0c8';
      g.fillRect(0, 0, 320, 200);
      rect(g, '#c4bcb3', 18, 14, 284, 150);
      g.strokeStyle = '#ada399';
      g.lineWidth = 5;
      g.strokeRect(124, 44, 120, 58);
      g.beginPath();
      g.moveTo(112, 110);
      g.lineTo(256, 110);
      g.stroke();
      // Whoever made the tutorial, talking to the camera beside the laptop.
      rect(g, '#8f857b', 34, 76, 56, 44, 16);
      g.fillStyle = '#ece7e1';
      g.beginPath();
      g.arc(62, 58, 19, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#5f564e';
      g.beginPath();
      g.arc(62, 54, 19, Math.PI, Math.PI * 2);
      g.fill();
      g.fillRect(54, 58, 4, 5);
      g.fillRect(66, 58, 4, 5);
      g.strokeStyle = '#5f564e';
      g.lineWidth = 2.5;
      g.beginPath();
      g.arc(62, 63, 7, Math.PI * 0.2, Math.PI * 0.8);
      g.stroke();
      // The player: play mark, progress, time.
      g.fillStyle = '#8f857b';
      g.beginPath();
      g.moveTo(20, 168);
      g.lineTo(20, 182);
      g.lineTo(31, 175);
      g.fill();
      rect(g, '#b3aaa0', 38, 172, 226, 6, 3);
      rect(g, '#f0732d', 38, 172, 120, 6, 3);
      rect(g, '#8f857b', 272, 171, 28, 8, 3);
      rect(g, '#faf8f5', 44, 118, 232, 38, 7);
      subtitle(g, portuguese, 160, 137, 23, '#5f564e');
      // The dub: the sound, in orange.
      if (portuguese) [10, 18, 26, 14, 8].forEach((h, i) => rect(g, '#f0732d', 262 + i * 7, 40 - h / 2, 4, h, 2));
    });
  screens = [
    // Off: a dead screen with one streak of reflection.
    draw(320, 200, (g) => {
      g.fillStyle = '#c9c2ba';
      g.fillRect(0, 0, 320, 200);
      g.fillStyle = 'rgba(255,255,255,0.2)';
      g.beginPath();
      g.moveTo(60, 0);
      g.lineTo(130, 0);
      g.lineTo(40, 200);
      g.lineTo(-30, 200);
      g.fill();
    }),
    // On: it works again, and it is glad to. A desktop bar under a face.
    draw(320, 200, (g) => {
      g.fillStyle = '#f1ece6';
      g.fillRect(0, 0, 320, 200);
      rect(g, '#d6cfc7', 0, 180, 320, 20, 0);
      g.fillStyle = '#f0732d';
      g.beginPath();
      g.arc(16, 190, 6, 0, Math.PI * 2);
      g.fill();
      face(g, true);
    }),
    // The tutorial with its Hindi subtitle, and the same with the Portuguese one and the dub.
    video(false),
    video(true),
    // Broken: it tries to start and can only pull a face.
    draw(320, 200, (g) => {
      g.fillStyle = '#d2cbc3';
      g.fillRect(0, 0, 320, 200);
      face(g, false);
    }),
    // The phone's camera, pointed at the problem: the broken fan, cracked.
    draw(160, 290, (g) => {
      g.fillStyle = '#d9d3cc';
      g.fillRect(0, 0, 160, 290);
      g.strokeStyle = '#f0732d';
      g.lineWidth = 12;
      g.beginPath();
      g.arc(80, 148, 40, 0, Math.PI * 2);
      g.stroke();
      g.fillStyle = '#b3aaa0';
      g.beginPath();
      g.arc(80, 148, 12, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = '#b3aaa0';
      g.lineWidth = 7;
      for (let i = 0; i < 5; i++) {
        const a = (i / 7) * Math.PI * 2;
        g.beginPath();
        g.moveTo(80 + Math.cos(a) * 14, 148 + Math.sin(a) * 14);
        g.lineTo(80 + Math.cos(a + 0.4) * 30, 148 + Math.sin(a + 0.4) * 30);
        g.stroke();
      }
      g.strokeStyle = '#3a2f28';
      g.lineWidth = 2.5;
      g.beginPath();
      [[44, 128], [62, 140], [56, 152], [78, 160], [92, 156], [114, 170]].forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
      g.stroke();
      g.strokeStyle = '#8f857b';
      g.lineWidth = 4;
      g.lineCap = 'round';
      for (const [x, y, dx, dy] of [[18, 92, 1, 1], [142, 92, -1, 1], [18, 202, 1, -1], [142, 202, -1, -1]]) {
        g.beginPath();
        g.moveTo(x, y + dy * 18);
        g.lineTo(x, y);
        g.lineTo(x + dx * 18, y);
        g.stroke();
      }
      g.fillStyle = '#faf8f5';
      g.beginPath();
      g.arc(80, 256, 15, 0, Math.PI * 2);
      g.fill();
    }),
    // The flash.
    draw(16, 16, (g) => {
      g.fillStyle = '#ffffff';
      g.fillRect(0, 0, 16, 16);
    }),
    // Waiting for the answer.
    draw(160, 290, (g) => {
      g.fillStyle = '#ece7e1';
      g.fillRect(0, 0, 160, 290);
      g.fillStyle = '#b3aaa0';
      for (const x of [56, 80, 104]) {
        g.beginPath();
        g.arc(x, 145, 7, 0, Math.PI * 2);
        g.fill();
      }
    }),
    // The terminal's screen.
    draw(16, 16, (g) => {
      g.fillStyle = '#cfc8c0';
      g.fillRect(0, 0, 16, 16);
    }),
  ];
  return screens;
}

/** A screen material that follows the theme. `pick` chooses the picture and `glow` how lit it is; only a change touches the material. */
function useScreen(pick: (p: Play) => number, glow?: (p: Play) => number) {
  const { play, mats } = useClay();
  const mat = useMemo(() => {
    const tex = screenTextures();
    return new THREE.MeshStandardMaterial({ map: tex[0], emissiveMap: tex[0], emissive: '#ffffff', emissiveIntensity: 0.14, color: mats.clay.color, roughness: 0.5 });
  }, [mats]);
  useEffect(() => () => mat.dispose(), [mat]);
  useFrame(() => {
    const t = screenTextures()[pick(play)];
    if (mat.map !== t) mat.map = mat.emissiveMap = t;
    if (glow) mat.emissiveIntensity = 0.14 + glow(play);
  });
  return mat;
}

/** A label like the kit's, shown while `on(p)` is above zero. Its text can change (`text`), so a counter can tick. */
export function LiveTag({ at: anchor, dx, dy, on, text, children }: { at: V3; dx: number; dy: number; on: (p: Play) => number; text?: (p: Play) => string; children: string }) {
  const { play } = useClay();
  const ref = useRef<HTMLDivElement>(null);
  useFrame(() => {
    const el = ref.current;
    if (!el) return;
    el.style.opacity = on(play).toFixed(3);
    const span = el.querySelector('span');
    const t = text?.(play);
    if (span && t && span.textContent !== t) span.textContent = t;
  });
  return (
    <Html position={anchor} zIndexRange={[4, 0]} wrapperClass="clay-html" style={{ pointerEvents: 'none' }}>
      <div ref={ref} className="clay-tag" style={{ opacity: 0 }} data-dx={dx} data-dy={dy}>
        <TagMark dx={dx} dy={dy}>{children}</TagMark>
      </div>
    </Html>
  );
}
/** `shown` of the kit, for a LiveTag. */
export const showOn = (steps: number[], after = 0) => (p: Play) => shown(p, steps, after);

// ── The laptop ──────────────────────────────────────────────────────────────
// Origin at the bottom centre, front edge towards +Z. The base is 2.4 x 1.6: a bottom cover held
// by eight screws, the walls, the keyboard deck. The screen (the lid with its hinge) is held by two
// screws on the deck and comes off whole. For the repair the base turns upside down.
export const W = 2.4;
export const D = 1.6;
const DECK = 0.21; // top of the keyboard deck
export const HB = 0.235; // the base's height, keys included: upside down it rests on them
const PIVOT: V3 = [0, 0.255, -0.79]; // the hinge
export const OPEN = 1.88; // radians: how far the lid stands open
const KEYS_X = 13;
const KEYS_Z = 4;
/** The cover's screws, in the base's own space (heads on the underside): along the back, then back along the front, the way the screwdriver goes (it ends at the front right of the upturned base, by its place on the mat). */
export const COVER_SCREWS: V3[] = [-1.08, -0.42, 0.42, 1.08].map((x): V3 => [x, 0.004, -0.7]).concat([1.08, 0.42, -0.42, -1.08].map((x): V3 => [x, 0.004, 0.7]));
/** The screws that hold the screen, on the deck behind the keys (the head's centre). */
export const HINGE_SCREWS: V3[] = [[-0.98, 0.221, -0.715], [0.98, 0.221, -0.715]];
/** Where the screen lies while it is off, screen up (its hinge, in the laptop's space at the bench). */
export const DISPLAY_ASIDE: V3 = [-0.7, 0.06, -1.2];
/** Where a point on the screen is (x across, z from the hinge, 0.21 to 1.39), in the laptop's own space, lid open. */
export const onScreen = (x: number, z: number): V3 => [x, PIVOT[1] + z * Math.sin(OPEN), PIVOT[2] + z * Math.cos(OPEN)];
const smooth = (u: number) => u * u * (3 - 2 * u);

function Keyboard() {
  const { mats } = useClay();
  const geo = useMemo(() => new RoundedBoxGeometry(0.13, 0.025, 0.125, 1, 0.01), []);
  useEffect(() => () => geo.dispose(), [geo]);
  // Static: laid out once, when the mesh exists.
  const lay = (m: THREE.InstancedMesh | null) => {
    if (!m) return;
    const o = new THREE.Object3D();
    for (let i = 0; i < KEYS_X * KEYS_Z; i++) {
      o.position.set(-0.96 + (i % KEYS_X) * 0.16 + (Math.floor(i / KEYS_X) % 2) * 0.04, DECK + 0.0125, -0.6 + Math.floor(i / KEYS_X) * 0.155);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  };
  return <instancedMesh ref={lay} args={[geo, mats.shade.dark, KEYS_X * KEYS_Z]} castShadow receiveShadow />;
}

// A screw, head up: the head with its cross, the thread under it. Origin at the head's centre.
const screwPieces = (): Piece[] => [
  cyl(0.045, 0.016, undefined, { segments: 10, tone: 'mid' }),
  cyl(0.013, 0.07, [0, -0.042, 0], { segments: 6, tone: 'mid' }),
  box([0.05, 0.006, 0.01], [0, 0.007, 0], { tone: 'dark' }),
  box([0.01, 0.006, 0.05], [0, 0.007, 0], { tone: 'dark' }),
];
/**
 * `n` screws in one mesh, however many there are. `place(k, o, p)` puts screw `k` (position,
 * rotation, scale on `o`) and says whether it is there at all.
 */
export function Screws({ n, place }: { n: number; place: (k: number, o: THREE.Object3D, p: Play) => boolean }) {
  const { play, mats, dark } = useClay();
  const ref = useRef<THREE.InstancedMesh>(null);
  const o = useMemo(() => new THREE.Object3D(), []);
  useFrame(() => {
    const a = ref.current;
    if (!a) return;
    let any = false;
    for (let k = 0; k < n; k++) {
      o.position.set(0, 0, 0);
      o.rotation.set(0, 0, 0);
      o.scale.setScalar(1);
      const there = place(k, o, play);
      if (!there) o.scale.setScalar(0);
      any ||= there;
      o.updateMatrix();
      a.setMatrixAt(k, o.matrix);
    }
    a.visible = any;
    if (any) a.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[lump('screw', screwPieces, mats, dark), PAINT, n]} castShadow receiveShadow frustumCulled={false} />;
}

// An empty screw hole: a dark dot, hidden under the screw's head until the screw is out.
const HOLE = new THREE.CylinderGeometry(0.027, 0.027, 0.004, 12);
function Holes({ at }: { at: V3[] }) {
  const { mats } = useClay();
  const lay = (m: THREE.InstancedMesh | null) => {
    if (!m) return;
    const o = new THREE.Object3D();
    at.forEach((p, k) => {
      o.position.set(p[0], p[1], p[2]);
      o.updateMatrix();
      m.setMatrixAt(k, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  };
  return <instancedMesh ref={lay} args={[HOLE, mats.shade.dark, at.length]} />;
}
const COVER_HOLES = COVER_SCREWS.map(([x, , z]): V3 => [x, -0.0005, z]);
const HINGE_HOLES = HINGE_SCREWS.map(([x, , z]): V3 => [x, DECK + 0.0065, z]);

/** The bottom cover, in the base's space: a plate with vents, four feet and its eight screw holes. */
const coverPieces = (): Piece[] => [
  box([W, 0.035, D], [0, 0.0175, 0], { r: 0.03 }),
  ...[-0.3, -0.15, 0, 0.15, 0.3].map((z) => box([0.9, 0.006, 0.05], [0.3, 0.001, z - 0.25], { tone: 'board' })),
  ...[-0.95, 0.95].flatMap((x) => [-0.5, 0.5].map((z) => box([0.2, 0.01, 0.08], [x, -0.001, z], { tone: 'dark' }))),
  // The label with the model and serial number
  box([0.5, 0.004, 0.3], [-0.55, 0, 0.3], { tone: 'mid' }),
  ...[0, 1, 2].map((i) => box([0.36 - i * 0.08, 0.004, 0.03], [-0.55 + i * 0.04, -0.002, 0.22 + i * 0.07], { tone: 'dark' })),
];
export function Cover() {
  return (
    <group>
      <Lump id="cover" pieces={coverPieces} />
      <Holes at={COVER_HOLES} />
    </group>
  );
}

/** The screen: the lid with its bezel and the screen set back inside it, the hinge and the camera. Origin at the hinge. */
const displayPieces = (): Piece[] => [
  puck(0.045, 1.7, [0, 0, 0.02], { segments: 14, rot: [0, 0, HALF_PI], tone: 'dark' }),
  box([W, 0.055, D - 0.02], [0, 0.0275, 0.79], { r: 0.03 }),
  box([W - 0.08, 0.012, 0.16], [0, -0.006, 1.49], { tone: 'dark' }),
  box([W - 0.08, 0.012, 0.18], [0, -0.006, 0.12], { tone: 'dark' }),
  box([0.16, 0.012, 1.18], [1.07, -0.006, 0.8], { tone: 'dark' }),
  box([0.16, 0.012, 1.18], [-1.07, -0.006, 0.8], { tone: 'dark' }),
  cyl(0.02, 0.004, [0, -0.0125, 1.49], { segments: 10, tone: 'mid' }),
  // A sticker on the lid, as every laptop that has been somewhere has
  box([0.34, 0.004, 0.34], [0.7, 0.056, 1.15], { tone: 'accent' }),
  box([0.5, 0.004, 0.16], [-0.6, 0.056, 0.5], { tone: 'mid' }),
];
function Display({ mat }: { mat: THREE.Material }) {
  return (
    <>
      <Lump id="display" pieces={displayPieces} />
      <mesh position={[0, -0.001, 0.8]} rotation={[HALF_PI, 0, 0]} material={mat}>
        <planeGeometry args={[1.98, 1.18]} />
      </mesh>
    </>
  );
}

const PORTS: [number, number, number][] = [[-1, -0.42, 0.16], [-1, -0.18, 0.16], [-1, 0.1, 0.24], [1, -0.4, 0.2], [1, -0.1, 0.1]];
/** The base without its bottom cover: the walls, the deck and everything on it. Origin at the bottom centre, right way up. */
const shellPieces = (): Piece[] => [
  // The walls, the deck, the space bar
  box([W, 0.14, 0.05], [0, 0.105, D / 2 - 0.025], { r: 0.02 }),
  box([W, 0.14, 0.05], [0, 0.105, -D / 2 + 0.025], { r: 0.02 }),
  box([0.05, 0.14, D - 0.1], [W / 2 - 0.025, 0.105, 0], { r: 0.02 }),
  box([0.05, 0.14, D - 0.1], [-W / 2 + 0.025, 0.105, 0], { r: 0.02 }),
  box([W, 0.04, D], [0, DECK - 0.02, 0], { r: 0.02 }),
  box([0.8, 0.025, 0.12], [0.02, DECK + 0.0125, 0.03], { r: 0.01, tone: 'dark' }),
  // The trackpad and its button line; two stickers on the palm rest; the status lights; the ports on
  // the sides; the notch that opens the lid; the hinge tabs
  box([0.74, 0.012, 0.42], [0, DECK + 0.004, 0.5], { tone: 'mid' }),
  box([0.66, 0.004, 0.012], [0, DECK + 0.0095, 0.62], { tone: 'dark' }),
  box([0.2, 0.004, 0.14], [0.86, DECK + 0.002, 0.56], { tone: 'accent' }),
  box([0.14, 0.004, 0.14], [0.62, DECK + 0.002, 0.56], { tone: 'dark' }),
  box([0.05, 0.02, 0.012], [-0.95, 0.165, D / 2 + 0.001], { tone: 'accent' }),
  box([0.05, 0.02, 0.012], [-0.85, 0.165, D / 2 + 0.001], { tone: 'dark' }),
  ...PORTS.map(([side, z, w]) => box([0.012, 0.042, w], [side * (W / 2 + 0.001), 0.1, z], { tone: 'dark' })),
  box([0.46, 0.022, 0.012], [0, 0.165, D / 2 + 0.001], { tone: 'mid' }),
  ...HINGE_SCREWS.map(([x, , z]) => box([0.2, 0.008, 0.11], [x, DECK + 0.002, z])),
];
function Shell() {
  return (
    <>
      <Lump id="shell" pieces={shellPieces} />
      <Keyboard />
      <Holes at={HINGE_HOLES} />
    </>
  );
}
/**
 * The laptop. `lid`: how open (0..1 of OPEN). `screen`: which picture. `flip`: 0 upright, 1 upside
 * down. `detached`: 0 the screen is on its hinge, 1 it lies aside. `cover` and `screw`: how far the
 * cover and each screw are out (above 0, the bench's loose copy takes over).
 */
export function Laptop({ lid, screen, glow, flip, detached, cover, screw, hinge }: {
  lid: (p: Play) => number;
  screen: (p: Play) => number;
  glow?: (p: Play) => number;
  flip: (p: Play) => number;
  detached: (p: Play) => number;
  cover: (p: Play) => number;
  screw: (p: Play, k: number) => number;
  hinge: (p: Play, k: number) => number;
}) {
  const mat = useScreen(screen, glow);
  const shell = useRef<THREE.Group>(null);
  return (
    <group>
      <Act
        f={(g, p) => {
          const f = flip(p);
          // Turned over in the air, high enough that its corners clear the mat. It rocks back before
          // it goes, and comes down a little past flat.
          g.position.set(0, HB / 2 + Math.sin(f * Math.PI) * 1.2, 0);
          g.rotation.set(0, 0, Math.PI * settle(f, 1.4) - 0.16 * bump(slice(f, 0, 0.3)));
          if (shell.current) shell.current.visible = cover(p) <= 0;
        }}
      >
        <group position={[0, -HB / 2, 0]}>
          <group ref={shell}>
            <Cover />
          </group>
          {/* The cover's screws, heads down, each there until it is taken out */}
          <Screws
            n={COVER_SCREWS.length}
            place={(k, o, p) => {
              o.position.set(COVER_SCREWS[k][0], COVER_SCREWS[k][1], COVER_SCREWS[k][2]);
              o.rotation.x = Math.PI;
              return screw(p, k) <= 0;
            }}
          />
          <Shell />
        </group>
      </Act>
      <Screws
        n={HINGE_SCREWS.length}
        place={(k, o, p) => {
          o.position.set(HINGE_SCREWS[k][0], HINGE_SCREWS[k][1], HINGE_SCREWS[k][2]);
          return hinge(p, k) <= 0;
        }}
      />
      {/* The screen: on its hinge, or pulled up out of it with a wiggle, carried over and laid down, screen up */}
      <Act
        f={(g, p) => {
          const d = detached(p);
          if (d <= 0) {
            g.position.set(PIVOT[0], PIVOT[1], PIVOT[2]);
            g.rotation.set(-OPEN * lid(p), 0, 0);
            return;
          }
          const u = slice(d, 0.22, 0.86);
          const e = smooth(u);
          const pull = ease(slice(d, 0, 0.26)) * 0.18 * (1 - e);
          g.position.set(
            lerp(PIVOT[0], DISPLAY_ASIDE[0], e),
            lerp(PIVOT[1], DISPLAY_ASIDE[1], e) + Math.sin(u * Math.PI) * 0.5 + pull * Math.sin(OPEN),
            lerp(PIVOT[2], DISPLAY_ASIDE[2], e) + pull * Math.cos(OPEN),
          );
          // Its far edge lands last, and bounces once.
          g.rotation.set(lerp(-OPEN, -Math.PI, smooth(slice(d, 0.3, 0.88))) + 0.08 * bump(slice(d, 0.88, 1)), 0.07 * Math.sin(slice(d, 0, 0.3) * Math.PI * 3) * (1 - slice(d, 0, 0.3)), 0);
        }}
      >
        <Display mat={mat} />
      </Act>
    </group>
  );
}

// ── The carton ──────────────────────────────────────────────────────────────
// Origin at the bottom centre. 2.9 x 1 x 2. The flaps open one by one; the long ones carry the tape.
export const CARTON: V3 = [2.9, 1, 2];
const [CW, CH, CD] = CARTON;
const cartonPieces = (): Piece[] => [
  box([CW, 0.06, CD], [0, 0.03, 0], { r: 0.02, tone: 'kraft' }),
  box([CW, CH, 0.06], [0, CH / 2, CD / 2 - 0.03], { r: 0.02, tone: 'kraft' }),
  box([CW, CH, 0.06], [0, CH / 2, -CD / 2 + 0.03], { r: 0.02, tone: 'kraft' }),
  box([0.06, CH, CD - 0.12], [CW / 2 - 0.03, CH / 2, 0], { r: 0.02, tone: 'kraft' }),
  box([0.06, CH, CD - 0.12], [-CW / 2 + 0.03, CH / 2, 0], { r: 0.02, tone: 'kraft' }),
  // The shipping label: the address, a bar code
  box([0.86, 0.56, 0.02], [0.85, 0.52, CD / 2 + 0.005]),
  ...[0, 1, 2].map((i) => box([0.6 - i * 0.14, 0.04, 0.016], [0.8 - i * 0.07, 0.7 - i * 0.09, CD / 2 + 0.012], { tone: 'dark' })),
  ...[0, 1, 2, 3, 4, 5, 6, 7].map((i) => box([i % 3 ? 0.022 : 0.04, 0.13, 0.016], [0.56 + i * 0.075, 0.37, CD / 2 + 0.012], { tone: 'dark' })),
  // "This side up", twice, and the tape that goes down the front
  ...[-0.95, -0.6].flatMap((x) => [box([0.05, 0.3, 0.016], [x, 0.36, CD / 2 + 0.006], { tone: 'dark' }), box([0.16, 0.05, 0.016], [x, 0.5, CD / 2 + 0.006], { tone: 'dark', rot: [0, 0, 0.78] }), box([0.16, 0.05, 0.016], [x, 0.5, CD / 2 + 0.006], { tone: 'dark', rot: [0, 0, -0.78] })]),
  box([0.34, 0.26, 0.012], [0, CH - 0.13, CD / 2 + 0.004], { tone: 'accent' }),
];
// A long flap: the board and half of the tape.
const flapPieces = (z: number) => (): Piece[] => [box([CW - 0.04, 0.04, CD / 2], [0, 0.02, z], { r: 0.015, tone: 'kraft' }), box([0.34, 0.012, CD / 2 - 0.01], [0, 0.046, z], { tone: 'accent' })];
export function Carton({ flap }: { flap: (p: Play, k: number) => number }) {
  const hinge = (k: number, axis: 'x' | 'z', sign: number, pos: V3, children: ReactNode) => (
    <Act position={pos} f={(g, p) => void (g.rotation[axis] = sign * flap(p, k))}>
      {children}
    </Act>
  );
  return (
    <group>
      <Lump id="carton" pieces={cartonPieces} />
      {/* Front and back flaps first (the tape splits between them), then the two short ones */}
      {hinge(0, 'x', 1, [0, CH, CD / 2], <Lump id="flap-front" pieces={flapPieces(-CD / 4)} />)}
      {hinge(1, 'x', -1, [0, CH, -CD / 2], <Lump id="flap-back" pieces={flapPieces(CD / 4)} />)}
      {hinge(2, 'z', 1, [-CW / 2, CH, 0], <Bx tone="kraft" size={[0.5, 0.03, CD - 0.1]} position={[0.25, -0.02, 0]} r={0.012} />)}
      {hinge(3, 'z', -1, [CW / 2, CH, 0], <Bx tone="kraft" size={[0.5, 0.03, CD - 0.1]} position={[-0.25, -0.02, 0]} r={0.012} />)}
    </group>
  );
}

// ── The terminal ────────────────────────────────────────────────────────────
// A small monitor on its foot. Its lines of code type in one by one, and an orange cursor blinks.
const LINES: [number, number][] = [[0, 0.62], [0.12, 0.84], [0.12, 0.5], [0.24, 0.7], [0.12, 0.56], [0, 0.36]];
export function Terminal({ typed }: { typed: (p: Play) => number }) {
  const { play } = useClay();
  const screen = useScreen(() => SCREEN.terminal);
  const lines = useRef<(THREE.Group | null)[]>([]);
  const cursor = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const n = typed(play) * LINES.length;
    lines.current.forEach((g, i) => g && g.scale.set(Math.max(clamp01(n - i), 1e-4), 1, 1));
    const c = cursor.current;
    if (!c) return;
    const row = Math.min(Math.floor(n), LINES.length - 1);
    const [x, w] = LINES[row];
    c.position.set(-0.7 + x + w * clamp01(n - row) + 0.06, 0.3 - row * 0.13, 0.045);
    c.visible = Math.sin(clock.elapsedTime * 9) > -0.3;
  });
  return (
    <group>
      <Lump id="terminal" pieces={terminalPieces} />
      <group position={[0, 0.98, -0.05]}>
        <mesh position={[0, -0.04, 0.0605]} material={screen}>
          <planeGeometry args={[1.66, 1.02]} />
        </mesh>
        {LINES.map(([x, w], i) => (
          <group key={i} ref={(g) => void (lines.current[i] = g)} position={[-0.66 + x, 0.3 - i * 0.13, 0.07]}>
            <Bx size={[w, 0.045, 0.02]} position={[w / 2, 0, 0]} />
          </group>
        ))}
        <group ref={cursor}>
          <Bx tone="accent" size={[0.05, 0.08, 0.02]} />
        </group>
      </group>
    </group>
  );
}
// The foot, the neck, the monitor with its three dots, and the prompt.
const terminalPieces = (): Piece[] => [
  box([1.1, 0.07, 0.6], [0, 0.035, 0], { r: 0.03, tone: 'dark' }),
  box([0.16, 0.22, 0.1], [0, 0.18, -0.05], { r: 0.03, tone: 'dark' }),
  box([1.9, 1.3, 0.12], [0, 0.98, -0.05], { r: 0.06 }),
  ...[0, 1, 2].map((i) => puck(0.024, 0.02, [-0.82 + i * 0.07, 1.54, 0.01], { segments: 10, rot: [HALF_PI, 0, 0] })),
  box([0.1, 0.03, 0.02], [-0.74, 1.31, 0.02], { rot: [0, 0, -0.6] }),
  box([0.1, 0.03, 0.02], [-0.74, 1.26, 0.02], { rot: [0, 0, 0.6] }),
];

/** The dub: a sound wave in orange on a small plate. `on`: how much it plays. Origin on the floor. */
export function Wave({ on }: { on: (p: Play) => number }) {
  const { play, mats } = useClay();
  const ref = useRef<THREE.InstancedMesh>(null);
  const N = 11;
  const geo = useMemo(() => new RoundedBoxGeometry(0.075, 1, 0.075, 2, 0.03), []);
  useEffect(() => () => geo.dispose(), [geo]);
  const o = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }) => {
    const m = ref.current;
    if (!m) return;
    const live = on(play);
    const t = clock.elapsedTime;
    for (let i = 0; i < N; i++) {
      const env = Math.sin(((i + 0.5) / N) * Math.PI);
      const h = 0.05 + env * (0.12 + 0.32 * live * Math.abs(Math.sin(t * 6.1 + i * 1.7) * Math.sin(t * 2.3 + i * 0.6)));
      o.position.set((i - (N - 1) / 2) * 0.11, 0.07 + h / 2, 0);
      o.scale.set(1, h, 1);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <group>
      <Bx size={[1.4, 0.07, 0.42]} position={[0, 0.035, 0]} r={0.03} />
      <instancedMesh ref={ref} args={[geo, mats.accent, N]} castShadow receiveShadow frustumCulled={false} />
    </group>
  );
}

// ── The phone, and the hand that holds it ───────────────────────────────────
// Origin at the bottom centre of the phone, screen towards +Z, its length along +Y.
export const PHONE_SCREEN: V3 = [0, 0.68, 0.04];
export const PHONE_LENS: V3 = [-0.18, 1.12, -0.05];
const phonePieces = (): Piece[] => [box([0.66, 1.28, 0.07], [0, 0.66, 0], { r: 0.08, tone: 'dark' }), puck(0.065, 0.03, PHONE_LENS, { segments: 14, rot: [HALF_PI, 0, 0], tone: 'mid' })];
export function Phone({ screen, glow, children }: { screen: (p: Play) => number; glow: (p: Play) => number; children?: ReactNode }) {
  const mat = useScreen(screen, glow);
  return (
    <group>
      <Lump id="phone" pieces={phonePieces} />
      <mesh position={[PHONE_SCREEN[0], PHONE_SCREEN[1], 0.0365]} material={mat}>
        <planeGeometry args={[0.56, 1.02]} />
      </mesh>
      {children}
    </group>
  );
}

// A right hand, in the phone's own space: the phone lies in the palm, the four fingers come round
// its left edge, the thumb round its right edge onto the screen, and the wrist goes down into a
// sleeve. `thumb`: 0 resting along the edge, 1 on the shutter button (it swings over and presses).
const FINGERS: [number, number, number, number][] = [[0.79, 0.215, 0.135, 0.1], [0.635, 0.235, 0.14, 0.03], [0.48, 0.225, 0.135, -0.04], [0.335, 0.19, 0.118, -0.1]];
const handPieces = (): Piece[] => [
  box([0.6, 0.74, 0.24], [0.05, 0.46, -0.16], { r: 0.11 }),
  ...FINGERS.map(([y, w, h, turn]) => box([w, h, 0.21], [-0.325 - w / 2 + 0.1, y, -0.04], { r: 0.062, rot: [0, 0, turn] })),
  // The ball of the thumb; the heel of the hand, the wrist, and the sleeve it goes into (cuff first)
  box([0.24, 0.4, 0.24], [0.36, 0.24, -0.09], { r: 0.1, rot: [0, 0, 0.2] }),
  box([0.56, 0.3, 0.25], [0.1, 0.02, -0.17], { r: 0.11, rot: [0, 0, -0.06] }),
  box([0.42, 0.42, 0.22], [0.16, -0.22, -0.19], { r: 0.1, rot: [0, 0, -0.14] }),
  box([0.58, 0.13, 0.34], [0.21, -0.44, -0.2], { r: 0.055, rot: [0, 0, -0.14], tone: 'mid' }),
  box([0.52, 2, 0.3], [0.35, -1.42, -0.2], { r: 0.09, rot: [0, 0, -0.14], tone: 'mid' }),
];
export function Hand({ thumb }: { thumb: (p: Play) => number }) {
  return (
    <group>
      <Lump id="hand" pieces={handPieces} />
      <Act
        position={[0.4, 0.2, 0.055]}
        f={(g, p) => {
          const k = thumb(p);
          g.rotation.z = lerp(-1.3, -0.28, ease(k));
          g.position.z = 0.075 - 0.03 * bump(slice(k, 0.55, 1.45));
        }}
      >
        <Bx size={[0.4, 0.135, 0.12]} position={[-0.17, 0, 0]} r={0.058} />
      </Act>
    </group>
  );
}

/** What comes back: a repair guide for the part. A small drawing of the fan, then numbered steps, ticked in one by one (`step`: how much of step `i` is there). Faces +Z, the size of the phone's screen. */
// The card with its drawing of the fan; a numbered step (an orange dot and two lines).
const cardPieces = (): Piece[] => [
  box([0.54, 0.98, 0.022], undefined, { r: 0.03 }),
  puck(0.12, 0.014, [0, 0.3, 0.014], { hole: 0.1, segments: 20, rot: [HALF_PI, 0, 0] }),
  puck(0.035, 0.014, [0, 0.3, 0.014], { segments: 10, rot: [HALF_PI, 0, 0] }),
  ...[0, 1, 2, 3, 4].map((i) => box([0.07, 0.026, 0.01], [Math.cos((i * Math.PI * 2) / 5) * 0.065, 0.3 - Math.sin((i * Math.PI * 2) / 5) * 0.065, 0.014], { rot: [0, 0, (-i * Math.PI * 2) / 5] })),
];
const tickPieces = (i: number) => (): Piece[] => [
  puck(0.04, 0.02, [-0.17, 0, 0], { segments: 14, rot: [HALF_PI, 0, 0], tone: 'accent' }),
  box([0.26, 0.032, 0.012], [0.07, 0.026, 0]),
  box([0.2 - i * 0.04, 0.032, 0.012], [0.04 - i * 0.02, -0.03, 0]),
];
export function TutorialCard({ step }: { step: (p: Play, i: number) => number }) {
  return (
    <group>
      <Lump id="card" pieces={cardPieces} />
      {[0, 1, 2].map((i) => (
        <Act
          key={i}
          position={[0, 0.05 - i * 0.18, 0.015]}
          f={(g, p) => {
            const k = step(p, i);
            g.visible = k > 0.001;
            g.scale.setScalar(Math.max(k, 1e-4));
          }}
        >
          <Lump id={`tick${i}`} pieces={tickPieces(i)} />
        </Act>
      ))}
    </group>
  );
}

// ── The map of Brazil ───────────────────────────────────────────────────────
/** World units per map unit, and the map's centre. South towards the camera (+Z). */
export const MAP_K = 0.03;
export const toWorld = ([x, y]: [number, number], h = 0): V3 => [(x - MAP_W / 2) * MAP_K, h, (y - MAP_H / 2) * MAP_K];
// The five states no laptop went to (the owner's list). The Federal District is not a state and is
// not counted either way: it stays plain, like the five states no laptop went to, and no laptop goes to it.
const NOT_REACHED = ['AC', 'AM', 'RR', 'AP', 'MS'];
export const stateKind = (uf: string) => (uf === 'DF' ? 'df' : NOT_REACHED.includes(uf) ? 'out' : 'lit');
export const REACHED = STATES.filter((s) => stateKind(s.uf) === 'lit');
export const H_BASE = 0.09; // the country, all one piece
const H_CAP = 0.045; // a state reached rises this much and turns orange

/** One state's outline (an `M x y l dx dy … z` path) as a shape in the map's plane, south down. */
function stateShape(d: string) {
  const n = (d.match(/-?(?:\d+\.?\d*|\.\d+)/g) ?? []).map(Number);
  const s = new THREE.Shape();
  let x = n[0];
  let y = n[1];
  s.moveTo((x - MAP_W / 2) * MAP_K, -(y - MAP_H / 2) * MAP_K);
  for (let i = 2; i + 1 < n.length; i += 2) {
    x += n[i];
    y += n[i + 1];
    s.lineTo((x - MAP_W / 2) * MAP_K, -(y - MAP_H / 2) * MAP_K);
  }
  return s;
}
const extrude = (d: string, depth: number, b: number) => {
  const g = new THREE.ExtrudeGeometry(stateShape(d), { depth: depth - 2 * b, bevelEnabled: true, bevelSize: b, bevelThickness: b, bevelOffset: -b, bevelSegments: 2 });
  g.rotateX(-HALF_PI);
  g.translate(0, b, 0);
  return g;
};

// Built once per page: the country as one mesh (each state with a soft edge, so the borders read as
// fine grooves) and a cap per state reached. 48 extrusions at once held the main thread for ~50 ms,
// so they are built a few at a time in idle moments after the stage mounts; the map waits for them.
type MapGeos = { base: THREE.BufferGeometry; caps: THREE.BufferGeometry[] };
let mapGeos: MapGeos | undefined;
let building: Promise<MapGeos> | undefined;
function buildMap(): Promise<MapGeos> {
  if (mapGeos) return Promise.resolve(mapGeos);
  if (!building) {
    building = new Promise((resolve) => {
      const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 16));
      const parts: THREE.BufferGeometry[] = [];
      const caps: THREE.BufferGeometry[] = [];
      const work = () => {
        const t0 = performance.now();
        while (performance.now() - t0 < 6 && parts.length + caps.length < STATES.length + REACHED.length) {
          if (parts.length < STATES.length) parts.push(extrude(STATES[parts.length].d, H_BASE, 0.006));
          else caps.push(extrude(REACHED[caps.length].d, H_CAP + 0.02, 0.008));
        }
        if (parts.length + caps.length < STATES.length + REACHED.length) return void idle(work);
        const base = mergeGeometries(parts)!;
        parts.forEach((g) => g.dispose());
        resolve((mapGeos = { base, caps }));
      };
      idle(work);
    });
  }
  return building;
}

/** What flies to each state: a laptop boxed up, taped and labelled. Origin under its centre. */
const parcelPieces = (): Piece[] => [
  box([0.32, 0.18, 0.24], [0, 0.09, 0], { r: 0.012, tone: 'kraft' }),
  box([0.07, 0.004, 0.242], [0, 0.181, 0], { tone: 'accent' }),
  box([0.07, 0.12, 0.004], [0, 0.12, 0.121], { tone: 'accent' }),
  box([0.1, 0.07, 0.004], [0.09, 0.07, 0.121]),
];

const DOT = new THREE.SphereGeometry(0.024, 6, 4);
/** When the laptop for reached state `k` (0 = nearest to Salvador) lands, seconds into the step. */
export const landAt = (k: number) => 0.98 + k * 0.068;
export const SALVADOR_AT = toWorld(SALVADOR, H_BASE);
const MAP_STEP = 5; // the story's last step

/** The country rises out of the page in one piece; then one laptop after another leaves Salvador, and each state turns orange as its laptop lands. */
export function BrazilMap() {
  const [geos, setGeos] = useState(mapGeos);
  useEffect(() => {
    let live = true;
    if (!geos) buildMap().then((g) => live && setGeos(g));
    return () => void (live = false);
  }, [geos]);
  return geos ? <MapBody geos={geos} /> : null;
}

function MapBody({ geos }: { geos: MapGeos }) {
  const { play, mats } = useClay();
  const country = useRef<THREE.Group>(null);
  const caps = useRef<(THREE.Mesh | null)[]>([]);
  const fleet = useRef<THREE.InstancedMesh>(null);
  const { base, caps: capGeos } = geos;
  const { dark } = useClay();
  const mini = lump('parcel', parcelPieces, mats, dark);
  const ends = useMemo(() => REACHED.map((s) => new THREE.Vector3(...toWorld(s.c, H_BASE + H_CAP))), []);
  // The small coastal states get a smaller laptop, so they do not pile up on each other.
  const sizes = useMemo(() => REACHED.map((s) => {
    const n = (s.d.match(/-?(?:\d+\.?\d*|\.\d+)/g) ?? []).map(Number);
    let [x, y, x0, x1, y0, y1] = [n[0], n[1], n[0], n[0], n[1], n[1]];
    for (let i = 2; i + 1 < n.length; i += 2) {
      x += n[i];
      y += n[i + 1];
      [x0, x1, y0, y1] = [Math.min(x0, x), Math.max(x1, x), Math.min(y0, y), Math.max(y1, y)];
    }
    return THREE.MathUtils.clamp(Math.sqrt((x1 - x0) * (y1 - y0)) / 26, 0.52, 1);
  }), []);
  const start = useMemo(() => new THREE.Vector3(SALVADOR_AT[0], H_BASE + 0.2, SALVADOR_AT[2]), []);
  // Each laptop's flight: how far, how long it takes, how high it goes. A near state is a short hop, a far one a long arc.
  const flights = useMemo(() => ends.map((end) => {
    const far = start.distanceTo(end);
    return { far, takes: 0.42 + far * 0.11, high: 0.42 + far * 0.2 };
  }), [ends, start]);
  // The way each one went stays drawn on the map as a dotted line (the first stretch left out: 21 lines leave the same pin).
  const dots = useMemo(() => {
    const all: { k: number; v: number }[] = [];
    flights.forEach(({ far }, k) => {
      const n = Math.max(2, Math.round(far / 0.24));
      for (let j = 0; j < n; j++) all.push({ k, v: 0.3 + (0.62 * (j + 0.5)) / n });
    });
    return all;
  }, [flights]);
  const trail = useRef<THREE.InstancedMesh>(null);
  const still = useRef(false);
  // Borders: every outline as one set of segments, drawn over the clay.
  const borders = useMemo(() => {
    const pts: V3[] = [];
    for (const s of STATES) {
      const n = (s.d.match(/-?(?:\d+\.?\d*|\.\d+)/g) ?? []).map(Number);
      let x = n[0];
      let y = n[1];
      const first: V3 = toWorld([x, y], H_BASE + 0.002);
      let prev = first;
      for (let i = 2; i + 1 < n.length; i += 2) {
        x += n[i];
        y += n[i + 1];
        const cur = toWorld([x, y], H_BASE + 0.002);
        pts.push(prev, cur);
        prev = cur;
      }
      pts.push(prev, first);
    }
    return pts;
  }, []);
  const o = useMemo(() => new THREE.Object3D(), []);
  useFrame(() => {
    const here = at(play, MAP_STEP);
    const on = here > 0.001;
    const age = ageOf(play, MAP_STEP);
    // Up in the second half of the travel (the laptop has gone by then), down in the first half of the travel away.
    const up = play.to === MAP_STEP ? (play.from === MAP_STEP ? 1 : settle(slice(play.t, 0.36, 1), 0.4)) : 1 - ease(slice(play.t, 0, 0.4));
    // Flat, it would still cover the floor: it is only there once it has some height.
    const there = on && up > 0.02;
    const g = country.current;
    if (g) {
      g.visible = there;
      g.scale.set(1, Math.max(up, 1e-4), 1);
    }
    for (let k = 0; k < REACHED.length; k++) {
      const m = caps.current[k];
      if (!m) continue;
      const lit = spring(age - landAt(k) + 0.04, 2, 6);
      m.visible = there && lit > 0.001;
      m.position.y = H_BASE - 0.02 - H_CAP + H_CAP * lit;
    }
    const f = fleet.current;
    const d = trail.current;
    if (!f || !d) return;
    f.visible = d.visible = there;
    // Once every laptop has landed and the step holds, nothing here moves: nothing is written.
    const settled = play.from === play.to && age > landAt(REACHED.length - 1) + 0.3;
    if (!there || (settled && still.current)) return;
    still.current = settled;
    for (let k = 0; k < REACHED.length; k++) {
      const end = ends[k];
      const u = slice(age, landAt(k) - flights[k].takes, landAt(k));
      const e = ease(u);
      o.position.lerpVectors(start, end, e);
      o.position.y += Math.sin(u * Math.PI) * flights[k].high;
      // Nose first along its arc, then it settles facing the camera.
      o.rotation.set(0, Math.atan2(end.x - start.x, end.z - start.z) * (1 - slice(u, 0.8, 1)), 0);
      // In the air it is big (the flight is the event); landed, it is the size of its state.
      const s = (u > 0 ? 1 : 0) * Math.min(1, slice(u, 0, 0.12) * 1.2) * up * lerp(sizes[k], 1.5, Math.sin(u * Math.PI));
      const land = bump(slice(age - landAt(k), 0, 0.2)) * 0.25;
      o.scale.set(s * (1 + land), Math.max(s * (1 - land), 1e-4), s * (1 + land));
      o.updateMatrix();
      f.setMatrixAt(k, o.matrix);
    }
    f.instanceMatrix.needsUpdate = true;
    o.rotation.set(0, 0, 0);
    for (let i = 0; i < dots.length; i++) {
      const { k, v } = dots[i];
      const u = slice(age, landAt(k) - flights[k].takes, landAt(k));
      // On the map, under the point of its arc the laptop has passed.
      o.position.lerpVectors(start, ends[k], ease(v));
      o.position.y = H_BASE + H_CAP + 0.006;
      o.scale.setScalar(pop(slice(u, v, v + 0.1), 1.6) * up);
      o.updateMatrix();
      d.setMatrixAt(i, o.matrix);
    }
    d.instanceMatrix.needsUpdate = true;
  });
  return (
    <>
      <group ref={country}>
        <mesh geometry={base} material={mats.clay} castShadow receiveShadow />
        <group userData={{ overlay: true }}>
          <Line points={borders} segments color={mats.inkColor} lineWidth={0.6} transparent opacity={0.22} layers={1} />
        </group>
        {capGeos.map((geo, k) => (
          <mesh key={REACHED[k].uf} ref={(m) => void (caps.current[k] = m)} geometry={geo} material={mats.accent} castShadow receiveShadow />
        ))}
      </group>
      <instancedMesh ref={fleet} args={[mini, PAINT, REACHED.length]} castShadow frustumCulled={false} />
      <instancedMesh ref={trail} args={[DOT, mats.ink, dots.length]} frustumCulled={false} layers={1} userData={OVERLAY} />
      {/* Salvador: a pin */}
      <Act
        position={SALVADOR_AT}
        f={(g, p) => {
          const u = p.to === MAP_STEP ? (p.from === MAP_STEP ? 1 : pop(slice(p.t, 0.8, 1))) : 1 - ease(slice(p.t, 0, 0.3));
          g.scale.setScalar(Math.max(u, 1e-4));
          // It pumps while the laptops leave it.
          const a = ageOf(p, MAP_STEP);
          g.scale.y *= 1 + 0.28 * Math.abs(Math.sin(a * 11)) * slice(a, landAt(0) - 0.35, landAt(0) - 0.2) * (1 - slice(a, landAt(REACHED.length - 1) - 0.3, landAt(REACHED.length - 1)));
          g.visible = at(p, MAP_STEP) > 0.001;
        }}
      >
        <Puck r={0.012} h={0.2} segments={8} position={[0, 0.1, 0]} />
        <Puck r={0.05} h={0.05} accent segments={16} position={[0, 0.22, 0]} />
      </Act>
    </>
  );
}
