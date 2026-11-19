// Where the kits went and what changed: Bahia and Ceará on the map of Brazil with a flag per school,
// and two classes of ten students, before the kit and after it.
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { MAP_H, MAP_W, STATES } from './brazilMap';
import { useTones } from './CandelaParts';
import { ageOf, at, Box, ease, pop, settle, slice, spring, useClay, type Play, type V3 } from './kit';

const HALF_PI = Math.PI / 2;
const lerp = THREE.MathUtils.lerp;

// ── 28 public schools, Bahia and Ceará ──────────────────────────────────────
export const REACH = 3; // the step
const K = 0.034; // world units per map unit
const MAP_AT: V3 = [-0.9, 0, 0.1];
const H = 0.09; // the country
const CAP = 0.05; // Bahia and Ceará rise this much, in orange
/** A point of the map (brazilMap's units), in the world. */
export const onMap = (x: number, y: number, h = 0): V3 => [MAP_AT[0] + (x - MAP_W / 2) * K, h, MAP_AT[2] + (y - MAP_H / 2) * K];
// The scene shows 17 flags in Bahia and 11 in Ceará, as it did before this version. The split is not
// in the site's content (only the total of 28 is), so no label prints it.
const LIT: [string, number][] = [['BA', 17], ['CE', 11]];
export const SCHOOLS = 28;
/** When the kit for school `k` lands, seconds into the step. */
export const landAt = (k: number) => 1.05 + k * 0.058;

/** A state's outline (an `M x y l dx dy … z` path) as points in map units. */
function outline(d: string) {
  const n = (d.match(/-?(?:\d+\.?\d*|\.\d+)/g) ?? []).map(Number);
  const pts: [number, number][] = [[n[0], n[1]]];
  for (let i = 2; i + 1 < n.length; i += 2) pts.push([pts[pts.length - 1][0] + n[i], pts[pts.length - 1][1] + n[i + 1]]);
  return pts;
}
const inside = (pts: [number, number][], x: number, y: number) => {
  let hit = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
};
/** `n` places inside a state, evenly apart and clear of its border, the southernmost first. */
function spots(pts: [number, number][], n: number) {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const clear = 2.2;
  for (let pitch = 16; pitch > 2; pitch -= 0.25) {
    const found: [number, number][] = [];
    for (let row = 0, y = y0 + pitch / 2; y < y1; y += pitch * 0.866, row++)
      for (let x = x0 + (row % 2 ? pitch : pitch / 2); x < x1; x += pitch) {
        let ok = true;
        for (let a = 0; a < 6 && ok; a++) ok = inside(pts, x + Math.cos(a * 1.047) * clear, y + Math.sin(a * 1.047) * clear);
        if (ok) found.push([x, y]);
      }
    if (found.length >= n) return found.sort((a, b) => b[1] - a[1]).slice(0, n);
  }
  return [];
}
const extrude = (pts: [number, number][], depth: number, b: number) => {
  const s = new THREE.Shape();
  pts.forEach(([x, y], i) => (i ? s.lineTo((x - MAP_W / 2) * K, -(y - MAP_H / 2) * K) : s.moveTo((x - MAP_W / 2) * K, -(y - MAP_H / 2) * K)));
  const g = new THREE.ExtrudeGeometry(s, { depth: depth - 2 * b, bevelEnabled: true, bevelSize: b, bevelThickness: b, bevelOffset: -b, bevelSegments: 1 });
  g.rotateX(-HALF_PI);
  g.translate(0, b, 0);
  return g;
};

// Built once per page, a few states at a time in idle moments after the stage mounts (the map is
// only on stage at the fourth step); the country waits for it.
type MapGeos = { base: THREE.BufferGeometry; caps: THREE.BufferGeometry[]; places: V3[] };
let mapGeos: MapGeos | undefined;
let building: Promise<MapGeos> | undefined;
function buildMap(): Promise<MapGeos> {
  if (mapGeos) return Promise.resolve(mapGeos);
  if (!building) {
    building = new Promise((resolve) => {
      const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 16));
      const parts: THREE.BufferGeometry[] = [];
      const work = () => {
        const t0 = performance.now();
        while (performance.now() - t0 < 5 && parts.length < STATES.length) parts.push(extrude(outline(STATES[parts.length].d), H, 0.006));
        if (parts.length < STATES.length) return void idle(work);
        const base = mergeGeometries(parts)!;
        parts.forEach((g) => g.dispose());
        const lit = LIT.map(([uf]) => outline(STATES.find((s) => s.uf === uf)!.d));
        const caps = lit.map((pts) => extrude(pts, CAP + 0.02, 0.008));
        const places = lit.flatMap((pts, i) => spots(pts, LIT[i][1]).map(([x, y]) => onMap(x, y, H + CAP)));
        resolve((mapGeos = { base, caps, places }));
      };
      idle(work);
    });
  }
  return building;
}

/** A closed kit, small enough to be carried to a school. Origin at its bottom centre. */
function miniKitGeometry() {
  const parts = [
    new RoundedBoxGeometry(0.24, 0.1, 0.16, 2, 0.02).translate(0, 0.05, 0),
    new RoundedBoxGeometry(0.26, 0.03, 0.18, 2, 0.012).translate(0, 0.112, 0),
    new RoundedBoxGeometry(0.1, 0.03, 0.03, 2, 0.012).translate(0, 0.14, 0),
  ];
  const g = mergeGeometries(parts)!;
  parts.forEach((p) => p.dispose());
  return g;
}
/** A school's flag on its pole. Origin at the foot of the pole. */
function flagGeometry() {
  const parts = [new THREE.CylinderGeometry(0.009, 0.009, 0.24, 6).translate(0, 0.12, 0), new THREE.BoxGeometry(0.11, 0.07, 0.012).translate(0.062, 0.203, 0)];
  const g = mergeGeometries(parts)!;
  parts.forEach((p) => p.dispose());
  return g;
}

/** How many schools have their kit, `p` into the story. */
export const reached = (p: Play) => {
  if (p.to !== REACH && p.from !== REACH) return 0;
  const a = ageOf(p, REACH);
  let n = 0;
  for (let k = 0; k < SCHOOLS; k++) if (a >= landAt(k)) n++;
  return n;
};

/** The country rises out of the page, Bahia and Ceará come up in orange, and one kit after another leaves the box at `from` for a school: a flag goes up where each lands. */
export function Reach({ from }: { from: V3 }) {
  const [geos, setGeos] = useState(mapGeos);
  useEffect(() => {
    let live = true;
    if (!geos) buildMap().then((g) => live && setGeos(g));
    return () => void (live = false);
  }, [geos]);
  return geos ? <ReachBody geos={geos} from={from} /> : null;
}

function ReachBody({ geos, from }: { geos: MapGeos; from: V3 }) {
  const { play, mats } = useClay();
  const { wood, inst } = useTones();
  const country = useRef<THREE.Group>(null);
  const caps = useRef<(THREE.Mesh | null)[]>([]);
  const kits = useRef<THREE.InstancedMesh>(null);
  const flags = useRef<THREE.InstancedMesh>(null);
  const { kit, flag } = useMemo(() => ({ kit: miniKitGeometry(), flag: flagGeometry() }), []);
  useEffect(
    () => () => {
      kit.dispose();
      flag.dispose();
    },
    [kit, flag],
  );
  const { start, ends, far } = useMemo(() => {
    const start = new THREE.Vector3(...from);
    const ends = geos.places.map((p) => new THREE.Vector3(...p));
    return { start, ends, far: ends.map((e) => start.distanceTo(e)) };
  }, [geos, from]);
  // Clay flags, wooden kits.
  useLayoutEffect(() => {
    for (const [m, c] of [[flags.current, mats.clay.color], [kits.current, wood.color]] as const) {
      if (!m) continue;
      for (let k = 0; k < SCHOOLS; k++) m.setColorAt(k, c);
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }
  }, [mats, wood, inst]);
  const o = useMemo(() => new THREE.Object3D(), []);
  useFrame(() => {
    const on = at(play, REACH) > 0.001;
    const age = ageOf(play, REACH);
    // Up in the second half of the travel, down in the first half of the travel away.
    const up = play.to === REACH ? (play.from === REACH ? 1 : settle(slice(play.t, 0.12, 0.85), 0.4)) : 1 - ease(slice(play.t, 0, 0.4));
    const there = on && up > 0.02;
    const g = country.current;
    if (g) {
      g.visible = there;
      g.scale.set(1, Math.max(up, 1e-4), 1);
    }
    for (let k = 0; k < caps.current.length; k++) {
      const m = caps.current[k];
      if (!m) continue;
      const lit = spring(age - 0.16 - k * 0.2, 2, 6);
      m.visible = there && lit > 0.001;
      m.position.y = H - 0.02 - CAP + CAP * lit;
    }
    const f = flags.current;
    const b = kits.current;
    if (!f || !b) return;
    f.visible = b.visible = there;
    if (!there) return;
    for (let k = 0; k < ends.length; k++) {
      const end = ends[k];
      // A near school is a short hop, a far one a longer flight.
      const u = slice(age, landAt(k) - (0.3 + far[k] * 0.05), landAt(k));
      const e = ease(u);
      o.position.lerpVectors(start, end, e);
      o.position.y = lerp(start.y, end.y, e) + Math.sin(u * Math.PI) * (0.5 + far[k] * 0.22);
      o.rotation.set(0, (1 - u) * 2.4, 0);
      const s = u > 0 && u < 1 ? Math.min(1, slice(u, 0, 0.12) * 1.2) * (1 - slice(u, 0.9, 1)) * up : 0;
      o.scale.setScalar(Math.max(s, 1e-4));
      o.updateMatrix();
      b.setMatrixAt(k, o.matrix);
      // And up goes the school's flag.
      const raised = spring(age - landAt(k) + 0.03, 2.2, 5) * up;
      o.position.copy(end);
      o.rotation.set(0, -0.35, 0);
      o.scale.set(Math.min(1, raised * 3), Math.max(raised, 1e-4), Math.min(1, raised * 3));
      o.updateMatrix();
      f.setMatrixAt(k, o.matrix);
    }
    f.instanceMatrix.needsUpdate = true;
    b.instanceMatrix.needsUpdate = true;
  });
  return (
    <>
      <group ref={country} position={[MAP_AT[0], 0, MAP_AT[2]]}>
        <mesh geometry={geos.base} material={mats.shade.mid} castShadow receiveShadow />
        {geos.caps.map((geo, k) => (
          <mesh key={k} ref={(m) => void (caps.current[k] = m)} geometry={geo} material={mats.accent} castShadow receiveShadow />
        ))}
      </group>
      <instancedMesh ref={flags} args={[flag, inst, SCHOOLS]} castShadow frustumCulled={false} />
      <instancedMesh ref={kits} args={[kit, inst, SCHOOLS]} castShadow frustumCulled={false} />
    </>
  );
}

// ── 30% to 10% ──────────────────────────────────────────────────────────────
// Two classes of ten. Before the kit three of the ten fail (grey, a sad face); after it one does, and
// the two who now pass are the orange ones. 3 in 10 and 1 in 10: the 30% and the 10% of the story.
export const RESULT = 4; // the step
export const AFTER = 1.1; // seconds into the step when the class after the kit stands up
const PITCH = 0.62;
const SIDE = 2.05; // from the kit in the middle to the middle of each class
const RISER = 0.28;
// A class photo: three in front, four behind them, three at the back, each row a step higher.
const ROWS = [{ n: 3, z: 1.05 }, { n: 4, z: 0.5 }, { n: 3, z: -0.05 }];
const FAILING = [0, 5, 8]; // who fails before the kit (0 to 2 the front row, 3 to 6 the middle, 7 to 9 the back)
const STILL_FAILING = 8;
type Mood = 'ok' | 'sad' | 'new';
interface Kid { x: number; y: number; z: number; mood: Mood; when: number; face: number; seed: number }
const KIDS: Kid[] = (() => {
  const all: Kid[] = [];
  const faces = { smile: 0, frown: 0 };
  for (let g = 0; g < 2; g++) {
    let i = 0;
    ROWS.forEach(({ n, z }, row) => {
      for (let c = 0; c < n; c++, i++) {
        const dx = (c - (n - 1) / 2) * PITCH;
        const mood: Mood = g === 0 ? (FAILING.includes(i) ? 'sad' : 'ok') : i === STILL_FAILING ? 'sad' : FAILING.includes(i) ? 'new' : 'ok';
        all.push({
          x: (g ? 1 : -1) * SIDE + dx,
          y: row * RISER,
          z,
          mood,
          // Each class stands up from the kit outwards, the front row first.
          when: (g ? AFTER : 0.3) + ((g ? dx : -dx) + 1.5 * PITCH) * 0.1 + row * 0.07,
          face: mood === 'sad' ? faces.frown++ : faces.smile++,
          seed: i * 1.7 + g * 0.9,
        });
      }
    });
  }
  return all;
})();
const FROWNS = KIDS.filter((k) => k.mood === 'sad').length;
/** The middle of each class, for the labels. */
export const CLASS_X = SIDE;

/** A student: a body like a chess pawn and a round head. 0.95 tall, origin at the feet, facing +Z. */
function kidGeometry() {
  const profile: [number, number][] = [[0, 0], [0.21, 0], [0.235, 0.03], [0.235, 0.07], [0.2, 0.3], [0.15, 0.5], [0.12, 0.58], [0.06, 0.62], [0, 0.63]];
  const parts = [new THREE.LatheGeometry(profile.map(([x, y]) => new THREE.Vector2(x, y)), 20), new THREE.SphereGeometry(0.19, 20, 14).translate(0, 0.77, 0)];
  const g = mergeGeometries(parts)!;
  parts.forEach((p) => p.dispose());
  return g;
}
/** Two eyes and a mouth on the head: a smile, or a frown with `sad`. */
function faceGeometry(sad: boolean) {
  const arc = 2;
  const mouth = new THREE.TorusGeometry(0.07, 0.013, 6, 12, arc).rotateZ(sad ? (Math.PI - arc) / 2 : Math.PI + (Math.PI - arc) / 2).translate(0, sad ? 0.665 : 0.775, 0.176);
  const parts = [mouth, ...[-0.068, 0.068].map((x) => new THREE.SphereGeometry(0.024, 8, 6).translate(x, 0.805, 0.17))];
  const g = mergeGeometries(parts)!;
  parts.forEach((p) => p.dispose());
  return g;
}

export function Classes() {
  const { play, mats } = useClay();
  const { inst } = useTones();
  const bodies = useRef<THREE.InstancedMesh>(null);
  const smiles = useRef<THREE.InstancedMesh>(null);
  const frowns = useRef<THREE.InstancedMesh>(null);
  const risers = useRef<THREE.Group>(null);
  const { kid, smile, frown } = useMemo(() => ({ kid: kidGeometry(), smile: faceGeometry(false), frown: faceGeometry(true) }), []);
  useEffect(
    () => () => {
      kid.dispose();
      smile.dispose();
      frown.dispose();
    },
    [kid, smile, frown],
  );
  // Who is who: clay for those who pass, grey for those who fail, orange for the two the kit turned round.
  useLayoutEffect(() => {
    const m = bodies.current;
    if (!m) return;
    KIDS.forEach((k, i) => m.setColorAt(i, k.mood === 'sad' ? mats.shade.mat.color : k.mood === 'new' ? mats.accent.color : mats.clay.color));
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    for (const f of [smiles.current, frowns.current]) {
      if (!f) continue;
      for (let i = 0; i < f.count; i++) f.setColorAt(i, mats.shade.dark.color);
      if (f.instanceColor) f.instanceColor.needsUpdate = true;
    }
  }, [mats, inst]);
  const o = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }) => {
    const b = bodies.current;
    const s = smiles.current;
    const f = frowns.current;
    if (!b || !s || !f) return;
    const here = at(play, RESULT);
    b.visible = s.visible = f.visible = here > 0.001;
    if (risers.current) {
      risers.current.visible = b.visible;
      risers.current.scale.setScalar(Math.max(play.to === RESULT ? ease(slice(here, 0.6, 1)) : ease(slice(here, 0.72, 1)), 1e-4));
    }
    if (!b.visible) return;
    const arriving = play.to === RESULT;
    const age = ageOf(play, RESULT);
    const time = clock.elapsedTime;
    for (let i = 0; i < KIDS.length; i++) {
      const k = KIDS[i];
      const up = arriving ? pop(slice(age, k.when, k.when + 0.3), 1.6) : ease(slice(here, 0.72, 1));
      const since = age - k.when - 0.25;
      // Those who pass cannot keep still; the two who pass now jump for it. Those who fail look at the floor.
      const hop = k.mood === 'sad' ? 0 : since < 0 ? 0 : k.mood === 'new' ? 0.34 * Math.abs(Math.sin(since * 5.2)) * Math.exp(-since * 0.5) + 0.05 : 0.05 * Math.max(0, Math.sin(time * 5 + k.seed * 3));
      const squash = k.mood === 'new' && since > 0 ? 0.08 * Math.cos(since * 10.4) * Math.exp(-since * 0.5) : 0;
      o.position.set(k.x, k.y + hop, k.z);
      o.rotation.set(k.mood === 'sad' ? 0.14 : -0.06, (k.x > 0 ? -1 : 1) * 0.1, k.mood === 'sad' ? 0 : 0.05 * Math.sin(time * 2.2 + k.seed));
      o.scale.set(up * (1 + squash), Math.max(up * (k.mood === 'sad' ? 0.96 : 1) * (1 - squash), 1e-4), up * (1 + squash));
      o.updateMatrix();
      b.setMatrixAt(i, o.matrix);
      (k.mood === 'sad' ? f : s).setMatrixAt(k.face, o.matrix);
    }
    b.instanceMatrix.needsUpdate = s.instanceMatrix.needsUpdate = f.instanceMatrix.needsUpdate = true;
  });
  return (
    <>
      {/* The back row stands on a step, like a class photo. */}
      <group ref={risers}>
        {[-1, 1].flatMap((side) => [
          <Box key={side} size={[4 * PITCH + 0.4, RISER, 1.15]} position={[side * SIDE, RISER / 2, 0.22]} r={0.05} material={mats.shade.mid} />,
          <Box key={side * 2} size={[4 * PITCH + 0.4, RISER, 0.6]} position={[side * SIDE, RISER * 1.5, -0.05]} r={0.05} material={mats.shade.mid} />,
        ])}
      </group>
      <instancedMesh ref={bodies} args={[kid, inst, KIDS.length]} castShadow receiveShadow frustumCulled={false} />
      <instancedMesh ref={smiles} args={[smile, inst, KIDS.length - FROWNS]} frustumCulled={false} />
      <instancedMesh ref={frowns} args={[frown, inst, FROWNS]} frustumCulled={false} />
    </>
  );
}
