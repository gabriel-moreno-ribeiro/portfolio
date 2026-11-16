// The HIBEEX models, in clay: the source systems, HIBEEX's intake, the cleaning gate, the
// conveyor lanes with their three agents (pair, stamp, file), and the people at their desks.
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Box, clamp01, ease, Puck, Rod, slice, useClay } from './kit';

const HALF_PI = Math.PI / 2;

// ── The beat of the lanes ───────────────────────────────────────────────────
// Every BEAT seconds the belts move one place (the first third), then stand still while the
// agents work on whatever stopped under them.
export const BEAT = 1.9;
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
  return (
    <group>
      <mesh geometry={geo} castShadow receiveShadow material={mats.clay} />
      <Puck ref={light} r={0.05} h={0.05} bevel={0.02} segments={14} position={[0.2, 0.87, 0.47]} rotation={[HALF_PI, 0, 0]} />
      <Box size={[0.28, 0.16, 0.12]} position={[0, 0.15, 0.5]} r={0.04} />
    </group>
  );
}

/** HIBEEX's intake: four sockets at the back, one mouth at the front where the raw data comes out. The orange thing of step 1. */
export function Intake() {
  return (
    <group>
      <Box accent size={[1.7, 0.56, 0.9]} position={[0, 0.28, 0]} r={0.13} />
      <Box size={[1.1, 0.08, 0.14]} position={[0, 0.2, 0.42]} r={0.03} />
      {[-0.57, -0.19, 0.19, 0.57].map((x) => (
        <Puck key={x} r={0.075} h={0.1} bevel={0.025} segments={16} position={[x, 0.28, -0.44]} rotation={[HALF_PI, 0, 0]} />
      ))}
    </group>
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

/** What makes the arch a cleaning gate: the scanner bar (the orange thing of step 2) and the fins that square the sheets up. */
export function GateKit() {
  return (
    <group>
      <Box accent size={[0.07, 0.06, 1.05]} r={0.025} position={[0, 0.9, 0]} />
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
// Each is an arch with a tool that does one thing to the sheet that stopped under it.
// `on`: how much the agents are at work (0 while travelling in, 1 while their step holds).

/** Reconciliation: two fingers come down outside a pair of sheets and push them together. */
export function Pairer({ on }: { on: () => number }) {
  const left = useRef<THREE.Mesh>(null);
  const right = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const { act } = beat(clock.elapsedTime);
    const w = on();
    const down = (slice(act, 0, 0.14) - slice(act, 0.72, 0.9)) * w;
    const close = (slice(act, 0.16, 0.42) - slice(act, 0.56, 0.72)) * w;
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

/** Collections: a stamp comes down on the sheet. */
export function Stamper({ on }: { on: () => number }) {
  const head = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const { act } = beat(clock.elapsedTime);
    const down = (ease(slice(act, 0.08, 0.3)) - ease(slice(act, 0.42, 0.7))) * on();
    head.current?.position.setY(0.78 - down * 0.4);
  });
  return (
    <group ref={head} position={[0, 0.78, 0]}>
      <Puck r={0.05} h={0.5} segments={14} position={[0, 0.16, 0]} />
      <Puck r={0.17} h={0.1} bevel={0.03} segments={24} position={[0, -0.09, 0]} />
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
  useFrame(({ clock }) => {
    const { act } = beat(clock.elapsedTime);
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
        <Puck r={0.13} h={0.06} bevel={0.02} segments={20} />
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
/** A desk with someone sitting at it, facing -X where the work comes from. `nod` returns 0..1: they look down at what just landed. */
export function Person({ nod }: { nod: () => number }) {
  const { mats } = useClay();
  const head = useRef<THREE.Group>(null);
  const arms = useMemo(
    () => [-1, 1].map((s) => new THREE.CatmullRomCurve3([new THREE.Vector3(1.0, 1.02, s * 0.25), new THREE.Vector3(0.8, 0.82, s * 0.29), new THREE.Vector3(0.5, 0.77, s * 0.2)])),
    [],
  );
  useFrame(() => {
    if (head.current) head.current.rotation.z = nod() * 0.38;
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
      <Puck r={0.215} h={0.62} bevel={0.2} position={[1.04, 0.84, 0]} />
      {arms.map((path, i) => (
        <Rod key={i} path={path} r={0.058} segments={16} />
      ))}
      <group ref={head} position={[1.02, 1.2, 0]}>
        <mesh position={[0, 0.16, 0]} castShadow receiveShadow material={mats.clay}>
          <sphereGeometry args={[0.185, 32, 24]} />
        </mesh>
      </group>
    </group>
  );
}
