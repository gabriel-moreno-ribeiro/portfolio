// The laptop-repair models, in clay: the laptop (tray, insides, keyboard deck, lid), the carton,
// the screwdriver, the phone and the clay map of Brazil. Built from the kit's shared primitives.
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { MAP_H, MAP_W, STATES } from './brazilMap';
import { Act, ageOf, at, Box, bump, clamp01, ease, Morph, pop, Puck, settle, slice, spring, Tag, useClay, type Play, type V3 } from './kit';

const HALF_PI = Math.PI / 2;
const lerp = THREE.MathUtils.lerp;

// ── Screens ─────────────────────────────────────────────────────────────────
// Four pictures a screen can show, tone on tone like the rest of the clay. Drawn once per page.
export const SCREEN = { off: 0, on: 1, video: 2, error: 3 } as const;
let screens: THREE.CanvasTexture[] | undefined;
function screenTextures() {
  if (screens) return screens;
  const draw = (paint: (g: CanvasRenderingContext2D) => void) => {
    const c = document.createElement('canvas');
    c.width = 320;
    c.height = 200;
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
  screens = [
    // Off: a dead screen with one streak of reflection.
    draw((g) => {
      g.fillStyle = '#c9c2ba';
      g.fillRect(0, 0, 320, 200);
      g.fillStyle = 'rgba(255,255,255,0.22)';
      g.beginPath();
      g.moveTo(60, 0);
      g.lineTo(130, 0);
      g.lineTo(40, 200);
      g.lineTo(-30, 200);
      g.fill();
    }),
    // On: a desktop with two windows.
    draw((g) => {
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
    // A repair tutorial: the video, its play button, its progress and its subtitles.
    draw((g) => {
      g.fillStyle = '#d7d0c8';
      g.fillRect(0, 0, 320, 200);
      rect(g, '#c4bcb3', 22, 16, 276, 140);
      g.strokeStyle = '#ada399';
      g.lineWidth = 5;
      g.strokeRect(96, 60, 128, 62); // a laptop in the video
      g.fillStyle = '#faf8f5';
      g.beginPath();
      g.arc(160, 86, 22, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#9c9187';
      g.beginPath();
      g.moveTo(153, 74);
      g.lineTo(153, 98);
      g.lineTo(173, 86);
      g.fill();
      rect(g, '#b3aaa0', 22, 166, 276, 6, 3);
      rect(g, '#f0732d', 22, 166, 120, 6, 3);
      rect(g, '#faf8f5', 70, 132, 180, 12, 4);
    }),
    // A software problem: an error dialog.
    draw((g) => {
      g.fillStyle = '#e4ded7';
      g.fillRect(0, 0, 320, 200);
      rect(g, '#faf8f5', 70, 40, 180, 118, 8);
      g.strokeStyle = '#b2a89e';
      g.lineWidth = 3;
      g.beginPath();
      g.roundRect(70, 40, 180, 118, 8);
      g.stroke();
      g.lineWidth = 5;
      g.lineJoin = 'round';
      g.strokeStyle = '#8f857b';
      g.beginPath();
      g.moveTo(112, 64);
      g.lineTo(134, 102);
      g.lineTo(90, 102);
      g.closePath();
      g.stroke();
      g.fillStyle = '#8f857b';
      g.fillRect(110, 76, 4, 14);
      g.fillRect(110, 94, 4, 4);
      g.fillStyle = '#d6cfc7';
      [0, 1, 2].forEach((i) => g.fillRect(148, 68 + i * 14, 80 - i * 18, 6));
      rect(g, '#d6cfc7', 176, 124, 58, 20, 5);
    }),
  ];
  return screens;
}

/** A screen material that follows the theme; `pick` chooses the picture, and only a change of picture touches the material. */
function useScreen(pick: (p: Play) => number) {
  const { play, mats } = useClay();
  const mat = useMemo(() => {
    const tex = screenTextures();
    return new THREE.MeshStandardMaterial({ map: tex[0], emissiveMap: tex[0], emissive: '#ffffff', emissiveIntensity: 0.18, color: mats.clay.color, roughness: 0.5 });
  }, [mats]);
  useEffect(() => () => mat.dispose(), [mat]);
  useFrame(() => {
    const t = screenTextures()[pick(play)];
    if (mat.map !== t) mat.map = mat.emissiveMap = t;
  });
  return mat;
}

// ── The laptop ──────────────────────────────────────────────────────────────
// Origin at the bottom centre, front edge towards +Z. Base 2.4 x 1.6.
const W = 2.4;
const D = 1.6;
const DECK_Y = 0.15; // the keyboard deck sits on the tray's walls
const HINGE: V3 = [0, 0.2, -0.78];
const KEYS_X = 13;
const KEYS_Z = 4;
const PART: V3 = [0.36, 0.1, -0.3]; // where the part that gets swapped sits
const SCREWS: V3[] = [[0.68, 0.11, -0.2], [0.68, 0.11, -0.4]];
export const OPEN = 1.85; // radians: how far the lid stands open

function Keyboard() {
  const { mats } = useClay();
  const geo = useMemo(() => new RoundedBoxGeometry(0.13, 0.03, 0.125, 2, 0.012), []);
  useEffect(() => () => geo.dispose(), [geo]);
  // Static: laid out once, when the mesh exists.
  const lay = (m: THREE.InstancedMesh | null) => {
    if (!m) return;
    const o = new THREE.Object3D();
    for (let i = 0; i < KEYS_X * KEYS_Z; i++) {
      o.position.set(-0.96 + (i % KEYS_X) * 0.16 + (Math.floor(i / KEYS_X) % 2) * 0.04, DECK_Y + 0.062, -0.6 + Math.floor(i / KEYS_X) * 0.155);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  };
  return <instancedMesh ref={lay} args={[geo, mats.clay, KEYS_X * KEYS_Z]} castShadow receiveShadow />;
}

/** A point in a step-1 repair track: [time, x, y, z, tilt about Z]. */
type Key5 = [number, number, number, number, number];
/** Writes the pose `a` seconds into the track into `out` (x, y, z, tilt), easing between keys. */
function track(keys: Key5[], a: number, out: number[]) {
  let i = 0;
  while (i < keys.length - 2 && a > keys[i + 1][0]) i++;
  const [t0, ...p] = keys[i];
  const [t1, ...q] = keys[i + 1];
  const u = ease(clamp01((a - t0) / (t1 - t0)));
  for (let k = 0; k < 4; k++) out[k] = lerp(p[k], q[k], u);
}

// The repair, in the laptop's own space. It begins once the deck is off.
const DRIVER: Key5[] = [
  [0.45, 1.3, 0.09, 1.05, HALF_PI],
  [0.85, SCREWS[0][0], 0.42, SCREWS[0][2], 0],
  [0.98, SCREWS[0][0], 0.14, SCREWS[0][2], 0],
  [1.4, SCREWS[0][0], 0.23, SCREWS[0][2], 0],
  [1.56, SCREWS[1][0], 0.42, SCREWS[1][2], 0],
  [1.66, SCREWS[1][0], 0.14, SCREWS[1][2], 0],
  [2.08, SCREWS[1][0], 0.23, SCREWS[1][2], 0],
  [2.45, 1.3, 0.09, 1.05, HALF_PI],
];
const TURNS: [number, number][] = [[0.98, 1.4], [1.66, 2.08]];
const OUT_AT = 2.1; // the old part comes out
const IN_AT = 2.45; // the new one goes in
export const FIXED_AT = 3; // and the screen comes on

function Screwdriver() {
  const tip = useMemo(() => [0, 0, 0, 0], []);
  return (
    <Act
      f={(g, p) => {
        const here = at(p, 1);
        const a = ageOf(p, 1);
        track(DRIVER, a, tip);
        g.position.set(tip[0], tip[1], tip[2]);
        g.rotation.set(0, TURNS.reduce((s, [t0, t1]) => s + slice(a, t0, t1), 0) * Math.PI * 5, tip[3]);
        // It comes in with the deck off, and goes as the story moves on.
        g.scale.setScalar(Math.max(pop(slice(a, 0.3, 0.6)) * here, 1e-4));
        g.visible = here > 0.01;
      }}
    >
      <Puck r={0.012} h={0.06} segments={8} position={[0, 0.03, 0]} />
      <Puck r={0.022} h={0.5} segments={10} position={[0, 0.3, 0]} />
      <Puck r={0.05} h={0.08} bevel={0.02} segments={16} position={[0, 0.57, 0]} />
      <Puck r={0.085} h={0.4} bevel={0.04} segments={10} position={[0, 0.81, 0]} />
      <Tag at={[0, 1.02, 0]} dx={34} dy={-24} on={[1]} after={0.9}>Screwdriver</Tag>
    </Act>
  );
}

/** A screw of the part: turned out, then laid on the bench. */
function Screw({ k }: { k: number }) {
  const [x, y, z] = SCREWS[k];
  const [t0, t1] = TURNS[k];
  return (
    <Act
      f={(g, p) => {
        const a = ageOf(p, 1);
        const out = slice(a, t1 + 0.02, t1 + 0.32);
        g.position.set(lerp(x, 1.5 + k * 0.14, ease(out)), y + 0.09 * slice(a, t0, t1) * (1 - out) + bump(out) * 0.35 - 0.08 * out, lerp(z, 0.72, ease(out)));
        g.rotation.set(0, slice(a, t0, t1) * Math.PI * 5, 0);
      }}
    >
      <Puck r={0.034} h={0.025} bevel={0.01} segments={14} />
      <Box size={[0.04, 0.008, 0.008]} r={0.003} position={[0, 0.013, 0]} />
    </Act>
  );
}

function Fan() {
  const { play } = useClay();
  const blades = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    // It starts turning once the new part is in.
    if (blades.current) blades.current.rotation.y -= dt * 9 * slice(ageOf(play, 1), FIXED_AT - 0.1, FIXED_AT + 0.3) * at(play, 1);
  });
  return (
    <group position={[-0.82, 0.075, -0.42]}>
      <Puck r={0.22} h={0.05} hole={0.19} segments={32} />
      <group ref={blades}>
        <Puck r={0.06} h={0.05} segments={16} />
        {[0, 1, 2, 3, 4].map((i) => (
          <Box key={i} size={[0.13, 0.012, 0.06]} r={0.005} position={[Math.cos((i * Math.PI * 2) / 5) * 0.12, 0, Math.sin((i * Math.PI * 2) / 5) * 0.12]} rotation={[0.45, (-i * Math.PI * 2) / 5, 0]} />
        ))}
      </group>
    </group>
  );
}

/**
 * The laptop. `lid`: how open it is (0..1 of OPEN). `screen`: which picture. `deck`: where the keyboard
 * deck is at each step, relative to the laptop. The repair (step 2 of the story) lives in here.
 */
export function Laptop({ lid, screen, deck, win }: { lid: (p: Play) => number; screen: (p: Play) => number; deck: Parameters<typeof Morph>[0]['k']; win?: Parameters<typeof Morph>[0]['win'] }) {
  const mat = useScreen(screen);
  return (
    <group>
      {/* The tray */}
      <Box size={[W, 0.06, D]} position={[0, 0.03, 0]} r={0.03} />
      <Box size={[W, 0.11, 0.06]} position={[0, 0.095, D / 2 - 0.03]} r={0.02} />
      <Box size={[W, 0.11, 0.06]} position={[0, 0.095, -D / 2 + 0.03]} r={0.02} />
      <Box size={[0.06, 0.11, D - 0.12]} position={[W / 2 - 0.03, 0.095, 0]} r={0.02} />
      <Box size={[0.06, 0.11, D - 0.12]} position={[-W / 2 + 0.03, 0.095, 0]} r={0.02} />
      {/* Inside: the board, the battery, a chip, the fan, the slot and its part */}
      <Box size={[1.55, 0.025, 0.78]} position={[-0.12, 0.072, -0.32]} r={0.008} />
      <Box size={[1.95, 0.07, 0.48]} position={[0, 0.095, 0.44]} r={0.02} />
      <Box size={[0.26, 0.035, 0.26]} position={[-0.32, 0.1, -0.36]} r={0.01} />
      <Box size={[0.07, 0.045, 0.32]} position={[0.08, 0.105, -0.3]} r={0.01} />
      <Fan />
      <OldPart />
      <NewPart />
      <Screw k={0} />
      <Screw k={1} />
      <Screwdriver />
      {/* The keyboard deck: lifted off for the repair */}
      <Morph k={deck} win={win} arc={1.1}>
        <Box size={[W - 0.04, 0.05, D - 0.04]} position={[0, DECK_Y + 0.025, 0]} r={0.02} />
        <Keyboard />
        <Box size={[0.8, 0.03, 0.12]} position={[0.02, DECK_Y + 0.062, 0.03]} r={0.012} />
        <Box size={[0.74, 0.012, 0.42]} position={[0, DECK_Y + 0.052, 0.5]} r={0.006} />
      </Morph>
      {/* The lid, hinged along the back edge. Its underside is the screen. */}
      <Act
        position={HINGE}
        f={(g, p) => {
          g.rotation.x = -OPEN * lid(p);
        }}
      >
        <Box size={[W, 0.07, D - 0.02]} position={[0, 0.035, 0.79]} r={0.03} />
        <mesh position={[0, -0.002, 0.8]} rotation={[HALF_PI, 0, 0]} material={mat}>
          <planeGeometry args={[2.16, 1.35]} />
        </mesh>
      </Act>
    </group>
  );
}

const PART_SIZE: V3 = [0.5, 0.025, 0.26];
function OldPart() {
  return (
    <Act
      f={(g, p) => {
        const a = ageOf(p, 1);
        const u = slice(a, OUT_AT, OUT_AT + 0.5);
        g.position.set(lerp(PART[0], 1.55, ease(u)), PART[1] + bump(u) * 0.7 - 0.087 * ease(u), lerp(PART[2], 0.28, ease(u)));
        g.rotation.set(0, u * 0.7, -bump(u) * 0.5);
        // Once out, it leaves with the step.
        g.scale.setScalar(Math.max(u > 0 ? at(p, 1) : 1, 1e-4));
      }}
    >
      <Box size={PART_SIZE} r={0.008} />
      <Box size={[0.08, 0.02, 0.08]} position={[-0.12, 0.02, 0]} r={0.006} />
      <Box size={[0.08, 0.02, 0.08]} position={[0.02, 0.02, 0]} r={0.006} />
    </Act>
  );
}

function NewPart() {
  return (
    <Act
      f={(g, p) => {
        const a = ageOf(p, 1);
        // Steps 3 to 5 the new part is in its place (under the deck); before the repair it isn't there.
        const u = p.to >= 2 && p.from >= 2 ? 1 : slice(a, IN_AT, IN_AT + 0.55);
        g.position.set(PART[0], lerp(PART[1] + 1.2, PART[1], settle(u, 1.2)), PART[2]);
        g.rotation.set(0, (1 - ease(u)) * 1.2, 0);
        g.scale.setScalar(Math.max(pop(slice(u, 0, 0.3)), 1e-4));
      }}
    >
      <Box accent size={PART_SIZE} r={0.008} />
      <Box accent size={[0.08, 0.02, 0.08]} position={[-0.12, 0.02, 0]} r={0.006} />
      <Box accent size={[0.08, 0.02, 0.08]} position={[0.02, 0.02, 0]} r={0.006} />
    </Act>
  );
}

// ── The carton ──────────────────────────────────────────────────────────────
// Origin at the bottom centre. 2.9 x 1 x 2. Two long flaps carry the halves of the tape.
const CW = 2.9;
const CH = 1;
const CD = 2;
export function Carton({ open }: { open: (p: Play) => number }) {
  const flap = (f: (g: THREE.Group, a: number) => void, children: ReactNode, pos: V3) => (
    <Act position={pos} f={(g, p) => f(g, open(p) * 2.5)}>
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
        <Box key={i} size={[0.6 - i * 0.14, 0.04, 0.012]} position={[0.82 - i * 0.07, 0.68 - i * 0.11, CD / 2 + 0.018]} r={0.004} />
      ))}
      {flap((g, a) => void (g.rotation.x = a), (
        <>
          <Box size={[CW - 0.04, 0.04, CD / 2]} position={[0, 0.02, -CD / 4]} r={0.015} />
          <Box accent size={[0.34, 0.012, CD / 2 - 0.01]} position={[0, 0.046, -CD / 4]} r={0.004} />
        </>
      ), [0, CH, CD / 2])}
      {flap((g, a) => void (g.rotation.x = -a), (
        <>
          <Box size={[CW - 0.04, 0.04, CD / 2]} position={[0, 0.02, CD / 4]} r={0.015} />
          <Box accent size={[0.34, 0.012, CD / 2 - 0.01]} position={[0, 0.046, CD / 4]} r={0.004} />
        </>
      ), [0, CH, -CD / 2])}
      {flap((g, a) => void (g.rotation.z = a * 0.95), <Box size={[0.5, 0.03, CD - 0.1]} position={[0.25, -0.02, 0]} r={0.012} />, [-CW / 2, CH, 0])}
      {flap((g, a) => void (g.rotation.z = -a * 0.95), <Box size={[0.5, 0.03, CD - 0.1]} position={[-0.25, -0.02, 0]} r={0.012} />, [CW / 2, CH, 0])}
    </group>
  );
}

// ── The phone ───────────────────────────────────────────────────────────────
// Origin at the bottom centre of its stand, screen towards +Z, leaning back a little.
export const PHONE_LEAN = -0.22;
export const PHONE_SCREEN: V3 = [0, 0.66, 0.04]; // centre of the screen, in the leaning frame
export function Phone({ screen, children }: { screen: (p: Play) => number; children?: ReactNode }) {
  const mat = useScreen(screen);
  return (
    <group>
      <Box size={[0.78, 0.06, 0.62]} position={[0, 0.03, 0]} r={0.03} />
      <Box size={[0.7, 0.07, 0.12]} position={[0, 0.095, 0.17]} r={0.03} />
      <group position={[0, 0.07, 0.06]} rotation={[PHONE_LEAN, 0, 0]}>
        <Box size={[0.66, 1.26, 0.07]} position={[0, 0.66, 0]} r={0.08} />
        <mesh position={[0, 0.69, 0.0365]} material={mat}>
          <planeGeometry args={[0.56, 1.02]} />
        </mesh>
        <Puck r={0.065} h={0.03} segments={20} position={[-0.18, 1.1, -0.045]} rotation={[HALF_PI, 0, 0]} />
        {children}
      </group>
    </group>
  );
}

/** What comes back: a tutorial card, numbered steps and their lines. Faces +Z. */
export function TutorialCard() {
  return (
    <group>
      <Box size={[0.56, 0.86, 0.025]} r={0.03} />
      {[0, 1, 2].map((i) => (
        <group key={i} position={[0, 0.26 - i * 0.26, 0.016]}>
          <Puck accent r={0.05} h={0.02} segments={16} position={[-0.18, 0, 0]} rotation={[HALF_PI, 0, 0]} />
          <Box size={[0.28, 0.035, 0.012]} position={[0.06, 0.03, 0]} r={0.006} />
          <Box size={[0.2 - i * 0.04, 0.035, 0.012]} position={[0.02 - i * 0.02, -0.035, 0]} r={0.006} />
        </group>
      ))}
    </group>
  );
}

/** The photo taken of the problem: a small print of the error screen. Faces +Z. */
export function PhotoCard() {
  const { mats } = useClay();
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ map: screenTextures()[SCREEN.error], color: mats.clay.color, roughness: 0.6 }), [mats]);
  useEffect(() => () => mat.dispose(), [mat]);
  return (
    <group>
      <Box size={[0.56, 0.4, 0.02]} r={0.02} />
      <mesh position={[0, 0, 0.0115]} material={mat}>
        <planeGeometry args={[0.48, 0.3]} />
      </mesh>
    </group>
  );
}

// ── The script ──────────────────────────────────────────────────────────────
/** A terminal standing on its foot: a prompt and lines of code, raised from the face. Origin on the floor. */
export function Script() {
  const lines = [[0.05, 0.9], [0.17, 0.7], [0.17, 0.82], [0.29, 0.46], [0.17, 0.62], [0.05, 0.36]];
  return (
    <group>
      <Box size={[1.1, 0.07, 0.6]} position={[0, 0.035, 0]} r={0.03} />
      <Box size={[0.16, 0.2, 0.1]} position={[0, 0.17, -0.05]} r={0.03} />
      <group position={[0, 0.94, -0.05]}>
        <Box size={[1.8, 1.24, 0.1]} r={0.05} />
        <Box size={[1.8, 0.02, 0.012]} position={[0, 0.45, 0.056]} r={0.004} />
        {[0, 1, 2].map((i) => (
          <Puck key={i} r={0.028} h={0.02} segments={12} position={[-0.78 + i * 0.09, 0.53, 0.055]} rotation={[HALF_PI, 0, 0]} />
        ))}
        {/* The prompt: a chevron */}
        <Box size={[0.12, 0.035, 0.02]} position={[-0.73, 0.33, 0.057]} rotation={[0, 0, -0.6]} r={0.008} />
        <Box size={[0.12, 0.035, 0.02]} position={[-0.73, 0.27, 0.057]} rotation={[0, 0, 0.6]} r={0.008} />
        {lines.map(([x, w], i) => (
          <Box key={i} size={[w, 0.045, 0.02]} position={[-0.62 + x + w / 2, 0.3 - i * 0.13, 0.057]} r={0.01} />
        ))}
      </group>
    </group>
  );
}

/** The dub: a sound wave in orange on a small plate. `on`: how much it is playing. Origin on the floor. */
export function Wave({ on }: { on: (p: Play) => number }) {
  const { play, mats } = useClay();
  const ref = useRef<THREE.InstancedMesh>(null);
  const N = 15;
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
      const h = 0.06 + env * (0.18 + 0.42 * live * Math.abs(Math.sin(t * 7.3 + i * 1.7) * Math.sin(t * 3.1 + i * 0.6)));
      o.position.set((i - (N - 1) / 2) * 0.11, 0.08 + h / 2, 0);
      o.scale.set(1, h, 1);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <group>
      <Box size={[1.9, 0.08, 0.5]} position={[0, 0.04, 0]} r={0.035} />
      <instancedMesh ref={ref} args={[geo, mats.accent, N]} castShadow receiveShadow frustumCulled={false} />
    </group>
  );
}

// ── The map of Brazil ───────────────────────────────────────────────────────
/** World units per map unit, and the map's centre. South towards the camera (+Z). */
export const MAP_K = 0.031;
export const toWorld = ([x, y]: [number, number], h = 0): V3 => [(x - MAP_W / 2) * MAP_K, h, (y - MAP_H / 2) * MAP_K];
// The five states no laptop went to (the owner's list). The Federal District is not a state and is
// not counted either way: it stays low and plain, and no box goes to it.
const NOT_REACHED = ['AC', 'AM', 'RR', 'AP', 'MS'];
export const stateKind = (uf: string) => (uf === 'DF' ? 'df' : NOT_REACHED.includes(uf) ? 'out' : 'lit');
export const REACHED = STATES.filter((s) => stateKind(s.uf) === 'lit');
export const H_LIT = 0.2;
const H_LOW = 0.07;

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

// Built once per page: 27 extruded outlines (a few thousand triangles in all).
let mapGeos: THREE.BufferGeometry[] | undefined;
function mapGeometries() {
  if (mapGeos) return mapGeos;
  const b = 0.012;
  mapGeos = STATES.map((st) => {
    const g = new THREE.ExtrudeGeometry(stateShape(st.d), { depth: (stateKind(st.uf) === 'lit' ? H_LIT : H_LOW) - 2 * b, bevelEnabled: true, bevelSize: b, bevelThickness: b, bevelOffset: -b, bevelSegments: 2 });
    g.rotateX(-HALF_PI);
    g.translate(0, b, 0);
    return g;
  });
  return mapGeos;
}

/** When the box for reached state `k` (0 = nearest to Salvador) lands, seconds into the step. */
export const landAt = (k: number) => 0.8 + k * 0.075;
const HOP = 0.5;

/** The states rise out of the page, nearest to Salvador first; each one reached stands up when its box lands. */
export function BrazilMap({ from }: { from: V3 }) {
  const { play, mats } = useClay();
  const states = useRef<(THREE.Mesh | null)[]>([]);
  const boxes = useRef<THREE.InstancedMesh>(null);
  const geos = mapGeometries();
  const box = useMemo(() => new RoundedBoxGeometry(0.17, 0.12, 0.13, 2, 0.025), []);
  useEffect(() => () => box.dispose(), [box]);
  const ends = useMemo(() => REACHED.map((s) => new THREE.Vector3(...toWorld(s.c, H_LIT))), []);
  const start = useMemo(() => new THREE.Vector3(...from), [from]);
  const o = useMemo(() => new THREE.Object3D(), []);
  useFrame(() => {
    const here = at(play, 4);
    const on = here > 0.001;
    const age = ageOf(play, 4);
    const arriving = play.to === 4;
    let lit = 0;
    for (let i = 0; i < STATES.length; i++) {
      const m = states.current[i];
      if (!m) continue;
      m.visible = on;
      if (!on) continue;
      const rank = i / STATES.length;
      const up = arriving ? pop(slice(age, 0.05 + rank * 0.35, 0.35 + rank * 0.35), 1.2) : ease(slice(here, 0.4 + (1 - rank) * 0.3, 1));
      let h = 1;
      if (stateKind(STATES[i].uf) === 'lit') {
        // Low until its box lands, then it stands up to full height.
        h = 0.35 + 0.65 * spring(age - landAt(lit) - HOP * 0.85, 2.2, 6);
        lit++;
      }
      m.scale.set(1, Math.max(up * h, 1e-4), 1);
    }
    const b = boxes.current;
    if (!b) return;
    b.visible = on;
    if (!on) return;
    for (let k = 0; k < REACHED.length; k++) {
      const u = slice(age, landAt(k) - HOP, landAt(k));
      const end = ends[k];
      o.position.lerpVectors(start, end, ease(u));
      o.position.y = lerp(start.y, end.y, u) + Math.sin(u * Math.PI) * (0.5 + start.distanceTo(end) * 0.28) + 0.06;
      o.rotation.set(0, (1 - u) * 3, 0);
      const s = slice(u, 0, 0.15) * here;
      // It squashes as it lands.
      const land = bump(slice(age - landAt(k), 0, 0.2)) * 0.3;
      o.scale.set(s * (1 + land), Math.max(s * (1 - land), 1e-4), s * (1 + land));
      o.updateMatrix();
      b.setMatrixAt(k, o.matrix);
    }
    b.instanceMatrix.needsUpdate = true;
  });
  return (
    <>
      {geos.map((g, i) => (
        <mesh key={STATES[i].uf} ref={(m) => void (states.current[i] = m)} geometry={g} material={mats.clay} castShadow receiveShadow />
      ))}
      <instancedMesh ref={boxes} args={[box, mats.accent, REACHED.length]} castShadow frustumCulled={false} />
    </>
  );
}
