// The clay kit: materials, step-keyed transforms, rounded primitives, arrows and labels.
// Everything a scene needs to tell a story in the same white-clay language.
import { Html, Line, RoundedBox } from '@react-three/drei';
import { useFrame, type ThreeElements } from '@react-three/fiber';
import { createContext, useContext, useMemo, useRef, type ReactNode, type Ref } from 'react';
import * as THREE from 'three';
import { TagMark } from './TagMark';

export type V3 = [number, number, number];
/** One keyframe per step. `null` = hidden at that step (it shrinks where its nearest pose is). */
export type Pose = { p?: V3; r?: V3; s?: number | V3 } | null;

/** Where the story is: holding on `to` (from === to), or `t` of the way from one step to another. */
export interface Play { from: number; to: number; t: number }

export interface Mats {
  clay: THREE.MeshStandardMaterial;
  accent: THREE.MeshStandardMaterial;
  ink: THREE.MeshBasicMaterial;
  inkColor: string;
}

export function makeMats(dark: boolean): Mats {
  const inkColor = dark ? '#f1ebe4' : '#16120f';
  return {
    clay: new THREE.MeshStandardMaterial({ color: dark ? '#9a9189' : '#f3f1ee', roughness: 0.95, metalness: 0 }),
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

/** How much of step `i` is on stage: 1 while it holds, sliding to 0 as the scene travels away. */
export const at = (p: Play, i: number) => (p.to === i ? (p.from === i ? 1 : p.t) : p.from === i ? 1 - p.t : 0);
/** Labels and arrows leave as soon as the scene moves, and come back only once things have landed. */
export function shown(p: Play, on: number[]) {
  const a = on.includes(p.from);
  const b = on.includes(p.to);
  if (a && b) return 1;
  if (b) return slice(p.t, 0.8, 1);
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

/** Writes the pose for the current travel into `o`. `win` staggers the move; `arc` lifts it mid-way. */
export function applyKeys(o: THREE.Object3D, keys: Key[], play: Play, win?: Wins, arc = 0) {
  const a = keys[play.from];
  const b = keys[play.to];
  const w = win?.(play.from, play.to);
  const u = w ? slice(play.t, w[0], w[1]) : play.t;
  o.position.lerpVectors(a.p, b.p, settle(u));
  if (arc) o.position.y += Math.sin(u * Math.PI) * arc;
  o.quaternion.slerpQuaternions(a.q, b.q, ease(u));
  // Arriving pops in past its size and relaxes; leaving just shrinks.
  o.scale.lerpVectors(a.s, b.s, a.s.x <= HIDDEN ? pop(u) : b.s.x <= HIDDEN ? ease(u) : settle(u));
  o.visible = o.scale.x > HIDDEN * 10;
}

export function Morph({ k, win, arc, children }: { k: Pose[]; win?: Wins; arc?: number; children: ReactNode }) {
  const { play } = useClay();
  const ref = useRef<THREE.Group>(null);
  const keys = useMemo(() => resolveKeys(k), [k]);
  useFrame(() => ref.current && applyKeys(ref.current, keys, play, win, arc));
  return <group ref={ref}>{children}</group>;
}

// ── Rounded primitives ──────────────────────────────────────────────────────
type MeshProps = Omit<ThreeElements['mesh'], 'args' | 'ref'> & { ref?: Ref<THREE.Mesh> };

export function Box({ size, r, accent, ...props }: { size: V3; r?: number; accent?: boolean } & MeshProps) {
  const { mats } = useClay();
  const radius = Math.min(r ?? 0.04, Math.min(...size) / 2 - 0.001);
  return (
    <RoundedBox args={size} radius={radius} smoothness={4} castShadow receiveShadow material={accent ? mats.accent : mats.clay} {...props} />
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

export function Puck({ r, h, bevel, segments, hole, accent, ...props }: { r: number; h: number; bevel?: number; segments?: number; hole?: number; accent?: boolean } & MeshProps) {
  const { mats } = useClay();
  const geo = useMemo(() => puckGeometry(r, h, bevel, segments, hole), [r, h, bevel, segments, hole]);
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

/**
 * A result bar: it grows in when the story reaches step `on`. With `from`, it arrives that
 * tall and comes down to `h` (the "before" becoming the "after"). It breathes while it holds.
 */
export function Bar({ p, w = 1, h, from, accent, on, delay = 0 }: { p: V3; w?: number; h: number; from?: number; accent?: boolean; on: number; delay?: number }) {
  const { play } = useClay();
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g) return;
    const here = at(play, on);
    const arriving = play.to === on;
    const grow = arriving ? pop(slice(here, 0.25 + delay, 0.6 + delay), 1.1) : ease(slice(here, 0.6, 1));
    const tall = from && arriving ? from / h + (1 - from / h) * settle(slice(here, 0.6 + delay, 0.98)) : 1;
    const breath = 1 + Math.sin(clock.elapsedTime * 1.6 + p[0]) * 0.012 * slice(here, 0.95, 1);
    g.visible = grow > 0.001;
    g.scale.set(grow, grow * tall * breath, grow);
  });
  return (
    <group ref={ref} position={p}>
      <Box accent={accent} size={[w, h, w]} r={0.1} position={[0, h / 2, 0]} />
    </group>
  );
}

// ── Arrows and labels ───────────────────────────────────────────────────────
const UP = new THREE.Vector3(0, 1, 0);
/** Annotations: drawn over the clay, but they cast nothing and take no part in the occlusion pass. */
const OVERLAY = { overlay: true };

/** Thin dashed arrow a -> b, bowed by `lift` (up) and `bend` (sideways). Its dashes march the way it points. */
export function Arrow({ a, b, lift = 0.5, bend, on, head = true }: { a: V3; b: V3; lift?: number; bend?: V3; on: number[]; head?: boolean }) {
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
    const o = shown(play, on);
    if (!group.current) return;
    group.current.visible = o > 0.01;
    const m = line.current?.material as (THREE.Material & { dashOffset: number }) | undefined;
    if (m) {
      m.opacity = o;
      m.dashOffset -= dt * 0.3;
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
export function Tag({ at: anchor, dx = 0, dy = -44, on, children }: { at: V3; dx?: number; dy?: number; on: number[]; children: string }) {
  const { play } = useClay();
  const ref = useRef<HTMLDivElement>(null);
  useFrame(() => {
    if (ref.current) ref.current.style.opacity = shown(play, on).toFixed(3);
  });
  return (
    <Html position={anchor} zIndexRange={[4, 0]} style={{ pointerEvents: 'none' }}>
      <div ref={ref} className="clay-tag" style={{ opacity: 0 }} data-dx={dx} data-dy={dy}>
        <TagMark dx={dx} dy={dy}>{children}</TagMark>
      </div>
    </Html>
  );
}

/** A measuring bracket (line with end ticks) with a centred label over it. */
export function Bracket({ a, b, on, children }: { a: V3; b: V3; on: number[]; children: string }) {
  const { play, mats } = useClay();
  const group = useRef<THREE.Group>(null);
  const tick = 0.14;
  const points = useMemo<V3[]>(() => [[a[0], a[1] - tick, a[2]], a, b, [b[0], b[1] - tick, b[2]]], [a, b]);
  useFrame(() => {
    if (group.current) group.current.visible = shown(play, on) > 0.5;
  });
  return (
    <>
      <group ref={group} userData={OVERLAY}>
        <Line points={points} color={mats.inkColor} lineWidth={1} layers={1} />
      </group>
      <Tag at={[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]} dx={0} dy={-10} on={on}>
        {children}
      </Tag>
    </>
  );
}

/** Camera keyed per step. It never stops: a slow orbit and breath keep the frame alive while a step holds. */
export function Rig({ k }: { k: { pos: V3; look: V3 }[] }) {
  const { play } = useClay();
  const keys = useMemo(() => k.map((c) => ({ pos: new THREE.Vector3(...c.pos), look: new THREE.Vector3(...c.look) })), [k]);
  const tmp = useMemo(() => ({ look: new THREE.Vector3(), arm: new THREE.Vector3() }), []);
  useFrame(({ camera, clock }) => {
    const f = ease(play.t);
    const t = clock.elapsedTime;
    const { look, arm } = tmp;
    look.lerpVectors(keys[play.from].look, keys[play.to].look, f);
    camera.position.lerpVectors(keys[play.from].pos, keys[play.to].pos, f);
    // Orbit a few degrees around what it looks at, and push in and out a touch.
    arm.subVectors(camera.position, look).applyAxisAngle(UP, Math.sin(t * 0.19) * 0.05).multiplyScalar(1 + Math.sin(t * 0.13) * 0.018);
    camera.position.addVectors(look, arm);
    camera.position.y += Math.sin(t * 0.23) * 0.05;
    camera.lookAt(look);
  });
  return null;
}
