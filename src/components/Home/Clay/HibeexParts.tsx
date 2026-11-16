// The HIBEEX models, in clay: the source systems, HIBEEX's intake, the cleaning gate, the
// conveyor lanes with their three agents (pair, stamp, file), and the people at their desks.
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { Act, ageOf, at, Box, bump, clamp01, ease, pop, Puck, Rod, Slab, slice, useClay, type Mats, type V3 } from './kit';

const HALF_PI = Math.PI / 2;
const lerp = THREE.MathUtils.lerp;
const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 3.7) * 43758.5453;
  return x - Math.floor(x);
};

// ── The beat of the lanes ───────────────────────────────────────────────────
// Every BEAT seconds the belts move one place (the first third), then stand still while the
// agents work on whatever stopped under them. `time` is the step's own clock, so it opens on a beat.
export const BEAT = 1.3;
export function beat(time: number) {
  const phase = (time / BEAT) % 1;
  return { tick: Math.floor(time / BEAT), move: ease(clamp01(phase / 0.3)), act: clamp01((phase - 0.3) / 0.7) };
}

// ── Source systems ──────────────────────────────────────────────────────────
function drumGeometry() {
  // Three bands with a groove between them: the drum everyone reads as "a database".
  const pts: [number, number][] = [[0, 0]];
  for (let band = 0; band < 3; band++) {
    const y = band * 0.36;
    pts.push([0.46, y], [0.5, y + 0.035], [0.5, y + 0.265], [0.46, y + 0.3]);
    if (band < 2) pts.push([0.435, y + 0.315], [0.435, y + 0.345]);
  }
  pts.push([0.38, 1.05], [0, 1.06]);
  return new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 44);
}

/** A source system, with its status light blinking and the socket HIBEEX plugs into. */
export function Drum({ phase = 0 }: { phase?: number }) {
  const { mats } = useClay();
  const geo = useMemo(drumGeometry, []);
  const light = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => light.current?.scale.setScalar(1 + Math.max(0, Math.sin(clock.elapsedTime * 2.6 + phase)) ** 4 * 0.5));
  // It pumps: a squeeze every two thirds of a second, each system a beat after its neighbour.
  const pumping = (g: THREE.Group, p: { age: number; to: number }) => {
    const ph = p.to === 0 ? (((p.age * 1.5 - phase * 0.13) % 1) + 1) % 1 : 1;
    const squeeze = 0.1 * bump(slice(ph, 0, 0.4));
    g.scale.set(1 + squeeze * 0.5, 1 - squeeze, 1 + squeeze * 0.5);
  };
  return (
    <Act f={pumping}>
      <mesh geometry={geo} castShadow receiveShadow material={mats.clay} />
      <Puck ref={light} r={0.05} h={0.05} bevel={0.02} segments={14} position={[0.2, 0.87, 0.47]} rotation={[HALF_PI, 0, 0]} />
      <Box size={[0.28, 0.16, 0.12]} position={[0, 0.15, 0.5]} r={0.04} />
    </Act>
  );
}

/** HIBEEX's intake: four sockets at the back, one mouth at the front where the raw data comes out. The orange thing of step 1. */
export function Intake() {
  // While the raw data pours out it shudders and swells, like something coughing paper.
  const coughing = (g: THREE.Group, p: { age: number; to: number }) => {
    const on = p.to === 0 ? slice(p.age, 0.05, 0.2) * (1 - slice(p.age, 2.1, 2.5)) : 0;
    g.scale.set(1 + 0.03 * Math.sin(p.age * 44) * on, 1 + 0.1 * Math.abs(Math.sin(p.age * 13)) * on, 1);
  };
  return (
    <Act f={coughing}>
      <Box accent size={[1.7, 0.56, 0.9]} position={[0, 0.28, 0]} r={0.13} />
      {/* The mouth: a lip below and a hood above. The vents on top say there is a machine inside. */}
      <Box size={[1.1, 0.08, 0.14]} position={[0, 0.2, 0.42]} r={0.03} />
      <Box size={[1.2, 0.045, 0.1]} position={[0, 0.37, 0.43]} r={0.02} />
      {[-0.36, -0.18, 0, 0.18, 0.36].map((x) => (
        <Box accent key={x} size={[0.07, 0.035, 0.46]} position={[x, 0.565, -0.05]} r={0.015} />
      ))}
      {[-0.57, -0.19, 0.19, 0.57].map((x) => (
        <Puck key={x} r={0.075} h={0.1} bevel={0.025} segments={16} position={[x, 0.28, -0.44]} rotation={[HALF_PI, 0, 0]} />
      ))}
    </Act>
  );
}

// ── Belts, the gate, trays ──────────────────────────────────────────────────
/** A conveyor along X: bed, end rollers, side rails, legs. `len` can change (the lanes shorten when the people arrive). */
export function Belt({ len, h = 0.34 }: { len: number; h?: number }) {
  return (
    <group>
      <Box size={[len, 0.1, 1.08]} position={[0, h - 0.05, 0]} r={0.03} />
      {[-1, 1].map((s) => (
        <group key={s}>
          <Puck r={0.105} h={1.14} bevel={0.03} segments={20} position={[(s * len) / 2, h - 0.1, 0]} rotation={[HALF_PI, 0, 0]} />
          <Box size={[len, 0.07, 0.05]} position={[0, h + 0.012, s * 0.565]} r={0.02} />
          {[-1, 1].map((e) => (
            <Box key={e} size={[0.09, h - 0.08, 0.09]} position={[e * (len / 2 - 0.45), (h - 0.08) / 2, s * 0.43]} r={0.025} />
          ))}
        </group>
      ))}
    </group>
  );
}

/** An arch over a belt, with feet: the cleaning gate, and the frame of each agent. */
export function Arch() {
  return (
    <group>
      {[-0.7, 0.7].map((z) => (
        <group key={z}>
          <Box size={[0.14, 1, 0.14]} r={0.045} position={[0, 0.5, z]} />
          <Box size={[0.34, 0.07, 0.24]} r={0.03} position={[0, 0.035, z]} />
        </group>
      ))}
      <Box size={[0.2, 0.18, 1.54]} r={0.06} position={[0, 1.02, 0]} />
    </group>
  );
}

// The belt of the second step: RIDERS sheets go round it, one under the gate every 0.7 s.
export const RIDERS = 9;
export const RIDER_V = 0.16; // laps of the belt per second
const GATE_PH = 0.439; // how far round the belt the gate stands
/** 0..1: how long since a sheet went under the gate (0 as it does, 1 just before the next). */
export const sinceGate = (age: number) => {
  const g = (age * RIDER_V - GATE_PH) * RIDERS;
  return g - Math.floor(g);
};

/** What makes the arch a cleaning gate: the roller that irons every sheet flat (the orange thing of step 2) and the fins that square it up first. */
export function GateKit() {
  const pressing = (g: THREE.Group, p: { age: number; to: number; from: number; was: number }) => {
    const s = sinceGate(p.to === 1 ? p.age : p.was);
    // It winds up before each sheet, comes down on it with a snap and eases off.
    const lift = s < 0.1 ? -1 : s < 0.4 ? -1 + ease((s - 0.1) / 0.3) : s < 0.72 ? 0 : s < 0.94 ? 0.9 * ease((s - 0.72) / 0.22) : lerp(0.9, -1, ((s - 0.94) / 0.06) ** 2);
    g.position.y = 0.5 + lift * 0.09;
    g.rotation.z = -(p.to === 1 ? p.age : p.was) * 5;
  };
  return (
    <group>
      <Act f={pressing} position={[0, 0.5, 0]}>
        <Puck accent r={0.085} h={0.98} bevel={0.025} segments={24} rotation={[HALF_PI, 0, 0]} />
      </Act>
      <Box size={[0.75, 0.16, 0.045]} r={0.02} position={[-0.55, 0.37, 0.46]} rotation={[0, -0.32, 0]} />
      <Box size={[0.75, 0.16, 0.045]} r={0.02} position={[-0.55, 0.37, -0.46]} rotation={[0, 0.32, 0]} />
    </group>
  );
}

/** A tray with a ream already in it: `n` plain sheets, a little out of square. The live sheets land on top. */
export function Tray({ n = 22 }: { n?: number }) {
  const { mats } = useClay();
  const geo = useMemo(() => new THREE.BoxGeometry(0.62, 0.013, 0.84), []);
  const lay = (m: THREE.InstancedMesh | null) => {
    if (!m) return;
    const o = new THREE.Object3D();
    for (let i = 0; i < n; i++) {
      o.position.set(Math.sin(i * 7.3) * 0.006, 0.062 + i * 0.016, Math.cos(i * 4.1) * 0.006);
      o.rotation.set(0, Math.sin(i * 12.9) * 0.012, 0);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  };
  return (
    <group>
      <Box size={[0.86, 0.05, 1.08]} position={[0, 0.025, 0]} r={0.02} />
      <Box size={[0.86, 0.2, 0.05]} position={[0, 0.1, 0.54]} r={0.02} />
      <Box size={[0.86, 0.2, 0.05]} position={[0, 0.1, -0.54]} r={0.02} />
      <Box size={[0.05, 0.2, 1.08]} position={[0.43, 0.1, 0]} r={0.02} />
      <instancedMesh ref={lay} args={[geo, mats.clay, n]} castShadow receiveShadow />
    </group>
  );
}
/** Height of the top of a tray's ream. */
export const reamTop = (n = 22) => 0.062 + n * 0.016;

// ── The three agents ────────────────────────────────────────────────────────
// Each is an arch with a tool that does one thing to the sheet that stopped under it, with a
// wind-up before and a recoil after. `on`: how much the agents are at work (0 while travelling
// in, 1 while their step holds). Their tools are the orange thing of that step, and plain clay
// once the work goes back to the people.
const lit = (m: THREE.Mesh | null, on: number, mats: Mats) => m && (m.material = on > 0.5 ? mats.accent : mats.clay);

/** When the pair of sheets under the pairer clicks together (0..1 through `act`). */
export const pinch = (act: number) => slice(act, 0.22, 0.32) ** 2;
/** Reconciliation: two fingers come down outside a pair of sheets, open a little, and snap them together. */
export function Pairer({ on }: { on: () => number }) {
  const left = useRef<THREE.Mesh>(null);
  const right = useRef<THREE.Mesh>(null);
  const { play, mats } = useClay();
  useFrame(() => {
    const { act } = beat(ageOf(play, 2));
    const w = on();
    lit(left.current, w, mats);
    lit(right.current, w, mats);
    const down = (slice(act, 0, 0.12) - slice(act, 0.7, 0.88)) * w;
    const close = (pinch(act) * 1.25 - 0.25 * slice(act, 0.32, 0.4) - 0.4 * bump(slice(act, 0.1, 0.24)) - slice(act, 0.55, 0.7)) * w;
    left.current?.position.set(-0.8 + close * 0.1, 0.92 - down * 0.36, 0);
    right.current?.position.set(0.8 - close * 0.1, 0.92 - down * 0.36, 0);
  });
  return (
    <group>
      <Box size={[1.86, 0.1, 0.14]} r={0.04} position={[0, 0.9, 0]} />
      <Box ref={left} size={[0.06, 0.5, 0.52]} r={0.025} position={[-0.8, 0.92, 0]} />
      <Box ref={right} size={[0.06, 0.5, 0.52]} r={0.025} position={[0.8, 0.92, 0]} />
    </group>
  );
}

/** The moment the stamp hits the sheet (0..1 through `act`). */
export const STAMP = 0.3;
/** Collections: the stamp winds up, slams down on the sheet and flattens against it. */
export function Stamper({ on }: { on: () => number }) {
  const head = useRef<THREE.Group>(null);
  const stamp = useRef<THREE.Mesh>(null);
  const { play, mats } = useClay();
  useFrame(() => {
    const { act } = beat(ageOf(play, 2));
    const w = on();
    lit(stamp.current, w, mats);
    const windup = 0.16 * ease(slice(act, 0, 0.2)) * (1 - slice(act, 0.2, STAMP));
    const down = slice(act, 0.2, STAMP) ** 2 - ease(slice(act, 0.45, 0.8));
    head.current?.position.setY(0.78 + (windup - down * 0.4) * w);
    const hit = 0.3 * bump(slice(act, STAMP - 0.02, STAMP + 0.14)) * w;
    stamp.current?.scale.set(1 + hit * 0.6, 1 - hit, 1 + hit * 0.6);
  });
  return (
    <group ref={head} position={[0, 0.78, 0]}>
      <Puck r={0.05} h={0.5} segments={14} position={[0, 0.16, 0]} />
      <Puck ref={stamp} r={0.17} h={0.1} bevel={0.03} segments={24} position={[0, -0.09, 0]} />
    </group>
  );
}

// The file box of the contracts lane stands beside the belt, on the camera's side.
export const FILE_Z = 1.12;
/** Where a sheet being filed is, `a` of the way (0 on the belt, 1 standing in the box). Shared by the sheet and the picker. */
export function fileAt(a: number, out: { y: number; z: number; tilt: number }) {
  const lift = ease(slice(a, 0, 0.3));
  const over = ease(slice(a, 0.25, 0.65));
  const drop = ease(slice(a, 0.6, 0.95));
  out.y = lift * 0.75 - drop * 0.59;
  out.z = over * FILE_Z;
  out.tilt = ease(slice(a, 0.15, 0.6)) * HALF_PI;
}

/** Contracts: a picker lifts the sheet, stands it up and files it in the box beside the belt. */
export function Filer({ on }: { on: () => number }) {
  const pad = useRef<THREE.Group>(null);
  const where = useMemo(() => ({ y: 0, z: 0, tilt: 0 }), []);
  const cup = useRef<THREE.Mesh>(null);
  const { play, mats } = useClay();
  useFrame(() => {
    const { act } = beat(ageOf(play, 2));
    lit(cup.current, on(), mats);
    // It rides the sheet to the box and lets go, then comes back for the next one.
    const grip = slice(act, 0, 0.6) - slice(act, 0.7, 0.95);
    fileAt(act * on(), where);
    pad.current?.position.set(0, 0.5 + where.y * grip + (1 - grip) * 0.26, where.z * grip);
  });
  return (
    <>
      <Box size={[0.16, 0.12, 2.2]} r={0.04} position={[0, 1.02, 0.55]} />
      <group ref={pad} position={[0, 0.76, 0]}>
        <Puck r={0.04} h={0.34} segments={12} position={[0, 0.2, 0]} />
        <Puck ref={cup} r={0.13} h={0.06} bevel={0.02} segments={20} />
      </group>
      {/* The file box, with what is already filed standing in it */}
      <group position={[0, 0, FILE_Z]}>
        <Box size={[1.05, 0.05, 0.62]} position={[0, 0.025, 0]} r={0.02} />
        <Box size={[1.05, 0.5, 0.05]} position={[0, 0.25, 0.3]} r={0.02} />
        <Box size={[1.05, 0.5, 0.05]} position={[0, 0.25, -0.3]} r={0.02} />
        <Box size={[0.05, 0.5, 0.62]} position={[0.52, 0.25, 0]} r={0.02} />
        <Box size={[0.05, 0.5, 0.62]} position={[-0.52, 0.25, 0]} r={0.02} />
        {[-0.2, -0.13, 0.17].map((z) => (
          <Box key={z} size={[0.64, 0.86, 0.016]} r={0.006} position={[0, 0.48, z]} />
        ))}
      </group>
    </>
  );
}

// ── The people ──────────────────────────────────────────────────────────────
/** A desk with someone sitting at it, facing -X where the work comes from. `react` returns 0..1: they look down at what just landed and an arm goes up. */
export function Person({ react }: { react: () => number }) {
  const { mats } = useClay();
  const head = useRef<THREE.Group>(null);
  const arm = useRef<THREE.Group>(null);
  const body = useRef<THREE.Mesh>(null);
  // Each arm from its shoulder, so the one on the camera's side can swing up.
  const arms = useMemo(() => [-1, 1].map((s) => new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(-0.2, -0.2, s * 0.04), new THREE.Vector3(-0.5, -0.25, s * -0.05)])), []);
  useFrame(() => {
    const r = react();
    if (head.current) head.current.rotation.z = r * 0.38;
    if (arm.current) arm.current.rotation.z = -1.7 * r;
    body.current?.scale.setY(1 + 0.08 * r);
  });
  return (
    <group>
      {/* Desk */}
      <Box size={[0.98, 0.08, 1.5]} position={[0.15, 0.69, 0]} r={0.03} />
      <Box size={[0.8, 0.65, 0.07]} position={[0.15, 0.325, 0.66]} r={0.025} />
      <Box size={[0.8, 0.65, 0.07]} position={[0.15, 0.325, -0.66]} r={0.025} />
      <Box size={[0.07, 0.4, 1.25]} position={[-0.2, 0.42, 0]} r={0.025} />
      {/* Chair */}
      <Puck r={0.24} h={0.05} bevel={0.02} segments={24} position={[1.05, 0.025, 0]} />
      <Puck r={0.045} h={0.4} segments={12} position={[1.05, 0.24, 0]} />
      <Box size={[0.5, 0.09, 0.52]} position={[1.05, 0.46, 0]} r={0.04} />
      <Box size={[0.09, 0.62, 0.5]} position={[1.3, 0.83, 0]} r={0.04} />
      {/* Whoever looks after the business */}
      <Puck ref={body} r={0.215} h={0.62} bevel={0.2} position={[1.04, 0.84, 0]} />
      {arms.map((path, i) => (
        <group key={i} ref={i ? arm : undefined} position={[1, 1.02, (i ? 1 : -1) * 0.25]}>
          <Rod path={path} r={0.058} segments={16} />
        </group>
      ))}
      <group ref={head} position={[1.02, 1.2, 0]}>
        <mesh position={[0, 0.16, 0]} castShadow receiveShadow material={mats.clay}>
          <sphereGeometry args={[0.185, 32, 24]} />
        </mesh>
      </group>
    </group>
  );
}

// ── The result ──────────────────────────────────────────────────────────────
// Each number is earned in front of you. `on`: the step they belong to. Origins: bottom centre.
function sawShape(r: number, teeth: number) {
  const s = new THREE.Shape();
  for (let i = 0; i < teeth * 2; i++) {
    const a = (i / (teeth * 2)) * Math.PI * 2;
    const d = i % 2 ? r : r * 0.86;
    if (i) s.lineTo(Math.cos(a) * d, Math.sin(a + (i % 2 ? 0.1 : 0)) * d);
    else s.moveTo(d, 0);
  }
  s.closePath();
  return s;
}

/** A bar `h` tall of which only `keep` (a fraction) stays: it stands whole, a saw comes through at the line, and what is above topples off. */
export function SawnBar({ p, w = 1, h, keep, on }: { p: V3; w?: number; h: number; keep: number; on: number }) {
  const blade = useMemo(() => sawShape(0.72, 18), []);
  const low = h * keep;
  return (
    <Act
      position={p}
      f={(g, play) => {
        const grow = play.to === on ? pop(slice(play.age, 0.2, 0.55), 1.4) : ease(slice(at(play, on), 0.6, 1));
        g.visible = grow > 0.001;
        g.scale.set(Math.min(grow, 1), grow, Math.min(grow, 1));
      }}
    >
      <Act f={(g, play) => void g.scale.setY(1 - 0.08 * bump(slice(ageOf(play, on), 1.25, 1.5)))}>
        <Box accent size={[w, low, w]} r={0.05} position={[0, low / 2, 0]} />
      </Act>
      {/* What is cut off: it hinges on its front edge, falls forward and is gone. */}
      <Act
        position={[0, low, w / 2]}
        f={(g, play) => {
          const a = ageOf(play, on);
          g.rotation.x = slice(a, 1.22, 1.75) ** 2 * 2;
          g.position.y = low + 0.05 * bump(slice(a, 1.15, 1.3));
          g.scale.setScalar(Math.max(1 - slice(a, 1.6, 1.8), 1e-4));
        }}
      >
        <Box accent size={[w, h - low, w]} r={0.05} position={[0, (h - low) / 2, -w / 2]} />
      </Act>
      {/* The saw: in from the side, through the bar at the line, and out again. */}
      <Act
        position={[1.6, low, 0]}
        f={(g, play) => {
          const a = ageOf(play, on);
          g.position.x = lerp(lerp(1.7, -0.2, ease(slice(a, 0.72, 1.25))), 1.8, ease(slice(a, 1.3, 1.65)));
          g.rotation.y = a * 16;
          g.scale.setScalar(Math.max(pop(slice(a, 0.62, 0.8), 1.2) * (1 - slice(a, 1.5, 1.7)), 1e-4));
        }}
      >
        <Slab shape={blade} depth={0.03} bevel={0.006} rotation={[-HALF_PI, 0, 0]} position={[0, -0.018, 0]} />
        <Puck r={0.12} h={0.09} bevel={0.02} segments={16} />
      </Act>
    </Act>
  );
}

/** `days` as a pad of calendar pages, one per day (the top one is the odd fraction): they are torn off from the top and fly away until `keep` are left. */
export function Calendar({ p, w = 1, h, days, keep, on }: { p: V3; w?: number; h: number; days: number; keep: number; on: number }) {
  const { play, mats } = useClay();
  const ref = useRef<THREE.InstancedMesh>(null);
  const n = Math.ceil(days);
  const pitch = h / days;
  const geo = useMemo(() => new RoundedBoxGeometry(w, pitch * 0.8, w, 1, 0.012), [w, pitch]);
  const o = useMemo(() => new THREE.Object3D(), []);
  useFrame(() => {
    const m = ref.current;
    if (!m) return;
    const here = at(play, on);
    m.visible = here > 0.001;
    if (!m.visible) return;
    const a = ageOf(play, on);
    for (let j = 0; j < n; j++) {
      const thick = Math.min(1, days - j);
      const size = play.to === on ? pop(slice(a, 0.15 + (j / n) * 0.35, 0.32 + (j / n) * 0.35), 1.3) : ease(slice(here, 0.6, 1));
      // The top of page j is exactly j + 1 days high.
      o.position.set(0, (j + thick) * pitch - pitch * 0.4 * thick, 0);
      o.rotation.set(0, 0, 0);
      o.scale.set(size, size * thick, size);
      if (j >= keep) {
        const fly = clamp01((a - 0.75 - (n - 1 - j) * 0.021) / 0.55);
        const side = hash(j) - 0.25;
        o.position.x += fly * (1 + hash(j + 9)) * side * 2;
        o.position.y += Math.sin(fly * Math.PI) * 0.7 + fly * 0.5;
        o.position.z += fly * (0.5 + hash(j + 5) * 1.4);
        o.rotation.set(fly * 5 * (hash(j + 2) - 0.3), fly * 3 * side, fly * 4 * side);
        o.scale.multiplyScalar(Math.max(1 - fly ** 2, 1e-4));
      }
      o.updateMatrix();
      m.setMatrixAt(j, o.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[geo, mats.accent, n]} position={p} castShadow receiveShadow frustumCulled={false} />;
}

const TILE = 0.25;
/**
 * 100 tiles in a 10 x 10 square standing in the XY plane. They arrive in clay, then `n` of them
 * turn over to orange one after the other, like a mosaic, from the bottom row up.
 */
export function Waffle({ n, on, p }: { n: number; on: number; p: V3 }) {
  const { play, mats } = useClay();
  const ref = useRef<THREE.InstancedMesh>(null);
  const { geo, mat } = useMemo(() => ({ geo: new RoundedBoxGeometry(TILE - 0.045, TILE - 0.045, 0.09, 2, 0.03), mat: new THREE.MeshStandardMaterial({ roughness: 0.9 }) }), []);
  const o = useMemo(() => new THREE.Object3D(), []);
  useFrame(() => {
    const m = ref.current;
    if (!m) return;
    const here = at(play, on);
    m.visible = here > 0.001;
    if (!m.visible) return;
    const a = ageOf(play, on);
    for (let i = 0; i < 100; i++) {
      const col = i % 10;
      const row = Math.floor(i / 10);
      const size = play.to === on ? pop(slice(a, 0.15 + (i / 100) * 0.3, 0.35 + (i / 100) * 0.3), 1.4) : ease(slice(here, 0.6, 1));
      const flip = i < n ? ease(slice(a, 0.75 + row * 0.085 + col * 0.035, 1.05 + row * 0.085 + col * 0.035)) : 0;
      o.position.set((col - 4.5) * TILE, (row + 0.5) * TILE, bump(flip) * 0.14);
      o.rotation.set(flip * Math.PI, 0, 0);
      o.scale.setScalar(Math.max(size, 1e-4));
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      m.setColorAt(i, flip > 0.5 ? mats.accent.color : mats.clay.color);
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[geo, mat, 100]} position={p} castShadow receiveShadow frustumCulled={false} />;
}
