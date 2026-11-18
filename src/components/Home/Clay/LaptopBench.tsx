// The repair bench (steps 2 and 3): the mat, the insides of the laptop, and every loose piece of
// the teardown. Everything here is in the laptop's own space while it stands on the mat (y = 0 is the
// top of the mat), with the base upside down: what was its bottom is now on top.
import { Line } from '@react-three/drei';
import { Children, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as THREE from 'three';
import { Act, ageOf, at, Box, ease, Puck, Rod, Slab, slice, Ticks, useClay, type Play, type V3 } from './kit';
import { COVER_SCREWS, Cover, D, HB, HINGE_SCREWS, LiveTag, ScrewShape } from './LaptopParts';
import { apart, APART, BACK, benchScale, N_PARTS, N_SCREWS, T, track, TURN, type Key6, type Win } from './teardown';

const HALF_PI = Math.PI / 2;
const lerp = THREE.MathUtils.lerp;
const HIDE = 1e-4;

/** The repair mat: thin, with round corners and a ruler printed along its front edge. Origin at the top centre. */
export const MAT: V3 = [5.7, 0.03, 4.4];
export const MAT_CENTER: V3 = [0, 0, -0.74]; // in the bench's space
const MAT_TICK: V3 = [0.012, 0.004, 0.06];
export function Mat({ size = MAT }: { size?: V3 }) {
  const { mats } = useClay();
  const [w, h, d] = size;
  const shape = useMemo(() => {
    const r = 0.2;
    const s = new THREE.Shape();
    s.moveTo(-w / 2 + r, -d / 2);
    s.lineTo(w / 2 - r, -d / 2);
    s.quadraticCurveTo(w / 2, -d / 2, w / 2, -d / 2 + r);
    s.lineTo(w / 2, d / 2 - r);
    s.quadraticCurveTo(w / 2, d / 2, w / 2 - r, d / 2);
    s.lineTo(-w / 2 + r, d / 2);
    s.quadraticCurveTo(-w / 2, d / 2, -w / 2, d / 2 - r);
    s.lineTo(-w / 2, -d / 2 + r);
    s.quadraticCurveTo(-w / 2, -d / 2, -w / 2 + r, -d / 2);
    return s;
  }, [w, d]);
  // A cutting mat: clearly darker than the clay, so every part has a silhouette on it, with a faint grid.
  const grid = useMemo(() => {
    const pts: V3[] = [];
    for (let x = -w / 2 + 0.45; x < w / 2 - 0.3; x += 0.5) pts.push([x, 0.002, -d / 2 + 0.2], [x, 0.002, d / 2 - 0.2]);
    for (let z = -d / 2 + 0.3; z < d / 2 - 0.25; z += 0.5) pts.push([-w / 2 + 0.2, 0.002, z], [w / 2 - 0.2, 0.002, z]);
    return pts;
  }, [w, d]);
  const rule = useMemo<[V3, V3]>(() => [[-w / 2 + 0.45, 0.001, d / 2 - 0.09], [w / 2 - 0.45, 0.001, d / 2 - 0.09]], [w, d]);
  return (
    <group>
      <Slab shape={shape} depth={h - 0.016} bevel={0.008} rotation={[-HALF_PI, 0, 0]} position={[0, 0.008 - h, 0]} material={mats.shade.mat} />
      <Ticks n={Math.round((w - 0.9) / 0.1) + 1} a={rule[0]} b={rule[1]} size={MAT_TICK} major={5} grow={2} along={2} />
      <group userData={{ overlay: true }}>
        <Line points={grid} segments color={mats.clay.color} lineWidth={0.7} transparent opacity={0.28} layers={1} />
      </group>
    </group>
  );
}

// ── The parts, each with its silhouette, its tone and one detail that names it ─
/** Mid grey, with three cells. */
function Battery() {
  const { mats } = useClay();
  return (
    <group>
      <Box size={[1.5, 0.08, 0.4]} r={0.02} material={mats.shade.mid} />
      {[-0.49, 0, 0.49].map((x) => (
        <Box key={x} size={[0.44, 0.01, 0.32]} position={[x, 0.044, 0]} r={0.008} />
      ))}
      <Box size={[0.12, 0.03, 0.06]} position={[0.42, 0.01, -0.22]} r={0.008} material={mats.shade.dark} />
    </group>
  );
}
/** Mid grey, with a dark grille. */
function Speaker() {
  const { mats } = useClay();
  return (
    <group>
      <Box size={[0.32, 0.05, 0.13]} r={0.02} material={mats.shade.mid} />
      {[-0.036, -0.012, 0.012, 0.036].map((z) => (
        <Box key={z} size={[0.22, 0.006, 0.012]} position={[0, 0.027, z]} r={0.003} material={mats.shade.dark} />
      ))}
    </group>
  );
}
/** A dark board with light chips and orange contacts. */
function Drive() {
  const { mats } = useClay();
  return (
    <group>
      <Box size={[0.48, 0.012, 0.15]} r={0.005} material={mats.shade.board} />
      <Box size={[0.14, 0.012, 0.1]} position={[-0.08, 0.01, 0]} r={0.004} />
      <Box size={[0.1, 0.012, 0.1]} position={[0.1, 0.01, 0]} r={0.004} />
      <Box accent size={[0.03, 0.006, 0.12]} position={[0.22, 0.007, 0]} r={0.002} />
    </group>
  );
}
const LEADS = [-1, 1].map((s) => new THREE.CatmullRomCurve3([new THREE.Vector3(s * 0.04, 0.012, -0.05), new THREE.Vector3(s * 0.07, 0.03, -0.2), new THREE.Vector3(s * 0.12, 0.02, -0.34)]));
/** A small dark card with its two antenna wires. */
function Wifi() {
  const { mats } = useClay();
  return (
    <group>
      <Box size={[0.17, 0.01, 0.16]} r={0.004} material={mats.shade.board} />
      {LEADS.map((path, i) => (
        <group key={i}>
          <Puck r={0.022} h={0.014} segments={10} position={[i ? 0.04 : -0.04, 0.009, -0.05]} />
          <Rod path={path} r={0.009} segments={12} material={mats.shade.dark} />
        </group>
      ))}
    </group>
  );
}
/** A dark stick with light chips and orange contacts along one edge. The new one is all orange. */
export function Ram({ accent }: { accent?: boolean }) {
  const { mats } = useClay();
  const board = accent ? mats.accent : mats.shade.board;
  return (
    <group>
      <Box size={[0.56, 0.014, 0.17]} r={0.005} material={board} />
      {[-0.18, -0.06, 0.06, 0.18].map((x) => (
        <Box key={x} size={[0.09, 0.01, 0.07]} position={[x, 0.01, -0.01]} r={0.003} material={accent ? mats.accent : mats.clay} />
      ))}
      <Box size={[0.5, 0.006, 0.026]} position={[0, 0.008, 0.07]} r={0.002} material={accent ? mats.clay : mats.accent} />
    </group>
  );
}
const PIPE = new THREE.CatmullRomCurve3([new THREE.Vector3(0.14, -0.006, 0), new THREE.Vector3(0.45, -0.012, -0.02), new THREE.Vector3(0.8, -0.012, -0.03)]);
const PIPE_FINS = new THREE.CatmullRomCurve3([new THREE.Vector3(0, -0.01, -0.16), new THREE.Vector3(0, -0.01, -0.33)]);
const FIN: V3 = [0.012, 0.06, 0.1];
/** The fan, dark blades in a light ring, with its heat pipe: to a plate that sits on the processor, and to the fins at the vent. */
export function Fan({ broken }: { broken?: boolean }) {
  const { mats } = useClay();
  return (
    <group>
      <Puck accent={broken} r={0.19} h={0.05} hole={0.165} segments={28} />
      <Puck r={0.19} h={0.008} segments={28} position={[0, -0.021, 0]} material={mats.shade.board} />
      <Puck r={0.05} h={0.04} segments={16} />
      {Array.from({ length: broken ? 5 : 7 }, (_, i) => (
        <Box key={i} size={[0.11, 0.01, 0.05]} r={0.004} material={mats.shade.dark} position={[Math.cos((i * Math.PI * 2) / 7) * 0.1, 0, Math.sin((i * Math.PI * 2) / 7) * 0.1]} rotation={[0.4, (-i * Math.PI * 2) / 7, 0]} />
      ))}
      {!broken && (
        <>
          <Rod path={PIPE} r={0.022} segments={20} />
          <Box size={[0.24, 0.012, 0.24]} position={[0.8, -0.008, -0.03]} r={0.006} />
          <Rod path={PIPE_FINS} r={0.022} segments={8} />
          <Box size={[0.36, 0.012, 0.11]} position={[0, -0.036, -0.36]} r={0.004} material={mats.shade.board} />
          <Ticks n={10} a={[-0.16, -0.01, -0.36]} b={[0.16, -0.01, -0.36]} size={FIN} major={99} along={0} />
        </>
      )}
    </group>
  );
}
// The crack on the broken fan: a zigzag across the housing, drawn over the clay.
const CRACK: V3[] = [[-0.16, 0.03, -0.08], [-0.08, 0.03, -0.02], [-0.1, 0.03, 0.04], [-0.01, 0.03, 0.08], [0.05, 0.03, 0.06], [0.13, 0.03, 0.12]];
export function Crack() {
  const { mats } = useClay();
  return (
    <group userData={{ overlay: true }}>
      <Line points={CRACK} color={mats.inkColor} lineWidth={2.2} layers={1} />
    </group>
  );
}

// ── Where every part is: inside the open base, and laid out on the mat ──────
// Laid out like a tidy bench: the screen and the cover behind the base, the big parts in a column on
// its left, the small ones in two on its right, the tools in front.
interface Part { at: V3; laid: V3; yaw?: number; lift: number; clip?: boolean; node: ReactNode }
// Removed in this order (the battery first, as it should be), put back in the reverse order.
const RAM_X = 1.86;
const SMALL_X = 2.5;
export const PARTS: Part[] = [
  { at: [0.05, 0.105, 0.45], laid: [-1.72, 0.04, 0], yaw: HALF_PI, lift: 0.85, node: <Battery /> },
  { at: [0.55, 0.093, -0.2], laid: [RAM_X, 0.007, -0.4], lift: 0.6, clip: true, node: <Ram /> },
  { at: [0.55, 0.093, -0.45], laid: [RAM_X, 0.007, -0.64], lift: 0.75, clip: true, node: <Ram /> },
  { at: [-0.7, 0.11, -0.32], laid: [-2.42, 0.042, -0.42], yaw: -HALF_PI, lift: 0.9, node: <Fan /> },
  { at: [-0.35, 0.092, -0.02], laid: [RAM_X, 0.006, 0.32], lift: 0.6, node: <Drive /> },
  { at: [0.15, 0.09, -0.02], laid: [SMALL_X, 0.005, 0.4], lift: 0.7, node: <Wifi /> },
  { at: [-1.0, 0.11, 0.55], laid: [SMALL_X, 0.025, -0.66], lift: 1, node: <Speaker /> },
  { at: [1.0, 0.11, 0.55], laid: [SMALL_X, 0.025, -0.46], lift: 0.7, node: <Speaker /> },
];
const OLD = 1; // the RAM stick that gets swapped
export const SPARE: V3 = [1.3, 0.007, 1.14]; // the new part on the mat; after the swap, the old one
const SPARE_TAG: V3 = [SPARE[0] + 0.24, 0.02, SPARE[2] - 0.06];
const TRAY: V3 = [0.15, 0, 1.16];
const DRIVER_REST: V3 = [-0.5, 0.09, 1.16];
const DRIVER_WAIT: V3 = [-1.8, 0.45, 0.95]; // held ready beside the laptop while something else moves
/** A screw's place in the tray: the screen's two in the middle, the cover's eight around them. */
const screwLaid = (n: number): V3 => {
  const r = n < 2 ? 0.07 : 0.185;
  const a = n < 2 ? n * Math.PI + 0.5 : (n - 2) * (Math.PI / 4) + 0.2;
  return [TRAY[0] + Math.cos(a) * r, 0.03, TRAY[2] + Math.sin(a) * r];
};
const RISE = 0.035; // how far a screw backs out of its hole
/** Each screw: in its hole, backed out of it, and in the tray. Upside down, a cover screw's place in the base is mirrored. */
const HINGE_PATH = HINGE_SCREWS.map((s, k): V3[] => [s, [s[0], s[1] + RISE, s[2]], screwLaid(k)]);
const COVER_PATH = COVER_SCREWS.map(([x, y, z], k): V3[] => [[-x, HB - y, z], [-x, HB - y + RISE, z], screwLaid(k + 2)]);
const COVER_AT: V3 = [0, HB - 0.0175, 0];
const COVER_LAID: V3 = [1.42, 0.0175, -2.0];
export const BOARD_Y = 0.075;

/** Open = the cover has started to come off: the insides are seen. */
const isOpen = (p: Play) => apart(p, T.cover) > 0;
const stepOf = (p: Play) => (p.t > 0.5 ? p.to : p.from);
const smooth = (u: number) => u * u * (3 - 2 * u);

/**
 * Carries `g` from `a` to `b` as `k` goes 0 to 1: up and over in an arc, tipping the way it goes,
 * with a small bounce where it lands. `yaw`: the turn it ends with. `from`: the flight starts there in `k`.
 */
function fly(g: THREE.Object3D, a: V3, b: V3, k: number, lift: number, yaw = 0, from = 0) {
  const u = slice(k, from, 0.82);
  const e = smooth(u);
  const land = slice(k, 0.82, 1);
  g.position.set(lerp(a[0], b[0], e), lerp(a[1], b[1], e) + Math.sin(u * Math.PI) * lift + Math.sin(land * Math.PI) * lift * 0.09, lerp(a[2], b[2], e));
  g.rotation.set(0, yaw * e, Math.sin(u * Math.PI * 2) * (b[0] < a[0] ? 0.2 : -0.2));
}

/** A part between its place in the laptop and its place on the mat. A RAM stick first springs up out of its clips. */
function carry(g: THREE.Object3D, part: Part, k: number) {
  fly(g, part.at, part.laid, k, part.lift, part.yaw, part.clip ? 0.2 : 0);
  if (!part.clip) return;
  const up = 0.5 * slice(k, 0, 0.2) * (1 - slice(k, 0.3, 0.7));
  g.rotation.x = up;
  g.position.y += Math.sin(up) * 0.085;
}

/** The job done, the tools are put away (from `at` seconds into step 3): the laptop starts again on a clear mat. */
const tidy = (p: Play, at: number) => (stepOf(p) === BACK ? 1 - ease(slice(ageOf(p, BACK), at, at + 0.16)) : 1);
const EMPTY = T.hinge[1][2] - 0.12; // the last screws are leaving the tray
/** Everything loose on the bench comes and goes with it, each thing on its own spot. `k`: its own share (the tools leave early). */
function loose(g: THREE.Object3D, p: Play, k = 1) {
  const s = benchScale(p) * k;
  g.visible = s > 0.001;
  g.scale.setScalar(Math.max(s, HIDE));
  return g.visible;
}

/** A screw's move: first it is turned out of its hole, then it jumps to the tray. */
function LooseScrew({ path, win }: { path: V3[]; win: Win }) {
  return (
    <Act
      f={(g, p) => {
        const k = apart(p, win);
        if (!loose(g, p) || !(g.visible = k > 0)) return;
        if (k < TURN) {
          const u = k / TURN;
          g.position.set(path[0][0], lerp(path[0][1], path[1][1], u), path[0][2]);
          g.rotation.set(0, u * Math.PI * 4, 0);
        } else fly(g, path[1], path[2], (k - TURN) / (1 - TURN), 0.4);
      }}
    >
      <ScrewShape />
    </Act>
  );
}

// The screwdriver's track. It skips from screw to screw like a stone on water: each screw it touches
// spins out and jumps to the tray (step 2), or is driven home as it gets there (step 3).
const LYING = HALF_PI;
/** Adds a run of screws to the track. Returns when it starts and ends turning: from just before the first screw to just after the last. */
function run(keys: Key6[], paths: V3[][], wins: Win[], out: boolean, outward = false): [number, number] {
  const first = keys.length;
  paths.forEach(([hole, up], i) => {
    const [a, , b, e] = wins[i];
    const prev = keys[keys.length - 1];
    const far = Math.hypot(hole[0] - prev[1], hole[2] - prev[3]);
    // It leans back from the way it is going; at the screen's screws it leans out, clear of the screen.
    const lean = outward ? (hole[0] < 0 ? 0.42 : -0.42) : i === 0 ? 0 : Math.sign(hole[0] - prev[1]) * 0.22;
    const top = (out ? hole : up)[1] + 0.006;
    keys.push([out ? a : b + e * (1 - TURN), hole[0], top, hole[2], lean, i === 0 ? 0 : Math.min(0.3, 0.06 + far * 0.1)]);
  });
  return [keys[first][0] - 0.1, keys[keys.length - 1][0] + 0.12];
}
const key = (t: number, [x, y, z]: V3, lean: number): Key6 => [t, x, y, z, lean, 0];
const LAST = COVER_PATH[N_SCREWS - 1][0];
const OUT_KEYS: Key6[] = [key(0.42, DRIVER_REST, LYING)];
const OUT_RUNS = [run(OUT_KEYS, HINGE_PATH, T.hinge, true, true)];
OUT_KEYS.push(key(1.14, DRIVER_WAIT, -0.3), key(T.screws[0][0] - 0.16, DRIVER_WAIT, -0.3));
OUT_RUNS.push(run(OUT_KEYS, COVER_PATH, T.screws, true));
OUT_KEYS.push(key(T.screws[N_SCREWS - 1][0] + 0.07, [LAST[0], LAST[1] + 0.1, LAST[2]], 0), key(T.screws[N_SCREWS - 1][0] + 0.45, DRIVER_REST, LYING));
const IN_KEYS: Key6[] = [key(T.screws[0][2] - 0.05, DRIVER_REST, LYING)];
const IN_RUNS = [run(IN_KEYS, COVER_PATH, T.screws, false)];
IN_KEYS.push(key(T.flip[2] + 0.1, DRIVER_WAIT, -0.3), key(T.hinge[0][2] - 0.02, DRIVER_WAIT, -0.3));
IN_RUNS.push(run(IN_KEYS, HINGE_PATH, T.hinge, false, true));
IN_KEYS.push(key(T.on + 0.3, DRIVER_REST, LYING));
const SPIN = Math.PI * 7; // radians a second

const FLUTES = [0, 1, 2, 3, 4, 5];
function Screwdriver() {
  const { mats } = useClay();
  const tip = useMemo(() => [0, 0, 0, 0], []);
  return (
    <Act
      f={(g, p) => {
        if (!loose(g, p, tidy(p, T.on))) return;
        const back = stepOf(p) === BACK;
        const a = ageOf(p, back ? BACK : APART);
        track(back ? IN_KEYS : OUT_KEYS, a, tip);
        const runs = back ? IN_RUNS : OUT_RUNS;
        let spin = 0;
        for (let i = 0; i < runs.length; i++) spin += THREE.MathUtils.clamp(a, runs[i][0], runs[i][1]) - runs[i][0];
        g.position.set(tip[0], tip[1], tip[2]);
        // It turns about its own shaft, however it leans.
        g.rotation.order = 'ZYX';
        g.rotation.set(0, spin * SPIN * (back ? -1 : 1), tip[3]);
      }}
    >
      <Puck r={0.012} h={0.06} segments={8} position={[0, 0.03, 0]} material={mats.shade.dark} />
      <Puck r={0.022} h={0.46} segments={10} position={[0, 0.28, 0]} material={mats.shade.mid} />
      <Puck r={0.05} h={0.08} bevel={0.02} segments={16} position={[0, 0.55, 0]} />
      <Puck r={0.085} h={0.42} bevel={0.04} segments={18} position={[0, 0.8, 0]} />
      {/* Flutes on the handle: without them nobody sees it turn */}
      {FLUTES.map((i) => (
        <Box key={i} size={[0.026, 0.3, 0.02]} r={0.008} position={[Math.sin((i * Math.PI) / 3) * 0.082, 0.8, Math.cos((i * Math.PI) / 3) * 0.082]} rotation={[0, (i * Math.PI) / 3, 0]} material={mats.shade.mid} />
      ))}
    </Act>
  );
}

/** A small dish for the screws, so none rolls away. */
function Tray() {
  const { mats } = useClay();
  return (
    <Act position={TRAY} f={(g, p) => void loose(g, p, tidy(p, EMPTY))}>
      <Puck r={0.3} h={0.016} segments={32} position={[0, 0.008, 0]} material={mats.shade.mid} />
      <Puck r={0.3} h={0.06} hole={0.265} segments={32} position={[0, 0.03, 0]} />
    </Act>
  );
}

const swapOf = (p: Play) => (p.to === BACK || p.from === BACK ? slice(ageOf(p, BACK), T.swap[0], T.swap[1]) : 0);
/** The motherboard, dark, with the processor and a chip in clay, two ribbon cables and the two RAM slots. */
function Board() {
  const { mats } = useClay();
  return (
    <>
      <Box size={[1.9, 0.02, 0.8]} position={[-0.1, BOARD_Y, -0.3]} r={0.006} material={mats.shade.board} />
      <Box size={[0.22, 0.014, 0.22]} position={[0.1, 0.092, -0.35]} r={0.005} />
      <Box size={[0.14, 0.012, 0.14]} position={[-0.2, 0.091, -0.56]} r={0.004} />
      <Box size={[0.08, 0.005, 0.22]} position={[0.45, 0.068, 0.15]} r={0.002} material={mats.shade.mid} />
      <Box size={[0.06, 0.005, 0.24]} position={[-0.4, 0.087, -0.62]} r={0.002} material={mats.shade.mid} />
      {[1, 2].map((i) => (
        <Box key={i} size={[0.6, 0.026, 0.03]} position={[PARTS[i].at[0], 0.096, PARTS[i].at[2] + 0.095]} r={0.006} material={mats.shade.mid} />
      ))}
    </>
  );
}

/** The base's eight screw posts, seen inside once the cover is off. */
function Posts() {
  const { mats } = useClay();
  const geo = useMemo(() => new THREE.CylinderGeometry(0.035, 0.035, 0.13, 14), []);
  useEffect(() => () => geo.dispose(), [geo]);
  const lay = (m: THREE.InstancedMesh | null) => {
    if (!m) return;
    const o = new THREE.Object3D();
    COVER_PATH.forEach(([hole], k) => {
      o.position.set(hole[0], 0.065 + 0.065, hole[2]);
      o.updateMatrix();
      m.setMatrixAt(k, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  };
  return <instancedMesh ref={lay} args={[geo, mats.clay, COVER_SCREWS.length]} castShadow receiveShadow />;
}

/**
 * Mounts its children a few at a time, in idle moments. The bench is ~150 meshes: built in one go they
 * held the main thread for ~50 ms when the stage mounted, and nothing on it is needed before step 2.
 */
function Staged({ children }: { children: ReactNode }) {
  const list = Children.toArray(children);
  const [n, setN] = useState(0);
  useEffect(() => {
    if (n >= list.length) return;
    const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 16));
    const cancel = window.cancelIdleCallback ?? window.clearTimeout;
    const id = idle(() => setN((k) => Math.min(list.length, k + 2)));
    return () => cancel(id);
  }, [n, list.length]);
  return <>{list.slice(0, n)}</>;
}

/** When part `i` has landed on the mat, in step 2. */
const laidAt = (i: number) => T.parts[i][0] + T.parts[i][1] * 0.8;
const over = ([x, y, z]: V3, dy: number, dz = 0): V3 => [x, y + dy, z + dz];

/** The whole bench. Put it where the laptop stands on the mat. */
export function Bench() {
  return (
    <Staged>
      {/* Inside the base: the board, the processor, a chip, the cables and the screw posts */}
      <Act
        f={(g, p) => {
          if (loose(g, p)) g.visible = isOpen(p);
        }}
      >
        <Board />
        <Posts />
      </Act>

      {/* The parts: out one by one onto the mat, back in the reverse order */}
      {PARTS.map((part, i) =>
        i === OLD ? null : (
          <Act
            key={i}
            f={(g, p) => {
              const k = apart(p, T.parts[i]);
              if (loose(g, p) && (g.visible = k > 0 || isOpen(p))) carry(g, part, k);
            }}
          >
            {part.node}
          </Act>
        ),
      )}
      {/* The old RAM stick: out with the others, then it is tossed aside as the new one takes its place */}
      <Act
        f={(g, p) => {
          const k = p.to === BACK || p.from === BACK ? 1 : apart(p, T.parts[OLD]);
          if (!loose(g, p, tidy(p, EMPTY)) || !(g.visible = k > 0 || isOpen(p))) return;
          const w = slice(swapOf(p), 0, 0.7);
          if (w > 0) fly(g, PARTS[OLD].laid, SPARE, w, 0.35, -0.4);
          else carry(g, PARTS[OLD], k);
        }}
      >
        <Ram />
      </Act>
      {/* The new one: it waits on the mat (it cannot keep still), jumps into the old one's place with a twirl, and goes in with the others */}
      <Act
        f={(g, p, time) => {
          const w = slice(swapOf(p), 0.3, 1);
          const k = w >= 1 ? apart(p, T.parts[OLD]) : 1;
          if (!loose(g, p) || !(g.visible = k > 0 || isOpen(p))) return;
          if (w >= 1) return carry(g, PARTS[OLD], k);
          fly(g, SPARE, PARTS[OLD].laid, w, 0.95, Math.PI * 2);
          if (w > 0) return;
          const hop = Math.max(0, Math.sin(time * 5.5)) ** 2 * slice(ageOf(p, APART), 0.9, 1.2) * at(p, APART);
          g.position.y += hop * 0.09;
          g.rotation.y = Math.sin(time * 5.5 - 0.6) * 0.1 * hop;
        }}
      >
        <Ram accent />
      </Act>

      {/* The cover: pried up at the front like a lid, then carried to the back of the mat */}
      <Act
        f={(g, p) => {
          const k = apart(p, T.cover);
          if (!loose(g, p) || !(g.visible = k > 0)) return;
          const pry = Math.sin(slice(k, 0, 0.6) * Math.PI) * 0.42;
          fly(g, COVER_AT, COVER_LAID, k, 0.7, 0, 0.16);
          g.position.y += Math.sin(pry) * (D / 2);
          g.rotation.set(-pry, 0, Math.PI + g.rotation.z);
        }}
      >
        <group position={[0, -0.0175, 0]}>
          <Cover />
        </group>
      </Act>
      {COVER_PATH.map((path, k) => (
        <LooseScrew key={k} path={path} win={T.screws[k]} />
      ))}
      {HINGE_PATH.map((path, k) => (
        <LooseScrew key={k} path={path} win={T.hinge[k]} />
      ))}
      <Tray />
      <Screwdriver />

      {/* Labels: each part is named as it lands (step 2), and the swap (step 3) */}
      <LiveTag at={over(PARTS[0].laid, 0.05, -0.75)} dx={0} dy={-18} on={on([APART], laidAt(0))}>Battery</LiveTag>
      <LiveTag at={over(PARTS[3].laid, 0.02, -0.2)} dx={0} dy={-18} on={on([APART], laidAt(3))}>Fan</LiveTag>
      <LiveTag at={over(PARTS[2].laid, 0.01, -0.09)} dx={0} dy={-18} on={on([APART], laidAt(2))}>RAM</LiveTag>
      <LiveTag at={over(PARTS[6].laid, 0.03, -0.07)} dx={0} dy={-18} on={on([APART], laidAt(N_PARTS - 1))}>Speakers</LiveTag>
      <LiveTag at={SPARE_TAG} dx={44} dy={-24} on={on([APART], 1)}>New part</LiveTag>
      <LiveTag at={SPARE_TAG} dx={44} dy={-24} on={oldTag}>Old part</LiveTag>
    </Staged>
  );
}

/** A label shown on step `steps` from `after` seconds in, gone as soon as the story moves. */
function on(steps: number[], after: number) {
  return (p: Play) => {
    const here = steps.includes(p.to) ? (steps.includes(p.from) ? 1 : slice(p.t, 0.8, 1)) : steps.includes(p.from) ? 1 - slice(p.t, 0, 0.15) : 0;
    return here * slice(steps.includes(p.to) ? p.age : p.was, after, after + 0.2);
  };
}
/** "Old part": from the swap until the tools are put away. */
const swapped = on([BACK], T.swap[1]);
const oldTag = (p: Play) => swapped(p) * (1 - slice(ageOf(p, BACK), EMPTY - 0.15, EMPTY));
