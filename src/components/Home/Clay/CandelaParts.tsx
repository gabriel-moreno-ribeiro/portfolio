// The Candela models, in clay. Shapes follow the photos in public/work/candela: the box with
// its finger joints and label plate, the six instruments, and the three setups shown running.
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import { at, Box, Puck, Rod, Slab, Ticks, useClay, type V3 } from './kit';

const HALF_PI = Math.PI / 2;
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

/** The lid, hinged along its back edge so it can peek open. Origin at the centre of its underside. */
export function Lid({ peek = 0 }: { peek?: number }) {
  const { play } = useClay();
  const hinge = useRef<THREE.Group>(null);
  const handle = useMemo(() => curve([[-0.42, 0, 0], [-0.4, 0.13, 0], [0, 0.17, 0], [0.4, 0.13, 0], [0.42, 0, 0]]), []);
  useFrame(({ clock }) => {
    // While the first step holds, the lid lifts a little and settles back: something is in there.
    const open = Math.max(0, Math.sin(clock.elapsedTime * 1.1)) ** 2 * peek * at(play, 0);
    if (hinge.current) hinge.current.rotation.x = -open;
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

/** Beam along X, jaws down, in the XY plane. The slider drifts open and shut. */
export function Caliper() {
  const slide = useRef<THREE.Group>(null);
  const shapes = useMemo(() => ({ fixed: jawShape(1), moving: jawShape(-1), beakA: jawShape(1, 0.25), beakB: jawShape(-1, 0.25) }), []);
  useFrame(({ clock }) => {
    if (slide.current) slide.current.position.x = -0.32 + Math.sin(clock.elapsedTime * 0.8) * 0.11;
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

/** Face towards +Z. The long hand sweeps. */
export function Stopwatch() {
  const { mats } = useClay();
  const hand = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (hand.current) hand.current.rotation.z = -clock.elapsedTime * 1.2;
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
      <Puck r={0.07} h={0.15} position={[0, 0.43, 0]} />
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
    const len = COIL + (0.09 + Math.sin(clock.elapsedTime * 2.4) * 0.13) * at(play, 2);
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
  const blade = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    // The blade creeps in and out a little, as if someone were taking a measure.
    if (blade.current) blade.current.scale.x = 1 + Math.sin(clock.elapsedTime * 0.9) * 0.07;
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
      {[0.06, 0.168, 0.276].map((y, i) => (
        <Slab key={y} shape={disc} depth={0.075} bevel={0.014} position={[0, y, 0]} rotation={[-HALF_PI, 0, 0.5 + i * 2.2]} />
      ))}
      <Puck r={0.024} h={0.56} segments={14} position={[0, 0.33, 0]} />
      <Rod path={hook} r={0.018} segments={24} position={[0, 0.6, 0]} />
    </group>
  );
}

/** Graduated cylinder: hexagonal foot, open tube with a pouring lip, marks up the front. */
export function Cylinder() {
  const { mats } = useClay();
  return (
    <group>
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
    </group>
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

/** The road swept along the lap: a kerb on each side, and the outside of each curve raised. */
function trackGeometry() {
  // Cross-section: [across the road (outwards +), height]. The inner kerb, the road, the outer kerb.
  const profile: [number, number][] = [[-ROAD / 2, 0], [-ROAD / 2, 0.1], [-ROAD / 2 + 0.04, 0.1], [-ROAD / 2 + 0.04, 0.05], [ROAD / 2 - 0.04, 0.05], [ROAD / 2 - 0.04, 0.1], [ROAD / 2, 0.1], [ROAD / 2, 0]];
  const rows = 200;
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
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
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

export function Track() {
  const { mats } = useClay();
  const car = useRef<THREE.Group>(null);
  const geo = useMemo(trackGeometry, []);
  useFrame(({ clock }) => {
    if (!car.current) return;
    const p = lapAt(clock.elapsedTime * 1.15);
    car.current.position.set(p.x, 0.05 + (ROAD / 2) * Math.tan(p.bank), p.z);
    car.current.rotation.set(-p.bank, p.a, 0, 'YXZ');
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
/** How far the mass has dropped (0..TRAVEL): it falls and pulls the cart up, then the cart is let back down. */
export const pull = (t: number) => {
  const u = (t * 0.32) % 1;
  // Falls with an ease, waits a beat at the bottom, comes back quicker.
  return TRAVEL * (u < 0.55 ? (u / 0.55) ** 2 : u < 0.68 ? 1 : 1 - ((u - 0.68) / 0.32) ** 0.7);
};

function pulleyGeometry() {
  const p: [number, number][] = [[0, -0.04], [0.14, -0.04], [0.14, -0.026], [0.1, 0], [0.14, 0.026], [0.14, 0.04], [0, 0.04]];
  return new THREE.LatheGeometry(p.map(([x, y]) => new THREE.Vector2(x, y)), 32);
}

export function Incline() {
  const { mats } = useClay();
  const cart = useRef<THREE.Group>(null);
  const wheel = useRef<THREE.Mesh>(null);
  const along = useRef<THREE.Mesh>(null);
  const down = useRef<THREE.Mesh>(null);
  const pulley = useMemo(pulleyGeometry, []);
  useFrame(({ clock }) => {
    const d = pull(clock.elapsedTime);
    const x = 0.9 + d;
    cart.current?.position.setX(x);
    wheel.current?.rotation.set(HALF_PI, 0, d / 0.12);
    // String along the plane, from the cart to the pulley; then down to the hanging mass.
    const a = x + 0.2;
    along.current?.position.setX((a + 2.6) / 2);
    along.current?.scale.setY(2.6 - a);
    const len = 0.22 + d;
    down.current?.position.setY(PULLEY_Y - len / 2);
    down.current?.scale.setY(len);
  });
  return (
    <group>
      <Box size={[2.95, 0.09, 0.39]} position={[0, 0.045, 0.2]} r={0.03} />
      <Box size={[2.95, 0.09, 0.39]} position={[0, 0.045, -0.2]} r={0.03} />
      <Puck r={0.07} h={0.66} bevel={0.02} segments={16} position={[PIVOT[0], PIVOT[1], 0]} rotation={[HALF_PI, 0, 0]} />
      <Box size={[0.1, 0.9, 0.5]} position={[0.66, 0.5, 0]} r={0.03} rotation={[0, 0, -0.12]} />
      <group position={PIVOT} rotation={[0, 0, TILT]}>
        <Box size={[2.62, 0.08, 0.62]} position={[1.31, 0, 0]} r={0.03} />
        <group ref={cart} position={[0.9, 0.04, 0]}>
          <Box accent size={[0.4, 0.1, 0.3]} r={0.035} position={[0, 0.115, 0]} />
          <Box accent size={[0.2, 0.09, 0.2]} r={0.035} position={[-0.04, 0.2, 0]} />
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
  useFrame(({ clock }) => {
    if (ref.current) ref.current.position.y = -pull(clock.elapsedTime) * k * at(play, 2);
  });
  return <group ref={ref}>{children}</group>;
}

// ── The stand ───────────────────────────────────────────────────────────────
/** Where the spring hangs, in the stand's space. */
export const HANG: V3 = [0.3, 2.55, -0.15];

export function Stand() {
  const { mats } = useClay();
  return (
    <group>
      <Box size={[1.35, 0.09, 1.1]} position={[0, 0.045, 0]} r={0.04} />
      <Puck r={0.09} h={0.1} bevel={0.03} segments={20} position={[-0.42, 0.13, HANG[2]]} />
      <Puck r={0.045} h={2.7} bevel={0.02} segments={16} position={[-0.42, 1.43, HANG[2]]} />
      {/* The clamp that holds the arm, with its screw */}
      <Box size={[0.2, 0.2, 0.2]} position={[-0.42, HANG[1] + 0.06, HANG[2]]} r={0.045} />
      <Puck r={0.05} h={0.16} bevel={0.016} segments={14} position={[-0.42, HANG[1] + 0.06, HANG[2] + 0.15]} rotation={[HALF_PI, 0, 0]} />
      <Puck r={0.034} h={0.92} bevel={0.014} segments={14} position={[-0.02, HANG[1] + 0.06, HANG[2]]} rotation={[0, 0, HALF_PI]} />
      <mesh position={[HANG[0], HANG[1] + 0.005, HANG[2]]} castShadow material={mats.clay}>
        <torusGeometry args={[0.05, 0.016, 8, 24]} />
      </mesh>
    </group>
  );
}
