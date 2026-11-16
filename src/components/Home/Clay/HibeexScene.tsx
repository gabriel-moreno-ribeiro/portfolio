// HIBEEX in five steps: raw data from the systems accounting firms already use, cleaned,
// worked by agents (reconciliation, collections, contracts), handed back through the people
// who look after the business, and the numbers at one client. Facts: public/llms.txt.
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Arrow, Bar, Box, Bracket, clamp01, ease, Morph, near, Puck, Rig, Tag, useClay, type Pose, type V3, type Win } from './kit';

const LANES = [-1.7, 0, 1.7]; // z of each lane: reconciliation, collections, contracts
const DESKS = [2.05, 2.85, 3.65]; // x of each station, stepped so nobody stands behind anybody
const DESK_K = 0.85;
const SHEETS = 36;
const SHEET: V3 = [0.62, 0.014, 0.84];

// ── Sheets ──────────────────────────────────────────────────────────────────
// One instanced mesh; every sheet has a pose (and maybe the accent) per step.
interface SheetKey { p: V3; r: V3; s?: number; hot?: boolean }

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SYSTEMS: V3[] = [-3.6, -1.2, 1.2, 3.6].map((x) => [x, 0, -1.9]);
const PILE: V3 = [0, 0, 1];
const AIRBORNE = 8; // the last sheets are still on their way out of the systems at step 1

function pile(rand: () => number, centre: V3, rx: number, rz: number, level: number): SheetKey {
  const a = rand() * Math.PI * 2;
  const d = Math.sqrt(rand());
  return {
    p: [centre[0] + Math.cos(a) * d * rx, 0.012 + level * 0.017, centre[2] + Math.sin(a) * d * rz],
    r: [(rand() - 0.5) * 0.16, rand() * Math.PI * 2, (rand() - 0.5) * 0.16],
  };
}

/** Where an airborne sheet is at `t` (0 = leaving its system, 1 = landing on the pile). */
function spill(i: number, t: number, out: SheetKey) {
  const from = SYSTEMS[i % SYSTEMS.length];
  out.p[0] = from[0] + (PILE[0] + (from[0] > 0 ? 0.5 : -0.5) - from[0]) * t;
  out.p[1] = 0.55 + 0.5 * Math.sin(t * Math.PI) - 0.4 * t;
  out.p[2] = -1.2 + (PILE[2] - 0.3 + 1.2) * t;
  out.r[0] = 0.9 - t * 0.8;
  out.r[1] = (i % 2 ? 0.5 : -0.4) + t * 0.6;
  out.r[2] = 0.2;
  out.s = Math.sin(Math.min(1, t * 1.15) * Math.PI) ** 0.4;
}

function sheetKeys(): SheetKey[][] {
  const rand = rng(7);
  return Array.from({ length: SHEETS }, (_, i) => {
    const lane = i % 3;
    const k = Math.floor(i / 3); // 0..11 within its lane
    const z = LANES[lane];
    const jitter = (rand() - 0.5) * 0.06;

    // 1 · raw: a messy pile, and a few sheets still spilling out of the systems
    const raw: SheetKey = pile(rand, PILE, 1.9, 0.95, i % 14);
    if (i >= SHEETS - AIRBORNE) spill(i, i % 2 ? 0.34 : 0.68, raw);

    // 2 · clean: some still in the pile, a line going through the gate, the rest stacked in order
    let clean: SheetKey;
    if (i < 12) clean = pile(rand, [-3.1, 0, 0.5], 0.95, 0.8, i % 6);
    else if (i < 16) clean = { p: [-1.55 + (i - 12) * 0.82, 0.62, 0.2], r: [0, (15 - i) * 0.22 - 0.16, (15 - i) * 0.05] };
    else clean = { p: [i % 2 ? 2.15 : 3.3, 0.012 + Math.floor((i - 16) / 2) * 0.017, 0.2], r: [0, 0, 0] };

    // 3 · agents: three lanes, small stacks along each; one matched pair on reconciliation
    const slot = k % 4;
    const level = Math.floor(k / 4);
    let work: SheetKey = { p: [-1.4 + slot * 1.35, 0.062 + level * 0.017, z], r: [0, jitter, 0] };
    const paired = lane === 0 && slot === 3;
    if (paired && level < 2) work = { p: [2.65 + (level ? 0.33 : -0.33), 0.062, z], r: [0, 0, 0], hot: true };
    else if (paired) work = { p: [-1.4, 0.062 + 3 * 0.017, z], r: [0, jitter, 0] };

    // 4 · people: four sheets of each lane land on the desk, the top one is the decision
    const out = k >= 8;
    const back: SheetKey = out
      ? { p: [DESKS[lane] - 0.04, 0.62 * DESK_K + 0.012 + (k - 8) * 0.017 + (k === 11 ? 0.05 : 0), z], r: [0, k === 11 ? 0.18 : jitter, 0], hot: k === 11 }
      : { p: [-2.5 + (k % 2) * 1.4, 0.062 + Math.floor(k / 2) * 0.017, z], r: [0, jitter, 0] };

    // 5 · result: the paper is gone, the numbers stay
    const done: SheetKey = { p: [(lane - 1) * 3.4, 0.2, 0], r: [0, 0, 0], s: 0 };
    return [raw, clean, work, back, done];
  });
}

function sheetTexture() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 176;
  const g = c.getContext('2d')!;
  g.fillStyle = '#fff';
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = '#b4aea8';
  g.fillRect(14, 16, 46, 7);
  g.fillStyle = '#d6d1cb';
  for (let i = 0; i < 12; i++) g.fillRect(14, 36 + i * 10.5, [100, 92, 100, 74, 100, 96, 58, 100, 88, 100, 96, 44][i], 3);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function Sheets() {
  const { step, mats } = useClay();
  const ref = useRef<THREE.InstancedMesh>(null);
  const { geo, materials, keys, quats } = useMemo(() => {
    const map = sheetTexture();
    const side = new THREE.MeshStandardMaterial({ roughness: 0.95 });
    const top = new THREE.MeshStandardMaterial({ roughness: 0.95, map });
    const keys = sheetKeys();
    const e = new THREE.Euler();
    return {
      geo: new THREE.BoxGeometry(...SHEET),
      materials: [side, side, top, side, side, side],
      keys,
      quats: keys.map((ks) => ks.map((k) => new THREE.Quaternion().setFromEuler(e.set(...k.r)))),
    };
  }, []);
  useEffect(
    () => () => {
      geo.dispose();
      materials[0].dispose();
      materials[2].map?.dispose();
      materials[2].dispose();
    },
    [geo, materials],
  );
  const tmp = useMemo(() => ({ o: new THREE.Object3D(), c: new THREE.Color(), q: new THREE.Quaternion(), e: new THREE.Euler(), air: { p: [0, 0, 0], r: [0, 0, 0] } as SheetKey }), []);

  useFrame(({ clock }) => {
    const m = ref.current;
    if (!m) return;
    const s = step.current;
    const t = clock.elapsedTime;
    const { o, c, q, e, air } = tmp;
    const i0 = Math.min(Math.floor(s), 3);
    m.visible = s < 3.3;
    if (!m.visible) return;
    for (let i = 0; i < SHEETS; i++) {
      // Sheets leave one after the other, never all at once.
      // On the way to the numbers the paper clears out first.
      const f = ease(clamp01(i0 === 3 ? (s - 3) / 0.3 : (s - i0 - (i / SHEETS) * 0.3) / 0.7));
      let a = keys[i][i0];
      let qa = quats[i][i0];
      const b = keys[i][i0 + 1];
      // Raw data keeps spilling out of the systems while the first step holds.
      if (i0 === 0 && i >= SHEETS - AIRBORNE) {
        spill(i, (t * 0.11 + i * 0.37) % 1, air);
        a = air;
        qa = q.setFromEuler(e.set(...air.r));
      }
      o.position.set(a.p[0] + (b.p[0] - a.p[0]) * f, a.p[1] + (b.p[1] - a.p[1]) * f + Math.sin(f * Math.PI) * 0.5, a.p[2] + (b.p[2] - a.p[2]) * f);
      o.quaternion.slerpQuaternions(qa, quats[i][i0 + 1], f);
      // The matched pair clicks together; the decisions hover over their stacks.
      if (a.hot && i0 === 2) o.position.x += (o.position.x < 2.65 ? -1 : 1) * 0.09 * Math.max(0, Math.sin(t * 1.5)) ** 3 * (1 - f);
      if (b.hot && i0 === 2) o.position.y += Math.sin(t * 1.3 + i) * 0.02 * f;
      if (a.hot && i0 === 3) o.position.y += Math.sin(t * 1.3 + i) * 0.02 * (1 - f);
      o.scale.setScalar(Math.max((a.s ?? 1) + ((b.s ?? 1) - (a.s ?? 1)) * f, 1e-4));
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      m.setColorAt(i, c.copy(mats.clay.color).lerp(mats.accent.color, (a.hot ? 1 - f : 0) + (b.hot ? f : 0)));
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });

  return <instancedMesh ref={ref} args={[geo, materials, SHEETS]} castShadow receiveShadow frustumCulled={false} />;
}

// ── Models ──────────────────────────────────────────────────────────────────
/** A source system: the three stacked discs everyone reads as "a database", with HIBEEX's plug in orange. */
function System() {
  return (
    <group>
      {[0.13, 0.42, 0.71].map((y) => (
        <Puck key={y} r={0.5} h={0.25} bevel={0.07} position={[0, y, 0]} />
      ))}
      <Box accent size={[0.34, 0.16, 0.2]} r={0.05} position={[0, 0.13, 0.55]} />
    </group>
  );
}

/** An arch the sheets pass under: the cleaning gate, then one agent per lane. */
function Arch() {
  return (
    <group>
      <Box size={[0.13, 0.92, 0.13]} r={0.045} position={[0, 0.46, -0.62]} />
      <Box size={[0.13, 0.92, 0.13]} r={0.045} position={[0, 0.46, 0.62]} />
      <Box size={[0.13, 0.13, 1.37]} r={0.045} position={[0, 0.92, 0]} />
    </group>
  );
}

/** An agent's arch sweeps its lane while the agents are at work. */
function Sweep({ phase, children }: { phase: number; children: React.ReactNode }) {
  const { step } = useClay();
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const s = step.current;
    if (ref.current) ref.current.position.x = Math.sin(clock.elapsedTime * 0.55 + phase) * (1.5 * near(s, 2, 1.4) + 0.6 * near(s, 3, 1.4));
  });
  return <group ref={ref}>{children}</group>;
}

function Station() {
  const { mats } = useClay();
  return (
    <group>
      <Box size={[0.95, 0.62, 1.3]} r={0.07} position={[0, 0.31, 0]} />
      <Puck r={0.27} h={0.86} bevel={0.26} position={[0.98, 0.43, 0]} />
      <mesh position={[0.98, 1.08, 0]} castShadow receiveShadow material={mats.clay}>
        <sphereGeometry args={[0.21, 32, 24]} />
      </mesh>
    </group>
  );
}

const CAMERA = [
  { pos: [0, 5.4, 10.8] as V3, look: [0, 0.4, -0.35] as V3 },
  { pos: [3.9, 3.8, 9] as V3, look: [0.2, 0.7, 0.2] as V3 },
  { pos: [3.6, 6.2, 10.8] as V3, look: [0.6, 0.2, 0.1] as V3 },
  { pos: [2.6, 6.9, 11.2] as V3, look: [0.6, 0.35, 0.1] as V3 },
  { pos: [0, 4.8, 11.6] as V3, look: [0, 1.25, 0] as V3 },
];

const NAMES = ['Domínio', 'Conta Azul', 'Nibo', 'Omie'];
const AGENTS = ['Reconciliation', 'Collections', 'Contracts'];
const PEOPLE = ['Accountant', 'Finance BPO', 'Lawyer'];
const H = 2.6; // height of a "before" bar
const W_LATE: Win = [undefined, [0.35, 1], [0.35, 1], undefined];

export default function HibeexScene() {
  return (
    <>
      <Rig k={CAMERA} />
      <Sheets />

      {/* 1 · raw data: the four systems */}
      {SYSTEMS.map((p, i) => (
        <group key={NAMES[i]}>
          <Morph k={[{ p }, { p: [-4.3 + i * 0.62, 0, -2.3], s: 0.42 }, null, null, null]}>
            <System />
            <Tag at={[0, 0.9, 0]} dx={0} dy={-26} on={[0]}>{NAMES[i]}</Tag>
          </Morph>
          <Arrow a={[p[0], 0.2, p[2] + 0.75]} b={[PILE[0] + p[0] * 0.38, 0.25, PILE[2] - 0.95]} lift={0.35} on={[0]} />
        </group>
      ))}

      {/* 2 · clean: the gate; 3 · it becomes the agents, one arch per lane */}
      {LANES.map((z, i) => (
        <Morph key={z} k={[null, { p: [0.15, 0, 0.2], s: 1.5 }, { p: [0.7, 0, z] }, { p: [-1.75, 0, z] }, null]} win={[undefined, [0.3, 1], undefined, [0, 0.5]]}>
          <Sweep phase={i * 2.1}>
            <Arch />
          </Sweep>
        </Morph>
      ))}
      <Morph k={[null, { p: [0.15, 1.5, 0.2], s: 1.5 }, null, null, null]} win={[[0.6, 1], [0, 0.3], undefined, undefined]}>
        <Box accent size={[0.12, 0.05, 0.5]} r={0.02} />
      </Morph>
      <Tag at={[0.15, 1.5, 0.2]} dx={-40} dy={-46} on={[1]}>Clean</Tag>
      <Tag at={[3.3, 0.2, 0.2]} dx={36} dy={-60} on={[1]}>In order</Tag>
      <Arrow a={[-1.9, 0.62, 1.25]} b={[1.9, 0.5, 1.25]} lift={0.2} on={[1]} />

      {/* 3 · the lanes */}
      {LANES.map((z, i) => (
        <group key={z}>
          <Morph k={[null, null, { p: [0.7, 0, z] }, { p: [-1.75, 0, z], s: [0.5, 1, 1] }, null]} win={W_LATE}>
            <Box size={[5.9, 0.05, 1.12]} r={0.024} position={[0, 0.025, 0]} />
          </Morph>
          <Arrow a={[-4.4, 0.25, z]} b={[-2.45, 0.2, z]} lift={0.25} on={[2]} />
          <Tag at={[3.65, 0.06, z]} dx={34} dy={-22} on={[2]}>{AGENTS[i]}</Tag>

          {/* 4 · back to the people */}
          <Morph k={[null, null, null, { p: [DESKS[i], 0, z], s: DESK_K }, null]} win={[undefined, undefined, [0.35, 0.9], [0, 0.4]]}>
            <Station />
            <Tag at={[1.05, 1.24, 0]} dx={12} dy={-22} on={[3]}>{PEOPLE[i]}</Tag>
          </Morph>
          <Arrow a={[-0.15, 0.3, z]} b={[DESKS[i] - 0.6, 0.66, z]} lift={0.4} on={[3]} />
        </group>
      ))}

      {/* 5 · result at one client: the tall bar is before, the orange one after */}
      <Bar p={[-4.05, 0, 0]} h={H} />
      <Bar accent p={[-2.85, 0, 0]} h={(H * 2) / 8} from={H} />
      <Bracket a={[-4.6, H + 0.45, 0]} b={[-2.3, H + 0.45, 0]} on={[4]}>8h → 2h<br />Accounting service</Bracket>

      <Bar p={[-0.6, 0, 0]} h={H} delay={0.04} />
      <Bar accent p={[0.6, 0, 0]} h={(H * 9) / 63.9} from={H} delay={0.04} />
      <Bracket a={[-1.15, H + 0.45, 0]} b={[1.15, H + 0.45, 0]} on={[4]}>63.9 → 9<br />Days to get paid</Bracket>

      {/* 94 of every 100 reconciled right: the orange part of the column */}
      <Bar accent p={[3.45, 0, 0]} h={H * 0.94} delay={0.08} />
      <Morph k={[null, null, null, null, { p: [3.45, H * 0.94 + 0.03, 0] }]} win={[undefined, undefined, undefined, [0.75, 1]]}>
        <Box size={[1, H * 0.06, 1]} r={0.06} position={[0, H * 0.03, 0]} />
      </Morph>
      <Bracket a={[2.3, H + 0.45, 0]} b={[4.6, H + 0.45, 0]} on={[4]}>94% accurate<br />Reconciliation</Bracket>
    </>
  );
}
