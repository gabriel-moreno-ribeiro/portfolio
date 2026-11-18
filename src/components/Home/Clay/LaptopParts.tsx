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
export const SCREEN = { off: 0, on: 1, hindi: 2, portuguese: 3, sad: 4, viewfinder: 5, flash: 6, waiting: 7, terminal: 8 } as const;
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
export const DISPLAY_ASIDE: V3 = [-1.42, 0.06, -1.2];
/** Where a point on the screen is (x across, z from the hinge, 0.21 to 1.39), in the laptop's own space, lid open. */
export const onScreen = (x: number, z: number): V3 => [x, PIVOT[1] + z * Math.sin(OPEN), PIVOT[2] + z * Math.cos(OPEN)];
const smooth = (u: number) => u * u * (3 - 2 * u);

function Keyboard() {
  const { mats } = useClay();
  const geo = useMemo(() => new RoundedBoxGeometry(0.13, 0.025, 0.125, 2, 0.01), []);
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
  return <instancedMesh ref={lay} args={[geo, mats.clay, KEYS_X * KEYS_Z]} castShadow receiveShadow />;
}

/** A screw, head up: the head with its cross, the thread under it. Origin at the head's centre. */
export function ScrewShape() {
  const { mats } = useClay();
  return (
    <>
      <Puck r={0.045} h={0.016} bevel={0.006} segments={16} />
      <Box size={[0.05, 0.006, 0.01]} r={0.002} position={[0, 0.007, 0]} material={mats.shade.dark} />
      <Box size={[0.01, 0.006, 0.05]} r={0.002} position={[0, 0.007, 0]} material={mats.shade.dark} />
      <Puck r={0.013} h={0.07} segments={8} position={[0, -0.042, 0]} />
    </>
  );
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
export function Cover() {
  const { mats } = useClay();
  return (
    <group>
      <Box size={[W, 0.035, D]} position={[0, 0.0175, 0]} r={0.03} />
      {[-0.3, -0.15, 0, 0.15, 0.3].map((z) => (
        <Box key={z} size={[0.9, 0.006, 0.05]} position={[0.3, 0.001, z - 0.25]} r={0.003} material={mats.shade.board} />
      ))}
      {[-0.95, 0.95].flatMap((x) => [-0.5, 0.5].map((z) => <Box key={`${x}${z}`} size={[0.2, 0.008, 0.08]} position={[x, 0.0, z]} r={0.004} material={mats.shade.mid} />))}
      <Holes at={COVER_HOLES} />
    </group>
  );
}

/** The screen: the lid with its bezel and the screen set back inside it, the hinge and the camera. Origin at the hinge. */
function Display({ mat }: { mat: THREE.Material }) {
  const { mats } = useClay();
  return (
    <>
      <Puck r={0.045} h={1.7} segments={20} position={[0, 0, 0.02]} rotation={[0, 0, HALF_PI]} />
      <Box size={[W, 0.055, D - 0.02]} position={[0, 0.0275, 0.79]} r={0.03} />
      <Box size={[W - 0.08, 0.012, 0.16]} position={[0, -0.006, 1.49]} r={0.005} />
      <Box size={[W - 0.08, 0.012, 0.18]} position={[0, -0.006, 0.12]} r={0.005} />
      <Box size={[0.16, 0.012, 1.18]} position={[1.07, -0.006, 0.8]} r={0.005} />
      <Box size={[0.16, 0.012, 1.18]} position={[-1.07, -0.006, 0.8]} r={0.005} />
      <Puck r={0.02} h={0.004} segments={12} position={[0, -0.0125, 1.49]} material={mats.shade.dark} />
      <mesh position={[0, -0.001, 0.8]} rotation={[HALF_PI, 0, 0]} material={mat}>
        <planeGeometry args={[1.98, 1.18]} />
      </mesh>
    </>
  );
}

const PORTS: [number, number, number][] = [[-1, -0.42, 0.16], [-1, -0.18, 0.16], [-1, 0.1, 0.24], [1, -0.4, 0.2], [1, -0.1, 0.1]];
/** The base without its bottom cover: the walls, the deck and everything on it. Origin at the bottom centre, right way up. */
export function Shell() {
  const { mats } = useClay();
  return (
    <>
      {/* The walls, the deck and its keys */}
      <Box size={[W, 0.14, 0.05]} position={[0, 0.105, D / 2 - 0.025]} r={0.02} />
      <Box size={[W, 0.14, 0.05]} position={[0, 0.105, -D / 2 + 0.025]} r={0.02} />
      <Box size={[0.05, 0.14, D - 0.1]} position={[W / 2 - 0.025, 0.105, 0]} r={0.02} />
      <Box size={[0.05, 0.14, D - 0.1]} position={[-W / 2 + 0.025, 0.105, 0]} r={0.02} />
      <Box size={[W, 0.04, D]} position={[0, DECK - 0.02, 0]} r={0.02} />
      <Keyboard />
      <Box size={[0.8, 0.025, 0.12]} position={[0.02, DECK + 0.0125, 0.03]} r={0.01} />
      {/* The trackpad and its button line; the ports on the sides; the notch that opens the lid */}
      <Box size={[0.74, 0.012, 0.42]} position={[0, DECK + 0.004, 0.5]} r={0.005} />
      <Box size={[0.66, 0.004, 0.012]} position={[0, DECK + 0.0095, 0.62]} r={0.002} material={mats.shade.mid} />
      {PORTS.map(([side, z, w]) => (
        <Box key={`${side}${z}`} size={[0.012, 0.042, w]} position={[side * (W / 2 + 0.001), 0.1, z]} r={0.004} material={mats.shade.dark} />
      ))}
      <Box size={[0.46, 0.022, 0.012]} position={[0, 0.165, D / 2 + 0.001]} r={0.004} material={mats.shade.mid} />
      {HINGE_SCREWS.map(([x, , z]) => (
        <Box key={x} size={[0.2, 0.008, 0.11]} position={[x, DECK + 0.002, z]} r={0.004} />
      ))}
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
  const screws = useRef<(THREE.Group | null)[]>([]);
  const hinges = useRef<(THREE.Group | null)[]>([]);
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
          screws.current.forEach((s, k) => s && (s.visible = screw(p, k) <= 0));
          hinges.current.forEach((s, k) => s && (s.visible = hinge(p, k) <= 0));
        }}
      >
        <group position={[0, -HB / 2, 0]}>
          <group ref={shell}>
            <Cover />
          </group>
          {COVER_SCREWS.map((s, k) => (
            <group key={k} ref={(g) => void (screws.current[k] = g)} position={s} rotation={[Math.PI, 0, 0]}>
              <ScrewShape />
            </group>
          ))}
          <Shell />
        </group>
      </Act>
      {HINGE_SCREWS.map((s, k) => (
        <group key={k} ref={(g) => void (hinges.current[k] = g)} position={s}>
          <ScrewShape />
        </group>
      ))}
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

// ── The phone, and the hand that holds it ───────────────────────────────────
// Origin at the bottom centre of the phone, screen towards +Z, its length along +Y.
export const PHONE_SCREEN: V3 = [0, 0.68, 0.04];
export const PHONE_LENS: V3 = [-0.18, 1.12, -0.05];
export function Phone({ screen, glow, children }: { screen: (p: Play) => number; glow: (p: Play) => number; children?: ReactNode }) {
  const mat = useScreen(screen, glow);
  return (
    <group>
      <Box size={[0.66, 1.28, 0.07]} position={[0, 0.66, 0]} r={0.08} />
      <mesh position={[PHONE_SCREEN[0], PHONE_SCREEN[1], 0.0365]} material={mat}>
        <planeGeometry args={[0.56, 1.02]} />
      </mesh>
      <Puck r={0.065} h={0.03} segments={20} position={PHONE_LENS} rotation={[HALF_PI, 0, 0]} />
      {children}
    </group>
  );
}

// A right hand, in the phone's own space: the phone lies in the palm, the four fingers come round
// its left edge, the thumb round its right edge onto the screen, and the wrist goes down into a
// sleeve. `thumb`: 0 resting along the edge, 1 on the shutter button (it swings over and presses).
const FINGERS: [number, number, number, number][] = [[0.79, 0.215, 0.135, 0.1], [0.635, 0.235, 0.14, 0.03], [0.48, 0.225, 0.135, -0.04], [0.335, 0.19, 0.118, -0.1]];
export function Hand({ thumb }: { thumb: (p: Play) => number }) {
  const { mats } = useClay();
  return (
    <group>
      <Box size={[0.6, 0.74, 0.24]} position={[0.05, 0.46, -0.16]} r={0.11} />
      {FINGERS.map(([y, w, h, turn]) => (
        <Box key={y} size={[w, h, 0.21]} position={[-0.325 - w / 2 + 0.1, y, -0.04]} rotation={[0, 0, turn]} r={0.062} />
      ))}
      {/* The ball of the thumb, then the thumb itself */}
      <Box size={[0.24, 0.4, 0.24]} position={[0.36, 0.24, -0.09]} rotation={[0, 0, 0.2]} r={0.1} />
      <Act
        position={[0.4, 0.2, 0.055]}
        f={(g, p) => {
          const k = thumb(p);
          g.rotation.z = lerp(-1.3, -0.28, ease(k));
          g.position.z = 0.075 - 0.03 * bump(slice(k, 0.55, 1.45));
        }}
      >
        <Box size={[0.4, 0.135, 0.12]} position={[-0.17, 0, 0]} r={0.058} />
      </Act>
      {/* The heel of the hand, the wrist, and the sleeve it goes into (cuff first) */}
      <Box size={[0.56, 0.3, 0.25]} position={[0.1, 0.02, -0.17]} rotation={[0, 0, -0.06]} r={0.11} />
      <Box size={[0.42, 0.42, 0.22]} position={[0.16, -0.22, -0.19]} rotation={[0, 0, -0.14]} r={0.1} />
      <Box size={[0.58, 0.13, 0.34]} position={[0.21, -0.44, -0.2]} rotation={[0, 0, -0.14]} r={0.055} material={mats.shade.mid} />
      <Box size={[0.52, 2, 0.3]} position={[0.35, -1.42, -0.2]} rotation={[0, 0, -0.14]} r={0.09} material={mats.shade.mid} />
    </group>
  );
}

/** What comes back: a repair guide for the part. A small drawing of the fan, then numbered steps, ticked in one by one (`step`: how much of step `i` is there). Faces +Z, the size of the phone's screen. */
export function TutorialCard({ step }: { step: (p: Play, i: number) => number }) {
  return (
    <group>
      <Box size={[0.54, 0.98, 0.022]} r={0.03} />
      <group position={[0, 0.3, 0.014]} rotation={[HALF_PI, 0, 0]}>
        <Puck r={0.12} h={0.014} hole={0.1} segments={24} />
        <Puck r={0.035} h={0.014} segments={14} />
        {[0, 1, 2, 3, 4].map((i) => (
          <Box key={i} size={[0.07, 0.01, 0.026]} r={0.004} position={[Math.cos((i * Math.PI * 2) / 5) * 0.065, 0, Math.sin((i * Math.PI * 2) / 5) * 0.065]} rotation={[0, (-i * Math.PI * 2) / 5, 0]} />
        ))}
      </group>
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
          <Puck accent r={0.04} h={0.02} segments={16} position={[-0.17, 0, 0]} rotation={[HALF_PI, 0, 0]} />
          <Box size={[0.26, 0.032, 0.012]} position={[0.07, 0.026, 0]} r={0.006} />
          <Box size={[0.2 - i * 0.04, 0.032, 0.012]} position={[0.04 - i * 0.02, -0.03, 0]} r={0.006} />
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
