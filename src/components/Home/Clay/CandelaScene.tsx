// Projeto Candela in five steps: the box, what is inside, the experiments, 28 schools, the result.
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Caliper, Cylinder, DROP_X, HANG, Incline, KitBox, Lid, PULLEY_Y, Riding, SpringScale, Stand, Stopwatch, Tape, Track, Weights } from './CandelaParts';
import { Arrow, at, Bar, Bracket, ease, Morph, pop, Puck, Rig, slice, Tag, useClay, wins, type Pose, type V3 } from './kit';

const HALF_PI = Math.PI / 2;

/** A point given in a setup's own space, taken to the world (setup at `o`, turned `yaw` about Y, scaled `k`). */
const place = (o: V3, yaw: number, [x, y, z]: V3, k = 1): V3 => [
  o[0] + (x * Math.cos(yaw) + z * Math.sin(yaw)) * k,
  o[1] + y * k,
  o[2] + (-x * Math.sin(yaw) + z * Math.cos(yaw)) * k,
];

// ── Where things are, per step ───────────────────────────────────────────────
const BOX: Pose[] = [
  { p: [0, 0, 0.3], r: [0, -0.36, 0], s: 1.5 }, // the hero
  { p: [0.3, 0, 2.05], r: [0, -0.16, 0], s: 1.1 }, // open, low in the frame
  { p: [-9, 0, -0.5], r: [0, 0.4, 0], s: 0.9 }, // out of the way while the experiments run
  { p: [-3.95, 0, 0.3], r: [0, 0.3, 0], s: 0.9 }, // the one kit that becomes 28
  null,
];
const onBox = (i: number): Pose => {
  const b = BOX[i]!;
  const k = b.s as number;
  return { p: [b.p![0], 0.9 * k, b.p![2]], r: b.r, s: k };
};
const LID: Pose[] = [onBox(0), { p: [-3.3, 0.07, -1.5], r: [0, 0.42, 0], s: 1.1 }, onBox(2), onBox(3), null];
// Parts leave the box at step 1 and go back into it at step 3. Each has its own place inside
// (`slot`, -1..1 across the box), so they rise side by side instead of through each other.
const inBox = (i: number, slot = 0): Pose => {
  const k = BOX[i]!.s as number;
  return { p: [BOX[i]!.p![0] + slot * 1.15 * k, 0.5 * k, BOX[i]!.p![2] + (slot % 0.5) * k], s: 0 };
};
const part = (slot: number, exploded: Pose, experiment: Pose): Pose[] => [inBox(1, slot), exploded, experiment, inBox(3), null];
// The setups grow where they stand and fold away on the spot.
const setup = (pose: Pose): Pose[] => [null, null, pose, null, null];

// Who moves when. The lid clears the way before the parts rise, and closes once they are back in.
const W_BOX = wins({ '0>1': [0, 0.5], '1>2': [0, 0.6], '2>3': [0, 0.5], '3>4': [0, 0.35], '4>0': [0.3, 0.9] });
const W_LID = wins({ '0>1': [0, 0.55], '1>2': [0, 0.6], '2>3': [0.4, 0.8], '3>4': [0, 0.35], '4>0': [0.3, 0.9] });
const wPart = (d: number) => wins({ '0>1': [0.3 + d, 0.88 + d], '1>2': [0.08 + d, 0.82 + d], '2>3': [d, 0.42 + d] }, [0, 0.8]);
const wSetup = (d: number) => wins({ '1>2': [0.3 + d, 0.8 + d], '2>3': [d, 0.38 + d] }, [0, 0.5]);

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
const COLS = 7;
const SCHOOLS = 28;
const SOURCE = new THREE.Vector3(BOX[3]!.p![0], 0.3, BOX[3]!.p![2]);
const cell = (i: number): V3 => [-1.15 + (i % COLS) * 1.04, 0, -1.85 + Math.floor(i / COLS) * 1.26];

/** A closed kit as one piece of geometry, for the 28 copies. Plain clay: only the first kit carries the orange plate. */
function kitGeometry() {
  const body = new RoundedBoxGeometry(3, 0.88, 1.9, 3, 0.05).translate(0, 0.44, 0);
  const lid = new RoundedBoxGeometry(3.1, 0.12, 2, 3, 0.04).translate(0, 0.955, 0);
  const plate = new RoundedBoxGeometry(1.8, 0.52, 0.06, 2, 0.02).translate(0, 0.45, 0.96);
  const handle = new RoundedBoxGeometry(0.9, 0.1, 0.1, 2, 0.04).translate(0, 1.06, 0);
  return mergeGeometries([body, lid, plate, handle])!;
}

function Schools() {
  const { play, mats } = useClay();
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(kitGeometry, []);
  const tmp = useMemo(() => ({ o: new THREE.Object3D(), to: new THREE.Vector3() }), []);
  useFrame(({ clock }) => {
    const m = ref.current;
    if (!m) return;
    const here = at(play, 3);
    m.visible = here > 0.001;
    if (!m.visible) return;
    const arriving = play.to === 3;
    const { o, to } = tmp;
    for (let i = 0; i < SCHOOLS; i++) {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      to.set(...cell(i));
      let size: number;
      if (arriving) {
        // Out of the first kit, column by column, on an arc; each lands with a little bounce.
        const u = slice(here, 0.42 + (col + row * 0.4) * 0.035, 0.72 + (col + row * 0.4) * 0.035);
        o.position.lerpVectors(SOURCE, to, ease(u));
        o.position.y += Math.sin(u * Math.PI) * 1.1;
        o.rotation.set(0, 0.3 * (1 - u), 0);
        size = pop(u, 1.3);
      } else {
        // Leaving: they fold away where they stand, last column first.
        size = ease(slice(here, 0.62 + (COLS - col) * 0.012, 1));
        o.position.copy(to);
        o.rotation.set(0, 0, 0);
      }
      // While the step holds, a small hop runs across the grid.
      o.position.y += Math.max(0, Math.sin(clock.elapsedTime * 2.2 - col * 0.55 - row * 0.3)) ** 8 * 0.16 * slice(here, 0.95, 1);
      o.scale.setScalar(Math.max(size * 0.285, 1e-4));
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[geo, mats.clay, SCHOOLS]} castShadow receiveShadow frustumCulled={false} />;
}

// ── 3,392 students ──────────────────────────────────────────────────────────
// 3,392 = 64 x 53: one figure per student.
const CROWD_X = 64;
const CROWD_Z = 53;
const PITCH = 0.088;
const CROWD: V3 = [2.15, 0, 0.3];

function Crowd() {
  const { play, mats } = useClay();
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => mergeGeometries([new THREE.CapsuleGeometry(0.024, 0.05, 2, 6).translate(0, 0.049, 0), new THREE.SphereGeometry(0.021, 6, 5).translate(0, 0.118, 0)])!, []);
  const o = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }) => {
    const m = ref.current;
    if (!m) return;
    const here = at(play, 4);
    m.visible = here > 0.001;
    if (!m.visible) return;
    const arriving = play.to === 4;
    const t = clock.elapsedTime;
    for (let i = 0; i < CROWD_X * CROWD_Z; i++) {
      const ix = i % CROWD_X;
      const iz = Math.floor(i / CROWD_X);
      const across = ix / CROWD_X;
      // They stand up in a wave from the left, and sit down the same way.
      const up = arriving ? pop(slice(here, 0.3 + across * 0.4, 0.55 + across * 0.4), 1.2) : ease(slice(here, 0.55 + across * 0.2, 0.8 + across * 0.2));
      // While the step holds, a ripple crosses the crowd.
      const ripple = 1 + Math.max(0, Math.sin(t * 1.7 - ix * 0.16 - iz * 0.05)) ** 10 * 0.35 * slice(here, 0.95, 1);
      o.position.set(CROWD[0] + (ix - (CROWD_X - 1) / 2) * PITCH, 0, CROWD[2] + (iz - (CROWD_Z - 1) / 2) * PITCH);
      o.scale.set(1, Math.max(up * ripple, 1e-4), 1);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });
  // 3,392 figures a few pixels wide: occlusion between them only reads as grain, so they sit out of that pass.
  return <instancedMesh ref={ref} args={[geo, mats.clay, CROWD_X * CROWD_Z]} castShadow receiveShadow frustumCulled={false} userData={{ overlay: true }} />;
}

const BAR_30: V3 = [-4.05, 0, -0.4];
const BAR_10: V3 = [-2.35, 0, -0.4];
const UNIT = 0.12; // bar height per percentage point

// A different frame for every step: close on the box, wide for the 28 schools.
const CAMERA = [
  { pos: [0.5, 3.15, 7.7] as V3, look: [0, 0.78, 0.3] as V3 },
  { pos: [0, 4.95, 11.2] as V3, look: [0, 1.6, 0.4] as V3 },
  { pos: [0.35, 6.3, 11.6] as V3, look: [0.1, 1.05, 0.2] as V3 },
  { pos: [0.05, 7.3, 11.8] as V3, look: [0.05, 0.1, 0.15] as V3 },
  { pos: [0.1, 6.3, 11.8] as V3, look: [0.1, 1.25, 0] as V3 },
];

export default function CandelaScene() {
  const hang = place(STAND, STAND_YAW, HANG, STAND_K);
  const foot = place(STAND, STAND_YAW, [HANG[0], 0.09, HANG[2]], STAND_K);
  const mass: V3 = [INCLINE[0] + DROP_X * INCLINE_K, (PULLEY_Y - 0.22) * INCLINE_K - 0.74 * WEIGHTS_K, INCLINE[2]];
  return (
    <>
      <Rig k={CAMERA} />

      <Morph k={BOX} win={W_BOX}>
        <KitBox />
      </Morph>
      <Morph k={LID} win={W_LID} arc={1.1}>
        <Lid peek={0.2} />
      </Morph>

      {/* What's inside. Each part rises above the spot where its experiment will stand, so nothing crosses on the way down. */}
      <Morph k={part(-0.55, { p: [-1.55, 3.3, -0.4], r: [0.12, 0.3, 0.06], s: 1.5 }, { p: [-1.95, 0.42, -1.28], r: [0, Math.PI, 0], s: 1.3 })} win={wPart(0)} arc={0.3}>
        <Tape />
        <Tag at={[0, 0.34, 0]} dx={0} dy={-22} on={[1]}>{'Measuring\ntape'}</Tag>
      </Morph>
      <Morph k={part(-0.1, { p: [0.45, 3.45, -0.5], r: [0.1, 0.08, 0], s: 1.4 }, { p: [2.55, 0.035, 2.9], r: [-HALF_PI, 0, 0.1], s: 1.05 })} win={wPart(0.03)} arc={0.3}>
        <Caliper />
        <Tag at={[0.6, 0.1, 0]} dx={26} dy={-34} on={[1]}>Caliper</Tag>
      </Morph>
      <Morph k={part(0.75, { p: [3.15, 4.2, 0.2], s: 1.45 }, { p: hang, s: SCALE_K })} win={wPart(0.06)}>
        <SpringScale
          bob={
            <Morph k={[null, null, { p: [0, -0.28, 0] }, null, null]}>
              <Puck accent r={0.085} h={0.2} bevel={0.035} />
            </Morph>
          }
        />
        <Tag at={[0.12, -0.6, 0]} dx={30} dy={26} on={[1]}>{'Spring\nscale'}</Tag>
      </Morph>
      <Morph k={part(-1, { p: [-3.6, 1.6, 0.9], r: [-0.15, 0.3, 0], s: 1.45 }, { p: [0.8, 0.1, 2.55], r: [-HALF_PI, 0, 0.5], s: 1.1 })} win={wPart(0.09)} arc={0.5}>
        <Stopwatch />
        <Tag at={[0, 0.68, 0]} dx={0} dy={-20} on={[1]}>Stopwatch</Tag>
      </Morph>
      <Morph k={part(0.4, { p: [2.1, 1.5, 0.9], s: 1.65 }, { p: mass, s: WEIGHTS_K })} win={wPart(0.12)}>
        <Riding k={INCLINE_K / WEIGHTS_K}>
          <Weights />
        </Riding>
        <Tag at={[-0.2, 0.2, 0]} dx={-46} dy={-34} on={[1]}>Weights</Tag>
      </Morph>
      <Morph k={part(1, { p: [3.95, 1.45, 0.5], s: 1.5 }, { p: foot, s: CYLINDER_K })} win={wPart(0.15)}>
        <Cylinder />
        <Tag at={[0, 0, 0]} dx={0} dy={24} on={[1]}>{'Graduated\ncylinder'}</Tag>
      </Morph>

      {/* Three of the five experiments, running */}
      <Morph k={setup({ p: TRACK, r: [0, 0.1, 0], s: TRACK_K })} win={wSetup(0.08)}>
        <Track />
        <Tag at={[-0.9, 0.12, 1.05]} dx={-6} dy={40} on={[2]}>Track and car</Tag>
      </Morph>
      <Morph k={setup({ p: INCLINE, s: INCLINE_K })} win={wSetup(0.04)}>
        <Incline />
        <Tag at={[0, 0.72, 0]} dx={-40} dy={-66} on={[2]}>Inclined plane</Tag>
      </Morph>
      <Morph k={setup({ p: STAND, r: [0, STAND_YAW, 0], s: STAND_K })} win={wSetup(0)}>
        <Stand />
        <Tag at={[0.45, 0.1, 0.55]} dx={-6} dy={34} on={[2]}>{'Spring scale\n+ cylinder'}</Tag>
      </Morph>

      {/* 28 schools */}
      <Schools />
      {[0, 1, 2, 3].map((row) => (
        <Arrow key={row} a={[-2.6, 0.5, 0.3 + (row - 1.5) * 0.32]} b={[-1.74, 0.17, -1.85 + row * 1.26]} lift={0.32} on={[3]} />
      ))}
      <Bracket a={[-1.62, 1, -2.7]} b={[5.6, 1, -2.7]} on={[3]}>28 public schools · Bahia and Ceará</Bracket>

      {/* The result. Failure rate: the 30 stays as it was; the other bar arrives as tall and comes down to 10. */}
      <Bar on={4} p={BAR_30} w={1.35} h={30 * UNIT} />
      <Bar on={4} accent p={BAR_10} w={1.35} h={10 * UNIT} from={30 * UNIT} />
      <Crowd />
      <Arrow a={[BAR_30[0] + 0.5, 30 * UNIT + 0.16, BAR_30[2]]} b={[BAR_10[0], 10 * UNIT + 0.18, BAR_10[2]]} lift={0.75} bend={[0.6, 0, 0]} on={[4]} />
      <Tag at={[BAR_30[0], 30 * UNIT, BAR_30[2]]} dx={0} dy={-26} on={[4]}>Before · 30%</Tag>
      <Tag at={[BAR_10[0], 0.1, BAR_10[2] + 0.7]} dx={0} dy={34} on={[4]}>After · 10%</Tag>
      <Bracket a={[CROWD[0] - 2.85, 0.85, CROWD[2] - 2.4]} b={[CROWD[0] + 2.85, 0.85, CROWD[2] - 2.4]} on={[4]}>3,392 students</Bracket>
    </>
  );
}
