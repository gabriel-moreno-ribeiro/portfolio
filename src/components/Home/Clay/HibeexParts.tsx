// The HIBEEX models, in clay: the three bees (its agents; the mark is a bee with a hexagon for a
// body), the hive, the hexagonal mat it all happens on, the source systems, the people the work goes
// back to, and the three results. Models that do not move inside themselves are one painted mesh.
import { Line } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Act, ageOf, at, Box, bump, clamp01, ease, pop, Puck, puckGeometry, Slab, slice, useClay, type Mats, type Play, type V3 } from './kit';

const HALF_PI = Math.PI / 2;
const lerp = THREE.MathUtils.lerp;
const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 3.7) * 43758.5453;
  return x - Math.floor(x);
};

// ── Painted models ──────────────────────────────────────────────────────────
// Every mesh is drawn again in each pass of a frame (colour, occlusion, shadow, contact shadow). So a
// model is one mesh: its pieces are merged once and each keeps its colour in the vertices.
const PAINT = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 });
const BLACK = new THREE.Color('#1d1714');
const WHITE = new THREE.Color('#fbf8f4');
interface Piece { g: THREE.BufferGeometry; c: THREE.Color; p?: V3; r?: V3; s?: V3; flat?: boolean }

function paint(pieces: Piece[]) {
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const v = new THREE.Vector3();
  const k = new THREE.Vector3();
  const done = pieces.map(({ g, c, p, r, s, flat }) => {
    const n = g.index ? g.toNonIndexed() : g;
    if (n !== g) g.dispose();
    if (flat) n.computeVertexNormals();
    n.applyMatrix4(m.compose(v.set(...(p ?? [0, 0, 0])), q.setFromEuler(e.set(...(r ?? [0, 0, 0]))), k.set(...(s ?? [1, 1, 1]))));
    const col = new Float32Array(n.attributes.position.count * 3);
    for (let i = 0; i < col.length; i += 3) c.toArray(col, i);
    n.setAttribute('color', new THREE.BufferAttribute(col, 3));
    return n;
  });
  const out = mergeGeometries(done)!;
  done.forEach((d) => d.dispose());
  return out;
}
/** A painted geometry in this theme's clay, disposed with it. */
function usePainted(build: (mats: Mats) => THREE.BufferGeometry) {
  const { mats } = useClay();
  const geo = useMemo(() => build(mats), [mats]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => geo.dispose(), [geo]);
  return geo;
}
const rbox = (w: number, h: number, d: number, r: number) => new RoundedBoxGeometry(w, h, d, 2, r);
/** A round stick from `a` to `b`. */
function stick(a: V3, b: V3, r: number, c: THREE.Color, segments = 8): Piece {
  const va = new THREE.Vector3(...a);
  const d = new THREE.Vector3(...b).sub(va);
  const e = new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize()));
  return { g: puckGeometry(r, d.length(), r * 0.9, segments), c, p: va.addScaledVector(d, 0.5).toArray() as V3, r: [e.x, e.y, e.z] };
}

// ── The bees ────────────────────────────────────────────────────────────────
// The mark, in clay: a hexagon for a body, a dark head with two antennae, two wings a side. They look
// forward along +Z. Three of them are two draw calls: the bodies and the wings.
function beeGeometry(mats: Mats) {
  const dark = BLACK;
  const antenna = (s: number): Piece[] => [
    stick([s * 0.07, 0.17, 0.27], [s * 0.16, 0.37, 0.39], 0.017, dark, 6),
    { g: new THREE.SphereGeometry(0.046, 10, 8), c: dark, p: [s * 0.165, 0.385, 0.4] },
  ];
  const eye = (s: number): Piece[] => [
    { g: new THREE.SphereGeometry(0.082, 14, 10), c: WHITE, p: [s * 0.098, 0.07, 0.38] },
    { g: new THREE.SphereGeometry(0.042, 10, 8), c: dark, p: [s * 0.102, 0.078, 0.443] },
  ];
  return paint([
    { g: puckGeometry(0.3, 0.3, 0.07, 6), c: mats.accent.color, p: [0, 0, -0.13], flat: true },
    { g: rbox(0.535, 0.315, 0.075, 0.035), c: dark, p: [0, 0, -0.05] },
    { g: rbox(0.535, 0.315, 0.075, 0.035), c: dark, p: [0, 0, -0.23] },
    { g: new THREE.ConeGeometry(0.055, 0.17, 8), c: dark, p: [0, 0, -0.47], r: [-HALF_PI, 0, 0] },
    { g: new THREE.SphereGeometry(0.2, 20, 14), c: dark, p: [0, 0.02, 0.25], s: [1.12, 0.92, 1] },
    ...eye(-1),
    ...eye(1),
    ...antenna(-1),
    ...antenna(1),
  ]);
}
/** The two wings of the right side, from their root: the big one swept forward, the small one back. */
function wingGeometry(mats: Mats) {
  const c = mats.clay.color;
  return paint([
    { g: new THREE.SphereGeometry(1, 14, 8), c, p: [0.33, 0, 0.12], r: [0, -0.35, 0], s: [0.35, 0.022, 0.15] },
    { g: new THREE.SphereGeometry(1, 12, 8), c, p: [0.22, 0, -0.1], r: [0, 0.42, 0], s: [0.25, 0.02, 0.105] },
  ]);
}

/** Where a bee is: place, heading (`yaw` about Y, `pitch` nose down, `roll`), size, and how hard its wings beat (0..1). */
export interface Bee { x: number; y: number; z: number; yaw: number; pitch: number; roll: number; s: number; flap: number }
export const bee = (): Bee => ({ x: 0, y: 0, z: 0, yaw: 0, pitch: 0, roll: 0, s: 1, flap: 1 });

/** `n` bees. `pose` writes where bee `b` is right now. */
export function Swarm({ n, pose }: { n: number; pose: (b: number, play: Play, o: Bee) => void }) {
  const { play } = useClay();
  const bodies = useRef<THREE.InstancedMesh>(null);
  const wings = useRef<THREE.InstancedMesh>(null);
  const body = usePainted(beeGeometry);
  const wing = usePainted(wingGeometry);
  const tmp = useMemo(() => ({ o: new THREE.Object3D(), w: new THREE.Object3D(), m: new THREE.Matrix4(), b: bee() }), []);
  useFrame(({ clock }) => {
    const { o, w, m, b } = tmp;
    if (!bodies.current || !wings.current) return;
    o.rotation.order = 'YXZ';
    for (let i = 0; i < n; i++) {
      pose(i, play, b);
      o.position.set(b.x, b.y, b.z);
      o.rotation.set(b.pitch, b.yaw, b.roll);
      o.scale.setScalar(Math.max(b.s, 1e-4));
      o.updateMatrix();
      bodies.current.setMatrixAt(i, o.matrix);
      // Beating in the air, folded back and almost still when it sits.
      const a = lerp(-0.12, 0.3 + 0.6 * Math.sin(clock.elapsedTime * 48 + i * 1.7), clamp01(b.flap));
      for (let side = 0; side < 2; side++) {
        w.position.set(side ? -0.2 : 0.2, 0.15, -0.03);
        w.rotation.set(0, 0, side ? Math.PI - a : a);
        w.updateMatrix();
        wings.current.setMatrixAt(i * 2 + side, m.multiplyMatrices(o.matrix, w.matrix));
      }
    }
    bodies.current.instanceMatrix.needsUpdate = true;
    wings.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <>
      <instancedMesh ref={bodies} args={[body, PAINT, n]} castShadow receiveShadow frustumCulled={false} />
      <instancedMesh ref={wings} args={[wing, PAINT, n * 2]} castShadow frustumCulled={false} />
    </>
  );
}

/** What the collections bee holds under it: a stamp. Its face is at y = -TOOL. */
export const TOOL = 0.5;
export function Stamp() {
  const { mats } = useClay();
  return (
    <group>
      <Puck r={0.045} h={0.26} segments={12} position={[0, -0.3, 0]} />
      <Puck r={0.15} h={0.1} bevel={0.03} segments={24} position={[0, -TOOL + 0.05, 0]} material={mats.shade.board} />
    </group>
  );
}
/** What the contracts bee holds: a pen, its tip at y = -TOOL. */
export function Pen() {
  const { mats } = useClay();
  return (
    <group position={[0, -TOOL, 0]} rotation={[0, 0, -0.3]}>
      <mesh position={[0, 0.045, 0]} rotation={[Math.PI, 0, 0]} material={mats.shade.board}>
        <coneGeometry args={[0.04, 0.09, 12]} />
      </mesh>
      <Puck r={0.04} h={0.3} bevel={0.012} segments={12} position={[0, 0.24, 0]} />
    </group>
  );
}

// ── The hive, the mat ───────────────────────────────────────────────────────
const HIVE_R = 0.85;
export const HIVE_H = HIVE_R * Math.sqrt(3); // flat to flat: it stands on a flat
const HIVE_D = 0.8;
function hexPath<T extends THREE.Path>(path: T, r: number) {
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    if (i) path.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    else path.moveTo(r, 0);
  }
  path.closePath();
  return path;
}
/** HIBEEX: a hexagon to go through. Raw data goes in one side and comes out the other. `pulse` (0..1) makes it swallow. Origin: on the floor, in the middle; open along Z. */
export function Hive({ pulse }: { pulse: (p: Play) => number }) {
  const shape = useMemo(() => {
    const s = hexPath(new THREE.Shape(), HIVE_R - 0.04);
    s.holes.push(hexPath(new THREE.Path(), HIVE_R - 0.27));
    return s;
  }, []);
  return (
    <Act
      f={(g, p) => {
        const k = pulse(p);
        g.scale.set(1 + 0.07 * k, 1 - 0.07 * k, 1);
      }}
    >
      <Slab accent shape={shape} depth={HIVE_D - 0.08} bevel={0.04} position={[0, HIVE_H / 2, -HIVE_D / 2 + 0.04]} />
    </Act>
  );
}

/** What it all happens on: a hexagonal mat, clearly darker than the clay, with a faint honeycomb drawn on it. */
export function HexMat({ r, h }: { r: number; h: number }) {
  const { mats } = useClay();
  const geo = useMemo(() => new THREE.CylinderGeometry(r, r, h, 6).rotateY(Math.PI / 6), [r, h]);
  useEffect(() => () => geo.dispose(), [geo]);
  const comb = useMemo(() => {
    const pts: V3[] = [];
    const c = 0.62; // a cell, corner to centre
    const inside = (x: number, z: number) => Math.abs(z) < r * 0.866 - 0.12 && Math.abs(z) * 0.5 + Math.abs(x) * 0.866 < r * 0.866 - 0.12;
    for (let row = -8; row <= 8; row++)
      for (let col = -8; col <= 8; col++) {
        const x = (col + (row & 1) * 0.5) * c * Math.sqrt(3);
        const z = row * c * 1.5;
        // Three sides of each cell: the neighbours draw the rest.
        for (let k = 0; k < 3; k++) {
          const a = (k / 6) * Math.PI * 2 + Math.PI / 6;
          const b = a + Math.PI / 3;
          const p: V3 = [x + Math.cos(a) * c, h / 2 + 0.002, z + Math.sin(a) * c];
          const q: V3 = [x + Math.cos(b) * c, h / 2 + 0.002, z + Math.sin(b) * c];
          if (inside(p[0], p[2]) && inside(q[0], q[2])) pts.push(p, q);
        }
      }
    return pts;
  }, [r, h]);
  return (
    <group>
      <mesh geometry={geo} material={mats.shade.mat} receiveShadow />
      <group userData={{ overlay: true }}>
        <Line points={comb} segments color={mats.clay.color} lineWidth={0.8} transparent opacity={0.22} layers={1} />
      </group>
    </group>
  );
}

// ── Source systems ──────────────────────────────────────────────────────────
function monitorGeometry(mats: Mats) {
  const clay = mats.clay.color;
  const screen = mats.shade.board.color;
  const line = mats.shade.mid.color;
  const rows: Piece[] = [0, 1, 2, 3].map((r) => ({ g: new THREE.BoxGeometry(0.86 - (r % 2) * 0.22, 0.05, 0.02), c: line, p: [-(r % 2) * 0.11, 0.9 - r * 0.115, 0.05] }));
  return paint([
    { g: rbox(1.2, 0.84, 0.1, 0.045), c: clay, p: [0, 0.8, 0] },
    { g: new THREE.BoxGeometry(1.04, 0.68, 0.02), c: screen, p: [0, 0.8, 0.043] },
    { g: new THREE.BoxGeometry(0.36, 0.07, 0.02), c: clay, p: [-0.25, 1.045, 0.05] },
    ...rows,
    { g: new THREE.BoxGeometry(0.16, 0.36, 0.07), c: clay, p: [0, 0.25, -0.03] },
    { g: rbox(0.62, 0.07, 0.36, 0.03), c: clay, p: [0, 0.035, 0] },
  ]);
}
/** The systems accounting firms already use: a screen each, with a table on it. Each gives a little as its data leaves. */
export function Systems({ xs, on }: { xs: number[]; on: number }) {
  const { play } = useClay();
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = usePainted(monitorGeometry);
  const o = useMemo(() => new THREE.Object3D(), []);
  useFrame(() => {
    const m = ref.current;
    if (!m || at(play, on) <= 0) return;
    const age = ageOf(play, on);
    for (let i = 0; i < xs.length; i++) {
      const squeeze = 0.07 * bump(slice((age * 1.4 + i * 0.25) % 1, 0, 0.45));
      o.position.set(xs[i], 0, 0);
      o.rotation.set(0, -xs[i] * 0.07, 0);
      o.scale.set(1 + squeeze * 0.5, 1 - squeeze, 1);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[geo, PAINT, xs.length]} castShadow receiveShadow frustumCulled={false} />;
}

// ── Paper at rest ───────────────────────────────────────────────────────────
const SHEET = 0.016; // a sheet in a pile
/** Piles of `n` plain sheets, a little out of square, at each of `spots`. The live sheets land on top. */
export function Reams({ spots, n }: { spots: V3[]; n: number }) {
  const { mats } = useClay();
  const geo = useMemo(() => new THREE.BoxGeometry(0.62, 0.013, 0.84), []);
  useEffect(() => () => geo.dispose(), [geo]);
  const lay = (m: THREE.InstancedMesh | null) => {
    if (!m) return;
    const o = new THREE.Object3D();
    spots.forEach(([x, y, z], k) => {
      for (let i = 0; i < n; i++) {
        o.position.set(x + Math.sin(i * 7.3 + k) * 0.006, y + SHEET / 2 + i * SHEET, z + Math.cos(i * 4.1 + k) * 0.006);
        o.rotation.set(0, Math.sin(i * 12.9 + k) * 0.012, 0);
        o.updateMatrix();
        m.setMatrixAt(k * n + i, o.matrix);
      }
    });
    m.instanceMatrix.needsUpdate = true;
  };
  return <instancedMesh ref={lay} args={[geo, mats.clay, spots.length * n]} castShadow receiveShadow />;
}
/** Height of a pile of `n` sheets. */
export const reamTop = (n: number) => n * SHEET;

/** A tray: three walls, open towards -X where the paper comes from. */
export function Tray() {
  return (
    <group>
      <Box size={[0.86, 0.05, 1.08]} position={[0, 0.025, 0]} r={0.02} />
      <Box size={[0.86, 0.2, 0.05]} position={[0, 0.1, 0.54]} r={0.02} />
      <Box size={[0.86, 0.2, 0.05]} position={[0, 0.1, -0.54]} r={0.02} />
      <Box size={[0.05, 0.2, 1.08]} position={[0.43, 0.1, 0]} r={0.02} />
    </group>
  );
}
export const TRAY_FLOOR = 0.05;

// ── The people ──────────────────────────────────────────────────────────────
function personGeometry(mats: Mats, kind: number) {
  const body = mats.shade.mid.color;
  const hair = mats.shade.dark.color;
  const arm = (s: number) => stick([s * 0.34, 1.08, 0.04], [s * 0.27, 0.6, 0.42], 0.078, body, 10);
  // Short hair, a bun, or hair down to the neck: tipped back off the forehead.
  const cut: Piece[] =
    kind === 2
      ? [{ g: new THREE.SphereGeometry(0.272, 22, 14, 0, Math.PI * 2, 0, Math.PI * 0.6), c: hair, p: [0, 1.58, -0.02], r: [-0.85, 0, 0] }]
      : [{ g: new THREE.SphereGeometry(0.264, 22, 10, 0, Math.PI * 2, 0, Math.PI * 0.42), c: hair, p: [0, 1.585, -0.015], r: [-0.5, 0, 0] }];
  if (kind === 1) cut.push({ g: new THREE.SphereGeometry(0.115, 14, 10), c: hair, p: [0, 1.86, -0.1] });
  return paint([
    { g: puckGeometry(0.31, 1.3, 0.29, 22), c: body, p: [0, 0.65, 0] },
    arm(-1),
    arm(1),
    { g: new THREE.SphereGeometry(0.25, 26, 18), c: mats.clay.color, p: [0, 1.58, 0] },
    ...cut,
    { g: new THREE.SphereGeometry(0.03, 8, 6), c: BLACK, p: [-0.09, 1.6, 0.232] },
    { g: new THREE.SphereGeometry(0.03, 8, 6), c: BLACK, p: [0.09, 1.6, 0.232] },
    { g: new THREE.TorusGeometry(0.07, 0.013, 6, 14, Math.PI), c: BLACK, p: [0, 1.545, 0.238], r: [0, 0, Math.PI] },
  ]);
}
/** The people who look after the business, standing behind their desk, facing us. `react(i)` is 0..1: glad of what just landed. */
export function People({ xs, react }: { xs: number[]; react: (i: number, p: Play) => number }) {
  const { play, mats } = useClay();
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const geos = useMemo(() => xs.map((_, i) => personGeometry(mats, i)), [mats, xs]);
  useEffect(() => () => geos.forEach((g) => g.dispose()), [geos]);
  useFrame(({ clock }) => {
    for (let i = 0; i < xs.length; i++) {
      const o = refs.current[i];
      if (!o) continue;
      const r = react(i, play);
      const breath = Math.sin(clock.elapsedTime * 1.9 + i * 2.3) * 0.008;
      o.position.set(xs[i], 0.1 * r, 0);
      o.rotation.set(0.1 * r, 0, Math.sin(clock.elapsedTime * 1.1 + i) * 0.015);
      o.scale.set(1 - 0.04 * r - breath, 1 + 0.06 * r + breath, 1 - 0.04 * r);
    }
  });
  return (
    <>
      {geos.map((g, i) => (
        <mesh key={i} ref={(m) => void (refs.current[i] = m)} geometry={g} material={PAINT} castShadow receiveShadow />
      ))}
    </>
  );
}

// ── The result ──────────────────────────────────────────────────────────────
// Each number is earned in front of you. `on`: the step they belong to. Origins: bottom centre.
const growing = (play: Play, on: number, a = 0.3, b = 0.6) => (play.to === on ? pop(slice(play.age, a, b), 1.4) : ease(slice(at(play, on), 0.6, 1)));
/** A result made of many pieces leaves in one piece: it shrinks where it stands. */
const leaving = (play: Play, on: number) => (play.to === on ? 1 : Math.max(ease(slice(at(play, on), 0.6, 1)), 1e-4));

function clockGeometry(mats: Mats) {
  const ticks: Piece[] = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    return { g: new THREE.BoxGeometry(0.03, i % 3 ? 0.07 : 0.12, 0.02), c: mats.shade.board.color, p: [Math.sin(a) * 0.79, Math.cos(a) * 0.79, 0.055], r: [0, 0, -a] };
  });
  return paint([
    { g: puckGeometry(0.92, 0.1, 0.03, 44), c: mats.clay.color, r: [HALF_PI, 0, 0] },
    ...ticks,
    { g: rbox(0.9, 0.08, 0.5, 0.03), c: mats.clay.color, p: [0, -0.9, -0.12] },
  ]);
}
const CLOCK_R = 0.92;
/**
 * `from` hours of work became `to`: a clock with `from` hours marked on it. The hand runs back to
 * `to`; the hours it passes go pale and flat, and the ones left turn orange.
 */
export function Clock({ p, from, to, on }: { p: V3; from: number; to: number; on: number }) {
  const { play, mats } = useClay();
  const ref = useRef<THREE.InstancedMesh>(null);
  const hand = useRef<THREE.Group>(null);
  const face = usePainted(clockGeometry);
  const { geo, mat } = useMemo(() => {
    const a0 = HALF_PI - 0.035;
    const a1 = HALF_PI - Math.PI / 6 + 0.035;
    const s = new THREE.Shape();
    s.absarc(0, 0, 0.7, a0, a1, true);
    s.absarc(0, 0, 0.24, a1, a0, false);
    return { geo: new THREE.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: false, curveSegments: 8 }), mat: new THREE.MeshStandardMaterial({ roughness: 0.9 }) };
  }, []);
  useEffect(
    () => () => {
      geo.dispose();
      mat.dispose();
    },
    [geo, mat],
  );
  const o = useMemo(() => new THREE.Object3D(), []);
  useFrame(() => {
    const m = ref.current;
    if (!m) return;
    const a = ageOf(play, on);
    // The hand: out to `from` as the hours are marked, then back to `to`.
    const hours = from * ease(slice(a, 0.45, 0.95)) - (from - to) * ease(slice(a, 1.25, 2.0));
    if (hand.current) hand.current.rotation.z = (-hours * Math.PI) / 6;
    const back = a > 1.1;
    for (let i = 0; i < from; i++) {
      const marked = pop(slice(a, 0.45 + (i / from) * 0.5, 0.6 + (i / from) * 0.5), 1.6);
      const cut = i >= to && back ? ease(clamp01((i + 1 - hours) * 2)) : 0;
      const kept = i < to ? bump(slice(a, 2.0 + i * 0.08, 2.4 + i * 0.08)) : 0;
      o.position.set(0, 0, 0.05);
      o.rotation.set(0, 0, (-i * Math.PI) / 6);
      o.scale.set(marked, marked, Math.max(marked * (1 - 0.8 * cut) * (1 + 0.8 * kept), 1e-3));
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      m.setColorAt(i, i < to && a > 2.0 + i * 0.08 ? mats.accent.color : cut > 0.5 ? mats.shade.mid.color : mats.shade.board.color);
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });
  return (
    <Act
      position={p}
      f={(g, pl) => {
        const s = growing(pl, on);
        g.visible = s > 0.001;
        g.scale.setScalar(Math.max(s, 1e-4));
      }}
    >
      <group position={[0, CLOCK_R + 0.02, 0]} rotation={[-0.16, 0, 0]}>
        <mesh geometry={face} material={PAINT} castShadow receiveShadow />
        <instancedMesh ref={ref} args={[geo, mat, from]} frustumCulled={false} />
        <group ref={hand} position={[0, 0, 0.11]}>
          <Box accent size={[0.07, 0.66, 0.04]} r={0.018} position={[0, 0.27, 0]} />
          <Puck accent r={0.085} h={0.05} bevel={0.015} segments={18} rotation={[HALF_PI, 0, 0]} />
        </group>
      </group>
    </Act>
  );
}

const BAND = 0.07; // the binding on top of a calendar pad
/** A whole pad of a tear-off calendar, `h` tall: what it was before. */
export function Pad({ p, w, h, on }: { p: V3; w: number; h: number; on: number }) {
  const { mats } = useClay();
  return (
    <Act
      position={p}
      f={(g, play) => {
        const s = growing(play, on, 0.34, 0.7);
        g.visible = s > 0.001;
        g.scale.set(Math.min(s, 1), s, Math.min(s, 1));
      }}
    >
      <Box size={[w, h, w]} r={0.04} position={[0, h / 2, 0]} />
      <Box size={[w, BAND, w]} r={0.02} position={[0, h + BAND / 2, 0]} material={mats.shade.board} />
    </Act>
  );
}

/** `days` as a pad of calendar pages, one per day (the top one is the odd fraction): they are torn off from the top and fly away until `keep` are left. */
export function Calendar({ p, w = 1, h, days, keep, on }: { p: V3; w?: number; h: number; days: number; keep: number; on: number }) {
  const { play, mats } = useClay();
  const ref = useRef<THREE.InstancedMesh>(null);
  const band = useRef<THREE.Mesh>(null);
  const n = Math.ceil(days);
  const pitch = h / days;
  const geo = useMemo(() => new RoundedBoxGeometry(w, pitch * 0.8, w, 1, 0.012), [w, pitch]);
  useEffect(() => () => geo.dispose(), [geo]);
  const o = useMemo(() => new THREE.Object3D(), []);
  useFrame(() => {
    const m = ref.current;
    if (!m) return;
    const here = at(play, on);
    m.visible = here > 0.001;
    if (band.current) band.current.visible = m.visible;
    if (!m.visible) return;
    const a = ageOf(play, on);
    const whole = leaving(play, on);
    m.scale.setScalar(whole);
    let top = 0;
    for (let j = 0; j < n; j++) {
      const thick = Math.min(1, days - j);
      const size = play.to === on ? pop(slice(a, 0.3 + (j / n) * 0.35, 0.47 + (j / n) * 0.35), 1.3) : 1;
      // The top of page j is exactly j + 1 days high.
      o.position.set(0, (j + thick) * pitch - pitch * 0.4 * thick, 0);
      o.rotation.set(0, 0, 0);
      o.scale.set(size, size * thick, size);
      const fly = j >= keep ? clamp01((a - 0.95 - (n - 1 - j) * 0.021) / 0.55) : 0;
      if (fly > 0) {
        const side = hash(j) - 0.5;
        o.position.x += fly * (0.6 + hash(j + 9)) * side * 0.8;
        o.position.y += Math.sin(fly * Math.PI) * 0.3;
        o.position.z += fly * (0.7 + hash(j + 5) * 1.1);
        o.rotation.set(fly * 5 * (hash(j + 2) - 0.3), fly * 3 * side, fly * 4 * side);
        o.scale.multiplyScalar(Math.max(1 - fly ** 2, 1e-4));
      } else if (size > 0.5) top = (j + thick) * pitch;
      o.updateMatrix();
      m.setMatrixAt(j, o.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
    // The binding rides on whatever pages are left.
    band.current?.position.setY((top + BAND / 2) * whole);
    band.current?.scale.setScalar(whole * (play.to === on ? Math.min(1, pop(slice(a, 0.3, 0.6), 1.3)) : 1));
  });
  return (
    <group position={p}>
      <instancedMesh ref={ref} args={[geo, mats.accent, n]} castShadow receiveShadow frustumCulled={false} />
      <Box ref={band} size={[w, BAND, w]} r={0.02} material={mats.shade.board} />
    </group>
  );
}

const CELL = 0.115; // a cell of the comb, corner to centre
export const COMB_H = (9 * 1.5 + 2) * CELL;
/**
 * A honeycomb of 100 cells, standing. They arrive in clay, then `n` of them turn over to orange
 * one after the other, filling up from the bottom row.
 */
export function Honeycomb({ n, on, p }: { n: number; on: number; p: V3 }) {
  const { play, mats } = useClay();
  const ref = useRef<THREE.InstancedMesh>(null);
  const { geo, mat } = useMemo(() => ({ geo: new THREE.CylinderGeometry(CELL - 0.012, CELL - 0.012, 0.09, 6).rotateX(HALF_PI), mat: new THREE.MeshStandardMaterial({ roughness: 0.9 }) }), []);
  useEffect(
    () => () => {
      geo.dispose();
      mat.dispose();
    },
    [geo, mat],
  );
  const o = useMemo(() => new THREE.Object3D(), []);
  useFrame(() => {
    const m = ref.current;
    if (!m) return;
    const here = at(play, on);
    m.visible = here > 0.001;
    if (!m.visible) return;
    const a = ageOf(play, on);
    m.scale.setScalar(leaving(play, on));
    for (let i = 0; i < 100; i++) {
      const col = i % 10;
      const row = Math.floor(i / 10);
      const size = play.to === on ? pop(slice(a, 0.3 + (i / 100) * 0.3, 0.5 + (i / 100) * 0.3), 1.4) : 1;
      const flip = i < n ? ease(slice(a, 0.85 + row * 0.085 + col * 0.035, 1.15 + row * 0.085 + col * 0.035)) : 0;
      o.position.set((col - 4.75 + (row & 1) * 0.5) * CELL * Math.sqrt(3), (row * 1.5 + 1) * CELL, bump(flip) * 0.14);
      o.rotation.set(flip * Math.PI, 0, 0);
      o.scale.setScalar(Math.max(size, 1e-4));
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      m.setColorAt(i, flip > 0.5 ? mats.accent.color : mats.clay.color);
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[geo, mat, 100]} position={p} rotation={[-0.14, 0, 0]} castShadow receiveShadow frustumCulled={false} />;
}
