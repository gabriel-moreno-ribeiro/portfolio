// The repair bench (taking apart, the photo, putting back): the mat, the insides of the laptop, and
// every loose piece. Everything here is in the laptop's own space while it stands on the mat (y = 0 is
// the top of the mat), with the base upside down: what was its bottom is now on top.
import { Line } from '@react-three/drei';
import { Children, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as THREE from 'three';
import { Act, ageOf, at, Box, ease, pop, Puck, ring, Rod, Slab, slice, Ticks, useClay, type Play, type V3 } from './kit';
import { COVER_SCREWS, Cover, D, HB, HINGE_SCREWS, LiveTag, ScrewShape } from './LaptopParts';
import { apart, APART, BACK, benchScale, N_SCREWS, OPENED, PHOTO, SHOT, stepOf, T, track, TURN, type Key6, type Win } from './teardown';

const HALF_PI = Math.PI / 2;
const lerp = THREE.MathUtils.lerp;
const HIDE = 1e-4;

/** The repair mat: thin, with round corners and a ruler printed along its front edge. Origin at the top centre. */
export const MAT: V3 = [5.7, 0.03, 4.56];
export const MAT_CENTER: V3 = [0, 0, -0.66]; // in the bench's space
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
/** A dark stick with light chips and orange contacts along one edge. */
function Ram() {
  const { mats } = useClay();
  return (
    <group>
      <Box size={[0.56, 0.014, 0.17]} r={0.005} material={mats.shade.board} />
      {[-0.18, -0.06, 0.06, 0.18].map((x) => (
        <Box key={x} size={[0.09, 0.01, 0.07]} position={[x, 0.01, -0.01]} r={0.003} />
      ))}
      <Box accent size={[0.5, 0.006, 0.026]} position={[0, 0.008, 0.07]} r={0.002} />
    </group>
  );
}
const PIPE = new THREE.CatmullRomCurve3([new THREE.Vector3(0.14, -0.006, 0), new THREE.Vector3(0.45, -0.012, -0.02), new THREE.Vector3(0.8, -0.012, -0.03)]);
const PIPE_FINS = new THREE.CatmullRomCurve3([new THREE.Vector3(0, -0.01, -0.16), new THREE.Vector3(0, -0.01, -0.33)]);
const FIN: V3 = [0.012, 0.06, 0.1];
/**
 * The fan, dark blades in a light ring, with its heat pipe: to a plate that sits on the processor, and
 * to the fins at the vent. `broken`: two blades are gone (the crack is drawn over it, see `Crack`).
 * `accent`: the new one, in orange.
 */
function Fan({ broken, accent }: { broken?: boolean; accent?: boolean }) {
  const { mats } = useClay();
  return (
    <group>
      <Puck accent={accent} r={0.19} h={0.05} hole={0.165} segments={28} />
      <Puck r={0.19} h={0.008} segments={28} position={[0, -0.021, 0]} material={mats.shade.board} />
      <Puck accent={accent} r={0.05} h={0.04} segments={16} />
      {Array.from({ length: broken ? 5 : 7 }, (_, i) => (
        <Box key={i} size={[0.11, 0.01, 0.05]} r={0.004} material={mats.shade.dark} position={[Math.cos((i * Math.PI * 2) / 7) * 0.1, 0, Math.sin((i * Math.PI * 2) / 7) * 0.1]} rotation={[0.4, (-i * Math.PI * 2) / 7, 0]} />
      ))}
      <Rod accent={accent} path={PIPE} r={0.022} segments={20} />
      <Box accent={accent} size={[0.24, 0.012, 0.24]} position={[0.8, -0.008, -0.03]} r={0.006} />
      <Rod accent={accent} path={PIPE_FINS} r={0.022} segments={8} />
      <Box size={[0.36, 0.012, 0.11]} position={[0, -0.036, -0.36]} r={0.004} material={mats.shade.board} />
      <Ticks n={10} a={[-0.16, -0.01, -0.36]} b={[0.16, -0.01, -0.36]} size={FIN} major={99} along={0} />
    </group>
  );
}
// The crack on the broken fan: a zigzag across the housing, drawn over the clay.
const CRACK: V3[] = [[-0.16, 0.03, -0.08], [-0.08, 0.03, -0.02], [-0.1, 0.03, 0.04], [-0.01, 0.03, 0.08], [0.05, 0.03, 0.06], [0.13, 0.03, 0.12]];
function Crack() {
  const { mats } = useClay();
  return (
    <group userData={{ overlay: true }}>
      <Line points={CRACK} color={mats.inkColor} lineWidth={2.2} layers={1} />
    </group>
  );
}

// ── Where everything is: inside the open base, and on the mat around it ─────
// The insides are laid out mirrored (the base is upside down), so the fan is at the back right.
// Behind the base lie the screen and the cover; in front, the new fan, the screw tray and the screwdriver.
const INSIDE: [V3, ReactNode][] = [
  [[0.05, 0.105, 0.45], <Battery key="battery" />],
  [[0.55, 0.093, -0.2], <Ram key="ram1" />],
  [[0.55, 0.093, -0.45], <Ram key="ram2" />],
  [[-0.35, 0.092, -0.02], <Drive key="drive" />],
  [[0.15, 0.09, -0.02], <Wifi key="wifi" />],
  [[-1.0, 0.11, 0.55], <Speaker key="left" />],
  [[1.0, 0.11, 0.55], <Speaker key="right" />],
];
/** The fan's place in the base, and where the two fans lie on the mat: the new one waiting in front, the broken one tossed to the side. */
export const FAN_AT: V3 = [0.7, 0.11, -0.32];
const SPARE: V3 = [-1.85, 0.042, 1.12];
const OLD_AT: V3 = [1.95, 0.042, -0.02];
const TRAY: V3 = [-0.35, 0, 1.25];
const DRIVER_REST: V3 = [1.78, 0.09, 1.25];
const DRIVER_IN: V3 = [-1.75, 0.45, 0.2]; // where it is picked up, by the first screw
const DRIVER_WAIT: V3 = [1.75, 0.45, 0.2]; // held ready beside the laptop while something else moves
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

/** The job done, the tools are put away (from `at` seconds into putting back): the laptop starts again on a clear mat. */
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
// spins out and jumps to the tray (taking apart), or is driven home as it gets there (putting back).
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
const OUT_KEYS: Key6[] = [key(0.42, DRIVER_IN, -0.3)];
const OUT_RUNS = [run(OUT_KEYS, HINGE_PATH, T.hinge, true, true)];
OUT_KEYS.push(key(1.14, DRIVER_WAIT, 0.3), key(T.screws[0][0] - 0.16, DRIVER_WAIT, 0.3));
OUT_RUNS.push(run(OUT_KEYS, COVER_PATH, T.screws, true));
OUT_KEYS.push(key(T.screws[N_SCREWS - 1][0] + 0.07, [LAST[0], LAST[1] + 0.1, LAST[2]], 0), key(T.screws[N_SCREWS - 1][0] + 0.5, DRIVER_REST, LYING));
const DRIVER_BACK = T.screws[0][2] - 0.24; // putting back: when it is picked up again
const IN_KEYS: Key6[] = [key(DRIVER_BACK + 0.14, DRIVER_REST, LYING)];
const IN_RUNS = [run(IN_KEYS, COVER_PATH, T.screws, false)];
IN_KEYS.push(key(T.flip[2] + 0.1, DRIVER_WAIT, 0.3), key(T.hinge[0][2] - 0.02, DRIVER_WAIT, 0.3));
IN_RUNS.push(run(IN_KEYS, HINGE_PATH, T.hinge, false, true));
IN_KEYS.push(key(T.on + 0.3, DRIVER_REST, LYING));
const SPIN = Math.PI * 7; // radians a second
/** The screwdriver is on the mat only while it has work: put down for the photo, picked up again for the screws, put away at the end. */
function driverShare(p: Play) {
  if (p.to === PHOTO) return 1 - ease(slice(p.age, 0, 0.22));
  if (stepOf(p) === PHOTO) return 0;
  return stepOf(p) === BACK ? pop(slice(ageOf(p, BACK), DRIVER_BACK, DRIVER_BACK + 0.16), 1.2) * tidy(p, T.on) : 1;
}

const FLUTES = [0, 1, 2, 3, 4, 5];
function Screwdriver() {
  const { mats } = useClay();
  const tip = useMemo(() => [0, 0, 0, 0], []);
  return (
    <Act
      f={(g, p) => {
        if (!loose(g, p, driverShare(p))) return;
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

/** How far the two fans are through changing places: only while putting back (like `apart`, by halves of a travel). */
const swapOf = (p: Play) => ((p.from === p.to ? p.to : stepOf(p)) === BACK ? slice(ageOf(p, BACK), T.swap[0], T.swap[1]) : 0);
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
      {[-0.2, -0.45].map((z) => (
        <Box key={z} size={[0.6, 0.026, 0.03]} position={[0.55, 0.096, z + 0.095]} r={0.006} material={mats.shade.mid} />
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

/** Like `at`, for things that pop: gone at once when the story leaves step `i`. */
const here = (p: Play, i: number) => (p.to === i ? 1 : p.from === i ? 1 - ease(slice(p.t, 0, 0.3)) : 0);

/** The whole bench. Put it where the laptop stands on the mat. */
export function Bench() {
  return (
    <Staged>
      {/* Inside the base: the board, the processor, a chip, the cables, the screw posts and every part but the fan, all in their places */}
      <Act
        f={(g, p) => {
          if (loose(g, p)) g.visible = isOpen(p);
        }}
      >
        <group scale={[-1, 1, 1]}>
          <Board />
          {INSIDE.map(([at, node], i) => (
            <group key={i} position={at}>
              {node}
            </group>
          ))}
        </group>
        <Posts />
      </Act>

      {/* The broken fan: found as the cover comes off (it rattles), photographed where it is, then pulled out and tossed aside */}
      <Act
        f={(g, p) => {
          const w = slice(swapOf(p), 0, 0.62);
          if (!loose(g, p, tidy(p, EMPTY)) || !(g.visible = w > 0 || isOpen(p))) return;
          fly(g, FAN_AT, OLD_AT, w, 0.75, 2.2);
          if (w <= 0) g.rotation.y = 0.2 * ring(ageOf(p, APART) - T.cover[0] - 0.14, 5, 3) * at(p, APART);
        }}
      >
        <group scale={[-1, 1, 1]}>
          <Fan broken />
          <Crack />
        </group>
      </Act>
      {/* The orange mark of the photo: a ring round the broken fan, from the moment the phone takes aim */}
      <Act
        position={[FAN_AT[0], 0.098, FAN_AT[2]]}
        f={(g, p) => {
          const a = ageOf(p, PHOTO);
          const k = pop(slice(a, SHOT.aim, SHOT.aim + 0.3), 2) * (1 + 0.12 * Math.sin(slice(a, SHOT.flash, SHOT.flash + 0.3) * Math.PI)) * here(p, PHOTO);
          if (loose(g, p, k)) g.rotation.y = a * 0.6;
        }}
      >
        <Puck accent r={0.275} h={0.022} hole={0.238} segments={36} />
      </Act>
      {/* The new fan: it waits in front (it cannot keep still), jumps into the broken one's place with a twirl, and stays */}
      <Act
        f={(g, p, time) => {
          const w = slice(swapOf(p), 0.34, 1);
          if (!loose(g, p) || !(g.visible = w < 1 || isOpen(p))) return;
          fly(g, SPARE, FAN_AT, w, 1.05);
          // It lies turned round on the mat, and comes round one and a half times on its way in.
          g.rotation.y = Math.PI * 3 * (1 - smooth(slice(w, 0, 0.82)));
          if (w > 0) return;
          const hop = Math.max(0, Math.sin(time * 5.5)) ** 2 * slice(ageOf(p, APART), 0.9, 1.2) * at(p, APART);
          g.position.y += hop * 0.09;
          g.rotation.y += Math.sin(time * 5.5 - 0.6) * 0.08 * hop;
        }}
      >
        <group scale={[-1, 1, 1]}>
          <Fan accent />
        </group>
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

      {/* Labels: what is inside, once it is open; the problem, at the photo; the old part, once it is out */}
      <LiveTag at={[-0.84, 0.11, -0.32]} dx={-74} dy={-10} on={on([APART], OPENED - 0.1)}>RAM</LiveTag>
      <LiveTag at={[0.9, 0.13, -0.32]} dx={66} dy={-12} on={on([APART], OPENED)}>Fan</LiveTag>
      <LiveTag at={[0.72, 0.15, 0.45]} dx={84} dy={18} on={on([APART], OPENED + 0.1)}>Battery</LiveTag>
      <LiveTag at={[SPARE[0] - 0.2, 0.08, SPARE[2]]} dx={-44} dy={-22} on={on([APART], OPENED + 0.2)}>New part</LiveTag>
      <LiveTag at={[FAN_AT[0] - 0.1, 0.14, FAN_AT[2] + 0.17]} dx={-30} dy={112} on={on([PHOTO], SHOT.aim + 0.25)}>Hardware problem</LiveTag>
      <LiveTag at={[OLD_AT[0] + 0.1, 0.08, OLD_AT[2] - 0.15]} dx={34} dy={-34} on={oldTag}>Old part</LiveTag>
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
const swapped = on([BACK], T.swap[0] + (T.swap[1] - T.swap[0]) * 0.62);
const oldTag = (p: Play) => swapped(p) * (1 - slice(ageOf(p, BACK), EMPTY - 0.15, EMPTY));
