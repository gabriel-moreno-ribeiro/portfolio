// The repair bench (steps 2 and 3): the mat, the insides of the laptop, and every loose piece of
// the teardown. Everything here is in the laptop's own space while it stands on the mat (y = 0 is the
// top of the mat), with the base upside down: what was its bottom is now on top.
import { Line } from '@react-three/drei';
import { Children, useEffect, useMemo, useState, type ReactNode } from 'react';
import * as THREE from 'three';
import { Act, ageOf, Box, bump, ease, Puck, Rod, settle, slice, Ticks, useClay, type Play, type V3 } from './kit';
import { COVER_SCREWS, Cover, HB, HINGE_SCREWS, LiveTag, ScrewShape } from './LaptopParts';
import { apart, APART, BACK, benchScale, driverKeys, N_PARTS, T, track, type Key5 } from './teardown';

const lerp = THREE.MathUtils.lerp;
const HIDE = 1e-4;

/** The repair mat: thin, with a raised rim. Origin at the top centre. */
export const MAT: V3 = [6.4, 0.03, 4.9];
export const MAT_CENTER: V3 = [0, 0, -0.5]; // in the bench's space
export function Mat({ size = MAT }: { size?: V3 }) {
  const { mats } = useClay();
  const [w, h, d] = size;
  // A cutting mat: clearly darker than the clay, so every part has a silhouette on it, with a faint grid.
  const mat = mats.shade.mat;
  const grid = useMemo(() => {
    const pts: V3[] = [];
    for (let x = -w / 2 + 0.3; x < w / 2 - 0.1; x += 0.5) pts.push([x, 0.002, -d / 2 + 0.12], [x, 0.002, d / 2 - 0.12]);
    for (let z = -d / 2 + 0.3; z < d / 2 - 0.1; z += 0.5) pts.push([-w / 2 + 0.12, 0.002, z], [w / 2 - 0.12, 0.002, z]);
    return pts;
  }, [w, d]);
  return (
    <group>
      <Box size={[w, h, d]} position={[0, -h / 2, 0]} r={0.012} material={mat} />
      <Box size={[w, 0.02, 0.06]} position={[0, 0.01, d / 2 - 0.03]} r={0.008} material={mat} />
      <Box size={[w, 0.02, 0.06]} position={[0, 0.01, -d / 2 + 0.03]} r={0.008} material={mat} />
      <Box size={[0.06, 0.02, d - 0.12]} position={[w / 2 - 0.03, 0.01, 0]} r={0.008} material={mat} />
      <Box size={[0.06, 0.02, d - 0.12]} position={[-w / 2 + 0.03, 0.01, 0]} r={0.008} material={mat} />
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
interface Part { name: string; at: V3; laid: V3; node: ReactNode }
// Removed in this order (the battery first), put back in the reverse order.
export const PARTS: Part[] = [
  { name: 'battery', at: [0.05, 0.105, 0.45], laid: [-2.15, 0.04, 1.4], node: <Battery /> },
  { name: 'speaker', at: [-1.0, 0.11, 0.55], laid: [2.2, 0.025, -0.3], node: <Speaker /> },
  { name: 'speaker', at: [1.0, 0.11, 0.55], laid: [2.2, 0.025, -0.6], node: <Speaker /> },
  { name: 'drive', at: [-0.35, 0.092, -0.02], laid: [2.2, 0.006, 0.55], node: <Drive /> },
  { name: 'wifi', at: [0.15, 0.09, -0.02], laid: [2.2, 0.005, 0.25], node: <Wifi /> },
  { name: 'ram', at: [0.55, 0.093, -0.45], laid: [0.9, 0.007, 1.58], node: <Ram /> },
  { name: 'ram', at: [0.55, 0.093, -0.2], laid: [0.9, 0.007, 1.28], node: <Ram /> },
  { name: 'fan', at: [-0.7, 0.11, -0.32], laid: [-0.7, 0.042, 1.5], node: <Fan /> },
];
const OLD = 6; // the RAM stick that gets swapped
export const WAITING: V3 = [2.2, 0.007, 1.3]; // the new part on the mat; after the swap, the old one
const DRIVER_REST: V3 = [-1.65, 0.085, 0.35];
/** A screw's place on the mat: the cover's in a row in front of the cover, the screen's in front of the screen. */
const coverScrewLaid = (k: number): V3 => [0.35 + k * 0.26, 0.008, -1.03];
const hingeScrewLaid = (k: number): V3 => [-1.0 + k * 0.26, 0.008, -1.03];
/** A cover screw upside down: its place in the base, seen from above. */
const coverScrewAt = (k: number): V3 => [-COVER_SCREWS[k][0], HB - COVER_SCREWS[k][1], COVER_SCREWS[k][2]];
const COVER_AT: V3 = [0, HB - 0.0175, 0];
const COVER_LAID: V3 = [1.35, 0.0175, -2.05];
export const BOARD_Y = 0.075;

/** Open = the cover has started to come off: the insides are seen. */
const isOpen = (p: Play) => apart(p, T.cover) > 0;

/** Moves `g` from `a` (in place) to `b` (on the mat) as `k` goes 0 to 1, in an arc, settling as it lands. */
function lay(g: THREE.Group, a: V3, b: V3, k: number, lift: number) {
  const e = settle(k, 0.5);
  g.position.set(lerp(a[0], b[0], e), lerp(a[1], b[1], ease(k)) + bump(k) * lift, lerp(a[2], b[2], e));
}

/** A screw's move: the first quarter turns it out of its hole, the rest carries it to the mat. */
function screwAt(g: THREE.Group, a: V3, b: V3, k: number) {
  if (k < 0.25) {
    const u = k / 0.25;
    g.position.set(a[0], a[1] + 0.035 * u, a[2]);
    g.rotation.set(0, u * Math.PI * 4, 0);
  } else {
    const u = (k - 0.25) / 0.75;
    lay(g, [a[0], a[1] + 0.035, a[2]], b, u, 0.35);
    g.rotation.set(0, Math.PI * 4, 0);
  }
}

function LooseScrew({ from, to, win }: { from: V3; to: V3; win: Parameters<typeof apart>[1] }) {
  return (
    <Act
      f={(g, p) => {
        const k = apart(p, win);
        const s = benchScale(p);
        g.visible = k > 0 && s > 0.001;
        if (!g.visible) return;
        screwAt(g, from, to, k);
        g.scale.setScalar(Math.max(k >= 1 ? s : 1, HIDE));
      }}
    >
      <ScrewShape />
    </Act>
  );
}

// The screwdriver's runs: the screen's two screws and the cover's eight, out in step 2 and in in step 3.
const hingeTops = HINGE_SCREWS.map(([x, y, z]): V3 => [x, y + 0.006, z]);
const coverTops = COVER_SCREWS.map((_, k): V3 => {
  const [x, y, z] = coverScrewAt(k);
  return [x, y + 0.006, z];
});
const OUT_RUNS = [driverKeys(DRIVER_REST, hingeTops, T.hinge, true, 0), driverKeys(DRIVER_REST, coverTops, T.screws, true, 0)];
const IN_RUNS = [driverKeys(DRIVER_REST, coverTops, T.screws, false, 1), driverKeys(DRIVER_REST, hingeTops, T.hinge, false, 1)];
const OUT_KEYS: Key5[] = OUT_RUNS.flatMap((r) => r.keys);
const IN_KEYS: Key5[] = IN_RUNS.flatMap((r) => r.keys);
const OUT_TURNS = OUT_RUNS.flatMap((r) => r.turns);
const IN_TURNS = IN_RUNS.flatMap((r) => r.turns);

function Screwdriver() {
  const tip = useMemo(() => [0, 0, 0, 0], []);
  return (
    <Act
      f={(g, p) => {
        const s = benchScale(p);
        g.visible = s > 0.001;
        if (!g.visible) return;
        const back = (p.t > 0.5 ? p.to : p.from) === BACK;
        const a = back ? ageOf(p, BACK) : ageOf(p, APART);
        track(back ? IN_KEYS : OUT_KEYS, a, tip);
        const turns = back ? IN_TURNS : OUT_TURNS;
        let spin = 0;
        for (let i = 0; i < turns.length; i++) spin += slice(a, turns[i][0], turns[i][1]);
        g.position.set(tip[0], tip[1], tip[2]);
        g.rotation.set(0, spin * Math.PI * 3 * (back ? -1 : 1), tip[3]);
        g.scale.setScalar(Math.max(s, HIDE));
      }}
    >
      <Puck r={0.012} h={0.06} segments={8} position={[0, 0.03, 0]} />
      <Puck r={0.022} h={0.5} segments={10} position={[0, 0.3, 0]} />
      <Puck r={0.05} h={0.08} bevel={0.02} segments={16} position={[0, 0.57, 0]} />
      <Puck r={0.085} h={0.4} bevel={0.04} segments={10} position={[0, 0.81, 0]} />
    </Act>
  );
}

const swapOf = (p: Play) => (p.to === BACK || p.from === BACK ? slice(ageOf(p, BACK), T.swap[0], T.swap[1]) : 0);
/** The motherboard, dark, with the processor and a chip in clay, and two ribbon cables. */
function Board() {
  const { mats } = useClay();
  return (
    <>
      <Box size={[1.9, 0.02, 0.8]} position={[-0.1, BOARD_Y, -0.3]} r={0.006} material={mats.shade.board} />
      <Box size={[0.22, 0.014, 0.22]} position={[0.1, 0.092, -0.35]} r={0.005} />
      <Box size={[0.14, 0.012, 0.14]} position={[-0.2, 0.091, -0.56]} r={0.004} />
      <Box size={[0.08, 0.005, 0.22]} position={[0.45, 0.068, 0.15]} r={0.002} material={mats.shade.mid} />
      <Box size={[0.06, 0.005, 0.24]} position={[-0.4, 0.087, -0.62]} r={0.002} material={mats.shade.mid} />
    </>
  );
}

/** The base's eight screw posts, seen inside once the cover is off. */
function Posts() {
  const { mats } = useClay();
  const geo = useMemo(() => new THREE.CylinderGeometry(0.035, 0.035, 0.13, 14), []);
  const lay = (m: THREE.InstancedMesh | null) => {
    if (!m) return;
    const o = new THREE.Object3D();
    COVER_SCREWS.forEach((_, k) => {
      const [x, , z] = coverScrewAt(k);
      o.position.set(x, 0.065 + 0.065, z);
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

/** The whole bench. Put it where the laptop stands on the mat. */
export function Bench() {
  return (
    <Staged>
      {/* Inside the base: the board, the processor, a chip, the cables and the screw posts */}
      <Act f={(g, p) => void (g.visible = isOpen(p))}>
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
              g.visible = (k > 0 || isOpen(p)) && benchScale(p) > 0.001;
              if (g.visible) lay(g, part.at, part.laid, k, 0.7);
            }}
          >
            {part.node}
          </Act>
        ),
      )}
      {/* The old RAM stick: out with the others, then it trades places with the new one and stays on the mat */}
      <Act
        f={(g, p) => {
          const k = p.to === BACK || p.from === BACK ? 1 : apart(p, T.parts[OLD]);
          const s = benchScale(p);
          g.visible = (k > 0 || isOpen(p)) && s > 0.001;
          if (!g.visible) return;
          const w = swapOf(p);
          if (w > 0) lay(g, PARTS[OLD].laid, WAITING, w, 0.45);
          else lay(g, PARTS[OLD].at, PARTS[OLD].laid, k, 0.7);
          g.scale.setScalar(Math.max(s, HIDE));
        }}
      >
        <Ram />
      </Act>
      {/* The new one: waits on the mat, takes the old one's place in the row, and goes in with the others */}
      <Act
        f={(g, p) => {
          const s = benchScale(p);
          const w = swapOf(p);
          const k = w >= 1 ? apart(p, T.parts[OLD]) : 1;
          g.visible = s > 0.001 && (k > 0 || isOpen(p));
          if (!g.visible) return;
          if (w < 1) lay(g, WAITING, PARTS[OLD].laid, w, 0.45);
          else lay(g, PARTS[OLD].at, PARTS[OLD].laid, k, 0.7);
          g.scale.setScalar(Math.max(k >= 1 && w <= 0 ? s : 1, HIDE));
        }}
      >
        <Ram accent />
      </Act>

      {/* The cover and the screws, loose */}
      <Act
        f={(g, p) => {
          const k = apart(p, T.cover);
          g.visible = k > 0 && benchScale(p) > 0.001;
          if (!g.visible) return;
          lay(g, COVER_AT, COVER_LAID, k, 0.8);
          g.rotation.set(0, 0, Math.PI - bump(k) * 0.12);
        }}
      >
        <group position={[0, -0.0175, 0]}>
          <Cover />
        </group>
      </Act>
      {COVER_SCREWS.map((_, k) => (
        <LooseScrew key={k} from={coverScrewAt(k)} to={coverScrewLaid(k)} win={T.screws[k]} />
      ))}
      {HINGE_SCREWS.map((s, k) => (
        <LooseScrew key={k} from={s} to={hingeScrewLaid(k)} win={T.hinge[k]} />
      ))}
      <Screwdriver />

      {/* Labels, once everything is laid out (step 2), and the swap (step 3) */}
      <LiveTag at={[PARTS[0].laid[0], 0.09, PARTS[0].laid[2] + 0.12]} dx={0} dy={36} on={on([APART], T.parts[N_PARTS - 1][0] + 0.5)}>Battery</LiveTag>
      <LiveTag at={[PARTS[7].laid[0], 0.06, PARTS[7].laid[2] + 0.1]} dx={0} dy={34} on={on([APART], T.parts[N_PARTS - 1][0] + 0.5)}>Fan</LiveTag>
      <LiveTag at={[PARTS[5].laid[0], 0.02, PARTS[5].laid[2] + 0.06]} dx={0} dy={34} on={on([APART], T.parts[N_PARTS - 1][0] + 0.5)}>RAM</LiveTag>
      <LiveTag at={[PARTS[1].laid[0] + 0.17, 0.05, PARTS[1].laid[2] - 0.15]} dx={46} dy={0} on={on([APART], T.parts[N_PARTS - 1][0] + 0.5)}>Speakers</LiveTag>
      <LiveTag at={[WAITING[0], 0.02, WAITING[2] + 0.06]} dx={0} dy={34} on={on([APART], 1)}>New part</LiveTag>
      <LiveTag at={[WAITING[0], 0.02, WAITING[2] + 0.06]} dx={0} dy={34} on={on([BACK], T.swap[1] + 0.1)}>Old part</LiveTag>
    </Staged>
  );
}

/** A label shown on step `steps` from `after` seconds in, gone as soon as the story moves. */
function on(steps: number[], after: number) {
  return (p: Play) => {
    const here = steps.includes(p.to) ? (steps.includes(p.from) ? 1 : slice(p.t, 0.8, 1)) : steps.includes(p.from) ? 1 - slice(p.t, 0, 0.15) : 0;
    return here * (steps.includes(p.to) ? slice(p.age, after, after + 0.2) : 1);
  };
}
