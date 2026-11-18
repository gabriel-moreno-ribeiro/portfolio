// The laptop-repair models, in clay: the laptop (a base with thickness, a keyboard deck that lifts
// off, a hinged lid with a bezel and a recessed screen), the carton, the repair mat and its tools,
// the terminal, the phone and the clay map of Brazil. Built from the kit's shared primitives.
import { Html, Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { MAP_H, MAP_W, SALVADOR, STATES } from './brazilMap';
import { Act, ageOf, at, Box, bump, clamp01, ease, pop, Puck, settle, shown, slice, spring, useClay, type Play, type V3 } from './kit';
import { TagMark } from './TagMark';

const HALF_PI = Math.PI / 2;
const lerp = THREE.MathUtils.lerp;

// ── Screens ─────────────────────────────────────────────────────────────────
// What a screen can show, tone on tone like the rest of the clay. Drawn once per page.
export const SCREEN = { off: 0, on: 1, hindi: 2, portuguese: 3, error: 4, viewfinder: 5, flash: 6, waiting: 7, terminal: 8 } as const;
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
  const dialog = (g: CanvasRenderingContext2D, x: number, y: number, k: number) => {
    rect(g, '#faf8f5', x, y, 180 * k, 118 * k, 8 * k);
    g.strokeStyle = '#b2a89e';
    g.lineWidth = 3 * k;
    g.beginPath();
    g.roundRect(x, y, 180 * k, 118 * k, 8 * k);
    g.stroke();
    g.lineWidth = 5 * k;
    g.lineJoin = 'round';
    g.strokeStyle = '#8f857b';
    g.beginPath();
    g.moveTo(x + 42 * k, y + 24 * k);
    g.lineTo(x + 64 * k, y + 62 * k);
    g.lineTo(x + 20 * k, y + 62 * k);
    g.closePath();
    g.stroke();
    g.fillStyle = '#8f857b';
    g.fillRect(x + 40 * k, y + 36 * k, 4 * k, 14 * k);
    g.fillRect(x + 40 * k, y + 54 * k, 4 * k, 4 * k);
    g.fillStyle = '#d6cfc7';
    [0, 1, 2].forEach((i) => g.fillRect(x + 78 * k, y + (28 + i * 14) * k, (80 - i * 18) * k, 6 * k));
    rect(g, '#d6cfc7', x + 106 * k, y + 84 * k, 58 * k, 20 * k, 5 * k);
  };
  // A tutorial video: the frame, a laptop in it, the progress bar and a subtitle line.
  const video = (subtitle: (g: CanvasRenderingContext2D) => void) =>
    draw(320, 200, (g) => {
      g.fillStyle = '#d7d0c8';
      g.fillRect(0, 0, 320, 200);
      rect(g, '#c4bcb3', 18, 14, 284, 150);
      g.strokeStyle = '#ada399';
      g.lineWidth = 5;
      g.strokeRect(100, 44, 120, 58);
      g.beginPath();
      g.moveTo(88, 112);
      g.lineTo(232, 112);
      g.stroke();
      rect(g, '#b3aaa0', 18, 172, 284, 6, 3);
      rect(g, '#f0732d', 18, 172, 150, 6, 3);
      subtitle(g);
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
    // On: a desktop with two windows.
    draw(320, 200, (g) => {
      g.fillStyle = '#ece7e1';
      g.fillRect(0, 0, 320, 200);
      rect(g, '#d6cfc7', 0, 180, 320, 20, 0);
      rect(g, '#faf8f5', 34, 30, 150, 104);
      rect(g, '#d6cfc7', 34, 30, 150, 16, 6);
      rect(g, '#faf8f5', 150, 70, 136, 92);
      rect(g, '#d6cfc7', 150, 70, 136, 16, 6);
      g.fillStyle = '#ddd6ce';
      [0, 1, 2, 3].forEach((i) => g.fillRect(162, 98 + i * 14, 100 - i * 14, 6));
      g.fillStyle = '#f0732d';
      g.beginPath();
      g.arc(16, 190, 6, 0, Math.PI * 2);
      g.fill();
    }),
    // The tutorial with Hindi subtitles: a line across the top of the letters, strokes hanging from it.
    video((g) => {
      rect(g, '#faf8f5', 54, 124, 212, 30, 6);
      g.fillStyle = '#8f857b';
      for (const [x, w] of [[66, 54], [128, 40], [176, 76]]) {
        g.fillRect(x, 131, w, 3);
        for (let s = x + 4; s < x + w - 4; s += 9) g.fillRect(s, 131, 3, 8 + ((s * 7) % 9));
      }
    }),
    // The same tutorial with Portuguese subtitles: plain words, and the sound in orange.
    video((g) => {
      rect(g, '#faf8f5', 54, 124, 212, 30, 6);
      g.fillStyle = '#8f857b';
      for (const [x, w] of [[66, 30], [102, 46], [154, 22], [182, 34], [222, 30]]) rect(g, '#8f857b', x, 135, w, 7, 3);
      g.fillStyle = '#f0732d';
      [10, 18, 26, 14, 8].forEach((h, i) => rect(g, '#f0732d', 262 + i * 7, 40 - h / 2, 4, h, 2));
    }),
    // A software problem: an error dialog.
    draw(320, 200, (g) => {
      g.fillStyle = '#e4ded7';
      g.fillRect(0, 0, 320, 200);
      dialog(g, 70, 40, 1);
    }),
    // The phone's camera, pointed at the problem.
    draw(160, 290, (g) => {
      g.fillStyle = '#d9d3cc';
      g.fillRect(0, 0, 160, 290);
      dialog(g, 26, 112, 0.6);
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
    <Html position={anchor} zIndexRange={[4, 0]} style={{ pointerEvents: 'none' }}>
      <div ref={ref} className="clay-tag" style={{ opacity: 0 }} data-dx={dx} data-dy={dy}>
        <TagMark dx={dx} dy={dy}>{children}</TagMark>
      </div>
    </Html>
  );
}
/** `shown` of the kit, for a LiveTag. */
export const showOn = (steps: number[], after = 0) => (p: Play) => shown(p, steps, after);

// ── The laptop ──────────────────────────────────────────────────────────────
// Origin at the bottom centre, front edge towards +Z. The base is 2.4 x 1.6 and 0.22 thick.
const W = 2.4;
const D = 1.6;
const DECK = 0.2; // top of the keyboard deck
const PIVOT: V3 = [0, 0.255, -0.79]; // the hinge
export const OPEN = 1.88; // radians: how far the lid stands open
const KEYS_X = 13;
const KEYS_Z = 4;
/** Where a point on the screen is (x across, z from the hinge, 0.21 to 1.39), in the laptop's own space, lid open. */
export const onScreen = (x: number, z: number): V3 => [x, PIVOT[1] + z * Math.sin(OPEN), PIVOT[2] + z * Math.cos(OPEN)];

function Keyboard() {
  const { mats } = useClay();
  const geo = useMemo(() => new RoundedBoxGeometry(0.13, 0.025, 0.125, 2, 0.01), []);
  useEffect(() => () => geo.dispose(), [geo]);
  // Static: laid out once, when the mesh exists.
  const lay = (m: THREE.InstancedMesh | null) => {
    if (!m) return;
    const o = new THREE.Object3D();
    for (let i = 0; i < KEYS_X * KEYS_Z; i++) {
      o.position.set(-0.96 + (i % KEYS_X) * 0.16 + (Math.floor(i / KEYS_X) % 2) * 0.04, DECK + 0.012, -0.6 + Math.floor(i / KEYS_X) * 0.155);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  };
  return <instancedMesh ref={lay} args={[geo, mats.clay, KEYS_X * KEYS_Z]} castShadow receiveShadow />;
}

function Fan({ spin }: { spin: (p: Play) => number }) {
  const { play } = useClay();
  const blades = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (blades.current) blades.current.rotation.y -= dt * 9 * spin(play);
  });
  return (
    <group position={[0.72, 0.085, -0.42]}>
      <Puck r={0.21} h={0.05} hole={0.18} segments={32} />
      <group ref={blades}>
        <Puck r={0.06} h={0.05} segments={16} />
        {[0, 1, 2, 3, 4].map((i) => (
          <Box key={i} size={[0.12, 0.012, 0.055]} r={0.005} position={[Math.cos((i * Math.PI * 2) / 5) * 0.11, 0, Math.sin((i * Math.PI * 2) / 5) * 0.11]} rotation={[0.45, (-i * Math.PI * 2) / 5, 0]} />
        ))}
      </group>
    </group>
  );
}

/**
 * The laptop. `lid`: how open it is (0..1 of OPEN). `screen`: which picture. `deck`: moves the keyboard
 * deck (it lifts off for the repair). `fan`: how fast the fan turns.
 */
export function Laptop({ lid, screen, deck, fan }: { lid: (p: Play) => number; screen: (p: Play) => number; deck: (g: THREE.Group, p: Play) => void; fan: (p: Play) => number }) {
  const mat = useScreen(screen);
  return (
    <group>
      {/* The base: a shell with walls, open on top under the deck */}
      <Box size={[W, 0.06, D]} position={[0, 0.03, 0]} r={0.03} />
      <Box size={[W, 0.12, 0.06]} position={[0, 0.12, D / 2 - 0.03]} r={0.02} />
      <Box size={[W, 0.12, 0.06]} position={[0, 0.12, -D / 2 + 0.03]} r={0.02} />
      <Box size={[0.06, 0.12, D - 0.12]} position={[W / 2 - 0.03, 0.12, 0]} r={0.02} />
      <Box size={[0.06, 0.12, D - 0.12]} position={[-W / 2 + 0.03, 0.12, 0]} r={0.02} />
      {/* Inside: the board, the battery, a chip, the fan and the slot of the part that gets swapped */}
      <Box size={[2, 0.02, 0.8]} position={[0, 0.07, 0.22]} r={0.006} />
      <Box size={[1.35, 0.07, 0.48]} position={[-0.38, 0.095, -0.42]} r={0.02} />
      <Box size={[0.26, 0.03, 0.26]} position={[-0.5, 0.095, 0.22]} r={0.01} />
      <Box size={[0.07, 0.04, 0.3]} position={[0.13, 0.1, 0.3]} r={0.01} />
      <Fan spin={fan} />
      {/* The hinge */}
      <Puck r={0.045} h={1.7} segments={20} position={[0, PIVOT[1], PIVOT[2] + 0.02]} rotation={[0, 0, HALF_PI]} />
      {/* The keyboard deck */}
      <Act f={deck}>
        <Box size={[W, 0.04, D]} position={[0, DECK - 0.02, 0]} r={0.02} />
        <Keyboard />
        <Box size={[0.8, 0.025, 0.12]} position={[0.02, DECK + 0.012, 0.03]} r={0.01} />
        <Box size={[0.74, 0.008, 0.4]} position={[0, DECK + 0.004, 0.52]} r={0.004} />
      </Act>
      {/* The lid on its hinge: a shell, a bezel around the inside, and the screen set back inside the bezel */}
      <Act position={PIVOT} f={(g, p) => void (g.rotation.x = -OPEN * lid(p))}>
        <Box size={[W, 0.055, D - 0.02]} position={[0, 0.0275, 0.79]} r={0.03} />
        <Box size={[W - 0.08, 0.012, 0.16]} position={[0, -0.006, 1.49]} r={0.005} />
        <Box size={[W - 0.08, 0.012, 0.18]} position={[0, -0.006, 0.12]} r={0.005} />
        <Box size={[0.16, 0.012, 1.18]} position={[1.07, -0.006, 0.8]} r={0.005} />
        <Box size={[0.16, 0.012, 1.18]} position={[-1.07, -0.006, 0.8]} r={0.005} />
        <mesh position={[0, -0.001, 0.8]} rotation={[HALF_PI, 0, 0]} material={mat}>
          <planeGeometry args={[1.98, 1.18]} />
        </mesh>
      </Act>
    </group>
  );
}

// ── The repair ──────────────────────────────────────────────────────────────
// All in the laptop's own space (y = 0 is the top of the mat it stands on). The deck comes off
// first; then the screwdriver goes to each screw and turns it out; the old part comes out and
// the new one goes in.
export const PART: V3 = [0.45, 0.0925, 0.3];
const PART_SIZE: V3 = [0.5, 0.025, 0.26];
const SCREWS: V3[] = [[0.76, 0.0925, 0.21], [0.76, 0.0925, 0.39]];
export const DISH: V3 = [1.75, 0, 0.78];
export const WAITING: V3 = [1.8, 0.0125, -0.42]; // the new part, on the mat
export const OLD_REST: V3 = [1.8, 0.0125, 0.16]; // where the old part is laid down
export const DRIVER_REST: V3 = [1.05, 0.085, 1.14];
export const REPAIR = { deck: [0.75, 1.15], out: [2.42, 2.78], in: [2.84, 3.24], fixed: 3.3 } as const;

/** A point in a track: [time, x, y, z, tilt about Z]. */
type Key5 = [number, number, number, number, number];
function track(keys: Key5[], a: number, out: number[]) {
  let i = 0;
  while (i < keys.length - 2 && a > keys[i + 1][0]) i++;
  const [t0, ...p] = keys[i];
  const [t1, ...q] = keys[i + 1];
  const u = ease(clamp01((a - t0) / (t1 - t0)));
  for (let k = 0; k < 4; k++) out[k] = lerp(p[k], q[k], u);
}
const TOP = 0.105; // the top of a screw head
const DRIVER: Key5[] = [
  [1.15, ...DRIVER_REST, HALF_PI],
  [1.42, SCREWS[0][0], 0.42, SCREWS[0][2], 0],
  [1.52, SCREWS[0][0], TOP, SCREWS[0][2], 0],
  [1.78, SCREWS[0][0], TOP + 0.08, SCREWS[0][2], 0],
  [1.9, SCREWS[1][0], 0.3, SCREWS[1][2], 0],
  [1.98, SCREWS[1][0], TOP, SCREWS[1][2], 0],
  [2.24, SCREWS[1][0], TOP + 0.08, SCREWS[1][2], 0],
  [2.45, ...DRIVER_REST, HALF_PI],
];
const TURNS: [number, number][] = [[1.52, 1.78], [1.98, 2.24]];
/** In and out with the step: grows in place at the end of the travel to step 2, shrinks at the start of the travel away. */
const toolScale = (p: Play) => (p.to === 1 ? (p.from === 1 ? 1 : pop(slice(p.t, 0.7, 1))) : p.from === 1 ? 1 - ease(slice(p.t, 0, 0.3)) : 0);
/** Things that sit in the laptop's slot: seen only while the deck is off. */
const inSlot = (p: Play) => (p.to === 1 && p.from === 1) || (p.from === 1 && p.t < 0.4);

export function Screwdriver() {
  const tip = useMemo(() => [0, 0, 0, 0], []);
  return (
    <Act
      f={(g, p) => {
        const a = ageOf(p, 1);
        track(DRIVER, a, tip);
        g.position.set(tip[0], tip[1], tip[2]);
        g.rotation.set(0, TURNS.reduce((s, [t0, t1]) => s + slice(a, t0, t1), 0) * Math.PI * 6, tip[3]);
        const s = toolScale(p);
        g.scale.setScalar(Math.max(s, 1e-4));
        g.visible = s > 0.001;
      }}
    >
      <Puck r={0.012} h={0.06} segments={8} position={[0, 0.03, 0]} />
      <Puck r={0.022} h={0.5} segments={10} position={[0, 0.3, 0]} />
      <Puck r={0.05} h={0.08} bevel={0.02} segments={16} position={[0, 0.57, 0]} />
      <Puck r={0.085} h={0.4} bevel={0.04} segments={10} position={[0, 0.81, 0]} />
    </Act>
  );
}

/** A screw: turned out, then dropped in the dish. */
export function Screw({ k }: { k: number }) {
  const [x, y, z] = SCREWS[k];
  const [t0, t1] = TURNS[k];
  return (
    <Act
      f={(g, p) => {
        const a = ageOf(p, 1);
        const out = slice(a, t1 + 0.02, t1 + 0.3);
        const e = ease(out);
        g.position.set(lerp(x, DISH[0] + (k - 0.5) * 0.1, e), lerp(y + 0.08 * slice(a, t0, t1), DISH[1] + 0.03, e) + bump(out) * 0.4, lerp(z, DISH[2], e));
        g.rotation.set(0, slice(a, t0, t1) * Math.PI * 6, out * 1.4);
        g.visible = inSlot(p) || (out > 0 && toolScale(p) > 0.001);
        g.scale.setScalar(Math.max(out > 0 ? toolScale(p) : 1, 1e-4));
      }}
    >
      <Puck r={0.034} h={0.025} bevel={0.01} segments={14} />
      <Box size={[0.04, 0.008, 0.008]} r={0.003} position={[0, 0.013, 0]} />
    </Act>
  );
}

function PartShape({ accent }: { accent?: boolean }) {
  return (
    <>
      <Box accent={accent} size={PART_SIZE} r={0.008} />
      <Box accent={accent} size={[0.08, 0.02, 0.08]} position={[-0.12, 0.02, 0]} r={0.006} />
      <Box accent={accent} size={[0.08, 0.02, 0.08]} position={[0.04, 0.02, 0]} r={0.006} />
    </>
  );
}

export function OldPart() {
  return (
    <Act
      f={(g, p) => {
        const a = ageOf(p, 1);
        const u = slice(a, REPAIR.out[0], REPAIR.out[1]);
        const e = settle(u, 0.5);
        g.position.set(lerp(PART[0], OLD_REST[0], e), lerp(PART[1], OLD_REST[1], e) + bump(u) * 0.55, lerp(PART[2], OLD_REST[2], e));
        g.rotation.set(0, ease(u) * 0.3, -bump(u) * 0.35);
        g.visible = u > 0 ? toolScale(p) > 0.001 : inSlot(p);
        g.scale.setScalar(Math.max(u > 0 ? toolScale(p) : 1, 1e-4));
      }}
    >
      <PartShape />
    </Act>
  );
}

export function NewPart() {
  return (
    <Act
      f={(g, p) => {
        const a = ageOf(p, 1);
        const u = slice(a, REPAIR.in[0], REPAIR.in[1]);
        const e = settle(u, 0.6);
        g.position.set(lerp(WAITING[0], PART[0], e), lerp(WAITING[1], PART[1], e) + bump(u) * 0.6, lerp(WAITING[2], PART[2], e));
        g.rotation.set(0, (1 - ease(u)) * 0.35, 0);
        // On the mat it comes and goes with the tools; once in the slot, it stays under the deck.
        g.visible = u >= 1 ? inSlot(p) : toolScale(p) > 0.001;
        g.scale.setScalar(Math.max(u >= 1 ? 1 : toolScale(p), 1e-4));
      }}
    >
      <PartShape accent />
    </Act>
  );
}

/** The repair mat, with a raised rim and a dish for the screws. Origin at the top centre of the mat. */
export const MAT: V3 = [6.1, 0.03, 2.9];
export function Mat() {
  const [w, h, d] = MAT;
  return (
    <group>
      <Box size={[w, h, d]} position={[0, -h / 2, 0]} r={0.012} />
      <Box size={[w, 0.02, 0.06]} position={[0, 0.01, d / 2 - 0.03]} r={0.008} />
      <Box size={[w, 0.02, 0.06]} position={[0, 0.01, -d / 2 + 0.03]} r={0.008} />
      <Box size={[0.06, 0.02, d - 0.12]} position={[w / 2 - 0.03, 0.01, 0]} r={0.008} />
      <Box size={[0.06, 0.02, d - 0.12]} position={[-w / 2 + 0.03, 0.01, 0]} r={0.008} />
    </group>
  );
}
export function Dish() {
  return (
    <group>
      <Puck r={0.17} h={0.05} hole={0.13} segments={32} position={[0, 0.025, 0]} />
      <Puck r={0.14} h={0.012} segments={28} position={[0, 0.006, 0]} />
    </group>
  );
}

// ── The carton ──────────────────────────────────────────────────────────────
// Origin at the bottom centre. 2.9 x 1 x 2. The flaps open one by one; the long ones carry the tape.
export const CARTON: V3 = [2.9, 1, 2];
export function Carton({ flap }: { flap: (p: Play, k: number) => number }) {
  const [CW, CH, CD] = CARTON;
  const hinge = (k: number, axis: 'x' | 'z', sign: number, pos: V3, children: ReactNode) => (
    <Act position={pos} f={(g, p) => void (g.rotation[axis] = sign * flap(p, k))}>
      {children}
    </Act>
  );
  return (
    <group>
      <Box size={[CW, 0.06, CD]} position={[0, 0.03, 0]} r={0.02} />
      <Box size={[CW, CH, 0.06]} position={[0, CH / 2, CD / 2 - 0.03]} r={0.02} />
      <Box size={[CW, CH, 0.06]} position={[0, CH / 2, -CD / 2 + 0.03]} r={0.02} />
      <Box size={[0.06, CH, CD - 0.12]} position={[CW / 2 - 0.03, CH / 2, 0]} r={0.02} />
      <Box size={[0.06, CH, CD - 0.12]} position={[-CW / 2 + 0.03, CH / 2, 0]} r={0.02} />
      {/* The shipping label */}
      <Box size={[0.8, 0.5, 0.02]} position={[0.85, 0.55, CD / 2 + 0.005]} r={0.01} />
      {[0, 1, 2].map((i) => (
        <Box key={i} size={[0.6 - i * 0.14, 0.05, 0.016]} position={[0.82 - i * 0.07, 0.68 - i * 0.12, CD / 2 + 0.02]} r={0.005} />
      ))}
      {/* Front and back flaps first (the tape splits between them), then the two short ones */}
      {hinge(0, 'x', 1, [0, CH, CD / 2], (
        <>
          <Box size={[CW - 0.04, 0.04, CD / 2]} position={[0, 0.02, -CD / 4]} r={0.015} />
          <Box accent size={[0.34, 0.012, CD / 2 - 0.01]} position={[0, 0.046, -CD / 4]} r={0.004} />
        </>
      ))}
      {hinge(1, 'x', -1, [0, CH, -CD / 2], (
        <>
          <Box size={[CW - 0.04, 0.04, CD / 2]} position={[0, 0.02, CD / 4]} r={0.015} />
          <Box accent size={[0.34, 0.012, CD / 2 - 0.01]} position={[0, 0.046, CD / 4]} r={0.004} />
        </>
      ))}
      {hinge(2, 'z', 1, [-CW / 2, CH, 0], <Box size={[0.5, 0.03, CD - 0.1]} position={[0.25, -0.02, 0]} r={0.012} />)}
      {hinge(3, 'z', -1, [CW / 2, CH, 0], <Box size={[0.5, 0.03, CD - 0.1]} position={[-0.25, -0.02, 0]} r={0.012} />)}
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
      <Box size={[1.1, 0.07, 0.6]} position={[0, 0.035, 0]} r={0.03} />
      <Box size={[0.16, 0.22, 0.1]} position={[0, 0.18, -0.05]} r={0.03} />
      <group position={[0, 0.98, -0.05]}>
        <Box size={[1.9, 1.3, 0.12]} r={0.06} />
        <mesh position={[0, -0.04, 0.0605]} material={screen}>
          <planeGeometry args={[1.66, 1.02]} />
        </mesh>
        {[0, 1, 2].map((i) => (
          <Puck key={i} r={0.024} h={0.02} segments={12} position={[-0.82 + i * 0.07, 0.56, 0.06]} rotation={[HALF_PI, 0, 0]} />
        ))}
        {/* The prompt, then the lines */}
        <Box size={[0.1, 0.03, 0.02]} position={[-0.74, 0.33, 0.07]} rotation={[0, 0, -0.6]} r={0.008} />
        <Box size={[0.1, 0.03, 0.02]} position={[-0.74, 0.28, 0.07]} rotation={[0, 0, 0.6]} r={0.008} />
        {LINES.map(([x, w], i) => (
          <group key={i} ref={(g) => void (lines.current[i] = g)} position={[-0.66 + x, 0.3 - i * 0.13, 0.07]}>
            <Box size={[w, 0.045, 0.02]} position={[w / 2, 0, 0]} r={0.01} />
          </group>
        ))}
        <group ref={cursor}>
          <Box accent size={[0.05, 0.08, 0.02]} r={0.008} />
        </group>
      </group>
    </group>
  );
}

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
      <Box size={[1.4, 0.07, 0.42]} position={[0, 0.035, 0]} r={0.03} />
      <instancedMesh ref={ref} args={[geo, mats.accent, N]} castShadow receiveShadow frustumCulled={false} />
    </group>
  );
}

// ── The phone ───────────────────────────────────────────────────────────────
// Origin at the bottom centre of its stand, screen towards +Z, leaning back a little.
export const PHONE_LEAN = -0.2;
/** The leaning frame of the phone, inside its stand. Children of `Phone` live in it. */
export const PHONE_FRAME: V3 = [0, 0.07, 0.06];
export const PHONE_SCREEN: V3 = [0, 0.68, 0.04];
export const PHONE_LENS: V3 = [-0.18, 1.12, -0.05];
export function Phone({ screen, glow, children }: { screen: (p: Play) => number; glow: (p: Play) => number; children?: ReactNode }) {
  const mat = useScreen(screen, glow);
  return (
    <group>
      <Box size={[0.78, 0.06, 0.62]} position={[0, 0.03, 0]} r={0.03} />
      <Box size={[0.7, 0.08, 0.12]} position={[0, 0.1, 0.17]} r={0.03} />
      <group position={PHONE_FRAME} rotation={[PHONE_LEAN, 0, 0]}>
        <Box size={[0.66, 1.28, 0.07]} position={[0, 0.66, 0]} r={0.08} />
        <mesh position={[PHONE_SCREEN[0], PHONE_SCREEN[1], 0.0365]} material={mat}>
          <planeGeometry args={[0.56, 1.02]} />
        </mesh>
        <Puck r={0.065} h={0.03} segments={20} position={PHONE_LENS} rotation={[HALF_PI, 0, 0]} />
        {children}
      </group>
    </group>
  );
}

/** What comes back: a tutorial card, numbered steps and their lines. Faces +Z, the size of the phone's screen. */
export function TutorialCard() {
  return (
    <group>
      <Box size={[0.54, 0.98, 0.022]} r={0.03} />
      <Box size={[0.38, 0.05, 0.012]} position={[-0.04, 0.38, 0.015]} r={0.006} />
      {[0, 1, 2].map((i) => (
        <group key={i} position={[0, 0.16 - i * 0.24, 0.015]}>
          <Puck accent r={0.045} h={0.02} segments={16} position={[-0.17, 0, 0]} rotation={[HALF_PI, 0, 0]} />
          <Box size={[0.26, 0.035, 0.012]} position={[0.07, 0.03, 0]} r={0.006} />
          <Box size={[0.2 - i * 0.04, 0.035, 0.012]} position={[0.04 - i * 0.02, -0.035, 0]} r={0.006} />
        </group>
      ))}
    </group>
  );
}

// ── The map of Brazil ───────────────────────────────────────────────────────
/** World units per map unit, and the map's centre. South towards the camera (+Z). */
export const MAP_K = 0.03;
export const toWorld = ([x, y]: [number, number], h = 0): V3 => [(x - MAP_W / 2) * MAP_K, h, (y - MAP_H / 2) * MAP_K];
// The five states no laptop went to (the owner's list). The Federal District is not a state and is
// not counted either way: it stays plain, like the states not reached, and no laptop goes to it.
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

/** A laptop the size of a state's pin, open, in one geometry. */
function miniLaptopGeometry() {
  const base = new RoundedBoxGeometry(0.24, 0.03, 0.16, 2, 0.01).translate(0, 0.015, 0);
  const lid = new RoundedBoxGeometry(0.24, 0.16, 0.016, 2, 0.008).translate(0, 0.08, 0).rotateX(-0.25).translate(0, 0.03, -0.08);
  const g = mergeGeometries([base, lid])!;
  base.dispose();
  lid.dispose();
  return g;
}

/** When the laptop for reached state `k` (0 = nearest to Salvador) lands, seconds into the step. */
export const landAt = (k: number) => 1.3 + k * 0.09;
export const SALVADOR_AT = toWorld(SALVADOR, H_BASE);

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
  const mini = useMemo(miniLaptopGeometry, []);
  useEffect(() => () => mini.dispose(), [mini]);
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
    return THREE.MathUtils.clamp(Math.sqrt((x1 - x0) * (y1 - y0)) / 26, 0.5, 1);
  }), []);
  const start = useMemo(() => new THREE.Vector3(SALVADOR_AT[0], H_BASE + 0.2, SALVADOR_AT[2]), []);
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
    const here = at(play, 4);
    const on = here > 0.001;
    const age = ageOf(play, 4);
    // Up in the second half of the travel (the laptop has gone by then), down in the first half of the travel away.
    const up = play.to === 4 ? (play.from === 4 ? 1 : settle(slice(play.t, 0.36, 1), 0.4)) : 1 - ease(slice(play.t, 0, 0.4));
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
    if (!f) return;
    f.visible = there;
    if (!there) return;
    for (let k = 0; k < REACHED.length; k++) {
      const end = ends[k];
      // A near state is a short hop, a far one a longer flight.
      const u = slice(age, landAt(k) - (0.22 + start.distanceTo(end) * 0.07), landAt(k));
      const e = ease(u);
      o.position.lerpVectors(start, end, e);
      o.position.y = lerp(start.y, end.y, e) + Math.sin(u * Math.PI) * (0.35 + start.distanceTo(end) * 0.2);
      // Nose first along its arc, then it settles facing the camera.
      o.rotation.set(0, Math.atan2(end.x - start.x, end.z - start.z) * (1 - slice(u, 0.8, 1)), 0);
      const s = (u > 0 ? 1 : 0) * Math.min(1, slice(u, 0, 0.12) * 1.2) * up * sizes[k];
      const land = bump(slice(age - landAt(k), 0, 0.2)) * 0.25;
      o.scale.set(s * (1 + land), Math.max(s * (1 - land), 1e-4), s * (1 + land));
      o.updateMatrix();
      f.setMatrixAt(k, o.matrix);
    }
    f.instanceMatrix.needsUpdate = true;
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
      <instancedMesh ref={fleet} args={[mini, mats.clay, REACHED.length]} castShadow frustumCulled={false} />
      {/* Salvador: a pin */}
      <Act
        position={SALVADOR_AT}
        f={(g, p) => {
          const u = p.to === 4 ? (p.from === 4 ? 1 : pop(slice(p.t, 0.8, 1))) : 1 - ease(slice(p.t, 0, 0.3));
          g.scale.setScalar(Math.max(u, 1e-4));
          g.visible = at(p, 4) > 0.001;
        }}
      >
        <Puck r={0.012} h={0.2} segments={8} position={[0, 0.1, 0]} />
        <Puck r={0.05} h={0.05} accent segments={16} position={[0, 0.22, 0]} />
      </Act>
    </>
  );
}
