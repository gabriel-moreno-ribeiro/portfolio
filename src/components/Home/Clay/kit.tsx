// The clay kit: materials, step-keyed transforms, rounded primitives, arrows and labels.
// Everything a scene needs to tell a story in the same white-clay language.
import { Html, Line, RoundedBox } from '@react-three/drei';
import { useFrame, type ThreeElements } from '@react-three/fiber';
import { createContext, useContext, useMemo, useRef, type ReactNode, type Ref, type RefObject } from 'react';
import * as THREE from 'three';

export type V3 = [number, number, number];
/** One keyframe per step. `null` = hidden at that step (it shrinks where its nearest pose is). */
export type Pose = { p?: V3; r?: V3; s?: number | V3 } | null;

export interface Mats {
  clay: THREE.MeshStandardMaterial;
  accent: THREE.MeshStandardMaterial;
  ink: THREE.MeshBasicMaterial;
  inkColor: string;
}

export function makeMats(dark: boolean): Mats {
  const inkColor = dark ? '#f1ebe4' : '#16120f';
  return {
    clay: new THREE.MeshStandardMaterial({ color: dark ? '#8d857d' : '#f3f1ee', roughness: 0.95, metalness: 0 }),
    accent: new THREE.MeshStandardMaterial({ color: '#f0732d', roughness: 0.85, metalness: 0 }),
    ink: new THREE.MeshBasicMaterial({ color: inkColor }),
    inkColor,
  };
}

export const ClayCtx = createContext<{ step: RefObject<number>; mats: Mats; dark: boolean }>(null!);
export const useClay = () => useContext(ClayCtx);

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
/** 1 while a step holds, fading as the scene travels away from it. */
export const near = (step: number, index: number, sharp = 3.2) => clamp01(1 - Math.abs(step - index) * sharp);
export const nearAny = (step: number, on: number[], sharp?: number) =>
  on.reduce((o, i) => Math.max(o, near(step, i, sharp)), 0);

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

/** The slice of a travel in which a move plays: one for every travel, or one per travel (`undefined` = all of it). */
export type Win = [number, number] | ([number, number] | undefined)[];

/** Writes the pose for `step` into `o`. `win` staggers the move; `arc` lifts it mid-way. */
export function applyKeys(o: THREE.Object3D, keys: Key[], step: number, win?: Win, arc = 0) {
  const i = Math.min(Math.max(Math.floor(step), 0), keys.length - 2);
  let f = clamp01(step - i);
  const w = win && (typeof win[0] === 'number' ? (win as [number, number]) : (win as ([number, number] | undefined)[])[i]);
  if (w) f = clamp01((f - w[0]) / (w[1] - w[0]));
  f = ease(f);
  const a = keys[i];
  const b = keys[i + 1];
  o.position.lerpVectors(a.p, b.p, f);
  if (arc) o.position.y += Math.sin(f * Math.PI) * arc;
  o.quaternion.slerpQuaternions(a.q, b.q, f);
  o.scale.lerpVectors(a.s, b.s, f);
  o.visible = o.scale.x > HIDDEN * 10;
}

export function Morph({ k, win, arc, children }: { k: Pose[]; win?: Win; arc?: number; children: ReactNode }) {
  const { step } = useClay();
  const ref = useRef<THREE.Group>(null);
  const keys = useMemo(() => resolveKeys(k), [k]);
  useFrame(() => ref.current && applyKeys(ref.current, keys, step.current, win, arc));
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

/** A flat outline extruded with a soft bevel (jaws, gussets, track rings). Lies in XY, depth along Z. */
export function Slab({ shape, depth, bevel = 0.012, accent, ...props }: { shape: THREE.Shape; depth: number; bevel?: number; accent?: boolean } & MeshProps) {
  const { mats } = useClay();
  const geo = useMemo(
    () => new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 3, curveSegments: 24 }),
    [shape, depth, bevel],
  );
  return <mesh geometry={geo} castShadow receiveShadow material={accent ? mats.accent : mats.clay} {...props} />;
}

/**
 * A result bar for the last step: it grows in on the way there. With `from`, it arrives that
 * tall and comes down to `h` (the "before" becoming the "after").
 */
export function Bar({ p, w = 1, h, from, accent, delay = 0 }: { p: V3; w?: number; h: number; from?: number; accent?: boolean; delay?: number }) {
  const { step } = useClay();
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    const g = ref.current;
    if (!g) return;
    // shortcut: assumes five steps with the bars on the last one; take the step as a prop when a story differs.
    const f = step.current - 3;
    const grow = ease(clamp01((f - 0.3 - delay) / 0.3));
    const tall = from ? from / h + (1 - from / h) * ease(clamp01((f - 0.66 - delay) / 0.3)) : 1;
    g.visible = grow > 0.001;
    g.scale.set(grow, grow * tall, grow);
  });
  return (
    <group ref={ref} position={p}>
      <Box accent={accent} size={[w, h, w]} r={0.09} position={[0, h / 2, 0]} />
    </group>
  );
}

// ── Arrows and labels ───────────────────────────────────────────────────────
const UP = new THREE.Vector3(0, 1, 0);

/** Thin dashed arrow a -> b, bowed by `lift` (up) and `bend` (sideways, world X/Z). Shown while the scene is near the steps in `on`. */
export function Arrow({ a, b, lift = 0.5, bend, on, head = true }: { a: V3; b: V3; lift?: number; bend?: V3; on: number[]; head?: boolean }) {
  const { step, mats } = useClay();
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
    const pts = curve.getPoints(28).filter((p) => !head || p.distanceTo(vb) > 0.14);
    return { points: pts, quat: new THREE.Quaternion().setFromUnitVectors(UP, dir) };
  }, [a, b, lift, bend, head]);

  useFrame((_, dt) => {
    const o = nearAny(step.current, on);
    if (!group.current) return;
    group.current.visible = o > 0.01;
    const m = line.current?.material as (THREE.Material & { dashOffset: number }) | undefined;
    if (m) {
      m.opacity = o;
      m.dashOffset -= dt * 0.22; // the dashes crawl the way the arrow points
    }
    cone.current?.scale.setScalar(Math.max(o, 0.001));
  });

  return (
    <group ref={group}>
      <Line ref={line as never} points={points} color={mats.inkColor} lineWidth={1.5} dashed dashSize={0.11} gapSize={0.085} transparent />
      {head && (
        <mesh ref={cone} position={b} quaternion={quat} material={mats.ink}>
          <coneGeometry args={[0.055, 0.17, 12]} />
        </mesh>
      )}
    </group>
  );
}

/** Uppercase mono label in real HTML, pinned to a 3D anchor with a 1px leader. Offsets are px at an 890px-wide stage. */
export function Tag({ at, dx = 0, dy = -44, on, children }: { at: V3; dx?: number; dy?: number; on: number[]; children: ReactNode }) {
  const { step } = useClay();
  const ref = useRef<HTMLDivElement>(null);
  useFrame(() => {
    if (ref.current) ref.current.style.opacity = nearAny(step.current, on).toFixed(3);
  });
  const u = (px: number) => `${(px / 8.9).toFixed(3)}cqw`;
  return (
    <Html position={at} zIndexRange={[4, 0]} style={{ pointerEvents: 'none' }}>
      <div ref={ref} className="clay-tag" style={{ opacity: 0 }}>
        {(dx !== 0 || dy !== 0) && <i style={{ width: u(Math.hypot(dx, dy)), transform: `rotate(${Math.atan2(dy, dx)}rad)` }} />}
        <span style={{ left: u(dx), top: u(dy), transform: `translate(-50%, ${dy < 0 ? '-100%' : dy > 0 ? '0' : '-50%'})` }}>{children}</span>
      </div>
    </Html>
  );
}

/** A measuring bracket (line with end ticks) with a centred label over it. */
export function Bracket({ a, b, on, children }: { a: V3; b: V3; on: number[]; children: ReactNode }) {
  const { step, mats } = useClay();
  const group = useRef<THREE.Group>(null);
  const tick = 0.12;
  const points = useMemo<V3[]>(() => [[a[0], a[1] - tick, a[2]], a, b, [b[0], b[1] - tick, b[2]]], [a, b]);
  useFrame(() => {
    if (group.current) group.current.visible = nearAny(step.current, on) > 0.5;
  });
  return (
    <>
      <group ref={group}>
        <Line points={points} color={mats.inkColor} lineWidth={1} />
      </group>
      <Tag at={[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]} dx={0} dy={-10} on={on}>
        {children}
      </Tag>
    </>
  );
}

/** Camera keyed per step, with a slow drift so the frame is never dead. */
export function Rig({ k }: { k: { pos: V3; look: V3 }[] }) {
  const { step } = useClay();
  const keys = useMemo(() => k.map((c) => ({ pos: new THREE.Vector3(...c.pos), look: new THREE.Vector3(...c.look) })), [k]);
  const look = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ camera, clock }) => {
    const s = step.current;
    const i = Math.min(Math.floor(s), keys.length - 2);
    const f = ease(clamp01(s - i));
    const t = clock.elapsedTime;
    camera.position.lerpVectors(keys[i].pos, keys[i + 1].pos, f);
    camera.position.x += Math.sin(t * 0.21) * 0.16;
    camera.position.y += Math.cos(t * 0.17) * 0.07;
    look.lerpVectors(keys[i].look, keys[i + 1].look, f);
    camera.lookAt(look);
  });
  return null;
}
