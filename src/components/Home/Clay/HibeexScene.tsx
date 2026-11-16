// HIBEEX in five steps: raw data from the systems accounting firms already use, cleaned,
// worked by agents (reconciliation, collections, contracts), handed back through the people
// who look after the business, and the numbers at one client. Facts: public/llms.txt.
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Arch, beat, Belt, Drum, fileAt, FILE_Z, Filer, GateKit, Intake, Pairer, Person, reamTop, Stamper, Tray, Waffle } from './HibeexParts';
import { Arrow, at, Bar, Bracket, Chart, clamp01, ease, Morph, PLATE, Rig, slice, Tag, useClay, wins, type Play, type V3 } from './kit';

const HALF_PI = Math.PI / 2;
const LANES = [-1.9, 0, 1.9]; // z of each lane: reconciliation, collections, contracts
const STATION = 0.3; // x where the agents stand
const BELT_Y = 0.31; // a sheet lying on a lane
const DESKS = [1.9, 2.6, 3.3]; // x of each desk, stepped so nobody sits behind anybody
const DESK_K = 0.9;
const DESK_TOP = 0.735 * DESK_K;
const DECISION = 2.4; // seconds each person gets before the next decision leaves

// ── Sheets ──────────────────────────────────────────────────────────────────
// One instanced mesh. Every sheet has a place in every step, and a little life while the step
// holds (spilling, riding the belt, being paired / stamped / filed, being handed over).
const SHEETS = 48;
interface Sheet { x: number; y: number; z: number; rx: number; ry: number; rz: number; s: number; hot: number }
const blank = (): Sheet => ({ x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1, hot: 0 });

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// A fixed scatter per sheet: where it lies in a pile, how it is turned.
const SCATTER = (() => {
  const rand = rng(11);
  return Array.from({ length: SHEETS }, () => {
    const a = rand() * Math.PI * 2;
    const d = Math.sqrt(rand());
    return { ax: Math.cos(a) * d, az: Math.sin(a) * d, yaw: rand() * Math.PI * 2, tx: (rand() - 0.5) * 0.18, tz: (rand() - 0.5) * 0.18, skew: (rand() - 0.5) * 1.1, off: (rand() - 0.5) * 0.44 };
  });
})();

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const STREAM = 8; // sheets still coming out of the intake in step 1
const RIDERS = 9; // sheets riding the belt through the gate in step 2
const TRAY_A: V3 = [2.6, 0, 0.2];
const TRAY_B: V3 = [3.8, 0, 0.2];
// Lanes: [first sheet, sheets per item, places on the belt, distance between places, the place under the agent]
const LANE = [
  { first: 0, per: 2, places: 4, pitch: 1.8, stop: 2 },
  { first: 8, per: 1, places: 6, pitch: 1.2, stop: 3 },
  { first: 14, per: 1, places: 6, pitch: 1.2, stop: 3 },
];
const filed = { y: 0, z: 0, tilt: 0 };

function pile(i: number, cx: number, cz: number, rx: number, rz: number, levels: number, o: Sheet) {
  const c = SCATTER[i];
  o.x = cx + c.ax * rx;
  o.z = cz + c.az * rz;
  o.y = 0.012 + (i % levels) * 0.018;
  o.rx = c.tx;
  o.ry = c.yaw;
  o.rz = c.tz;
}

/** Where sheet `i` is while `step` holds, at `time`. */
function sheetAt(step: number, i: number, time: number, o: Sheet) {
  const c = SCATTER[i];
  o.s = 1;
  o.hot = 0;
  o.rx = o.rz = 0;
  if (step === 0) {
    // Raw: a pile in front of the intake, and a few sheets still flying out of its mouth.
    pile(i, 0, 1.85, 2.4, 0.95, 18, o);
    if (i < SHEETS - STREAM) return;
    const ph = (time * 0.17 + i * 0.125) % 1;
    const e = ease(slice(ph, 0, 0.8));
    o.x = lerp(((i % 4) - 1.5) * 0.26, o.x, e);
    o.z = lerp(0.1, o.z, e);
    o.y = lerp(0.24, o.y + 18 * 0.018, e) + Math.sin(e * Math.PI) * 0.75;
    o.rx = c.tx + (1 - e) * 1.3;
    o.ry = c.yaw * e;
    o.s = slice(ph, 0, 0.1) * (1 - slice(ph, 0.92, 1));
  } else if (step === 1) {
    if (i < 12) return pile(i, -3.9, 0.35, 0.8, 0.8, 12, o);
    if (i < 12 + RIDERS) {
      // Clean: off the heap, along the belt, squared up by the gate, onto the ream.
      const ph = (time * 0.085 + (i - 12) / RIDERS) % 1;
      const hop = ease(slice(ph, 0, 0.1));
      const land = ease(slice(ph, 0.88, 0.98));
      const x = lerp(-2.5, 1.5, slice(ph, 0.08, 0.9));
      const square = ease(slice(x, -1.55, -0.8));
      o.x = lerp(lerp(-3.75, x, hop), TRAY_A[0], land);
      o.y = lerp(lerp(0.3, 0.43, hop), reamTop() + 0.24, land) + Math.sin(hop * Math.PI) * 0.4 + Math.sin(land * Math.PI) * 0.25;
      o.z = 0.2 + c.off * (1 - square);
      o.ry = c.skew * (1 - square);
      o.s = slice(ph, 0, 0.05) * (1 - slice(ph, 0.97, 1));
      return;
    }
    // In order: the top of the two reams.
    const k = i - 12 - RIDERS;
    const tray = k % 2 ? TRAY_B : TRAY_A;
    o.x = tray[0];
    o.z = tray[2];
    o.y = reamTop() + 0.008 + Math.floor(k / 2) * 0.016;
    o.ry = 0;
  } else if (step === 2) {
    const lane = i < 8 ? 0 : i < 14 ? 1 : i < 20 ? 2 : -1;
    o.y = BELT_Y;
    o.ry = 0;
    if (lane < 0) {
      // Not on a belt in this step: waiting out of sight at the head of a lane.
      o.x = -5.2;
      o.z = LANES[i % 3];
      o.s = 0;
      return;
    }
    const L = LANE[lane];
    const { tick, move, act } = beat(time);
    const item = Math.floor((i - L.first) / L.per);
    const place = (item + tick) % L.places;
    const stopped = place === L.stop;
    o.z = LANES[lane];
    o.x = STATION + (place - 1 + move - L.stop) * L.pitch;
    if (place === 0) o.s = move;
    if (place === L.places - 1 && lane < 2) {
      // The last place: off the belt, onto the tray at its end.
      const out = ease(act);
      o.x += out * 1.05;
      o.y = lerp(BELT_Y, reamTop(10) + 0.01, slice(act, 0.5, 1)) + Math.sin(out * Math.PI) * 0.2;
      o.s = 1 - slice(act, 0.85, 1);
    }
    if (lane === 0) {
      // Reconciliation: two sheets arrive apart and askew, the fingers push them into one matched pair.
      const side = (i - L.first) % 2 ? 1 : -1;
      const match = place < L.stop ? 0 : stopped ? ease(slice(act, 0.16, 0.42)) : 1;
      o.x += side * lerp(0.4, 0.315, match);
      o.z += side * 0.05 * (1 - match);
      o.ry = side * -0.09 * (1 - match);
      // The orange thing of this step: the pair at the moment it matches.
      o.hot = stopped ? slice(act, 0.38, 0.5) : place === L.stop + 1 ? 1 - move : 0;
    } else if (lane === 2 && place >= L.stop) {
      // Contracts: lifted, stood up and filed in the box beside the belt.
      fileAt(stopped ? act * move : 1, filed);
      if (!stopped) o.x = STATION + (place - L.stop) * 0.012;
      o.y = BELT_Y + filed.y;
      o.z = LANES[2] + filed.z + (stopped ? 0 : (place - L.stop) * 0.06);
      o.rx = -filed.tilt;
      if (place === L.places - 1) o.s = 1 - slice(act, 0.7, 1);
    }
  } else if (step === 3) {
    if (i < 9) {
      // What is still on the lanes.
      o.x = -3.8 + Math.floor(i / 3) * 1.2;
      o.y = BELT_Y;
      o.z = LANES[i % 3];
      o.ry = c.tx * 0.3;
    } else if (i === 9) {
      // The decision (the orange thing of this step): handed to one person at a time.
      const person = Math.floor(time / DECISION) % 3;
      const ph = (time / DECISION) % 1;
      const e = ease(slice(ph, 0, 0.5));
      o.x = lerp(-0.75, DESKS[person] - 0.02 * DESK_K, e);
      o.y = lerp(BELT_Y + 0.1, DESK_TOP + 0.1, e) + Math.sin(e * Math.PI) * 0.85;
      o.z = LANES[person];
      o.ry = e * 0.15;
      o.rz = Math.sin(e * Math.PI) * -0.25;
      o.s = slice(ph, 0, 0.08) * (1 - slice(ph, 0.88, 1));
      o.hot = 1;
    } else if (i < 22) {
      // What each person already has on the desk.
      const k = i - 10;
      o.x = DESKS[k % 3] - 0.02 * DESK_K;
      o.y = DESK_TOP + 0.012 + Math.floor(k / 3) * 0.017;
      o.z = LANES[k % 3];
      o.ry = c.tz * 0.5;
    } else {
      o.x = -0.75;
      o.y = BELT_Y;
      o.z = LANES[i % 3];
      o.s = 0;
    }
  } else {
    // Result: the paper is gone, the numbers stay.
    o.x = ((i % 3) - 1) * 3.4;
    o.y = 0.3;
    o.z = 0;
    o.ry = 0;
    o.s = 0;
  }
}

/** A statement, not a blank page: a header block, lines of text and a table. Clay-coloured, tone on tone. */
function sheetTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 352;
  const g = c.getContext('2d')!;
  g.fillStyle = '#fff';
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = '#aaa39c';
  g.fillRect(26, 28, 96, 16);
  g.fillStyle = '#c9c3bc';
  g.fillRect(194, 24, 36, 36);
  g.fillStyle = '#d3cec8';
  [204, 176, 204, 140].forEach((w, i) => g.fillRect(26, 70 + i * 17, w, 6));
  // The table
  g.strokeStyle = '#c4beb7';
  g.lineWidth = 2;
  g.strokeRect(26, 150, 204, 132);
  g.fillStyle = '#e3dfda';
  g.fillRect(27, 151, 202, 20);
  g.beginPath();
  for (let r = 1; r < 6; r++) g.rect(26, 150 + r * 22, 204, 0);
  for (const x of [112, 172]) g.rect(x, 150, 0, 132);
  g.stroke();
  g.fillStyle = '#d3cec8';
  for (let r = 1; r < 6; r++) [[34, 60], [120, 40], [180, 38]].forEach(([x, w]) => g.fillRect(x, 158 + r * 22, w - ((r * 7) % 16), 5));
  g.fillStyle = '#aaa39c';
  g.fillRect(150, 300, 80, 9);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function Sheets() {
  const { play, mats } = useClay();
  const ref = useRef<THREE.InstancedMesh>(null);
  const marks = useRef<THREE.InstancedMesh>(null);
  const { geo, materials, ring } = useMemo(() => {
    const side = new THREE.MeshStandardMaterial({ roughness: 0.95 });
    const top = new THREE.MeshStandardMaterial({ roughness: 0.95, map: sheetTexture() });
    return { geo: new THREE.BoxGeometry(0.62, 0.014, 0.84), materials: [side, side, top, side, side, side], ring: new THREE.RingGeometry(0.075, 0.105, 28).rotateX(-HALF_PI) };
  }, []);
  useEffect(
    () => () => {
      geo.dispose();
      ring.dispose();
      materials[0].dispose();
      materials[2].map?.dispose();
      materials[2].dispose();
    },
    [geo, ring, materials],
  );
  const tmp = useMemo(() => ({ o: new THREE.Object3D(), c: new THREE.Color(), a: blank(), b: blank(), qa: new THREE.Quaternion(), qb: new THREE.Quaternion(), e: new THREE.Euler() }), []);

  useFrame(({ clock }) => {
    const m = ref.current;
    if (!m) return;
    const time = clock.elapsedTime;
    const { o, c, a, b, qa, qb, e } = tmp;
    const still = play.from === play.to;
    for (let i = 0; i < SHEETS; i++) {
      sheetAt(play.to, i, time, b);
      if (still) {
        o.position.set(b.x, b.y, b.z);
        o.rotation.set(b.rx, b.ry, b.rz);
        o.scale.setScalar(Math.max(b.s, 1e-4));
        c.copy(mats.clay.color).lerp(mats.accent.color, b.hot);
      } else {
        // Sheets leave one after the other and fly in an arc; on the way to the numbers they just clear out.
        sheetAt(play.from, i, time, a);
        const u = play.to === 4 ? slice(play.t, 0, 0.35) : slice(play.t, (i / SHEETS) * 0.3, 0.7 + (i / SHEETS) * 0.3);
        const f = ease(u);
        o.position.set(lerp(a.x, b.x, f), lerp(a.y, b.y, f) + Math.sin(u * Math.PI) * 0.6 * Math.min(a.s, b.s), lerp(a.z, b.z, f));
        o.quaternion.slerpQuaternions(qa.setFromEuler(e.set(a.rx, a.ry, a.rz)), qb.setFromEuler(e.set(b.rx, b.ry, b.rz)), f);
        o.scale.setScalar(Math.max(lerp(a.s, b.s, f), 1e-4));
        c.copy(mats.clay.color).lerp(mats.accent.color, lerp(a.hot, b.hot, f));
      }
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      m.setColorAt(i, c);
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;

    // Collections: the stamp leaves its mark on every sheet that has been under it.
    const k = marks.current;
    if (!k) return;
    const working = at(play, 2);
    k.visible = working > 0.02;
    if (!k.visible) return;
    const L = LANE[1];
    const { tick, act } = beat(time);
    for (let item = 0; item < L.places; item++) {
      const place = (item + tick) % L.places;
      sheetAt(2, L.first + item, time, b);
      const stamped = place > L.stop || (place === L.stop && act > 0.3);
      o.position.set(b.x + 0.12, b.y + 0.009, b.z + 0.22);
      o.rotation.set(0, 0, 0);
      o.scale.setScalar(stamped ? Math.max(b.s * working, 1e-4) : 1e-4);
      o.updateMatrix();
      k.setMatrixAt(item, o.matrix);
    }
    k.instanceMatrix.needsUpdate = true;
  });

  return (
    <>
      <instancedMesh ref={ref} args={[geo, materials, SHEETS]} castShadow receiveShadow frustumCulled={false} />
      <instancedMesh ref={marks} args={[ring, mats.ink, LANE[1].places]} frustumCulled={false} userData={{ overlay: true }} />
    </>
  );
}

// ── Staging ─────────────────────────────────────────────────────────────────
const SYSTEMS = [-3.3, -1.1, 1.1, 3.3];
const NAMES = ['Domínio', 'Conta Azul', 'Nibo', 'Omie'];
const AGENTS = ['Reconciliation', 'Collections', 'Contracts'];
const PEOPLE = ['Accountant', 'Finance BPO', 'Lawyer'];
const H = 2.7; // height of a "before" bar
const STANDS = [-3.45, 0, 3.45]; // x of each result chart
const W_STAND = wins({ '3>4': [0.12, 0.55] }, [0, 0.4]);

// The machines arrive after the paper has started to move, and fold away before it lands elsewhere.
const W_GEAR = wins({ '0>1': [0.2, 0.75], '1>2': [0.1, 0.7], '2>3': [0, 0.6], '3>4': [0, 0.28], '4>0': [0.3, 0.85] }, [0, 0.7]);
const W_LATE = wins({ '1>2': [0.3, 0.85], '2>3': [0.3, 0.9], '0>1': [0.35, 0.9], '3>4': [0, 0.28] }, [0, 0.6]);

const CAMERA = [
  { pos: [0, 5, 10] as V3, look: [0, 0.55, 0.15] as V3 },
  { pos: [5.3, 6.1, 7.5] as V3, look: [0.1, 0.45, 0.3] as V3 }, // down the belt, on a diagonal
  { pos: [2, 8.1, 9.6] as V3, look: [0.7, 0.2, 0.3] as V3 }, // over the three lanes, almost square on
  { pos: [2.2, 6.3, 10.8] as V3, look: [0.6, 0.55, 0.1] as V3 },
  { pos: [0, 5, 11.7] as V3, look: [0, 1.65, 0] as V3 },
];

/** 0..1: the person at desk `i` looks down while the decision lands in front of them. */
const nodOf = (play: Play, i: number, time: number) => {
  if (Math.floor(time / DECISION) % 3 !== i) return 0;
  const ph = (time / DECISION) % 1;
  return (slice(ph, 0.4, 0.55) - slice(ph, 0.8, 0.95)) * at(play, 3);
};

export default function HibeexScene() {
  const { play } = useClay();
  const clock = useRef(0);
  useFrame((s) => void (clock.current = s.clock.elapsedTime));
  const working = () => at(play, 2);
  return (
    <>
      <Rig k={CAMERA} />
      <Sheets />

      {/* 1 · raw data: four systems plugged into one intake */}
      {SYSTEMS.map((x, i) => (
        <group key={NAMES[i]}>
          <Morph k={[{ p: [x, 0, -2.05], s: 1.15 }, null, null, null, null]} win={W_GEAR}>
            <Drum phase={i * 1.7} />
            <Tag at={[0, 1.12, 0]} dx={0} dy={-22} on={[0]}>{NAMES[i]}</Tag>
          </Morph>
          <Arrow a={[x, 0.2, -1.38]} b={[(i - 1.5) * 0.44, 0.34, -1.02]} lift={0.3} on={[0]} />
        </group>
      ))}
      <Morph k={[{ p: [0, 0, -0.5] }, null, null, null, null]} win={W_GEAR}>
        <Intake />
      </Morph>

      {/* 2 · clean: the belt, the gate, the reams in order */}
      <Morph k={[null, { p: [-0.5, 0, 0.2] }, null, null, null]} win={W_GEAR}>
        <Belt len={4.4} h={0.42} />
      </Morph>
      <Morph k={[null, { p: [-0.75, 0, 0.2], s: 1.3 }, null, null, null]} win={W_LATE}>
        <GateKit />
      </Morph>
      {[TRAY_A, TRAY_B].map((p) => (
        <Morph key={p[0]} k={[null, { p }, null, null, null]} win={W_LATE}>
          <Tray />
        </Morph>
      ))}
      <Tag at={[-0.75, 1.45, 0.2]} dx={-34} dy={-40} on={[1]}>Clean</Tag>
      <Tag at={[-3.8, 0.3, 0.95]} dx={-6} dy={44} on={[1]}>Raw</Tag>
      <Tag at={[TRAY_B[0], 0.5, 0.2]} dx={-10} dy={-46} on={[1]}>In order</Tag>

      {/* 2 → 3 · the gate becomes three agents, one arch per lane */}
      {LANES.map((z, i) => (
        <group key={z}>
          <Morph k={[null, { p: [-0.75, 0, 0.2], s: 1.3 }, { p: [STATION, 0, z] }, { p: [-2.6, 0, z] }, null]} win={W_GEAR}>
            <Arch />
            <Morph k={[null, null, {}, {}, null]}>{i === 0 ? <Pairer on={working} /> : i === 1 ? <Stamper on={working} /> : <Filer on={working} />}</Morph>
            
          </Morph>
          <Morph k={[null, null, { p: [0, 0, z] }, { p: [-2.6, 0, z], s: [0.5, 1, 1] }, null]} win={W_GEAR}>
            <Belt len={7.8} h={0.3} />
          </Morph>
          {i < 2 && (
            <Morph k={[null, null, { p: [4.35, 0, z] }, null, null]} win={W_LATE}>
              <Tray n={10} />
            </Morph>
          )}
          <Tag at={[3.3, 0.36, z - 0.56]} dx={-34} dy={-8} on={[2]}>{AGENTS[i]}</Tag>

          {/* 4 · back to the people */}
          <Morph k={[null, null, null, { p: [DESKS[i], 0, z], s: DESK_K }, null]} win={W_LATE}>
            <Person nod={() => nodOf(play, i, clock.current)} />
            <Tag at={[1.05, 1.58, 0]} dx={i === 1 ? 44 : 14} dy={-20} on={[3]}>{PEOPLE[i]}</Tag>
          </Morph>
          <Arrow a={[-0.45, 0.45, z]} b={[DESKS[i] - 0.38, 0.78, z]} lift={0.45} on={[3]} />
        </group>
      ))}

      {/* 5 · result at one client: three charts. Clay is before, orange is after. */}
      {STANDS.map((x, i) => (
        <Morph key={x} k={[null, null, null, null, { p: [x, 0, i === 2 ? -0.4 : 0] }]} win={W_STAND}>
          {i === 0 ? <Chart w={2.7} h={H + 0.42} rules={9} top={H} /> : i === 1 ? <Chart w={2.7} h={H + 0.42} rules={7} top={(H * 60) / 63.9} /> : <Chart w={2.7} h={H + 0.42} d={0.7} />}
        </Morph>
      ))}
      {/* 8 hours of work became 2: a quarter of the bar */}
      <Bar on={4} p={[STANDS[0] - 0.62, PLATE, 0.1]} h={H} />
      <Bar on={4} accent p={[STANDS[0] + 0.62, PLATE, 0.1]} h={(H * 2) / 8} from={H} />
      <Bracket a={[STANDS[0] - 1.25, H + 0.95, -0.7]} b={[STANDS[0] + 1.25, H + 0.95, -0.7]} on={[4]}>{'8h → 2h\nAccounting service'}</Bracket>
      {/* 63.9 days to get paid became 9 */}
      <Bar on={4} p={[STANDS[1] - 0.62, PLATE, 0.1]} h={H} delay={0.04} />
      <Bar on={4} accent p={[STANDS[1] + 0.62, PLATE, 0.1]} h={(H * 9) / 63.9} from={H} delay={0.04} />
      <Bracket a={[STANDS[1] - 1.25, H + 0.95, -0.7]} b={[STANDS[1] + 1.25, H + 0.95, -0.7]} on={[4]}>{'63.9 → 9\nDays to get paid'}</Bracket>
      {/* 94 of every 100 reconciled right */}
      <Waffle on={4} n={94} p={[STANDS[2], PLATE + 0.1, -0.63]} />
      <Bracket a={[STANDS[2] - 1.25, H + 0.95, -0.7]} b={[STANDS[2] + 1.25, H + 0.95, -0.7]} on={[4]}>{'94% accurate\nReconciliation'}</Bracket>
    </>
  );
}
