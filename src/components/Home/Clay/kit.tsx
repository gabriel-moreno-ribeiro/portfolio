// The clay kit: materials, step-keyed transforms, rounded primitives, arrows and labels.
// Everything a scene needs to tell a story in the same white-clay language.
import { Html, Line } from '@react-three/drei';
import { useFrame, type ThreeElements } from '@react-three/fiber';
import { createContext, useContext, useMemo, useRef, type ReactNode, type Ref } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { TagMark } from './TagMark';

export type V3 = [number, number, number];
/** One keyframe per step. `null` = hidden at that step (it shrinks where its nearest pose is). */
export type Pose = { p?: V3; r?: V3; s?: number | V3 } | null;

/**
 * Where the story is: holding on `to` (from === to), or `t` of the way from one step to another.
 * `age`: seconds since the story set off for `to` (every step is a small performance on that clock).
 * `was`: the age the step it is leaving had reached. `frozen`: the QA scripts hold the clock.
 */
export interface Play { from: number; to: number; t: number; age: number; was: number; frozen?: boolean }

export interface Mats {
  clay: THREE.MeshStandardMaterial;
  accent: THREE.MeshStandardMaterial;
  ink: THREE.MeshBasicMaterial;
  inkColor: string;
}

export function makeMats(dark: boolean): Mats {
  const inkColor = dark ? '#f1ebe4' : '#16120f';
  return {
    clay: new THREE.MeshStandardMaterial({ color: dark ? '#c4bcb4' : '#f3f1ee', roughness: 0.95, metalness: 0 }),
    accent: new THREE.MeshStandardMaterial({ color: '#f0732d', roughness: 0.85, metalness: 0 }),
    ink: new THREE.MeshBasicMaterial({ color: inkColor }),
    inkColor,
  };
}

export const ClayCtx = createContext<{ play: Play; mats: Mats; dark: boolean }>(null!);
export const useClay = () => useContext(ClayCtx);

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
/** Ease in, then overshoot a little and come back: things settle instead of stopping dead. */
export const settle = (t: number, k = 0.9) => {
  if (t < 0.5) return 4 * t * t * t;
  const u = 2 * t - 2;
  return (u * u * ((k + 1) * u + k) + 2) / 2;
};
/** Pop in past the target and relax. */
export const pop = (t: number, k = 1.5) => 1 + (k + 1) * Math.pow(t - 1, 3) + k * Math.pow(t - 1, 2);
/** A slice of the travel, 0..1. */
export const slice = (t: number, a: number, b: number) => clamp01((t - a) / (b - a));

/** A pulse: 0 at both ends of 0..1, 1 in the middle. */
export const bump = (t: number) => Math.sin(clamp01(t) * Math.PI);
/** 0 to 1 like a released spring: past the target and back, `f` swings a second, dying at `d`. */
export const spring = (t: number, f = 2.2, d = 5) => (t <= 0 ? 0 : 1 - Math.exp(-d * t) * Math.cos(t * f * Math.PI * 2));
/** A ring that dies out: 1 at t = 0, swinging `f` times a second around 0. */
export const ring = (t: number, f = 3, d = 3) => (t <= 0 ? 0 : Math.exp(-d * t) * Math.cos(t * f * Math.PI * 2));

/** How much of step `i` is on stage: 1 while it holds, sliding to 0 as the scene travels away. */
export const at = (p: Play, i: number) => (p.to === i ? (p.from === i ? 1 : p.t) : p.from === i ? 1 - p.t : 0);
/** The clock of step `i`'s performance: running while the story is on it, stopped where it was left. */
export const ageOf = (p: Play, i: number) => (p.to === i ? p.age : p.from === i ? p.was : 0);
/** Labels and arrows leave as soon as the scene moves, and come back only once things have landed (or `after` seconds into the step). */
export function shown(p: Play, on: number[], after = 0) {
  const a = on.includes(p.from);
  const b = on.includes(p.to);
  if (b) return (a ? 1 : slice(p.t, 0.8, 1)) * (after ? slice(p.age, after, after + 0.2) : 1);
  return a ? 1 - slice(p.t, 0, 0.15) : 0;
}

// ── Step-keyed transforms ────────────────────────────────────────────────────
interface Key { p: THREE.Vector3; q: THREE.Quaternion; s: THREE.Vector3 }
const HIDDEN = 1e-4;

export function resolveKeys(keys: Pose[]): Key[] {
  return keys.map((key, i) => {
    let k = key;
    // Hidden: borrow the nearest pose (the one before first) and shrink there.
    for (let d = 1; !k && d < keys.length; d++) k = keys[i - d] ?? keys[i + d] ?? null;
    const s = key ? (key.s ?? 1) : HIDDEN;
    return {
      p: new THREE.Vector3(...(k?.p ?? [0, 0, 0])),
      q: new THREE.Quaternion().setFromEuler(new THREE.Euler(...(k?.r ?? [0, 0, 0]))),
      s: typeof s === 'number' ? new THREE.Vector3(s || HIDDEN, s || HIDDEN, s || HIDDEN) : new THREE.Vector3(...s),
    };
  });
}

/** The slice of a travel in which a move plays, per pair of steps. */
export type Wins = (from: number, to: number) => [number, number] | undefined;
/** `wins({ '0>1': [0.3, 0.9] }, [0, 0.8])`: slices by "from>to", and one for every other travel. */
export function wins(table: Record<string, [number, number]>, rest?: [number, number]): Wins {
  const m = new Map(Object.entries(table).map(([k, v]) => [Number(k[0]) * 8 + Number(k[2]), v]));
  return (from, to) => m.get(from * 8 + to) ?? rest;
}

/** How a move plays: `win` staggers it, `arc` lifts it mid-way, `kick` is how far it shoots past its place, `twirl` turns it in flight, `bounce` squashes it on landing. */
export interface Move { win?: Wins; arc?: number; kick?: number; twirl?: number; bounce?: number }

/** Writes the pose for the current travel into `o`. */
export function applyKeys(o: THREE.Object3D, keys: Key[], play: Play, { win, arc = 0, kick = 0.9, twirl = 0, bounce = 0 }: Move = {}) {
  const a = keys[play.from];
  const b = keys[play.to];
  const w = win?.(play.from, play.to);
  const u = w ? slice(play.t, w[0], w[1]) : play.t;
  o.position.lerpVectors(a.p, b.p, settle(u, kick));
  if (arc) o.position.y += Math.sin(u * Math.PI) * arc;
  o.quaternion.slerpQuaternions(a.q, b.q, ease(u));
  // Arriving pops in past its size and relaxes; leaving just shrinks.
  o.scale.lerpVectors(a.s, b.s, a.s.x <= HIDDEN ? pop(u) : b.s.x <= HIDDEN ? ease(u) : settle(u));
  if (a !== b && u < 1) {
    if (twirl) o.rotateY((1 - ease(u)) * twirl * Math.PI * 2);
    // It lands like clay: flatter and wider for a moment.
    const land = bump(slice(u, 0.8, 1)) * bounce;
    o.scale.y *= 1 - land;
    o.scale.x *= 1 + land * 0.5;
    o.scale.z *= 1 + land * 0.5;
  }
  o.visible = o.scale.x > HIDDEN * 10;
}

export function Morph({ k, children, ...move }: { k: Pose[]; children: ReactNode } & Move) {
  const { play } = useClay();
  const ref = useRef<THREE.Group>(null);
  const keys = useMemo(() => resolveKeys(k), [k]);
  useFrame(() => ref.current && applyKeys(ref.current, keys, play, move));
  return <group ref={ref}>{children}</group>;
}

/** A group whose transform is written every frame by `f`: where the small performances live. `time` is the idle clock. */
export function Act({ f, children, ...props }: { f: (g: THREE.Group, play: Play, time: number) => void; children?: ReactNode } & Omit<ThreeElements['group'], 'ref'>) {
  const { play } = useClay();
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => ref.current && f(ref.current, play, clock.elapsedTime));
  return (
    <group ref={ref} {...props}>
      {children}
    </group>
  );
}

// ── Rounded primitives ──────────────────────────────────────────────────────
type MeshProps = Omit<ThreeElements['mesh'], 'args' | 'ref'> & { ref?: Ref<THREE.Mesh> };

// One geometry per size, shared by every box of that size and by both scenes. drei's RoundedBox
// extruded and recomputed normals for each of the ~100 boxes on mount, freezing the page for ~1 s.
const boxes = new Map<string, THREE.BufferGeometry>();
function boxGeometry([w, h, d]: V3, r: number) {
  const key = `${w},${h},${d},${r}`;
  let g = boxes.get(key);
  if (!g) boxes.set(key, (g = new RoundedBoxGeometry(w, h, d, 3, r)));
  return g;
}

export function Box({ size, r, accent, ...props }: { size: V3; r?: number; accent?: boolean } & MeshProps) {
  const { mats } = useClay();
  const radius = Math.min(r ?? 0.04, Math.min(...size) / 2 - 0.001);
  return (
    <mesh geometry={boxGeometry(size, radius)} castShadow receiveShadow material={accent ? mats.accent : mats.clay} {...props} />
  );
}

/** A cylinder with rounded rims, axis along Y. `hole` makes it a tube (open, with an inner wall). */
export function puckGeometry(r: number, h: number, bevel = Math.min(r, h / 2) * 0.35, segments = 40, hole = 0) {
  const b = Math.min(bevel, r - hole, h / 2);
  const pts = [new THREE.Vector2(hole, -h / 2)];
  for (let i = 0; i <= 6; i++) {
    const a = -Math.PI / 2 + (i / 6) * (Math.PI / 2);
    pts.push(new THREE.Vector2(r - b + Math.cos(a) * b, -h / 2 + b + Math.sin(a) * b));
  }
  for (let i = 0; i <= 6; i++) {
    const a = (i / 6) * (Math.PI / 2);
    pts.push(new THREE.Vector2(r - b + Math.cos(a) * b, h / 2 - b + Math.sin(a) * b));
  }
  pts.push(new THREE.Vector2(hole, h / 2));
  if (hole) pts.push(new THREE.Vector2(hole, -h / 2));
  return new THREE.LatheGeometry(pts, segments);
}

const pucks = new Map<string, THREE.BufferGeometry>();
export function Puck({ r, h, bevel, segments, hole, accent, ...props }: { r: number; h: number; bevel?: number; segments?: number; hole?: number; accent?: boolean } & MeshProps) {
  const { mats } = useClay();
  // Like Box: one geometry per shape, shared (the laptop's screws alone are 20 of the same pucks).
  const key = `${r},${h},${bevel},${segments},${hole}`;
  let geo = pucks.get(key);
  if (!geo) pucks.set(key, (geo = puckGeometry(r, h, bevel, segments, hole)));
  return <mesh geometry={geo} castShadow receiveShadow material={accent ? mats.accent : mats.clay} {...props} />;
}

/** A flat outline extruded with a soft bevel (jaws, gussets, slotted discs). Lies in XY, depth along Z. */
export function Slab({ shape, depth, bevel = 0.012, accent, ...props }: { shape: THREE.Shape; depth: number; bevel?: number; accent?: boolean } & MeshProps) {
  const { mats } = useClay();
  const geo = useMemo(
    () => new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 3, curveSegments: 24 }),
    [shape, depth, bevel],
  );
  return <mesh geometry={geo} castShadow receiveShadow material={accent ? mats.accent : mats.clay} {...props} />;
}

/** A round rod along a path (hooks, handles, springs, cables). */
export function Rod({ path, r, segments = 48, accent, ...props }: { path: THREE.Curve<THREE.Vector3>; r: number; segments?: number; accent?: boolean } & MeshProps) {
  const { mats } = useClay();
  const geo = useMemo(() => new THREE.TubeGeometry(path, segments, r, 8), [path, r, segments]);
  return <mesh geometry={geo} castShadow receiveShadow material={accent ? mats.accent : mats.clay} {...props} />;
}

/** A row of small raised marks (ruler ticks): `n` boxes from `a` to `b`, every `major`-th one longer along axis `along`. */
export function Ticks({ n, a, b, size, major = 5, grow = 1.8, along = 1 }: { n: number; a: V3; b: V3; size: V3; major?: number; grow?: number; along?: 0 | 1 | 2 }) {
  const { mats } = useClay();
  const geo = useMemo(() => new THREE.BoxGeometry(...size), [size]);
  // Static: laid out when the mesh exists.
  const lay = (m: THREE.InstancedMesh | null) => {
    if (!m) return;
    const o = new THREE.Object3D();
    for (let i = 0; i < n; i++) {
      const t = n > 1 ? i / (n - 1) : 0;
      const long = i % major === 0 ? grow : 1;
      o.position.set(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t);
      o.position.setComponent(along, o.position.getComponent(along) - (size[along] * (long - 1)) / 2);
      o.scale.set(1, 1, 1).setComponent(along, long);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  };
  return <instancedMesh ref={lay} args={[geo, mats.clay, n]} />;
}

/** A result bar: it grows in when the story reaches step `on`. */
export function Bar({ p, w = 1, h, accent, on, delay = 0 }: { p: V3; w?: number; h: number; accent?: boolean; on: number; delay?: number }) {
  const { play } = useClay();
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    const here = at(play, on);
    const grow = play.to === on ? pop(slice(here, 0.2 + delay, 0.65 + delay), 1.4) : ease(slice(here, 0.6, 1));
    g.visible = grow > 0.001;
    g.scale.set(Math.min(grow, 1), grow, Math.min(grow, 1));
  });
  return (
    <group ref={ref} position={p}>
      <Box accent={accent} size={[w, h, w]} r={0.05} position={[0, h / 2, 0]} />
    </group>
  );
}

/** Thickness of a chart's base plate: bars stand at this height. */
export const PLATE = 0.08;
/**
 * What a result stands on: a base plate and a back board ruled like graph paper, `rules` raised
 * lines from the plate up to `top` (every `major`-th one heavier). Origin on the floor, centre of the plate.
 */
export function Chart({ w, h, d = 1.5, rules, top, major = 2 }: { w: number; h: number; d?: number; rules?: number; top?: number; major?: number }) {
  const z = -d / 2 + 0.04;
  const size = useMemo<V3>(() => [w - 0.2, 0.014, 0.02], [w]);
  return (
    <group>
      <Box size={[w, PLATE, d]} position={[0, PLATE / 2, 0]} r={0.035} />
      <Box size={[w, h, 0.08]} position={[0, h / 2 + 0.02, z]} r={0.035} />
      {rules && <Ticks n={rules} a={[0, PLATE, z + 0.045]} b={[0, PLATE + (top ?? h), z + 0.045]} size={size} major={major} grow={2.2} along={1} />}
    </group>
  );
}

// ── Arrows and labels ───────────────────────────────────────────────────────
const UP = new THREE.Vector3(0, 1, 0);
/** Annotations: drawn over the clay, but they cast nothing and take no part in the occlusion pass. */
const OVERLAY = { overlay: true };

/** Thin dashed arrow a -> b, bowed by `lift` (up) and `bend` (sideways). Its dashes march the way it points. */
export function Arrow({ a, b, lift = 0.5, bend, on, after, head = true }: { a: V3; b: V3; lift?: number; bend?: V3; on: number[]; after?: number; head?: boolean }) {
  const { play, mats } = useClay();
  const group = useRef<THREE.Group>(null);
  const line = useRef<THREE.Mesh>(null);
  const cone = useRef<THREE.Mesh>(null);
  const { points, quat } = useMemo(() => {
    const va = new THREE.Vector3(...a);
    const vb = new THREE.Vector3(...b);
    const mid = va.clone().add(vb).multiplyScalar(0.5).add(new THREE.Vector3(bend?.[0] ?? 0, lift + (bend?.[1] ?? 0), bend?.[2] ?? 0));
    const curve = new THREE.QuadraticBezierCurve3(va, mid, vb);
    const dir = curve.getTangent(1).normalize();
    // The dashes stop where the head starts.
    const pts = curve.getPoints(28).filter((p) => !head || p.distanceTo(vb) > 0.16);
    return { points: pts, quat: new THREE.Quaternion().setFromUnitVectors(UP, dir) };
  }, [a, b, lift, bend, head]);

  useFrame((_, dt) => {
    const o = shown(play, on, after);
    if (!group.current) return;
    group.current.visible = o > 0.01;
    const m = line.current?.material as (THREE.Material & { dashOffset: number }) | undefined;
    if (m) {
      m.opacity = o;
      m.dashOffset -= dt * 0.42;
    }
    cone.current?.scale.setScalar(Math.max(o, 0.001));
  });

  return (
    <group ref={group} userData={OVERLAY}>
      <Line ref={line as never} points={points} color={mats.inkColor} lineWidth={1.6} dashed dashSize={0.12} gapSize={0.09} transparent layers={1} />
      {head && (
        <mesh ref={cone} position={b} quaternion={quat} material={mats.ink} layers={1}>
          <coneGeometry args={[0.06, 0.19, 12]} />
        </mesh>
      )}
    </group>
  );
}

/** Uppercase mono label in real HTML, pinned to a 3D anchor with a 1px leader. Offsets are px at an 890px-wide stage. */
export function Tag({ at: anchor, dx = 0, dy = -44, on, after, children }: { at: V3; dx?: number; dy?: number; on: number[]; after?: number; children: string }) {
  const { play } = useClay();
  const ref = useRef<HTMLDivElement>(null);
  useFrame(() => {
    if (ref.current) ref.current.style.opacity = shown(play, on, after).toFixed(3);
  });
  return (
    <Html position={anchor} zIndexRange={[4, 0]} style={{ pointerEvents: 'none' }}>
      <div ref={ref} className="clay-tag" style={{ opacity: 0 }} data-dx={dx} data-dy={dy}>
        <TagMark dx={dx} dy={dy}>{children}</TagMark>
      </div>
    </Html>
  );
}

/** A measuring bracket (line with end ticks) with a centred label over it, or under it with `below` (for one lying on the floor). */
export function Bracket({ a, b, on, after, below, children }: { a: V3; b: V3; on: number[]; after?: number; below?: boolean; children: string }) {
  const { play, mats } = useClay();
  const group = useRef<THREE.Group>(null);
  const tick = below ? -0.14 : 0.14;
  const points = useMemo<V3[]>(() => [[a[0], a[1] - tick, a[2]], a, b, [b[0], b[1] - tick, b[2]]], [a, b, tick]);
  useFrame(() => {
    if (group.current) group.current.visible = shown(play, on, after) > 0.5;
  });
  return (
    <>
      <group ref={group} userData={OVERLAY}>
        <Line points={points} color={mats.inkColor} lineWidth={1} layers={1} />
      </group>
      <Tag at={[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]} dx={0} dy={below ? 10 : -10} on={on} after={after}>
        {children}
      </Tag>
    </>
  );
}

/** A camera position per step. With `to`, the camera travels there while the step plays (a push-in on its key moment), over the `over` seconds. */
export interface Shot { pos: V3; look: V3; to?: { pos: V3; look: V3 }; over?: [number, number] }

/** Camera keyed per step. It never stops: a slow orbit and breath keep the frame alive while a step holds. */
export function Rig({ k }: { k: Shot[] }) {
  const { play } = useClay();
  const keys = useMemo(
    () =>
      k.map((c) => ({
        pos: new THREE.Vector3(...c.pos),
        look: new THREE.Vector3(...c.look),
        pos2: new THREE.Vector3(...(c.to ?? c).pos),
        look2: new THREE.Vector3(...(c.to ?? c).look),
        over: c.over ?? [0.5, 2.6],
      })),
    [k],
  );
  const tmp = useMemo(() => ({ look: new THREE.Vector3(), arm: new THREE.Vector3(), a: new THREE.Vector3(), b: new THREE.Vector3() }), []);
  useFrame(({ camera, clock }) => {
    const f = ease(play.t);
    const t = clock.elapsedTime;
    const { look, arm, a, b } = tmp;
    const from = keys[play.from];
    const to = keys[play.to];
    // Each end is where its own step's move has got to, so the travel starts exactly where the camera was.
    const fa = ease(slice(play.was, from.over[0], from.over[1]));
    const fb = ease(slice(play.age, to.over[0], to.over[1]));
    look.lerpVectors(a.lerpVectors(from.look, from.look2, fa), b.lerpVectors(to.look, to.look2, fb), f);
    camera.position.lerpVectors(a.lerpVectors(from.pos, from.pos2, fa), b.lerpVectors(to.pos, to.pos2, fb), f);
    // Orbit a few degrees around what it looks at, and push in and out a touch.
    arm.subVectors(camera.position, look).applyAxisAngle(UP, Math.sin(t * 0.19) * 0.05).multiplyScalar(1 + Math.sin(t * 0.13) * 0.018);
    camera.position.addVectors(look, arm);
    camera.position.y += Math.sin(t * 0.23) * 0.05;
    camera.lookAt(look);
  });
  return null;
}
