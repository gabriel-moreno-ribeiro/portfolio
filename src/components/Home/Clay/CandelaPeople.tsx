// The ending, under one magnifying glass. It slides in under the kit and shows where the kits went:
// 28 schools, 17 in Bahia and 11 in Ceará. Then it goes into one of the schools and shows who was
// reached: its students come out, the count runs to 3,392, and those who failed physics (a cross over
// their heads) go from 9 in 30 to 3 in 30 once the kit is in class: the 30% and the 10% of the story.
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { useTones } from './CandelaParts';
import { Act, ageOf, at, ease, pop, Puck, settle, slice, spring, useClay, type Mats, type Play, type V3 } from './kit';

const HALF_PI = Math.PI / 2;
const lerp = THREE.MathUtils.lerp;
const HIDE = 1e-4;
// One geometry out of several (rounded boxes have no index, plain ones do: all are taken to no index).
const merged = (parts: THREE.BufferGeometry[]) => {
  const flat = parts.map((p) => (p.index ? p.toNonIndexed() : p));
  const g = mergeGeometries(flat)!;
  [...parts, ...flat].forEach((p) => p.dispose());
  return g;
};

export const REACH = 3; // the step of the schools
export const RESULT = 4; // the step of the students

// ── The magnifying glass ────────────────────────────────────────────────────
/** The middle of the glass, and the height its top is at: everything it shows stands on it. */
export const LENS: V3 = [-0.9, 0, 0.15];
export const GLASS = 0.06;
const RIM = 3; // radius
const HANDLE = 0.38; // the way the handle points, radians from +X towards the camera
/** A point on the glass (x to the right, z towards the camera, from its middle), in the world. */
export const onLens = (x: number, z: number, y = 0): V3 => [LENS[0] + x, GLASS + y, LENS[2] + z];
// It slides in along its handle, under the kit, and leaves the way it came. Between the two steps it only refocuses.
const lensAct = (g: THREE.Group, p: Play) => {
  const here = p.to === REACH || p.to === RESULT;
  const was = p.from === REACH || p.from === RESULT;
  const k = here ? (was ? 1 : settle(slice(p.t, 0.2, 0.85), 0.5)) : was ? 1 - ease(slice(p.t, 0, 0.45)) : 0;
  g.visible = k > 0.001;
  const out = (1 - k) * 11;
  // Going from the schools into one school, the rim gives: the glass refocuses.
  const focus = p.from === REACH && p.to === RESULT ? 0.035 * Math.sin(slice(p.t, 0.05, 0.6) * Math.PI) : 0;
  g.position.set(LENS[0] + Math.cos(HANDLE) * out, 0, LENS[2] + Math.sin(HANDLE) * out);
  g.scale.setScalar(1 - focus);
};

export function Lens() {
  const { mats } = useClay();
  const { wood } = useTones();
  const { rim, glint } = useMemo(() => ({ rim: new THREE.TorusGeometry(RIM, 0.1, 8, 72).rotateX(HALF_PI), glint: new THREE.TorusGeometry(RIM - 0.4, 0.018, 4, 20, 0.55).rotateX(HALF_PI).rotateY(2.2) }), []);
  useEffect(
    () => () => {
      rim.dispose();
      glint.dispose();
    },
    [rim, glint],
  );
  return (
    <Act f={lensAct}>
      <Puck r={RIM - 0.02} h={GLASS - 0.004} bevel={0.01} segments={64} position={[0, GLASS / 2, 0]} material={mats.shade.mid} />
      <mesh geometry={rim} position={[0, 0.09, 0]} castShadow receiveShadow material={mats.shade.dark} />
      <mesh geometry={glint} position={[0, GLASS + 0.004, 0]} material={mats.clay} />
      <group rotation={[0, -HANDLE, 0]}>
        <Puck r={0.14} h={0.5} bevel={0.03} segments={16} position={[RIM + 0.3, 0.12, 0]} rotation={[0, 0, HALF_PI]} material={mats.shade.dark} />
        <Puck r={0.19} h={1.3} bevel={0.08} segments={20} position={[RIM + 1.15, 0.17, 0]} rotation={[0, 0, HALF_PI]} material={wood} />
      </group>
    </Act>
  );
}

// ── 28 public schools: 17 in Bahia, 11 in Ceará ─────────────────────────────
export const BAHIA = 17;
export const CEARA = 11;
export const SCHOOLS = BAHIA + CEARA;
const SCHOOL_K = 0.58;
const BIG_K = 2; // the one school the glass goes into
/** Where the kit stands on the glass: at the front, in both steps. */
export const KIT_ON_LENS: [number, number] = [0, 1.85];
// The schools stand in rows all over the glass, clear of the kit: Bahia's on the left, Ceará's on the
// right, and an empty street between the two.
const SPOTS: { x: number; z: number; yaw: number }[] = (() => {
  const all: [number, number][] = [];
  for (let r = -5; r <= 5; r++)
    for (let c = -6; c <= 6; c++) {
      const z = r * 0.72 - 0.25;
      const x = (c + (Math.abs(r) % 2 ? 0.5 : 0)) * 0.8;
      if (Math.hypot(x, z) <= 2.5 && Math.hypot(x - KIT_ON_LENS[0], z - KIT_ON_LENS[1]) >= 0.95) all.push([x, z]);
    }
  all.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const pick = [...all.slice(0, BAHIA), ...all.slice(all.length - CEARA)];
  return pick.map(([x, z], i) => ({ x: x + (i < BAHIA ? -0.12 : 0.12), z, yaw: Math.sin(i * 12.9898) * 0.16 }));
})();
/** The middle of each state's schools, on the glass: where its label points. */
const middle = (from: number, to: number): [number, number] => [SPOTS.slice(from, to).reduce((a, s) => a + s.x, 0) / (to - from), Math.min(...SPOTS.slice(from, to).map((s) => s.z))];
export const BAHIA_AT = middle(0, BAHIA);
export const CEARA_AT = middle(BAHIA, SCHOOLS);
// The school the glass goes into: the one nearest the back of the glass, in the middle.
const FOCUS = SPOTS.reduce((best, s, i) => (Math.hypot(s.x, s.z + 2.1) < Math.hypot(SPOTS[best].x, SPOTS[best].z + 2.1) ? i : best), 0);
const FOCUS_AT: [number, number] = [0, -1.7];
// Kits leave the box for the nearest schools first.
const ORDER = SPOTS.map((_, i) => i).sort((a, b) => Math.hypot(SPOTS[a].x - KIT_ON_LENS[0], SPOTS[a].z - KIT_ON_LENS[1]) - Math.hypot(SPOTS[b].x - KIT_ON_LENS[0], SPOTS[b].z - KIT_ON_LENS[1]));
const RANK = SPOTS.map((_, i) => ORDER.indexOf(i));
/** When the kit for the `n`-th school lands, seconds into the step. */
export const landAt = (n: number) => 1.05 + n * 0.05;
/** How many schools have their kit, `p` into the story. */
export const reached = (p: Play, from = 0, to = SCHOOLS) => {
  if (p.to !== REACH && p.from !== REACH) return 0;
  const a = ageOf(p, REACH);
  let n = 0;
  for (let i = from; i < to; i++) if (a >= landAt(RANK[i])) n++;
  return n;
};

/** A geometry with one tone all over (a factor of the clay's own colour). */
const tone = (g: THREE.BufferGeometry, c: THREE.Color) => {
  const n = g.attributes.position.count;
  const a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) a.set([c.r, c.g, c.b], i * 3);
  return g.setAttribute('color', new THREE.Float32BufferAttribute(a, 3));
};
/**
 * A school: classrooms on each side of the door under an orange roof, a tower over the door with
 * its flag, a yard in front. About one unit wide, origin on the ground, the door towards +Z.
 */
function schoolGeometry(mats: Mats) {
  const white = new THREE.Color(1, 1, 1);
  const yard = new THREE.Color(0.86, 0.86, 0.86);
  const dark = new THREE.Color(0.36, 0.36, 0.36);
  const c = mats.clay.color;
  const a = mats.accent.color;
  const orange = new THREE.Color(a.r / c.r, a.g / c.g, a.b / c.b);
  const box = (w: number, h: number, d: number, x: number, y: number, z: number, t: THREE.Color) => tone(new THREE.BoxGeometry(w, h, d).translate(x, y + h / 2, z), t);
  const roof = (w: number, h: number, d: number, x: number, y: number, z: number) => tone(new THREE.ConeGeometry(Math.SQRT1_2, h, 4).rotateY(Math.PI / 4).scale(w, 1, d).translate(x, y + h / 2, z), orange);
  return merged([
    box(1.1, 0.02, 0.84, 0, 0, 0.06, yard),
    tone(new RoundedBoxGeometry(1, 0.26, 0.36, 1, 0.02).translate(0, 0.15, -0.14), white),
    roof(1.08, 0.17, 0.46, 0, 0.28, -0.14),
    box(0.25, 0.5, 0.25, 0, 0.02, 0, white),
    roof(0.31, 0.2, 0.31, 0, 0.52, 0),
    box(0.11, 0.17, 0.014, 0, 0.02, 0.126, dark),
    ...[-0.42, -0.31, -0.2, 0.2, 0.31, 0.42].map((x) => box(0.075, 0.1, 0.014, x, 0.1, 0.041, dark)),
    tone(new THREE.CylinderGeometry(0.009, 0.009, 0.3, 5).translate(0, 0.84, 0), dark),
    box(0.17, 0.1, 0.012, 0.09, 0.88, 0, orange),
  ]);
}
/** A closed kit, small enough to be carried to a school. Origin at its bottom centre. */
const miniKitGeometry = () =>
  merged([
    new RoundedBoxGeometry(0.24, 0.1, 0.16, 1, 0.02).translate(0, 0.05, 0),
    new RoundedBoxGeometry(0.26, 0.03, 0.18, 1, 0.012).translate(0, 0.112, 0),
    new THREE.BoxGeometry(0.1, 0.03, 0.03).translate(0, 0.14, 0),
  ]);

/** One kit after another leaves the box for a school, and each school comes up as its kit lands. Then the glass goes into one of them: it grows, the others go. */
export function Schools() {
  const { play, mats } = useClay();
  const { built, inst, wood } = useTones();
  const schools = useRef<THREE.InstancedMesh>(null);
  const kits = useRef<THREE.InstancedMesh>(null);
  const school = useMemo(() => schoolGeometry(mats), [mats]);
  const kit = useMemo(miniKitGeometry, []);
  useEffect(() => () => school.dispose(), [school]);
  useEffect(() => () => kit.dispose(), [kit]);
  useLayoutEffect(() => {
    const m = kits.current;
    if (!m) return;
    for (let k = 0; k < SCHOOLS; k++) m.setColorAt(k, wood.color);
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [wood, inst]);
  const o = useMemo(() => new THREE.Object3D(), []);
  useFrame(() => {
    const m = schools.current;
    const b = kits.current;
    if (!m || !b) return;
    const p = play;
    const on = p.to === REACH || p.from === REACH || p.to === RESULT || p.from === RESULT;
    m.visible = on;
    b.visible = on && (p.to === REACH || p.from === REACH);
    if (!on) return;
    const a3 = ageOf(p, REACH);
    for (let i = 0; i < SCHOOLS; i++) {
      const s = SPOTS[i];
      const land = landAt(RANK[i]);
      const up = pop(slice(a3, land, land + 0.25), 1.5);
      let x = s.x;
      let z = s.z;
      let k = 0;
      const chosen = i === FOCUS;
      if (p.to === REACH) {
        k = SCHOOL_K * up;
        // Coming back from inside the school: the big one goes first.
        if (chosen && p.from === RESULT && p.t < 0.35) [x, z, k] = [FOCUS_AT[0], FOCUS_AT[1], BIG_K * (1 - ease(p.t / 0.35))];
      } else if (p.from === REACH && p.to === RESULT) {
        // Into one school: it comes to the middle and grows, the others slide away from it as they go.
        const zoom = ease(slice(p.t, 0.1, 0.8));
        if (chosen) [x, z, k] = [lerp(s.x, FOCUS_AT[0], zoom), lerp(s.z, FOCUS_AT[1], zoom), lerp(SCHOOL_K, BIG_K, zoom) * up];
        else [x, z, k] = [s.x + (s.x - SPOTS[FOCUS].x) * 0.5 * zoom, s.z + (s.z - SPOTS[FOCUS].z) * 0.5 * zoom, SCHOOL_K * up * (1 - ease(slice(p.t, 0.05, 0.5)))];
      } else if (p.from === REACH) k = SCHOOL_K * up * (1 - ease(slice(p.t, 0, 0.4)));
      else if (chosen) [x, z, k] = [FOCUS_AT[0], FOCUS_AT[1], BIG_K * (p.to === RESULT ? (p.from === RESULT ? 1 : pop(slice(p.t, 0.5, 0.9))) : 1 - ease(slice(p.t, 0, 0.4)))];
      o.position.set(LENS[0] + x, GLASS, LENS[2] + z);
      o.rotation.set(0, chosen ? 0 : s.yaw, 0);
      o.scale.setScalar(Math.max(k, HIDE));
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);

      // Its kit: out of the box in an arc, and into the school as it comes up.
      const far = Math.hypot(s.x - KIT_ON_LENS[0], s.z - KIT_ON_LENS[1]);
      const u = slice(a3, land - (0.26 + far * 0.06), land + 0.04);
      const e = ease(u);
      o.position.set(LENS[0] + lerp(KIT_ON_LENS[0], s.x, e), GLASS + lerp(0.45, 0.1, e) + Math.sin(u * Math.PI) * (0.5 + far * 0.25), LENS[2] + lerp(KIT_ON_LENS[1], s.z, e));
      o.rotation.set(0, (1 - u) * 2.4, 0);
      o.scale.setScalar(Math.max(u > 0 && u < 1 ? Math.min(1, slice(u, 0, 0.12) * 1.2) * (1 - slice(u, 0.88, 1)) * 0.9 : 0, HIDE));
      o.updateMatrix();
      b.setMatrixAt(i, o.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
    b.instanceMatrix.needsUpdate = true;
  });
  return (
    <>
      <instancedMesh ref={schools} args={[school, built, SCHOOLS]} castShadow receiveShadow frustumCulled={false} />
      <instancedMesh ref={kits} args={[kit, inst, SCHOOLS]} castShadow frustumCulled={false} />
    </>
  );
}

// ── 3,392 students; those who fail physics, from 30% to 10% ─────────────────
export const STUDENTS = 3392;
export const COUNT: [number, number] = [0.55, 1.75]; // seconds into the step over which the count runs
export const TURN = 2.0; // the kit does its work: most of those who failed now pass
// Thirty students in front of their school, with the kit in the middle of the front row. Nine of them
// fail (9 in 30 is 30%); after the kit three still do (10%).
const row = (n: number) => Array.from({ length: n }, (_, i) => (i - (n - 1) / 2) * 0.56);
const ROWS: [number, number[]][] = [
  [-0.5, row(9)],
  [0.25, row(8)],
  [1.0, row(9)],
  [1.8, [-1.5, -0.95, 0.95, 1.5]],
];
const KID_K = 0.95;
const FAILED = [1, 6, 10, 13, 16, 19, 22, 25, 28]; // of the thirty, before the kit
const STILL_FAIL = [6, 16, 25]; // and after it
interface Kid { x: number; z: number; failed: boolean; stays: boolean; when: number; turn: number; cross: number; seed: number }
const KIDS: Kid[] = (() => {
  const all: Kid[] = [];
  let cross = 0;
  ROWS.forEach(([z, xs], row) =>
    xs.forEach((x) => {
      const i = all.length;
      const failed = FAILED.includes(i);
      // Out of the school's door and to their places, the back rows first; the kit's news runs from it outwards.
      all.push({ x, z, failed, stays: STILL_FAIL.includes(i), when: 0.45 + row * 0.2 + Math.abs(x) * 0.07, turn: TURN + Math.hypot(x - KIT_ON_LENS[0], z - KIT_ON_LENS[1]) * 0.09, cross: failed ? cross++ : -1, seed: i * 1.7 });
    }),
  );
  return all;
})();

/** A student: a body like a chess pawn and a round head. 0.95 tall, origin at the feet, facing +Z. */
function kidGeometry() {
  const profile: [number, number][] = [[0, 0], [0.21, 0], [0.235, 0.03], [0.235, 0.07], [0.2, 0.3], [0.15, 0.5], [0.12, 0.58], [0.06, 0.62], [0, 0.63]];
  return merged([new THREE.LatheGeometry(profile.map(([x, y]) => new THREE.Vector2(x, y)), 16), new THREE.SphereGeometry(0.19, 16, 12).translate(0, 0.77, 0)]);
}
/** Two eyes and a mouth on the head: a smile, or a frown with `sad`. */
function faceGeometry(sad: boolean) {
  const arc = 2;
  const mouth = new THREE.TorusGeometry(0.07, 0.013, 5, 10, arc).rotateZ(sad ? (Math.PI - arc) / 2 : Math.PI + (Math.PI - arc) / 2).translate(0, sad ? 0.665 : 0.775, 0.176);
  return merged([mouth, ...[-0.068, 0.068].map((x) => new THREE.SphereGeometry(0.024, 6, 5).translate(x, 0.805, 0.17))]);
}
/** What hangs over a head: a cross (failed) or a tick (passes now). */
const crossGeometry = () => merged([-1, 1].map((s) => new THREE.BoxGeometry(0.32, 0.075, 0.04).rotateZ((s * Math.PI) / 4).translate(0, 1.24, 0)));
const tickGeometry = () => merged([new THREE.BoxGeometry(0.15, 0.07, 0.04).rotateZ(-0.8).translate(-0.1, 1.19, 0), new THREE.BoxGeometry(0.3, 0.07, 0.04).rotateZ(0.95).translate(0.05, 1.25, 0)]);

export function Students() {
  const { play, mats } = useClay();
  const { inst } = useTones();
  const bodies = useRef<THREE.InstancedMesh>(null);
  const smiles = useRef<THREE.InstancedMesh>(null);
  const frowns = useRef<THREE.InstancedMesh>(null);
  const crosses = useRef<THREE.InstancedMesh>(null);
  const ticks = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => ({ kid: kidGeometry(), smile: faceGeometry(false), frown: faceGeometry(true), cross: crossGeometry(), tick: tickGeometry() }), []);
  useEffect(() => () => Object.values(geo).forEach((g) => g.dispose()), [geo]);
  // Who fails right now, as last painted: colours are only written when it changes.
  const painted = useRef<boolean[]>([]);
  useLayoutEffect(() => {
    painted.current = [];
    const ink = mats.shade.dark.color.clone().multiplyScalar(0.45); // the crosses: the darkest thing on the glass
    for (const [m, c] of [[smiles.current, mats.shade.dark.color], [frowns.current, mats.shade.dark.color], [crosses.current, ink], [ticks.current, mats.accent.color]] as const) {
      if (!m) continue;
      for (let i = 0; i < m.count; i++) m.setColorAt(i, c);
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }
  }, [mats, inst]);
  const o = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }) => {
    const b = bodies.current;
    const s = smiles.current;
    const f = frowns.current;
    const x = crosses.current;
    const v = ticks.current;
    if (!b || !s || !f || !x || !v) return;
    const here = at(play, RESULT);
    b.visible = s.visible = f.visible = x.visible = v.visible = here > 0.001;
    if (!b.visible) return;
    const arriving = play.to === RESULT;
    const age = ageOf(play, RESULT);
    const time = clock.elapsedTime;
    let repaint = false;
    for (let i = 0; i < KIDS.length; i++) {
      const k = KIDS[i];
      const up = KID_K * (arriving ? pop(slice(age, k.when, k.when + 0.3), 1.6) : ease(slice(here, 0.72, 1)));
      const turned = k.failed && !k.stays && age >= k.turn;
      const fails = k.failed && !turned;
      if (painted.current[i] !== fails) {
        painted.current[i] = fails;
        b.setColorAt(i, fails ? mats.shade.mat.color : mats.clay.color);
        repaint = true;
      }
      const since = age - k.turn;
      // Those who pass cannot keep still; those who pass now jump for it. Those who fail look at the floor.
      const hop = fails ? 0 : turned ? 0.3 * Math.abs(Math.sin(since * 5.2)) * Math.exp(-since * 1.6) + 0.03 : 0.04 * Math.max(0, Math.sin(time * 5 + k.seed * 3));
      o.position.set(LENS[0] + k.x, GLASS + hop, LENS[2] + k.z);
      o.rotation.set(fails ? 0.14 : -0.06, 0, fails ? 0 : 0.05 * Math.sin(time * 2.2 + k.seed));
      o.scale.setScalar(Math.max(up, HIDE));
      o.updateMatrix();
      b.setMatrixAt(i, o.matrix);
      if (k.failed) {
        // The mark over the head: the cross spins off and a tick pops in its place.
        const mark = spring(since, 2.4, 6);
        o.rotation.set(0, 0, 0);
        o.scale.setScalar(Math.max(up * (k.stays ? 1 : 1 - slice(since, 0, 0.12)), HIDE));
        o.updateMatrix();
        x.setMatrixAt(k.cross, o.matrix);
        o.scale.setScalar(Math.max(k.stays ? 0 : up * mark, HIDE));
        o.updateMatrix();
        v.setMatrixAt(k.cross, o.matrix);
        // Back to the body's pose for the face.
        o.rotation.set(fails ? 0.14 : -0.06, 0, fails ? 0 : 0.05 * Math.sin(time * 2.2 + k.seed));
        o.scale.setScalar(Math.max(fails ? up : 0, HIDE));
        o.updateMatrix();
        f.setMatrixAt(k.cross, o.matrix);
        o.scale.setScalar(Math.max(fails ? 0 : up, HIDE));
        o.updateMatrix();
      }
      s.setMatrixAt(i, o.matrix);
    }
    if (repaint && b.instanceColor) b.instanceColor.needsUpdate = true;
    b.instanceMatrix.needsUpdate = s.instanceMatrix.needsUpdate = f.instanceMatrix.needsUpdate = x.instanceMatrix.needsUpdate = v.instanceMatrix.needsUpdate = true;
  });
  return (
    <>
      <instancedMesh ref={bodies} args={[geo.kid, inst, KIDS.length]} castShadow receiveShadow frustumCulled={false} />
      <instancedMesh ref={smiles} args={[geo.smile, inst, KIDS.length]} frustumCulled={false} />
      <instancedMesh ref={frowns} args={[geo.frown, inst, FAILED.length]} frustumCulled={false} />
      <instancedMesh ref={crosses} args={[geo.cross, inst, FAILED.length]} castShadow frustumCulled={false} />
      <instancedMesh ref={ticks} args={[geo.tick, inst, FAILED.length]} castShadow frustumCulled={false} />
    </>
  );
}
/** The count of students reached, `p` into the story, as it reads on its label. */
export const counted = (p: Play) => Math.round(STUDENTS * ease(slice(ageOf(p, RESULT), COUNT[0], COUNT[1]))).toLocaleString('en-US');
/** Where a student stands, in the world: for the labels. */
export const kidAt = (i: number, y = 0): V3 => onLens(KIDS[i].x, KIDS[i].z, y);
