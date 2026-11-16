// Projeto Candela in five steps: the box, what is inside, the experiments, 28 schools, the result.
// Shapes follow the photos in public/work/candela (box with its label plate, caliper, spring
// scale, stopwatch, tape, weights, graduated cylinder, track and car, inclined plane, stand).
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { Arrow, Bar, Box, Bracket, clamp01, ease, Morph, near, Puck, Rig, Slab, Tag, useClay, type Pose, type V3, type Win } from './kit';

const HALF_PI = Math.PI / 2;

/** A point given in a setup's own space, taken to the world (setup at `o`, turned `yaw` about Y, scaled `k`). */
const place = (o: V3, yaw: number, [x, y, z]: V3, k = 1): V3 => [
  o[0] + (x * Math.cos(yaw) + z * Math.sin(yaw)) * k,
  o[1] + y * k,
  o[2] + (-x * Math.sin(yaw) + z * Math.cos(yaw)) * k,
];

// ── Where things are, per step ───────────────────────────────────────────────
const BOX: Pose[] = [
  { p: [0, 0, 0.3], r: [0, -0.34, 0], s: 1.45 },
  { p: [0.2, 0, 1.9], r: [0, -0.2, 0], s: 1.1 },
  { p: [-3.7, 0, -2.5], r: [0, 0.3, 0], s: 0.55 },
  { p: [-3.75, 0, 0.1], r: [0, 0.3, 0], s: 0.85 },
  { p: [-3.75, 0, 0.1], r: [0, 0.3, 0], s: 0 },
];
const onBox = (i: number, dx = 0, turn = 0): Pose => {
  const b = BOX[i]!;
  const k = b.s as number;
  return { p: [b.p![0] + dx, 0.95 * k, b.p![2]], r: [0, b.r![1] + turn, 0], s: k };
};
const LID: Pose[] = [onBox(0), { p: [-3.1, 0.06, -1.3], r: [0, 0.3, 0], s: 1.1 }, onBox(2, 0.2, 0.3), onBox(3), BOX[4]];
// Parts leave the box at step 1 and go back into it at step 3.
const inBox = (i: number): Pose => ({ p: [BOX[i]!.p![0], 0.5 * (BOX[i]!.s as number), BOX[i]!.p![2]], s: 0 });
const part = (exploded: Pose, experiment: Pose): Pose[] => [inBox(0), exploded, experiment, inBox(3), null];
// The setups grow where they stand, and pack into the box afterwards.
const setup = (pose: Pose): Pose[] => [null, null, pose, inBox(3), null];
// Who moves when: the lid clears the way before the parts rise, and closes after they are back in.
const W_BOX: Win = [undefined, undefined, undefined, [0, 0.3]];
const W_LID: Win = [[0, 0.5], undefined, [0.5, 1], [0, 0.3]];
const wPart = (d: number): Win => [[0.3 + d, 0.9 + d], [d, 0.8 + d], [d, 0.55 + d], undefined];
const wSetup = (d: number): Win => [undefined, [0.3 + d, 0.9 + d], [d, 0.5 + d], undefined];

const TRACK: V3 = [-2.25, 0, 1.45];
const INCLINE: V3 = [0.35, 0, -1.95];
const INCLINE_K = 1.25;
const STAND: V3 = [3.55, 0, 0.75];
const STAND_YAW = -0.4;
const STAND_K = 1.3;
const HANG: V3 = [0.22, 2.2, -0.2]; // where the spring hangs, in the stand's space
const WEIGHTS_K = 1; // the weights' scale while they hang from the plane

// ── The box ─────────────────────────────────────────────────────────────────
function KitBox() {
  return (
    <group>
      <Box size={[3, 0.1, 1.9]} position={[0, 0.05, 0]} />
      <Box size={[3, 0.9, 0.1]} position={[0, 0.45, 0.9]} />
      <Box size={[3, 0.9, 0.1]} position={[0, 0.45, -0.9]} />
      <Box size={[0.1, 0.9, 1.72]} position={[1.45, 0.45, 0]} />
      <Box size={[0.1, 0.9, 1.72]} position={[-1.45, 0.45, 0]} />
      <Box size={[0.06, 0.62, 1.72]} position={[0.55, 0.38, 0]} r={0.02} />
      <Box size={[0.9, 0.62, 0.06]} position={[1, 0.38, -0.1]} r={0.02} />
      {/* The label plate: the kit's one orange part. */}
      <Box accent size={[1.7, 0.46, 0.04]} position={[0, 0.45, 0.955]} r={0.015} />
      <Box size={[1.12, 0.055, 0.02]} position={[-0.12, 0.53, 0.976]} r={0.009} />
      <Box size={[0.86, 0.045, 0.02]} position={[-0.25, 0.41, 0.976]} r={0.009} />
    </group>
  );
}

// ── The six parts ───────────────────────────────────────────────────────────
function jawShape(dir: 1 | -1, long = 0.6) {
  // The measuring face is the straight side; the back of the jaw tapers to the tip.
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.lineTo(0.17 * dir, 0);
  s.lineTo(0.17 * dir, -long);
  s.lineTo(0.125 * dir, -long);
  s.lineTo(0, -long * 0.3);
  s.closePath();
  return s;
}

function Caliper() {
  const slide = useRef<THREE.Group>(null);
  const shapes = useMemo(() => ({ fixed: jawShape(1), moving: jawShape(-1), beakA: jawShape(1, 0.24), beakB: jawShape(-1, 0.24) }), []);
  useFrame(({ clock }) => {
    if (slide.current) slide.current.position.x = -0.3 + Math.sin(clock.elapsedTime * 0.7) * 0.1;
  });
  return (
    <group>
      <Box size={[1.8, 0.17, 0.05]} r={0.02} />
      <Slab shape={shapes.fixed} depth={0.03} position={[-0.9, -0.08, -0.015]} />
      <Slab shape={shapes.beakA} depth={0.03} position={[-0.9, 0.08, -0.015]} scale={[1, -1, 1]} />
      <group ref={slide} position={[-0.3, 0, 0]}>
        <Box size={[0.5, 0.28, 0.09]} r={0.03} />
        <Slab shape={shapes.moving} depth={0.03} position={[-0.08, -0.08, -0.015]} />
        <Slab shape={shapes.beakB} depth={0.03} position={[-0.08, 0.08, -0.015]} scale={[1, -1, 1]} />
        <Puck r={0.055} h={0.05} position={[0.12, -0.17, 0]} rotation={[HALF_PI, 0, 0]} />
      </group>
    </group>
  );
}

class Helix extends THREE.Curve<THREE.Vector3> {
  constructor(private r: number, private turns: number, private len: number) {
    super();
  }
  getPoint(t: number, target = new THREE.Vector3()) {
    const a = t * this.turns * Math.PI * 2;
    return target.set(Math.cos(a) * this.r, -t * this.len, Math.sin(a) * this.r);
  }
}

const COIL = 0.6;
/** Hangs from its origin. `bob` rides the lower hook; the coil stretches while the experiment runs. */
function SpringScale({ bob }: { bob?: ReactNode }) {
  const { step, mats } = useClay();
  const coil = useRef<THREE.Mesh>(null);
  const low = useRef<THREE.Group>(null);
  const geo = useMemo(() => new THREE.TubeGeometry(new Helix(0.085, 9, COIL), 200, 0.021, 8), []);
  useFrame(({ clock }) => {
    const len = COIL + Math.sin(clock.elapsedTime * 2.3) * 0.13 * near(step.current, 2, 1.5);
    coil.current?.scale.setY(len / COIL);
    low.current?.position.setY(-0.15 - len);
  });
  return (
    <group>
      <mesh position={[0, -0.08, 0]} castShadow material={mats.clay}>
        <torusGeometry args={[0.065, 0.019, 10, 28]} />
      </mesh>
      <mesh ref={coil} geometry={geo} position={[0, -0.15, 0]} castShadow receiveShadow material={mats.clay} />
      <group ref={low}>
        <mesh position={[0, -0.06, 0]} castShadow material={mats.clay}>
          <torusGeometry args={[0.06, 0.019, 10, 28, Math.PI * 1.55]} />
        </mesh>
        {bob}
      </group>
    </group>
  );
}

function Stopwatch() {
  const { mats } = useClay();
  return (
    <group>
      <Puck r={0.34} h={0.16} rotation={[HALF_PI, 0, 0]} />
      <Puck r={0.25} h={0.04} bevel={0.012} position={[0, 0, 0.085]} rotation={[HALF_PI, 0, 0]} />
      <Puck r={0.065} h={0.13} position={[0, 0.39, 0]} />
      <Puck r={0.04} h={0.09} position={[0.26, 0.29, 0]} rotation={[0, 0, -0.72]} />
      <mesh position={[0, 0.53, 0]} castShadow material={mats.clay}>
        <torusGeometry args={[0.085, 0.017, 10, 28]} />
      </mesh>
    </group>
  );
}

/** A roll lying flat with the loose end peeling off. */
function Tape() {
  const tail = useMemo(() => {
    // A thin band: tangent to the roll, then curling away.
    const pts: [number, number][] = [];
    for (let i = 0; i <= 30; i++) {
      const t = i / 30;
      pts.push([0.36 + Math.sin(t * 2.7) * 0.2, -t * 0.62]);
    }
    const w = 0.011;
    const s = new THREE.Shape();
    pts.forEach(([x, y], i) => (i ? s.lineTo(x - w, y) : s.moveTo(x - w, y)));
    [...pts].reverse().forEach(([x, y]) => s.lineTo(x + w, y));
    s.closePath();
    return s;
  }, []);
  return (
    <group>
      <Puck r={0.37} h={0.17} bevel={0.03} hole={0.1} position={[0, 0.085, 0]} />
      <Slab shape={tail} depth={0.17} bevel={0} rotation={[-HALF_PI, 0, 0]} />
    </group>
  );
}

/** Slotted masses on their hanger. Origin at the bottom; the hook is 0.6 up. */
function Weights() {
  const { mats } = useClay();
  return (
    <group>
      {[0.05, 0.16, 0.27].map((y) => (
        <Puck key={y} r={0.2} h={0.1} bevel={0.025} position={[0, y, 0]} />
      ))}
      <Puck r={0.026} h={0.24} position={[0, 0.43, 0]} />
      <mesh position={[0, 0.58, 0]} castShadow material={mats.clay}>
        <torusGeometry args={[0.045, 0.016, 10, 24]} />
      </mesh>
    </group>
  );
}

function Cylinder() {
  const { mats } = useClay();
  return (
    <group>
      <Puck r={0.25} h={0.07} bevel={0.02} segments={6} position={[0, 0.035, 0]} />
      <Puck r={0.13} h={1.05} bevel={0.012} hole={0.108} position={[0, 0.59, 0]} />
      {[0.34, 0.5, 0.66, 0.82, 0.98].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[HALF_PI, 0, 0]} material={mats.clay}>
          <torusGeometry args={[0.131, 0.007, 6, 32]} />
        </mesh>
      ))}
    </group>
  );
}

// ── The setups ──────────────────────────────────────────────────────────────
const LAP_L = 1.5;
const LAP_R = 0.74;
function stadium<T extends THREE.Path>(path: T, r: number): T {
  path.moveTo(-LAP_L / 2, -r);
  path.lineTo(LAP_L / 2, -r);
  path.absarc(LAP_L / 2, 0, r, -HALF_PI, HALF_PI, false);
  path.lineTo(-LAP_L / 2, r);
  path.absarc(-LAP_L / 2, 0, r, HALF_PI, HALF_PI * 3, false);
  return path;
}
const ring = (outer: number, inner: number) => {
  const s = stadium(new THREE.Shape(), outer);
  s.holes.push(stadium(new THREE.Path(), inner));
  return s;
};

function Track() {
  const car = useRef<THREE.Group>(null);
  const shapes = useMemo(() => ({ road: ring(0.97, 0.51), out: ring(0.99, 0.94), inn: ring(0.54, 0.49) }), []);
  useFrame(({ clock }) => {
    if (!car.current) return;
    const per = 2 * LAP_L + 2 * Math.PI * LAP_R;
    let d = ((clock.elapsedTime * 0.13) % 1) * per;
    let x: number, z: number, a: number;
    if (d < LAP_L) [x, z, a] = [-LAP_L / 2 + d, LAP_R, 0];
    else if ((d -= LAP_L) < Math.PI * LAP_R) [x, z, a] = [LAP_L / 2 + Math.sin(d / LAP_R) * LAP_R, Math.cos(d / LAP_R) * LAP_R, d / LAP_R];
    else if ((d -= Math.PI * LAP_R) < LAP_L) [x, z, a] = [LAP_L / 2 - d, -LAP_R, Math.PI];
    else {
      d -= LAP_L;
      [x, z, a] = [-LAP_L / 2 - Math.sin(d / LAP_R) * LAP_R, -Math.cos(d / LAP_R) * LAP_R, Math.PI + d / LAP_R];
    }
    car.current.position.set(x, 0.07, z);
    car.current.rotation.y = a;
  });
  return (
    <group>
      <Slab shape={shapes.road} depth={0.05} rotation={[-HALF_PI, 0, 0]} />
      <Slab shape={shapes.out} depth={0.12} bevel={0.008} rotation={[-HALF_PI, 0, 0]} />
      <Slab shape={shapes.inn} depth={0.12} bevel={0.008} rotation={[-HALF_PI, 0, 0]} />
      <group ref={car}>
        <Box accent size={[0.46, 0.13, 0.25]} r={0.045} position={[0, 0.125, 0]} />
        <Box accent size={[0.24, 0.12, 0.21]} r={0.04} position={[-0.04, 0.24, 0]} />
        {[-0.14, 0.14].flatMap((x) => [-0.13, 0.13].map((z) => <Puck key={`${x}${z}`} r={0.068} h={0.055} position={[x, 0.068, z]} rotation={[HALF_PI, 0, 0]} />))}
      </group>
    </group>
  );
}

const TILT = 0.42;
const PIVOT: V3 = [-1.2, 0.12, 0];
// Top of the pulley, where the string turns down (in the incline's space).
const PULLEY_X = PIVOT[0] + 2.6 * Math.cos(TILT) - 0.13 * Math.sin(TILT);
const PULLEY_Y = PIVOT[1] + 2.6 * Math.sin(TILT) + 0.13 * Math.cos(TILT);
const DROP_X = PULLEY_X + 0.1;
const TRAVEL = 0.42;
/** How far the mass has dropped (0..TRAVEL): it pulls the block up the plane, then lets it back. */
const pull = (t: number) => (TRAVEL / 2) * (1 - Math.cos(t * 0.9));

function Incline() {
  const { mats } = useClay();
  const block = useRef<THREE.Mesh>(null);
  const along = useRef<THREE.Mesh>(null);
  const down = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const d = pull(clock.elapsedTime);
    const x = 0.95 + d;
    block.current?.position.setX(x);
    // String along the plane: from the block to the pulley.
    const a = x + 0.17;
    along.current?.position.setX((a + 2.6) / 2);
    along.current?.scale.setY(2.6 - a);
    // String down to the hanging mass.
    const len = 0.25 + d;
    down.current?.position.setY(PULLEY_Y - len / 2);
    down.current?.scale.setY(len);
  });
  return (
    <group>
      <Box size={[2.9, 0.08, 0.72]} position={[0, 0.04, 0]} />
      <Box size={[0.09, 0.84, 0.46]} position={[0.62, 0.48, 0]} r={0.03} />
      <group position={PIVOT} rotation={[0, 0, TILT]}>
        <Box size={[2.6, 0.07, 0.6]} position={[1.3, 0, 0]} r={0.03} />
        <Box ref={block} accent size={[0.34, 0.2, 0.3]} r={0.05} position={[0.95, 0.135, 0]} />
        <mesh ref={along} position={[1.8, 0.14, 0]} rotation={[0, 0, HALF_PI]} material={mats.ink}>
          <cylinderGeometry args={[0.007, 0.007, 1, 6]} />
        </mesh>
        <Box size={[0.16, 0.2, 0.05]} position={[2.56, 0.07, 0.09]} r={0.02} />
        <Puck r={0.1} h={0.06} bevel={0.02} position={[2.6, 0.13, 0]} rotation={[HALF_PI, 0, 0]} />
      </group>
      <mesh ref={down} position={[DROP_X, PULLEY_Y - 0.2, 0]} material={mats.ink}>
        <cylinderGeometry args={[0.007, 0.007, 1, 6]} />
      </mesh>
    </group>
  );
}

function Stand() {
  const gusset = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.lineTo(0.42, 0);
    s.quadraticCurveTo(0.1, -0.08, 0, -0.5);
    s.closePath();
    return s;
  }, []);
  return (
    <group>
      <Box size={[1.25, 0.07, 1.05]} position={[0, 0.035, 0]} r={0.03} />
      <Box size={[0.12, 2.22, 0.24]} position={[-0.42, 1.18, -0.2]} r={0.035} />
      <Box size={[0.86, 0.1, 0.24]} position={[-0.05, 2.25, -0.2]} r={0.035} />
      <Slab shape={gusset} depth={0.06} position={[-0.37, 2.2, -0.23]} />
    </group>
  );
}

/** The hanging mass rides the string of the inclined plane. */
function Riding({ children }: { children: ReactNode }) {
  const { step } = useClay();
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = ((-pull(clock.elapsedTime) * INCLINE_K) / WEIGHTS_K) * near(step.current, 2, 1.5);
  });
  return <group ref={ref}>{children}</group>;
}

// ── 28 schools ──────────────────────────────────────────────────────────────
const COLS = 7;
const SCHOOLS = 28;
const SOURCE = new THREE.Vector3(-3.75, 0.3, 0.1);
const cell = (i: number): V3 => [-1.05 + (i % COLS) * 1.01, 0, -1.8 + Math.floor(i / COLS) * 1.24];

function Schools() {
  const { step, mats } = useClay();
  const body = useRef<THREE.InstancedMesh>(null);
  const plate = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => {
    const g = new RoundedBoxGeometry(3.08, 1, 1.98, 3, 0.1);
    g.translate(0, 0.5, 0);
    const p = new THREE.BoxGeometry(1.7, 0.46, 0.05);
    p.translate(0, 0.45, 0.99);
    return { body: g, plate: p };
  }, []);
  const o = useMemo(() => new THREE.Object3D(), []);
  const to = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const s = step.current;
    const on = s > 2.01 && s < 3.99;
    if (body.current) body.current.visible = on;
    if (plate.current) plate.current.visible = on;
    if (!on || !body.current || !plate.current) return;
    for (let i = 0; i < SCHOOLS; i++) {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      to.set(...cell(i));
      let a: number;
      if (s <= 3) {
        // Out of the first box, column by column.
        a = ease(clamp01((s - 2 - 0.3 - (col + row * 0.4) * 0.045) / 0.32));
        o.position.lerpVectors(SOURCE, to, a);
        o.position.y += Math.sin(a * Math.PI) * 0.9;
      } else {
        a = 1 - ease(clamp01((s - 3 - col * 0.012) / 0.25));
        o.position.copy(to);
      }
      o.rotation.set(0, 0.3 * (1 - a), 0);
      o.scale.setScalar(Math.max(a * 0.285, 1e-4));
      o.updateMatrix();
      body.current.setMatrixAt(i, o.matrix);
      plate.current.setMatrixAt(i, o.matrix);
    }
    body.current.instanceMatrix.needsUpdate = true;
    plate.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <>
      <instancedMesh ref={body} args={[geo.body, mats.clay, SCHOOLS]} castShadow receiveShadow frustumCulled={false} />
      <instancedMesh ref={plate} args={[geo.plate, mats.accent, SCHOOLS]} frustumCulled={false} />
    </>
  );
}

// ── 3,392 students ──────────────────────────────────────────────────────────
// 3,392 = 64 x 53: one peg per student.
const CROWD_X = 64;
const CROWD_Z = 53;
const PITCH = 0.086;
const CROWD: V3 = [2.05, 0, 0.3];

function Crowd() {
  const { step, mats } = useClay();
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => {
    const g = new THREE.CapsuleGeometry(0.025, 0.065, 3, 8);
    g.translate(0, 0.0575, 0);
    return g;
  }, []);
  const o = useMemo(() => new THREE.Object3D(), []);
  const settled = useRef(false);
  useFrame(() => {
    const m = ref.current;
    if (!m) return;
    const s = step.current;
    m.visible = s > 3.01;
    if (!m.visible) return void (settled.current = false);
    if (s >= 3.999 && settled.current) return;
    settled.current = s >= 3.999;
    for (let i = 0; i < CROWD_X * CROWD_Z; i++) {
      const ix = i % CROWD_X;
      const iz = Math.floor(i / CROWD_X);
      // They stand up in a wave from the left.
      const a = ease(clamp01((s - 3 - 0.32 - (ix / CROWD_X) * 0.35) / 0.3));
      o.position.set(CROWD[0] + (ix - (CROWD_X - 1) / 2) * PITCH, 0, CROWD[2] + (iz - (CROWD_Z - 1) / 2) * PITCH);
      o.scale.set(1, Math.max(a, 1e-4), 1);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[geo, mats.clay, CROWD_X * CROWD_Z]} castShadow receiveShadow frustumCulled={false} />;
}

const BAR_30: V3 = [-4.15, 0, -0.5];
const BAR_10: V3 = [-2.5, 0, -0.5];
const UNIT = 0.12; // bar height per percentage point

const CAMERA = [
  { pos: [0.7, 3.5, 9.6] as V3, look: [0.1, 0.62, 0.2] as V3 },
  { pos: [0, 4.9, 12] as V3, look: [0, 1.75, 0.2] as V3 },
  { pos: [0.4, 5.9, 12.6] as V3, look: [0.25, 1.05, -0.3] as V3 },
  { pos: [0.3, 7.4, 12.6] as V3, look: [0.35, 0.1, 0.1] as V3 },
  { pos: [0, 6.1, 13.2] as V3, look: [0, 1.15, 0] as V3 },
];

export default function CandelaScene() {
  const hang = place(STAND, STAND_YAW, HANG, STAND_K);
  const cyl = place(STAND, STAND_YAW, [HANG[0], 0.07, HANG[2]], STAND_K);
  const mass: V3 = [INCLINE[0] + DROP_X * INCLINE_K, (PULLEY_Y - 0.25) * INCLINE_K - 0.6 * WEIGHTS_K, INCLINE[2]];
  return (
    <>
      <Rig k={CAMERA} />

      <Morph k={BOX} win={W_BOX}>
        <KitBox />
        <Tag at={[0.55, 0.5, 0.98]} dx={96} dy={-150} on={[0]}>Kit de física experimental</Tag>
      </Morph>
      <Morph k={LID} win={W_LID} arc={0.9}>
        <Box size={[3.08, 0.1, 1.98]} />
      </Morph>

      {/* What's inside → the experiments */}
      <Morph k={part({ p: [-1.75, 3.45, -0.6], r: [0.1, 0.1, 0], s: 1.5 }, { p: [1.75, 0.03, 2.5], r: [-HALF_PI, 0, 0.12] })} win={wPart(0)} arc={0.6}>
        <Caliper />
        <Tag at={[0.45, 0.09, 0]} dx={56} dy={-46} on={[1]}>Caliper</Tag>
      </Morph>
      <Morph k={part({ p: [-3.5, 3.35, 0.5], s: 1.8 }, { p: hang, s: STAND_K })} win={wPart(0.02)}>
        <SpringScale
          bob={
            <Morph k={[null, null, { p: [0, -0.24, 0] }, null, null]}>
              <Puck accent r={0.08} h={0.2} bevel={0.03} />
            </Morph>
          }
        />
        <Tag at={[0, -0.02, 0]} dx={-4} dy={-26} on={[1]}>Spring scale</Tag>
      </Morph>
      <Morph k={part({ p: [1.05, 3.0, -0.5], r: [-0.2, -0.1, 0], s: 1.7 }, { p: [0.3, 0.09, 2.75], r: [-HALF_PI, 0, 0.5], s: 1.1 })} win={wPart(0.04)} arc={0.5}>
        <Stopwatch />
        <Tag at={[0, 0.62, 0]} dx={0} dy={-26} on={[1]}>Stopwatch</Tag>
      </Morph>
      <Morph k={part({ p: [-1.6, 1.75, 0.9], r: [0.55, 0.3, 0], s: 1.6 }, { p: [-0.35, 0, -0.75], r: [0, 2.2, 0] })} win={wPart(0.06)}>
        <Tape />
        <Tag at={[-0.25, 0.1, 0.25]} dx={-50} dy={46} on={[1]}>Measuring tape</Tag>
      </Morph>
      <Morph k={part({ p: [1.2, 1.45, 0.9], s: 1.9 }, { p: mass, s: WEIGHTS_K })} win={wPart(0.1)}>
        <Riding>
          <Weights />
        </Riding>
        <Tag at={[0.2, 0.2, 0]} dx={62} dy={30} on={[1]}>Weights</Tag>
      </Morph>
      <Morph k={part({ p: [2.9, 1.7, 0.2], s: 1.75 }, { p: cyl, s: STAND_K })} win={wPart(0.08)}>
        <Cylinder />
        <Tag at={[0, 1.13, 0]} dx={-8} dy={-34} on={[1]}>Graduated cylinder</Tag>
      </Morph>

      {/* Three of the five experiments, running */}
      <Morph k={setup({ p: TRACK, r: [0, 0.08, 0], s: 1.2 })} win={wSetup(0.1)}>
        <Track />
        <Tag at={[-0.6, 0.1, 0.98]} dx={-8} dy={46} on={[2]}>Track and car</Tag>
      </Morph>
      <Morph k={setup({ p: INCLINE, s: INCLINE_K })} win={wSetup(0.05)}>
        <Incline />
        <Tag at={[-0.2, 0.62, 0]} dx={-36} dy={-74} on={[2]}>Inclined plane</Tag>
      </Morph>
      <Morph k={setup({ p: STAND, r: [0, STAND_YAW, 0], s: STAND_K })} win={wSetup(0)}>
        <Stand />
        <Tag at={[-0.3, 2.31, -0.2]} dx={-44} dy={-40} on={[2]}>Spring scale + cylinder</Tag>
      </Morph>

      {/* 28 schools */}
      <Schools />
      {[0, 1, 2, 3].map((row) => (
        <Arrow key={row} a={[-2.5, 0.45, 0.1 + (row - 1.5) * 0.3]} b={[-1.62, 0.16, -1.8 + row * 1.24]} lift={0.3} on={[3]} />
      ))}
      <Bracket a={[-1.5, 1, -2.6]} b={[5.45, 1, -2.6]} on={[3]}>28 public schools · Bahia and Ceará</Bracket>

      {/* The result */}
      {/* Failure rate: the 30 stays as it was; the other one arrives as tall and comes down to 10. */}
      <Bar p={BAR_30} w={1.3} h={30 * UNIT} />
      <Bar accent p={BAR_10} w={1.3} h={10 * UNIT} from={30 * UNIT} />
      <Crowd />
      <Arrow a={[BAR_30[0] + 0.5, 30 * UNIT + 0.15, BAR_30[2]]} b={[BAR_10[0], 10 * UNIT + 0.16, BAR_10[2]]} lift={0.7} bend={[0.55, 0, 0]} on={[4]} />
      <Tag at={[BAR_30[0], 30 * UNIT, BAR_30[2]]} dx={0} dy={-30} on={[4]}>Before · 30%</Tag>
      <Tag at={[BAR_10[0] + 0.5, 6 * UNIT, BAR_10[2] + 0.65]} dx={50} dy={-70} on={[4]}>After · 10%</Tag>
      <Bracket a={[CROWD[0] - 2.75, 0.8, CROWD[2] - 2.35]} b={[CROWD[0] + 2.75, 0.8, CROWD[2] - 2.35]} on={[4]}>3,392 students</Bracket>
    </>
  );
}
