// Projeto Candela in five steps: the box, what is inside, the experiments, 28 schools, the result.
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Caliper, Cylinder, DROP_X, FLAG_RISE, FLAG_TOP, flagGeometry, HANG, Incline, KitBox, Lid, miniKitGeometry, PULLEY_Y, Riding, schoolGeometries, SpringScale, Stand, Stopwatch, Tape, Track, Weights } from './CandelaParts';
import { Act, ageOf, Arrow, at, Bar, Box, Bracket, bump, Chart, clamp01, ease, Morph, PLATE, pop, Puck, Rig, slice, spring, Tag, useClay, wins, type Play, type Pose, type Shot, type V3 } from './kit';

const HALF_PI = Math.PI / 2;

/** A point given in a setup's own space, taken to the world (setup at `o`, turned `yaw` about Y, scaled `k`). */
const place = (o: V3, yaw: number, [x, y, z]: V3, k = 1): V3 => [
  o[0] + (x * Math.cos(yaw) + z * Math.sin(yaw)) * k,
  o[1] + y * k,
  o[2] + (-x * Math.sin(yaw) + z * Math.cos(yaw)) * k,
];

// The failure rate, on its chart. One unit of height per percentage point.
const UNIT = 0.1;
const RATE: V3 = [0.3, 0, -3.1];
const BAR_30: V3 = [RATE[0] - 0.78, PLATE, RATE[2] + 0.1];
const BAR_10: V3 = [RATE[0] + 0.78, PLATE, RATE[2] + 0.1];

// ── Where things are, per step ───────────────────────────────────────────────
const BOX: Pose[] = [
  { p: [0, 0, 0.3], r: [0, -0.36, 0], s: 1.25 }, // the hero: it opens
  { p: [0.3, 0, 2.05], r: [0, -0.16, 0], s: 1.1 }, // open, low in the frame
  { p: [-9, 0, -0.5], r: [0, 0.4, 0], s: 0.9 }, // out of the way while the experiments run
  { p: [-3.35, 0, 0.2], r: [0, 0.5, 0], s: 0.7 }, // the one kit that goes to 28 schools, half out of the frame
  { p: [BAR_10[0], PLATE + 10 * UNIT, BAR_10[2]], s: 0.34 }, // dropped on the failure rate
];
const onBox = (i: number): Pose => {
  const b = BOX[i]!;
  const k = b.s as number;
  return { p: [b.p![0], b.p![1] + 0.9 * k, b.p![2]], r: b.r, s: k };
};
const LID: Pose[] = [onBox(0), { p: [-3.3, 0.07, -1.5], r: [0, 0.42, 0], s: 1.1 }, onBox(2), onBox(3), onBox(4)];
// Parts wait inside the box at the first step (each in its own place, world units from the box's
// centre), spring out of it at the second and go back into it at the fourth.
const HERO_YAW = BOX[0]!.r![1];
const inBox = (i: number, slot = 0): Pose => {
  const k = BOX[i]!.s as number;
  return { p: [BOX[i]!.p![0] + slot * 1.15 * k, 0.5 * k, BOX[i]!.p![2] + (slot % 0.5) * k], s: 0 };
};
const part = (packed: { at: V3; r?: V3; s: number }, exploded: Pose, experiment: Pose): Pose[] => [
  { p: place(BOX[0]!.p!, HERO_YAW, packed.at), r: packed.r ?? [0, HERO_YAW, 0], s: packed.s },
  exploded,
  experiment,
  inBox(3),
  null,
];
// The setups grow where they stand and fold away on the spot.
const setup = (pose: Pose): Pose[] => [null, null, pose, null, null];

// Who moves when. The lid is thrown clear as the parts spring out one after the other, and closes once they are back in.
const W_BOX = wins({ '0>1': [0, 0.5], '1>2': [0, 0.6], '2>3': [0, 0.5], '3>4': [0, 0.7], '4>0': [0, 0.45] });
const W_LID = wins({ '0>1': [0, 0.6], '1>2': [0, 0.6], '2>3': [0.4, 0.8], '3>4': [0, 0.7], '4>0': [0, 0.45] });
const wPart = (d: number) => wins({ '0>1': [0.04 + d, 0.74 + d], '1>2': [0.04 + d, 0.8 + d], '2>3': [d, 0.5 + d] }, [0, 0.8]);
const wSetup = (d: number) => wins({ '1>2': [d, 0.35 + d], '2>3': [d, 0.38 + d] }, [0, 0.5]);
const SPRUNG = { kick: 2.4, twirl: 1, bounce: 0.18 }; // out of the box like a jack-in-the-box

const DUCK = 2; // seconds into the first step when the box gathers itself for the jump
/** A part looks out of the open box: up it comes `at` seconds into the first step, `rise` high, and bobs there. */
const peek = (rise: number, when: number, k: number) => (g: THREE.Group, p: Play, time: number) => {
  const a = ageOf(p, 0);
  // Just before they spring out they duck, as if taking a run-up.
  g.position.y = ((rise * spring(a - when, 2.3, 5) * (1 - 0.6 * bump(slice(a, DUCK, DUCK + 1))) + 0.035 * Math.sin(time * 5 + when * 20) * slice(a, when + 0.4, when + 0.8)) * at(p, 0)) / k;
};

/** The kit box has a body: it squats before the lid flies open, recoils when the parts spring out, pumps while it sends kits out, and at the end it drops on the failure rate. */
const DROP = 1; // seconds into the result when the kit lands on the bar
/** The failure rate under the kit, in points: 30 until it lands, then squashed past 10 and back to exactly 10. */
const rateAt = (age: number) => 30 - 20 * spring(age - DROP, 2.3, 7);
/** How far above the bar the falling kit still is. */
const fallAt = (age: number) => 2.8 * (1 - clamp01((age - 0.45) / (DROP - 0.45)) ** 2);
const boxAct = (g: THREE.Group, p: Play) => {
  const a0 = ageOf(p, 0);
  const a3 = ageOf(p, 3);
  const a4 = ageOf(p, 4);
  const squat = (0.08 * bump(slice(a0, 0.02, 0.22)) - 0.06 * bump(slice(a0, 0.2, 0.5)) + 0.07 * bump(slice(a0, DUCK, DUCK + 1))) * at(p, 0);
  const recoil = p.to === 1 ? 0.16 * bump(slice(p.age, 0.02, 0.32)) : 0;
  const pump = 0.13 * Math.abs(Math.sin(a3 * Math.PI * 3)) * slice(a3, 0.5, 0.6) * (1 - slice(a3, 1.9, 2.2)) * at(p, 3);
  g.scale.y = 1 - squat - recoil - pump;
  g.position.y = ((rateAt(a4) - 10) * UNIT + fallAt(a4)) * at(p, 4);
};

const TRACK: V3 = [-2.3, 0, 1.75];
const TRACK_K = 1.3;
const INCLINE: V3 = [0.5, 0, -1.9];
const INCLINE_K = 1.3;
const STAND: V3 = [3.5, 0, 0.9];
const STAND_YAW = -0.4;
const STAND_K = 1.35;
const WEIGHTS_K = 1.05; // the weights' scale while they hang from the plane
const SCALE_K = 0.8 * STAND_K; // the spring scale and the cylinder are smaller on the stand
const CYLINDER_K = 0.85 * STAND_K;

// ── 28 schools ──────────────────────────────────────────────────────────────
// Two towns, each a few streets deep, the buildings staggered from one street to the next. 17 + 11 = 28.
const TOWNS = [
  { x: 0.2, rows: [3, 3, 3, 3, 3, 2] },
  { x: 4.05, rows: [2, 2, 2, 2, 2, 1] },
];
const STREET_X = 1.24;
const STREET_Z = 1.2;
const TOWN_Z = -0.15;
const SOURCE = new THREE.Vector3(BOX[3]!.p![0], 0.75, BOX[3]!.p![2]);
const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 3.7) * 43758.5453;
  return x - Math.floor(x);
};
interface School { x: number; z: number; yaw: number; k: number; kind: number; slot: number; door: THREE.Vector3; rank: number }
const SCHOOLS: School[] = (() => {
  const all: School[] = [];
  const perKind = [0, 0, 0];
  for (const town of TOWNS)
    town.rows.forEach((n, row) => {
      for (let i = 0; i < n; i++) {
        const id = all.length;
        const kind = (id + row) % 3;
        const x = town.x + (i - (n - 1) / 2 + ((row % 2) - 0.5) * 0.3) * STREET_X + (hash(id) - 0.5) * 0.1;
        const z = TOWN_Z + (row - 2.5) * STREET_Z + (hash(id + 40) - 0.5) * 0.14;
        const yaw = (hash(id + 80) - 0.5) * 0.3;
        const k = 0.94 + hash(id + 120) * 0.12;
        // The kit is left at the end of the path to the front door.
        const door = new THREE.Vector3(...place([x, 0, z], yaw, [0, 0.024, 0.36], k));
        all.push({ x, z, yaw, k, kind, slot: perKind[kind]++, door, rank: 0 });
      }
    });
  // Nearest to the kit first: the delivery runs across the two towns as a wave.
  const far = all.map((s) => Math.hypot(s.x - SOURCE.x, s.z - SOURCE.z));
  const [min, max] = [Math.min(...far), Math.max(...far)];
  all.forEach((s, i) => (s.rank = (far[i] - min) / (max - min)));
  return all;
})();
const KINDS = [0, 1, 2].map((kind) => SCHOOLS.filter((s) => s.kind === kind).length);
const ROUND = 4.4; // seconds from one round of deliveries to the next

function Schools() {
  const { play, mats } = useClay();
  const meshes = useRef<(THREE.InstancedMesh | null)[]>([]);
  const kits = useRef<THREE.InstancedMesh>(null);
  const flags = useRef<THREE.InstancedMesh>(null);
  const { geos, kit, flag, mat } = useMemo(() => {
    const m = mats.clay.clone();
    m.vertexColors = true;
    return { geos: schoolGeometries(), kit: miniKitGeometry(), flag: flagGeometry(), mat: m };
  }, [mats]);
  useEffect(
    () => () => {
      geos.forEach((g) => g.dispose());
      kit.dispose();
      flag.dispose();
      mat.dispose();
    },
    [geos, kit, flag, mat],
  );
  const o = useMemo(() => new THREE.Object3D(), []);
  useFrame(() => {
    const here = at(play, 3);
    const on = here > 0.001;
    meshes.current.forEach((m) => m && (m.visible = on));
    if (kits.current) kits.current.visible = on;
    if (flags.current) flags.current.visible = on;
    if (!on || !kits.current || !flags.current) return;
    const age = ageOf(play, 3);
    const tau = age % ROUND;
    const reset = 1 - slice(tau, ROUND - 0.35, ROUND);
    const arriving = play.to === 3;
    for (let i = 0; i < SCHOOLS.length; i++) {
      const s = SCHOOLS[i];
      // The schools come up out of the floor, the nearest first, and fold away the other way round.
      const up = arriving ? pop(slice(age, 0.08 + s.rank * 0.34, 0.36 + s.rank * 0.34), 1.3) : ease(slice(here, 0.55 + (1 - s.rank) * 0.2, 1));
      const start = 0.55 + s.rank * 1.25;
      const u = slice(tau, start, start + 0.7);
      const arrived = tau - start - 0.72;
      // A school gives a little jump when its kit lands.
      const jump = bump(slice(arrived, 0, 0.3)) * 0.1;
      o.position.set(s.x, 0, s.z);
      o.rotation.set(0, s.yaw, 0);
      o.scale.set(s.k * up, Math.max(s.k * up * (1 + jump), 1e-4), s.k * up);
      o.updateMatrix();
      meshes.current[s.kind]?.setMatrixAt(s.slot, o.matrix);

      // Its kit: stamped out of the big one, it hops to the door in three bounces and goes in.
      const hop = Math.abs(Math.sin(u * Math.PI * 3));
      o.position.lerpVectors(SOURCE, s.door, u);
      o.position.y = s.door.y + (SOURCE.y - s.door.y) * (1 - slice(u, 0, 0.34)) ** 2 + hop * (0.45 + s.rank * 0.35) * (1 - u * 0.55);
      o.rotation.set(0, s.yaw + (1 - u) * 2.2, 0);
      const size = slice(u, 0, 0.1) * (1 - slice(arrived, 0, 0.2)) * here;
      o.scale.set(size * (1.15 - hop * 0.15), Math.max(size * (0.7 + hop * 0.3), 1e-4), size * (1.15 - hop * 0.15));
      o.updateMatrix();
      kits.current.setMatrixAt(i, o.matrix);

      // And up goes the flag.
      const raised = spring(arrived - 0.05, 2.2, 5) * reset;
      const top = FLAG_TOP[s.kind];
      o.position.set(...place([s.x, 0, s.z], s.yaw, [top[0], top[1] - (1 - raised) * FLAG_RISE, top[2]], s.k * up));
      o.rotation.set(0, s.yaw, 0);
      o.scale.setScalar(Math.max(Math.min(1, raised * 4) * s.k * up * here, 1e-4));
      o.updateMatrix();
      flags.current.setMatrixAt(i, o.matrix);
    }
    meshes.current.forEach((m) => m && (m.instanceMatrix.needsUpdate = true));
    kits.current.instanceMatrix.needsUpdate = true;
    flags.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <>
      {geos.map((geo, kind) => (
        <instancedMesh key={kind} ref={(m) => void (meshes.current[kind] = m)} args={[geo, mat, KINDS[kind]]} castShadow receiveShadow frustumCulled={false} />
      ))}
      <instancedMesh ref={kits} args={[kit, mats.accent, SCHOOLS.length]} castShadow frustumCulled={false} />
      <instancedMesh ref={flags} args={[flag, mats.accent, SCHOOLS.length]} castShadow frustumCulled={false} />
    </>
  );
}

// ── 3,392 students ──────────────────────────────────────────────────────────
// 3,392 = 64 x 53: one figure per student, in loose rows across the front of the frame.
const CROWD_X = 64;
const CROWD_Z = 53;
const PITCH = 0.12;
const CROWD: V3 = [0.3, 0, 1.3];
const GROUND = 0.03; // they stand on a plate of the same clay, so the gaps between them never show the bare floor

function Crowd() {
  const { play, mats } = useClay();
  const ref = useRef<THREE.InstancedMesh>(null);
  const { geo, spread } = useMemo(() => {
    // A peg figure: shoulders narrower than the feet, and a head.
    const body = new THREE.CylinderGeometry(0.022, 0.038, 0.135, 8, 1, true).translate(0, 0.0675, 0);
    const head = new THREE.SphereGeometry(0.036, 9, 7).translate(0, 0.175, 0);
    // Nobody stands exactly on the grid, and nobody is the same height: [dx, dz, height] per figure.
    const s = new Float32Array(CROWD_X * CROWD_Z * 3);
    for (let i = 0; i < CROWD_X * CROWD_Z; i++) s.set([(hash(i) - 0.5) * 0.085, (hash(i + 0.5) - 0.5) * 0.085, 0.86 + hash(i + 0.25) * 0.28], i * 3);
    return { geo: mergeGeometries([body, head])!, spread: s };
  }, []);
  useEffect(() => () => geo.dispose(), [geo]);
  const o = useMemo(() => new THREE.Object3D(), []);
  useFrame(() => {
    const m = ref.current;
    if (!m) return;
    const here = at(play, 4);
    m.visible = here > 0.001;
    if (!m.visible) return;
    const arriving = play.to === 4;
    const age = ageOf(play, 4);
    // The cheer leaves the chart when the kit lands and runs out through the crowd; after it, a wave every 1.6 s.
    const front = (age - DROP) * 7;
    const wave = ((age - DROP - 1.1) % 1.6) * 7;
    for (let i = 0; i < CROWD_X * CROWD_Z; i++) {
      const ix = i % CROWD_X;
      const iz = Math.floor(i / CROWD_X);
      const back = 1 - iz / CROWD_Z;
      // They stand up in a wave from the front row to the last, and sit down the same way.
      const up = arriving ? pop(slice(age, 0.15 + back * 0.4, 0.4 + back * 0.4), 1.2) : ease(slice(here, 0.55 + back * 0.2, 0.8 + back * 0.2));
      const x = CROWD[0] + (ix - (CROWD_X - 1) / 2 + (iz % 2) * 0.5) * PITCH + spread[i * 3];
      const z = CROWD[2] + (iz - (CROWD_Z - 1) / 2) * PITCH + spread[i * 3 + 1];
      const far = Math.hypot(x - RATE[0], z - RATE[2]);
      const cheer = bump((front - far) / 1.6) * 0.75 + bump((wave - far) / 1.3) * 0.4 * slice(age, DROP + 1.1, DROP + 1.2);
      o.position.set(x, GROUND + cheer * 0.07, z);
      o.scale.set(1, Math.max(up * (1 + cheer) * spread[i * 3 + 2], 1e-4), 1);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });
  // 3,392 figures a few pixels wide: occlusion between them only reads as grain, so they sit out of that pass.
  return <instancedMesh ref={ref} args={[geo, mats.clay, CROWD_X * CROWD_Z]} castShadow receiveShadow frustumCulled={false} userData={{ overlay: true }} />;
}

// A different frame for every step, and a move inside each: back from the label as the box opens, in on the moment that matters.
const CAMERA: Shot[] = [
  { pos: [0.45, 2.6, 6.3], look: [0, 0.62, 0.3], to: { pos: [0.3, 3.9, 9.3], look: [0, 1.4, 0.1] }, over: [0.1, 1.2] },
  { pos: [0, 5.3, 12.1], look: [0, 1.72, 0.4], to: { pos: [0, 5.1, 11.4], look: [0, 1.72, 0.4] } },
  { pos: [0.2, 6.5, 12.3], look: [-0.05, 0.85, 0.2], to: { pos: [0.2, 6.35, 12], look: [-0.05, 0.85, 0.2] } },
  { pos: [0.9, 8.5, 11.2], look: [0.9, 0.2, 0.3], to: { pos: [1.2, 8.2, 10.7], look: [1.2, 0.2, 0.3] }, over: [0.6, 2.6] },
  { pos: [0.3, 3.7, 10.8], look: [0.3, 1.38, 0], to: { pos: [0.3, 3.45, 10], look: [0.3, 1.38, 0] }, over: [0.7, 1.5] },
];

export default function CandelaScene() {
  const hang = place(STAND, STAND_YAW, HANG, STAND_K);
  const foot = place(STAND, STAND_YAW, [HANG[0], 0.09, HANG[2]], STAND_K);
  const mass: V3 = [INCLINE[0] + DROP_X * INCLINE_K, (PULLEY_Y - 0.22) * INCLINE_K - 0.74 * WEIGHTS_K, INCLINE[2]];
  return (
    <>
      <Rig k={CAMERA} />

      <Act f={boxAct}>
        <Morph k={BOX} win={W_BOX} bounce={0.12}>
          <KitBox />
        </Morph>
        <Morph k={LID} win={W_LID} arc={1.6} twirl={1}>
          <Lid />
        </Morph>
      </Act>

      {/* What's inside. They look out of the open box one by one, then spring out, each above the spot where its experiment will stand. */}
      <Morph k={part({ at: [-0.75, 0.55, -0.35], s: 0.85 }, { p: [-1.55, 3.1, -0.4], r: [0.12, 0.3, 0.06], s: 1.5 }, { p: [-1.95, 0.42, -1.28], r: [0, Math.PI, 0], s: 1.3 })} win={wPart(0.05)} {...SPRUNG}>
        <Act f={peek(0.75, 0.66, 0.85)}>
          <Tape />
        </Act>
        <Tag at={[0, 0.34, 0]} dx={0} dy={-20} on={[1]}>Measuring tape</Tag>
      </Morph>
      <Morph k={part({ at: [-0.3, 0.5, 0.45], r: [Math.PI, -HERO_YAW, 0], s: 0.75 }, { p: [0.45, 3.3, -0.5], r: [0.1, 0.08, 0], s: 1.4 }, { p: [2.55, 0.035, 2.9], r: [-HALF_PI, 0, 0.1], s: 1.05 })} win={wPart(0.1)} {...SPRUNG}>
        <Act f={peek(-0.6, 0.78, 0.75)}>
          <Caliper />
        </Act>
        <Tag at={[0.6, 0.1, 0]} dx={26} dy={-34} on={[1]}>Caliper</Tag>
      </Morph>
      <Morph k={part({ at: [1.35, 1, -0.45], s: 0.62 }, { p: [3.15, 4.2, 0.2], s: 1.45 }, { p: hang, s: SCALE_K })} win={wPart(0.25)} {...SPRUNG}>
        <Act f={peek(0.65, 1.14, 0.62)}>
          <SpringScale
            bob={
              <Morph k={[null, null, { p: [0, -0.28, 0] }, null, null]}>
                <Puck r={0.085} h={0.2} bevel={0.035} />
              </Morph>
            }
          />
        </Act>
        <Tag at={[0.12, -0.45, 0]} dx={58} dy={-16} on={[1]}>{'Spring\nscale'}</Tag>
      </Morph>
      <Morph k={part({ at: [-1.3, 0.52, 0.3], s: 0.8 }, { p: [-3.6, 1.6, 0.9], r: [-0.15, 0.3, 0], s: 1.45 }, { p: [0.8, 0.1, 2.55], r: [-HALF_PI, 0, 0.5], s: 1.1 })} win={wPart(0)} {...SPRUNG}>
        <Act f={peek(0.55, 0.54, 0.8)}>
          <Stopwatch />
        </Act>
        <Tag at={[0, 0.68, 0]} dx={0} dy={-20} on={[1]}>Stopwatch</Tag>
      </Morph>
      <Morph k={part({ at: [0.55, 0.15, 0.45], s: 0.95 }, { p: [2.1, 1.5, 0.9], s: 1.65 }, { p: mass, s: WEIGHTS_K })} win={wPart(0.15)} {...SPRUNG}>
        <Act f={peek(0.6, 0.9, 0.95)}>
          <Riding k={INCLINE_K / WEIGHTS_K}>
            <Weights />
          </Riding>
        </Act>
        <Tag at={[-0.2, 0.2, 0]} dx={-46} dy={-34} on={[1]}>Weights</Tag>
      </Morph>
      <Morph k={part({ at: [1.3, 0.15, 0.35], s: 0.78 }, { p: [4.2, 1.2, 0.5], s: 1.5 }, { p: foot, s: CYLINDER_K })} win={wPart(0.2)} {...SPRUNG}>
        <Act f={peek(0.55, 1.02, 0.78)}>
          <Cylinder />
        </Act>
        <Tag at={[0, 0, 0]} dx={0} dy={24} on={[1]}>{'Graduated\ncylinder'}</Tag>
      </Morph>

      {/* Three of the five experiments, running */}
      <Morph k={setup({ p: TRACK, r: [0, 0.1, 0], s: TRACK_K })} win={wSetup(0)}>
        <Track />
        <Tag at={[-0.6, 0.12, 1.05]} dx={14} dy={36} on={[2]}>Track and car</Tag>
      </Morph>
      <Morph k={setup({ p: INCLINE, s: INCLINE_K })} win={wSetup(0.05)} bounce={0.1}>
        <Incline />
        <Tag at={[0, 0.72, 0]} dx={-40} dy={-66} on={[2]}>Inclined plane</Tag>
      </Morph>
      <Morph k={setup({ p: STAND, r: [0, STAND_YAW, 0], s: STAND_K })} win={wSetup(0.1)} bounce={0.1}>
        <Stand />
        <Tag at={[0.45, 0.1, 0.55]} dx={-6} dy={34} on={[2]}>{'Spring scale\n+ cylinder'}</Tag>
      </Morph>

      {/* 28 schools: the kit goes out to two towns */}
      <Schools />
      <Arrow a={[-2.45, 0.45, 0.2]} b={[-1.75, 0.2, 0.05]} lift={0.3} on={[3]} />
      <Arrow a={[-2.9, 0.75, -0.5]} b={[2.9, 0.45, -1.9]} lift={2.3} on={[3]} />
      <Bracket below a={[-1.6, 0.02, 3.6]} b={[2, 0.02, 3.6]} on={[3]}>Bahia · 17</Bracket>
      <Bracket below a={[3.05, 0.02, 3.6]} b={[5.05, 0.02, 3.6]} on={[3]}>Ceará · 11</Bracket>

      {/* The result. Both bars stand at 30; then the kit drops on one of them and squashes it to 10. The crowd cheers from the chart outwards. */}
      <Morph k={[null, null, null, null, { p: RATE }]} win={wins({ '3>4': [0, 0.45] }, [0, 0.4])} bounce={0.1}>
        <Chart w={3.3} h={30 * UNIT + 0.45} d={1.6} rules={7} top={30 * UNIT} />
      </Morph>
      <Bar on={4} p={BAR_30} w={1.2} h={30 * UNIT} />
      <Act
        position={BAR_10}
        f={(g, p) => {
          const a = ageOf(p, 4);
          const grow = p.to === 4 ? pop(slice(a, 0.2, 0.5), 1.4) : ease(slice(at(p, 4), 0.6, 1));
          const wide = Math.min(grow, 1) * (1 + 0.16 * bump(slice(a, DROP, DROP + 0.35)));
          g.visible = grow > 0.001;
          g.scale.set(wide, (grow * rateAt(a)) / 10, wide);
        }}
      >
        <Box accent size={[1.2, 10 * UNIT, 1.2]} r={0.05} position={[0, 5 * UNIT, 0]} />
      </Act>
      <Morph k={[null, null, null, null, { p: CROWD }]} win={wins({ '3>4': [0.1, 0.45] }, [0.3, 0.9])}>
        <Box size={[CROWD_X * PITCH + 0.3, GROUND, CROWD_Z * PITCH + 0.25]} position={[PITCH / 4, GROUND / 2, 0]} r={0.012} />
      </Morph>
      <Crowd />
      <Arrow a={[BAR_30[0] + 0.3, PLATE + 30 * UNIT + 0.12, BAR_30[2]]} b={[BAR_10[0] - 0.2, PLATE + 14 * UNIT + 0.2, BAR_10[2] + 0.3]} lift={0.5} bend={[0.5, 0, 0]} on={[4]} after={DROP + 0.25} />
      <Tag at={[BAR_30[0] - 0.6, PLATE + 26 * UNIT, BAR_30[2] + 0.3]} dx={-62} dy={-14} on={[4]}>Before · 30%</Tag>
      <Tag at={[BAR_10[0] + 0.6, PLATE + 8 * UNIT, BAR_10[2] + 0.3]} dx={46} dy={-30} on={[4]} after={DROP + 0.25}>After · 10%</Tag>
      <Tag at={[CROWD[0] + 3.5, 0.22, CROWD[2] - 2.6]} dx={-6} dy={-30} on={[4]}>3,392 students</Tag>
    </>
  );
}
