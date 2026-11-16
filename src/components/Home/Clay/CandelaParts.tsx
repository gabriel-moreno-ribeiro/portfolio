// The Candela models, in clay. Shapes follow the photos in public/work/candela: the box with
// its finger joints and label plate, the six instruments, and the three setups shown running.
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Act, ageOf, at, Box, bump, clamp01, ease, pop, Puck, ring, Rod, Slab, slice, spring, Ticks, useClay, type V3 } from './kit';

const HALF_PI = Math.PI / 2;
const lerp = THREE.MathUtils.lerp;
/** A wobble that starts from rest and dies out: `f` swings a second. */
const wobble = (t: number, f: number, d: number) => (t <= 0 ? 0 : Math.exp(-d * t) * Math.sin(t * f * Math.PI * 2));
const curve = (pts: V3[]) => new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));

// ── The box ─────────────────────────────────────────────────────────────────
/** "Kit de física experimental", pressed into the plate: tone on tone, no ink. */
function plateTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 144;
  const g = c.getContext('2d')!;
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  const write = (dy: number, fill: string) => {
    g.fillStyle = fill;
    g.font = '700 50px "DM Sans", system-ui, sans-serif';
    g.fillText('Kit de física', 256, 44 + dy);
    g.fillText('experimental', 256, 100 + dy);
  };
  write(2.5, 'rgba(255, 214, 180, 0.75)'); // the lit lower lip of the engraving
  write(0, 'rgba(118, 42, 6, 0.8)');
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

const CORNERS: [number, number][] = [[1, 1], [1, -1], [-1, 1], [-1, -1]];

/** Origin at the bottom centre. 3 x 0.9 x 1.9, open on top. */
export function KitBox() {
  const { mats } = useClay();
  const label = useMemo(() => {
    const map = plateTexture();
    return new THREE.MeshStandardMaterial({ map, transparent: true, roughness: 0.85, polygonOffset: true, polygonOffsetFactor: -2 });
  }, []);
  return (
    <group>
      <Box size={[3, 0.1, 1.9]} position={[0, 0.05, 0]} />
      {/* Two planks per wall: the seam between them is a real groove. */}
      {[0.275, 0.685].map((y) => (
        <group key={y}>
          <Box size={[2.8, 0.4, 0.11]} position={[0, y, 0.895]} r={0.025} />
          <Box size={[2.8, 0.4, 0.11]} position={[0, y, -0.895]} r={0.025} />
          <Box size={[0.11, 0.4, 1.7]} position={[1.445, y, 0]} r={0.025} />
          <Box size={[0.11, 0.4, 1.7]} position={[-1.445, y, 0]} r={0.025} />
        </group>
      ))}
      {/* Finger joints: at each corner the fingers of the two walls alternate. */}
      {CORNERS.flatMap(([sx, sz]) =>
        [0, 1, 2, 3, 4, 5].map((i) => (
          <Box
            key={`${sx}${sz}${i}`}
            size={[0.125, 0.128, 0.125]}
            r={0.018}
            position={[sx * (1.44 + (i % 2 ? 0.01 : 0)), 0.143 + i * 0.135, sz * (0.89 + (i % 2 ? 0 : 0.01))]}
          />
        )),
      )}
      <Box size={[0.06, 0.62, 1.7]} position={[0.55, 0.4, 0]} r={0.02} />
      <Box size={[0.86, 0.62, 0.06]} position={[1, 0.4, -0.1]} r={0.02} />
      {/* The label plate: the kit's one orange part, with its name pressed in. */}
      <Box accent size={[1.8, 0.52, 0.04]} position={[0, 0.47, 0.962]} r={0.016} />
      <mesh position={[0, 0.47, 0.9835]} material={label}>
        <planeGeometry args={[1.62, 0.455]} />
      </mesh>
      {[-0.82, 0.82].map((x) => (
        <Puck accent key={x} r={0.022} h={0.02} bevel={0.008} segments={12} position={[x, 0.47, 0.985]} rotation={[HALF_PI, 0, 0]} material={mats.accent} />
      ))}
    </group>
  );
}

/** How far the lid stands open (radians), `age` seconds into the first step: it unlatches, flies up past its stop and settles. */
export const lidOpen = (age: number) => 1.2 * spring(age - 0.2, 1.7, 4.5);

/** The lid, hinged along its back edge. The first step is the opening. Origin at the centre of its underside. */
export function Lid() {
  const { play } = useClay();
  const hinge = useRef<THREE.Group>(null);
  const handle = useMemo(() => curve([[-0.42, 0, 0], [-0.4, 0.13, 0], [0, 0.17, 0], [0.4, 0.13, 0], [0.42, 0, 0]]), []);
  useFrame(() => {
    // On the way to the next step it is thrown off and lands flat, so the hinge closes as it leaves.
    if (hinge.current) hinge.current.rotation.x = -lidOpen(ageOf(play, 0)) * at(play, 0);
  });
  return (
    <group ref={hinge} position={[0, 0, -1]}>
      <group position={[0, 0, 1]}>
        <Box size={[3.1, 0.11, 0.99]} position={[0, 0.055, 0.5]} r={0.03} />
        <Box size={[3.1, 0.11, 0.99]} position={[0, 0.055, -0.5]} r={0.03} />
        <Box size={[2.72, 0.05, 1.62]} position={[0, -0.02, 0]} r={0.02} />
        <Rod path={handle} r={0.036} position={[0, 0.11, 0]} />
      </group>
    </group>
  );
}

// ── The six instruments ─────────────────────────────────────────────────────
function jawShape(dir: 1 | -1, long = 0.62) {
  // The measuring face is the straight side; the back of the jaw tapers to the tip.
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.lineTo(0.18 * dir, 0);
  s.lineTo(0.18 * dir, -long);
  s.lineTo(0.135 * dir, -long);
  s.lineTo(0, -long * 0.3);
  s.closePath();
  return s;
}

/** Beam along X, jaws down, in the XY plane. Out of the box it snaps its jaws twice; then the slider drifts open and shut. */
export function Caliper() {
  const { play } = useClay();
  const slide = useRef<THREE.Group>(null);
  const shapes = useMemo(() => ({ fixed: jawShape(1), moving: jawShape(-1), beakA: jawShape(1, 0.25), beakB: jawShape(-1, 0.25) }), []);
  useFrame(({ clock }) => {
    const a = ageOf(play, 1);
    const chomp = Math.abs(Math.cos(slice(a, 0.75, 1.35) * Math.PI * 2)); // open, shut, open, shut, open
    const snapping = at(play, 1) * slice(a, 0.6, 0.75) * (1 - slice(a, 1.35, 1.9));
    if (slide.current) slide.current.position.x = lerp(-0.32 + Math.sin(clock.elapsedTime * 0.8) * 0.11, -0.57 + chomp * 0.42, snapping);
  });
  return (
    <group>
      <Box size={[2, 0.18, 0.045]} r={0.018} />
      <Ticks n={46} a={[-0.66, -0.05, 0.027]} b={[0.92, -0.05, 0.027]} size={[0.009, 0.036, 0.012]} />
      <Box size={[0.46, 0.028, 0.018]} position={[1.2, 0, 0]} r={0.008} />
      <Slab shape={shapes.fixed} depth={0.03} position={[-1, -0.085, -0.015]} />
      <Slab shape={shapes.beakA} depth={0.03} position={[-1, 0.085, -0.015]} scale={[1, -1, 1]} />
      <group ref={slide} position={[-0.32, 0, 0]}>
        <Box size={[0.54, 0.3, 0.085]} r={0.03} position={[0.02, 0, 0]} />
        <Ticks n={11} a={[-0.13, -0.085, 0.047]} b={[0.17, -0.085, 0.047]} size={[0.008, 0.03, 0.012]} />
        <Slab shape={shapes.moving} depth={0.03} position={[-0.07, -0.085, -0.015]} />
        <Slab shape={shapes.beakB} depth={0.03} position={[-0.07, 0.085, -0.015]} scale={[1, -1, 1]} />
        <Puck r={0.06} h={0.05} bevel={0.012} segments={14} position={[0.16, -0.185, 0]} rotation={[HALF_PI, 0, 0]} />
        <Puck r={0.035} h={0.07} position={[0.02, 0.18, 0]} />
      </group>
    </group>
  );
}

/** Face towards +Z. Out of the box its crown is clicked and the hand ticks round; on the bench it times the car. */
export function Stopwatch() {
  const { play, mats } = useClay();
  const hand = useRef<THREE.Group>(null);
  const crown = useRef<THREE.Mesh>(null);
  useFrame(() => {
    const a = ageOf(play, 1);
    crown.current?.position.setY(0.43 - 0.06 * bump(slice(a, 0.68, 0.9)) * at(play, 1));
    // Ten ticks a second after the click; a smooth sweep from the moment the car is let go.
    if (hand.current) hand.current.rotation.z = -(Math.floor(Math.max(0, a - 0.8) * 10) / 10) * 2.2 - Math.max(0, ageOf(play, 2) - CAR_GO) * 2.6;
  });
  return (
    <group>
      <Puck r={0.37} h={0.17} rotation={[HALF_PI, 0, 0]} />
      <mesh position={[0, 0, 0.085]} castShadow material={mats.clay}>
        <torusGeometry args={[0.305, 0.028, 10, 48]} />
      </mesh>
      {Array.from({ length: 12 }, (_, i) => (
        <Box key={i} size={[0.014, i % 3 ? 0.035 : 0.06, 0.012]} r={0.004} position={[Math.sin((i * Math.PI) / 6) * 0.235, Math.cos((i * Math.PI) / 6) * 0.235, 0.089]} rotation={[0, 0, (-i * Math.PI) / 6]} />
      ))}
      <group ref={hand} position={[0, 0, 0.097]}>
        <Box size={[0.016, 0.21, 0.012]} r={0.005} position={[0, 0.08, 0]} />
      </group>
      <Box size={[0.02, 0.1, 0.012]} r={0.005} position={[0.03, 0.035, 0.094]} rotation={[0, 0, -0.7]} />
      <Puck r={0.03} h={0.03} segments={14} position={[0, 0, 0.1]} rotation={[HALF_PI, 0, 0]} />
      <Puck ref={crown} r={0.07} h={0.15} position={[0, 0.43, 0]} />
      <Puck r={0.045} h={0.1} position={[0.29, 0.32, 0]} rotation={[0, 0, -0.73]} />
      <Puck r={0.045} h={0.1} position={[-0.29, 0.32, 0]} rotation={[0, 0, 0.73]} />
      <mesh position={[0, 0.59, 0]} castShadow material={mats.clay}>
        <torusGeometry args={[0.09, 0.018, 10, 28]} />
      </mesh>
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

const COIL = 0.34;
const HOUSING = 0.92; // where the spring leaves the housing, below the hang point
/**
 * Hangs from its origin: ring, housing with its scale, the spring coming out of it, the hook.
 * `bob` rides the hook; the spring stretches while the experiment (step 2) runs.
 */
export function SpringScale({ bob }: { bob?: ReactNode }) {
  const { play, mats } = useClay();
  const coil = useRef<THREE.Mesh>(null);
  const low = useRef<THREE.Group>(null);
  const geo = useMemo(() => new THREE.TubeGeometry(new Helix(0.062, 6, COIL), 150, 0.019, 8), []);
  const hook = useMemo(() => curve([[0, 0, 0], [-0.035, -0.09, 0], [0, -0.17, 0], [0.05, -0.13, 0], [0.04, -0.07, 0]]), []);
  useFrame(({ clock }) => {
    // Sprung out of the box, the hook rings. On the stand the weight is let go: it drops, swings and settles.
    const hung = ageOf(play, 2) - 1;
    const stretch = hung < 0 ? 0 : 0.11 * spring(hung, 2.4, 1.4) + 0.025 * Math.sin(clock.elapsedTime * 2.4) * slice(hung, 2.4, 3.4);
    const len = COIL + 0.17 * ring(ageOf(play, 1) - 0.55, 3.2, 2.2) * at(play, 1) + stretch * at(play, 2);
    coil.current?.scale.setY(len / COIL);
    low.current?.position.setY(-HOUSING - len);
  });
  return (
    <group>
      <mesh position={[0, -0.09, 0]} castShadow material={mats.clay}>
        <torusGeometry args={[0.07, 0.02, 10, 28]} />
      </mesh>
      <Puck r={0.115} h={0.76} bevel={0.05} position={[0, -0.54, 0]} />
      <Box size={[0.12, 0.52, 0.03]} position={[0, -0.54, 0.105]} r={0.012} />
      <Ticks n={13} a={[0, -0.32, 0.123]} b={[0, -0.76, 0.123]} size={[0.045, 0.007, 0.01]} major={4} along={0} />
      <mesh ref={coil} geometry={geo} position={[0, -HOUSING, 0]} castShadow receiveShadow material={mats.clay} />
      <group ref={low}>
        <Rod path={hook} r={0.018} segments={24} />
        {bob}
      </group>
    </group>
  );
}

/** A tape measure: the case standing on its edge, the blade pulled out along -X with its ticks and end hook. */
export function Tape() {
  const { play } = useClay();
  const blade = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    // Out of the box the blade shoots out, holds, and is reeled back with a snap. Otherwise it creeps a little, as if taking a measure.
    const a = ageOf(play, 1);
    const shot = 0.25 + 1.5 * spring(a - 0.65, 2.2, 5) * (1 - 0.8 * ease(slice(a, 1.9, 2.05)));
    if (blade.current) blade.current.scale.x = lerp(1 + Math.sin(clock.elapsedTime * 0.9) * 0.07, shot, at(play, 1));
  });
  return (
    <group>
      <Box size={[0.64, 0.64, 0.25]} r={0.15} />
      <Puck r={0.2} h={0.04} bevel={0.012} position={[0, 0.01, 0.126]} rotation={[HALF_PI, 0, 0]} />
      <Puck r={0.07} h={0.03} bevel={0.01} segments={16} position={[0, 0.01, 0.15]} rotation={[HALF_PI, 0, 0]} />
      <Box size={[0.16, 0.07, 0.13]} position={[0.1, 0.33, 0.03]} r={0.025} />
      <group ref={blade} position={[-0.3, -0.255, 0]}>
        <Box size={[0.8, 0.014, 0.17]} position={[-0.4, 0, 0]} r={0.006} />
        <Ticks n={17} a={[-0.06, 0.009, 0.062]} b={[-0.75, 0.009, 0.062]} size={[0.008, 0.008, 0.045]} along={2} />
        <Box size={[0.016, 0.075, 0.18]} position={[-0.8, -0.022, 0]} r={0.006} />
      </group>
    </group>
  );
}

function slotDisc(r: number, slot: number) {
  const a = Math.asin(slot / 2 / r);
  const s = new THREE.Shape();
  s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
  s.absarc(0, 0, r, a, Math.PI * 2 - a, false);
  s.lineTo(0, -slot / 2);
  s.absarc(0, 0, slot / 2, -HALF_PI, HALF_PI, true);
  s.closePath();
  return s;
}

/** Slotted masses on their hanger. Origin at the bottom; the hook's eye is 0.74 up. */
export function Weights() {
  const disc = useMemo(() => slotDisc(0.21, 0.06), []);
  const hook = useMemo(() => curve([[0, 0, 0], [0, 0.09, 0], [0.045, 0.15, 0], [0.09, 0.1, 0], [0.07, 0.05, 0]]), []);
  return (
    <group>
      <Puck r={0.2} h={0.05} bevel={0.016} position={[0, 0.025, 0]} />
      {/* Out of the box the masses drop onto the hanger one by one, each with a clack. */}
      {[0.06, 0.168, 0.276].map((y, i) => (
        <Act
          key={y}
          f={(g, p) => {
            const a = p.to === 1 ? p.age - 0.7 - i * 0.17 : 1;
            g.position.y = 0.8 * (1 - clamp01(a / 0.2) ** 2) + 0.05 * bump(slice(a, 0.2, 0.42));
            g.scale.setScalar(Math.max(slice(a, -0.04, 0.04), 1e-4));
          }}
        >
          <Slab shape={disc} depth={0.075} bevel={0.014} position={[0, y, 0]} rotation={[-HALF_PI, 0, 0.5 + i * 2.2]} />
        </Act>
      ))}
      <Puck r={0.024} h={0.56} segments={14} position={[0, 0.33, 0]} />
      <Rod path={hook} r={0.018} segments={24} position={[0, 0.6, 0]} />
    </group>
  );
}

/** Graduated cylinder: hexagonal foot, open tube with a pouring lip, marks up the front. */
export function Cylinder() {
  const { mats } = useClay();
  // Out of the box it rocks on its foot like a skittle before it stands still.
  return (
    <Act f={(g, p) => void (g.rotation.z = 0.3 * wobble(ageOf(p, 1) - 0.75, 2.6, 2.4) * at(p, 1))}>
      <Puck r={0.27} h={0.07} bevel={0.02} segments={6} position={[0, 0.035, 0]} />
      <Puck r={0.135} h={1.08} bevel={0.012} hole={0.112} position={[0, 0.6, 0]} />
      <mesh position={[0, 1.14, 0]} rotation={[HALF_PI, 0, 0]} castShadow material={mats.clay}>
        <torusGeometry args={[0.135, 0.02, 8, 36]} />
      </mesh>
      <Box size={[0.09, 0.028, 0.08]} r={0.012} position={[0.17, 1.14, 0]} rotation={[0, 0, 0.35]} />
      {Array.from({ length: 11 }, (_, i) => {
        const arc = i % 5 === 0 ? 1.5 : 0.75;
        return (
          <mesh key={i} position={[0, 0.3 + i * 0.07, 0]} rotation={[HALF_PI, 0, -HALF_PI + arc / 2]} material={mats.clay}>
            <torusGeometry args={[0.136, 0.0075, 6, 16, arc]} />
          </mesh>
        );
      })}
    </Act>
  );
}

// ── The track and the car ───────────────────────────────────────────────────
const LAP_L = 1.6; // straight
const LAP_R = 0.82; // curve radius, at the centre line
const LAP = 2 * LAP_L + 2 * Math.PI * LAP_R;
const ROAD = 0.48;
const BANK = 0.4; // how far the curves lean, in radians

/** A point on the centre line at distance `d`: position, heading, and how much the road banks there. */
function lapAt(d: number) {
  d = ((d % LAP) + LAP) % LAP;
  const curveLen = Math.PI * LAP_R;
  if (d < LAP_L) return { x: -LAP_L / 2 + d, z: LAP_R, a: 0, bank: 0 };
  d -= LAP_L;
  if (d < curveLen) {
    const t = d / LAP_R;
    return { x: LAP_L / 2 + Math.sin(t) * LAP_R, z: Math.cos(t) * LAP_R, a: t, bank: BANK * Math.sin((d / curveLen) * Math.PI) ** 2 };
  }
  d -= curveLen;
  if (d < LAP_L) return { x: LAP_L / 2 - d, z: -LAP_R, a: Math.PI, bank: 0 };
  d -= LAP_L;
  const t = d / LAP_R;
  return { x: -LAP_L / 2 - Math.sin(t) * LAP_R, z: -Math.cos(t) * LAP_R, a: Math.PI + t, bank: BANK * Math.sin((d / curveLen) * Math.PI) ** 2 };
}

const ROWS = 200; // slices of road around the lap
const ROW_INDICES = 7 * 6;
/** The road swept along the lap: a kerb on each side, and the outside of each curve raised. Indexed slice by slice, so it can be laid progressively. */
function trackGeometry() {
  // Cross-section: [across the road (outwards +), height]. The inner kerb, the road, the outer kerb.
  const profile: [number, number][] = [[-ROAD / 2, 0], [-ROAD / 2, 0.1], [-ROAD / 2 + 0.04, 0.1], [-ROAD / 2 + 0.04, 0.05], [ROAD / 2 - 0.04, 0.05], [ROAD / 2 - 0.04, 0.1], [ROAD / 2, 0.1], [ROAD / 2, 0]];
  const rows = ROWS;
  const pos: number[] = [];
  const idx: number[] = [];
  for (let seg = 0; seg < profile.length - 1; seg++) {
    const base = pos.length / 3;
    for (let r = 0; r <= rows; r++) {
      const p = lapAt((r / rows) * LAP);
      // Outwards = to the right of the direction of travel.
      const ox = Math.sin(p.a);
      const oz = Math.cos(p.a);
      for (const [across, h] of [profile[seg], profile[seg + 1]]) {
        const lift = h > 0 ? (across + ROAD / 2) * Math.tan(p.bank) : 0;
        pos.push(p.x + ox * across, h + lift, p.z + oz * across);
      }
    }
    for (let r = 0; r < rows; r++) {
      const a = base + r * 2;
      [a, a + 1, a + 2, a + 1, a + 3, a + 2].forEach((v, k) => (idx[r * ROW_INDICES + seg * 6 + k] = v));
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

/** A toy pickup: cab, hood, an open bed. Forward is +X; origin on the ground under its centre. */
function Pickup() {
  return (
    <group>
      <Box accent size={[0.6, 0.08, 0.28]} r={0.03} position={[0, 0.115, 0]} />
      <Box accent size={[0.21, 0.19, 0.26]} r={0.055} position={[0.03, 0.245, 0]} />
      <Box accent size={[0.19, 0.1, 0.26]} r={0.04} position={[0.2, 0.2, 0]} />
      <Box accent size={[0.27, 0.1, 0.035]} r={0.015} position={[-0.165, 0.2, 0.123]} />
      <Box accent size={[0.27, 0.1, 0.035]} r={0.015} position={[-0.165, 0.2, -0.123]} />
      <Box accent size={[0.035, 0.1, 0.28]} r={0.015} position={[-0.285, 0.2, 0]} />
      <Box size={[0.035, 0.045, 0.3]} r={0.015} position={[0.31, 0.11, 0]} />
      {[-0.18, 0.19].flatMap((x) => [-0.15, 0.15].map((z) => <Puck key={`${x}${z}`} r={0.08} h={0.065} bevel={0.022} segments={20} position={[x, 0.08, z]} rotation={[HALF_PI, 0, 0]} />))}
    </group>
  );
}

/** Seconds into the experiments at which the car is let go (the stopwatch starts with it). */
export const CAR_GO = 1.1;

/** The road lays itself around the lap, the car drops onto the line, pulls back and shoots off. */
export function Track() {
  const { play, mats } = useClay();
  const car = useRef<THREE.Group>(null);
  const geo = useMemo(trackGeometry, []);
  useFrame(() => {
    const a = ageOf(play, 2);
    geo.setDrawRange(0, Math.round(ROWS * ease(slice(a, 0.1, 0.75))) * ROW_INDICES);
    if (!car.current) return;
    const go = a - CAR_GO;
    // Pulled back on its springs, then off: a burst and a steady lap every 2.7 s.
    const p = lapAt(go < 0 ? -0.14 * bump(slice(a, CAR_GO - 0.25, CAR_GO + 0.02)) : 3.1 * go + 0.5 * (1 - Math.exp(-5 * go)));
    const drop = 1 - ease(slice(a, 0.68, 0.84));
    car.current.position.set(p.x, 0.05 + (ROAD / 2) * Math.tan(p.bank) + drop * 0.6, p.z);
    car.current.rotation.set(-p.bank, p.a, 0, 'YXZ');
    const size = 0.82 * pop(slice(a, 0.66, 0.84), 1.2);
    const stretch = 0.22 * bump(slice(go, 0, 0.35)) - 0.14 * bump(slice(a, CAR_GO - 0.25, CAR_GO)) - 0.2 * bump(slice(a, 0.82, 0.98));
    car.current.scale.set(Math.max(size * (1 + stretch), 1e-4), Math.max(size * (1 - stretch * 0.6), 1e-4), Math.max(size, 1e-4));
  });
  return (
    <group>
      <mesh geometry={geo} castShadow receiveShadow material={mats.clay} />
      <group ref={car} scale={0.82}>
        <Pickup />
      </group>
    </group>
  );
}

// ── The inclined plane ──────────────────────────────────────────────────────
export const TILT = 0.42;
const PIVOT: V3 = [-1.2, 0.14, 0];
// Top of the pulley, where the string turns down (in the incline's space).
export const PULLEY_X = PIVOT[0] + 2.62 * Math.cos(TILT) - 0.16 * Math.sin(TILT);
export const PULLEY_Y = PIVOT[1] + 2.62 * Math.sin(TILT) + 0.16 * Math.cos(TILT);
export const DROP_X = PULLEY_X + 0.125;
const TRAVEL = 0.42;
/**
 * How far the mass has dropped (0..TRAVEL), `age` seconds into the experiments: it is let go, falls
 * and yanks the cart up the plane, the cart rings against the stop, and it is all let back down.
 */
export const pull = (age: number) => {
  if (age < 1) return 0;
  const c = (age - 1) % 2.7;
  return TRAVEL * (c < 0.42 ? (c / 0.42) ** 2 : c < 1.7 ? 1 - 0.09 * wobble(c - 0.42, 3.5, 5) : 1 - ease((c - 1.7) / 1));
};

function pulleyGeometry() {
  const p: [number, number][] = [[0, -0.04], [0.14, -0.04], [0.14, -0.026], [0.1, 0], [0.14, 0.026], [0.14, 0.04], [0, 0.04]];
  return new THREE.LatheGeometry(p.map(([x, y]) => new THREE.Vector2(x, y)), 32);
}

export function Incline() {
  const { play, mats } = useClay();
  const cart = useRef<THREE.Group>(null);
  const wheel = useRef<THREE.Mesh>(null);
  const along = useRef<THREE.Mesh>(null);
  const down = useRef<THREE.Mesh>(null);
  const plane = useRef<THREE.Group>(null);
  const strut = useRef<THREE.Group>(null);
  const pulley = useMemo(pulleyGeometry, []);
  useFrame(() => {
    const age = ageOf(play, 2);
    // It builds itself: the plane swings up off the base past its angle and settles, the strut stands up under it.
    plane.current?.rotation.set(0, 0, TILT * spring(age - 0.12, 1.6, 5.5));
    strut.current?.scale.setY(Math.max(pop(slice(age, 0.3, 0.55), 1.2), 1e-4));
    const d = pull(age);
    const x = 0.9 + d;
    cart.current?.position.setX(x);
    wheel.current?.rotation.set(HALF_PI, 0, d / 0.12);
    // String along the plane, from the cart to the pulley; then down to the hanging mass. It is threaded once the plane stands.
    const strung = slice(age, 0.5, 0.65);
    const a = x + 0.2;
    along.current?.position.setX((a + 2.6) / 2);
    along.current?.scale.set(strung, 2.6 - a, strung);
    const len = 0.22 + d;
    down.current?.position.setY(PULLEY_Y - len / 2);
    down.current?.scale.set(strung, len, strung);
  });
  return (
    <group>
      <Box size={[2.95, 0.09, 0.39]} position={[0, 0.045, 0.2]} r={0.03} />
      <Box size={[2.95, 0.09, 0.39]} position={[0, 0.045, -0.2]} r={0.03} />
      <Puck r={0.07} h={0.66} bevel={0.02} segments={16} position={[PIVOT[0], PIVOT[1], 0]} rotation={[HALF_PI, 0, 0]} />
      <group ref={strut} position={[0.71, 0.06, 0]}>
        <Box size={[0.1, 0.9, 0.5]} position={[-0.05, 0.44, 0]} r={0.03} rotation={[0, 0, -0.12]} />
      </group>
      <group ref={plane} position={PIVOT} rotation={[0, 0, TILT]}>
        <Box size={[2.62, 0.08, 0.62]} position={[1.31, 0, 0]} r={0.03} />
        <group ref={cart} position={[0.9, 0.04, 0]}>
          <Box size={[0.4, 0.1, 0.3]} r={0.035} position={[0, 0.115, 0]} />
          <Box size={[0.2, 0.09, 0.2]} r={0.035} position={[-0.04, 0.2, 0]} />
          {[-0.13, 0.13].flatMap((x) => [-0.16, 0.16].map((z) => <Puck key={`${x}${z}`} r={0.052} h={0.04} bevel={0.014} segments={16} position={[x, 0.052, z]} rotation={[HALF_PI, 0, 0]} />))}
        </group>
        <mesh ref={along} position={[1.8, 0.16, 0]} rotation={[0, 0, HALF_PI]} material={mats.ink} userData={{ overlay: true }}>
          <cylinderGeometry args={[0.008, 0.008, 1, 6]} />
        </mesh>
        {/* The pulley in its fork, at the top of the plane */}
        <Box size={[0.3, 0.22, 0.04]} position={[2.56, 0.11, 0.075]} r={0.018} />
        <Box size={[0.3, 0.22, 0.04]} position={[2.56, 0.11, -0.075]} r={0.018} />
        <mesh ref={wheel} geometry={pulley} position={[2.62, 0.16, 0]} rotation={[HALF_PI, 0, 0]} castShadow receiveShadow material={mats.clay} />
        <Puck r={0.03} h={0.22} segments={12} position={[2.62, 0.16, 0]} rotation={[HALF_PI, 0, 0]} />
      </group>
      <mesh ref={down} position={[DROP_X, PULLEY_Y - 0.2, 0]} material={mats.ink} userData={{ overlay: true }}>
        <cylinderGeometry args={[0.008, 0.008, 1, 6]} />
      </mesh>
    </group>
  );
}

/** The hanging mass rides the string of the inclined plane. `k`: the plane's scale over the mass's own. */
export function Riding({ k, children }: { k: number; children: ReactNode }) {
  const { play } = useClay();
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (ref.current) ref.current.position.y = -pull(ageOf(play, 2)) * k * at(play, 2);
  });
  return <group ref={ref}>{children}</group>;
}

// ── The stand ───────────────────────────────────────────────────────────────
/** Where the spring hangs, in the stand's space. */
export const HANG: V3 = [0.3, 2.55, -0.15];

/** It builds itself: the rod grows out of the base, the clamp drops down it, the arm slides out. */
export function Stand() {
  const { mats } = useClay();
  return (
    <group>
      <Box size={[1.35, 0.09, 1.1]} position={[0, 0.045, 0]} r={0.04} />
      <Puck r={0.09} h={0.1} bevel={0.03} segments={20} position={[-0.42, 0.13, HANG[2]]} />
      <Act position={[-0.42, 0.08, HANG[2]]} f={(g, p) => void g.scale.setY(Math.max(pop(slice(ageOf(p, 2), 0.1, 0.4), 1.2), 1e-4))}>
        <Puck r={0.045} h={2.7} bevel={0.02} segments={16} position={[0, 1.35, 0]} />
      </Act>
      {/* The clamp that holds the arm, with its screw */}
      <Act
        position={[-0.42, HANG[1] + 0.06, HANG[2]]}
        f={(g, p) => {
          const a = ageOf(p, 2);
          g.position.y = HANG[1] + 0.06 + 0.9 * (1 - spring(a - 0.3, 2, 6));
          g.scale.setScalar(Math.max(slice(a, 0.3, 0.38), 1e-4));
        }}
      >
        <Box size={[0.2, 0.2, 0.2]} r={0.045} />
        <Puck r={0.05} h={0.16} bevel={0.016} segments={14} position={[0, 0, 0.15]} rotation={[HALF_PI, 0, 0]} />
        <Act f={(g, p) => void g.scale.setX(Math.max(pop(slice(ageOf(p, 2), 0.45, 0.68), 1.3), 1e-4))}>
          <Puck r={0.034} h={0.92} bevel={0.014} segments={14} position={[0.4, 0, 0]} rotation={[0, 0, HALF_PI]} />
          <mesh position={[HANG[0] + 0.42, -0.055, 0]} castShadow material={mats.clay}>
            <torusGeometry args={[0.05, 0.016, 8, 24]} />
          </mesh>
        </Act>
      </Act>
    </group>
  );
}

// ── The schools ─────────────────────────────────────────────────────────────
// Each school is one piece of geometry (it is drawn 28 times). Glass and doors are a darker
// tone of the same clay, carried in the vertex colours.
const GLASS = 0.5;
function toned(g: THREE.BufferGeometry, tone = 1) {
  const flat = g.index ? g.toNonIndexed() : g;
  flat.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(flat.attributes.position.count * 3).fill(tone), 3));
  return flat;
}
/** A box standing on `y`, centred on x and z. */
const block = (w: number, h: number, d: number, x: number, y: number, z: number, tone = 1, r = 0.014) =>
  toned(new RoundedBoxGeometry(w, h, d, 2, Math.min(r, Math.min(w, h, d) / 2 - 0.001)).translate(x, y + h / 2, z), tone);
const post = (r: number, h: number, x: number, y: number, z: number) => toned(new THREE.CylinderGeometry(r, r, h, 8).translate(x, y + h / 2, z));
/** A pitched roof sitting on `y`: `len` along its ridge, `span` across. The ridge runs along X, or along Z with `front`. */
function gable(len: number, span: number, rise: number, x: number, y: number, z: number, front = false) {
  const s = new THREE.Shape();
  s.moveTo(-span / 2, 0);
  s.lineTo(span / 2, 0);
  s.lineTo(0, rise);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: len - 0.02, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01, bevelSegments: 1 }).translate(0, 0, -len / 2 + 0.01);
  if (!front) g.rotateY(HALF_PI);
  return toned(g.translate(x, y, z));
}
/** A row of windows on a wall facing +Z. */
const windows = (xs: number[], y: number, z: number, w = 0.085, h = 0.12) =>
  xs.flatMap((x) => [block(w, h, 0.014, x, y, z, GLASS, 0.004), block(w + 0.03, 0.016, 0.03, x, y - 0.016, z + 0.004, 1, 0.005)]);
const Y = 0.022; // the top of a school's yard
/**
 * What makes each of them a school: the yard with its path, and over the front door a tower
 * `h` tall with a clock, a pointed roof and a flagpole.
 */
const entrance = (h: number) => [
  block(1.06, Y, 0.86, 0, 0, 0.05, 1, 0.01),
  block(0.14, 0.008, 0.32, 0, Y, 0.33, 1, 0.003),
  block(0.26, h, 0.24, 0, Y, -0.02),
  toned(new THREE.ConeGeometry(0.225, 0.17, 4).rotateY(Math.PI / 4).translate(0, Y + h + 0.085, -0.02)),
  block(0.1, 0.17, 0.014, 0, Y, 0.102, GLASS, 0.004),
  toned(new THREE.CylinderGeometry(0.043, 0.043, 0.016, 16).rotateX(HALF_PI).translate(0, Y + h - 0.085, 0.104), GLASS),
  block(0.3, 0.014, 0.07, 0, Y, 0.135, 1, 0.005),
  post(0.01, 0.36, 0, Y + h + 0.13, -0.02),
];
/** The flag of each kind of school, flying at the top of its pole (in the school's space). It is raised `FLAG_RISE` up the pole when the kit arrives. */
export const FLAG_TOP = [0.43, 0.62, 0.43].map((h): V3 => [0.13, Y + h + 0.42, -0.02]);
export const FLAG_RISE = 0.24;
export const flagGeometry = () => new RoundedBoxGeometry(0.24, 0.14, 0.018, 1, 0.005);

/** Three kinds of school, origin on the ground in the middle of the yard, front door towards +Z. */
export function schoolGeometries() {
  // One storey of classrooms on each side of the door, under a low pitched roof.
  const long = [
    ...entrance(0.43),
    block(1, 0.24, 0.34, 0, Y, -0.17),
    gable(1.08, 0.44, 0.13, 0, Y + 0.24, -0.17),
    ...windows([-0.42, -0.31, -0.2, 0.2, 0.31, 0.42], Y + 0.08, 0.002),
  ];
  // Two storeys, a flat roof with its parapet and the water tank.
  const flat = [
    ...entrance(0.62),
    block(0.9, 0.43, 0.34, 0, Y, -0.17),
    block(0.96, 0.035, 0.4, 0, Y + 0.43, -0.17, 1, 0.012),
    block(0.18, 0.08, 0.14, 0.3, Y + 0.465, -0.2),
    ...windows([-0.39, -0.29, -0.19, 0.19, 0.29, 0.39], Y + 0.07, 0.002, 0.075),
    ...windows([-0.39, -0.29, -0.19, 0.19, 0.29, 0.39], Y + 0.27, 0.002, 0.075),
  ];
  // A classroom wing on one side of the door and, on the other, the vaulted roof of the covered court.
  const court = [
    ...entrance(0.43),
    block(0.5, 0.24, 0.34, -0.27, Y, -0.17),
    block(0.56, 0.035, 0.4, -0.27, Y + 0.24, -0.17, 1, 0.012),
    ...windows([-0.42, -0.31, -0.2], Y + 0.08, 0.002),
    toned(new THREE.CylinderGeometry(0.21, 0.21, 0.52, 14, 1, false, -HALF_PI, Math.PI).rotateX(-HALF_PI).scale(1, 0.6, 1).translate(0.34, Y + 0.19, -0.15)),
    ...[-0.37, 0.07].flatMap((z) => [post(0.012, 0.19, 0.16, Y, z), post(0.012, 0.19, 0.52, Y, z)]),
    block(0.36, 0.008, 0.46, 0.34, Y, -0.15, GLASS, 0.003),
  ];
  return [long, flat, court].map((parts) => mergeGeometries(parts)!);
}

/** A closed kit, small enough to be carried to a school. Origin at its bottom centre. */
export function miniKitGeometry() {
  return mergeGeometries([
    new RoundedBoxGeometry(0.24, 0.1, 0.16, 2, 0.02).translate(0, 0.05, 0),
    new RoundedBoxGeometry(0.26, 0.03, 0.18, 2, 0.012).translate(0, 0.112, 0),
    new RoundedBoxGeometry(0.1, 0.03, 0.03, 2, 0.012).translate(0, 0.14, 0),
  ])!;
}
