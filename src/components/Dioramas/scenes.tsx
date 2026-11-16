// The three scenes. Each is a pure function of the scroll progress: nothing moves on
// its own, so a still page costs zero frames (the canvas runs with frameloop="demand").
import { useThree } from '@react-three/fiber';
import type { MotionValue } from 'motion/react';
import { useLayoutEffect, useMemo, useRef } from 'react';
import type { Group, InstancedMesh, Mesh } from 'three';
import { Object3D } from 'three';
import { stepAt } from './steps';

export interface Palette {
  paper: string;
  ink: string;
  mute: string;
  line: string;
  accent: string;
  wood: string;
  dot: string;
}

interface SceneProps {
  progress: MotionValue<number>;
  c: Palette;
}

type V3 = [number, number, number];

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
/** 0 before `a`, 1 after `b`, eased in between. */
const seg = (v: number, a: number, b: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
// A scale of exactly 0 makes a singular matrix; this is invisible and safe.
const tiny = (v: number) => Math.max(v, 0.0001);

/** Runs `apply` now and on every progress change, then asks for one frame. */
function useScrub(progress: MotionValue<number>, apply: (p: number) => void) {
  const invalidate = useThree((s) => s.invalidate);
  const fn = useRef(apply);
  fn.current = apply;
  useLayoutEffect(() => {
    const run = (p: number) => { fn.current(p); invalidate(); };
    run(progress.get());
    return progress.on('change', run);
  }, [progress, invalidate]);
}

function Box({ size, color, ...rest }: { size: V3; color: string; position?: V3; rotation?: V3 }) {
  return (
    <mesh castShadow receiveShadow {...rest}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.85} />
    </mesh>
  );
}

function Cyl({ r, h, color, ...rest }: { r: number; h: number; color: string; position?: V3; rotation?: V3 }) {
  return (
    <mesh castShadow receiveShadow {...rest}>
      <cylinderGeometry args={[r, r, h, 20]} />
      <meshStandardMaterial color={color} roughness={0.85} />
    </mesh>
  );
}

// ── HIBEEX: raw data in, decisions out ────────────────────────────────────────
const RAW_SIZES = [0.34, 0.2, 0.3, 0.18, 0.27, 0.23, 0.31, 0.19];
const DECISIONS = 5;

export function Hibeex({ progress, c }: SceneProps) {
  const raw = useRef<Group>(null);
  const core = useRef<Group>(null);
  const gem = useRef<Mesh>(null);
  const out = useRef<Group>(null);

  useScrub(progress, (p) => {
    const s = stepAt(p, 3);
    // The belt is driven by the scroll: pieces leave the business and enter the core.
    raw.current?.children.forEach((m, i) => {
      const t = (i / RAW_SIZES.length + p * 1.5) % 1;
      m.position.x = -2.85 + t * 2.3;
      m.scale.setScalar(tiny(Math.min(t / 0.12, (1 - t) / 0.12, 1)));
      m.rotation.y = i * 1.7 + t * 2.4;
    });
    const k = seg(s, 0.15, 0.9);
    core.current?.scale.setScalar(tiny(k));
    if (gem.current) gem.current.rotation.y = p * 7;
    out.current?.children.forEach((m, i) => {
      const a = seg(s, 1.05 + i * 0.16, 1.4 + i * 0.16);
      m.position.x = 0.7 + a * (0.75 + i * 0.6);
      m.scale.setScalar(tiny(a));
    });
  });

  return (
    <group position={[0.5, 0, 0]}>
      {/* the belt everything rides on */}
      <Box size={[7.3, 0.06, 0.8]} color={c.line} position={[0.35, 0.03, 0]} />

      {/* the business */}
      <group position={[-3.7, 0, 0]}>
        <Box size={[1.5, 1, 1.3]} color={c.paper} position={[0, 0.5, 0]} />
        <Box size={[1.7, 0.1, 1.5]} color={c.ink} position={[0, 1.05, 0]} />
        <Box size={[0.9, 0.07, 0.34]} color={c.accent} position={[-0.1, 0.66, 0.8]} rotation={[0.35, 0, 0]} />
        <Box size={[0.3, 0.5, 0.04]} color={c.ink} position={[-0.3, 0.25, 0.66]} />
        <Box size={[0.36, 0.26, 0.04]} color={c.mute} position={[0.25, 0.4, 0.66]} />
      </group>

      {/* raw data: every piece a different shape and size */}
      <group ref={raw}>
        {RAW_SIZES.map((size, i) => (
          <mesh key={i} castShadow position={[0, 0.06 + size / 2, ((i * 37) % 9) / 9 * 0.36 - 0.18]}>
            {i % 3 === 0 ? <boxGeometry args={[size, size, size]} />
              : i % 3 === 1 ? <tetrahedronGeometry args={[size * 0.75]} />
              : <cylinderGeometry args={[size / 2, size / 2, size, 6]} />}
            <meshStandardMaterial color={[c.paper, c.mute, c.ink][i % 3]} roughness={0.85} flatShading />
          </mesh>
        ))}
      </group>

      {/* the backoffice AI */}
      <group ref={core} position={[0.1, 0, 0]}>
        <Box size={[1.3, 1.15, 1.3]} color={c.ink} position={[0, 0.6, 0]} />
        <Box size={[1.5, 0.08, 1.5]} color={c.mute} position={[0, 0.07, 0]} />
        <mesh ref={gem} castShadow position={[0, 1.6, 0]}>
          <icosahedronGeometry args={[0.34, 0]} />
          <meshStandardMaterial color={c.accent} roughness={0.5} flatShading />
        </mesh>
      </group>

      {/* decisions: all the same, in a row */}
      <group ref={out}>
        {Array.from({ length: DECISIONS }, (_, i) => (
          <group key={i} position={[0, 0.06, 0]}>
            <Box size={[0.1, 0.6, 0.46]} color={c.paper} position={[0, 0.3, 0]} />
            <Box size={[0.11, 0.1, 0.47]} color={c.accent} position={[0, 0.55, 0]} />
          </group>
        ))}
      </group>
    </group>
  );
}

// ── Candela: kit → 28 schools → 3,392 students → 30% to 10% ───────────────────
const SCHOOLS = 28;
const STUDENTS = 3392;
const COLS = 7;
const schoolAt = (i: number): [number, number] => [-1.75 + (i % COLS) * 0.6, -1.5 + Math.floor(i / COLS) * 0.95];

export function Candela({ progress, c }: SceneProps) {
  const lit = useRef<Group>(null);
  const students = useRef<InstancedMesh>(null);
  const bar30 = useRef<Mesh>(null);
  const bar10 = useRef<Mesh>(null);

  // One dot per student, laid out in front of their school: placed once, then only
  // `count` changes.
  useLayoutEffect(() => {
    const mesh = students.current;
    if (!mesh) return;
    const o = new Object3D();
    for (let i = 0; i < STUDENTS; i++) {
      const [x, z] = schoolAt(i % SCHOOLS);
      const slot = Math.floor(i / SCHOOLS);
      o.position.set(x - 0.22 + (slot % 12) * 0.04, 0.014, z + 0.2 + Math.floor(slot / 12) * 0.045);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, []);

  useScrub(progress, (p) => {
    const s = stepAt(p, 4);
    lit.current?.children.forEach((m, i) => {
      m.scale.setScalar(tiny(seg(s, 0.1 + (i / SCHOOLS) * 0.7, 0.25 + (i / SCHOOLS) * 0.7)));
    });
    if (students.current) students.current.count = Math.round(STUDENTS * seg(s, 1.05, 1.95));
    const grow = (mesh: Mesh | null, h: number, k: number) => {
      if (!mesh) return;
      mesh.scale.y = tiny(k);
      mesh.position.y = (h * tiny(k)) / 2;
    };
    grow(bar30.current, 1.5, seg(s, 2.05, 2.5));
    grow(bar10.current, 0.5, seg(s, 2.5, 2.95));
  });

  const schools = useMemo(() => Array.from({ length: SCHOOLS }, (_, i) => schoolAt(i)), []);

  return (
    <group position={[0.3, 0, 0]}>
      {/* the kit: a wooden box, lid open, instruments inside */}
      <group position={[-3.9, 0, 0.2]}>
        <Box size={[1.3, 0.6, 0.9]} color={c.wood} position={[0, 0.3, 0]} />
        <group position={[0, 0.6, -0.45]} rotation={[-1.15, 0, 0]}>
          <Box size={[1.3, 0.06, 0.9]} color={c.wood} position={[0, 0, 0.45]} />
        </group>
        <Cyl r={0.08} h={0.5} color={c.paper} position={[-0.4, 0.8, 0]} />
        <Cyl r={0.07} h={0.14} color={c.ink} position={[-0.1, 0.67, 0.2]} />
        <Cyl r={0.07} h={0.14} color={c.ink} position={[0.06, 0.67, 0.2]} />
        <Cyl r={0.07} h={0.14} color={c.accent} position={[-0.02, 0.67, 0.05]} />
        <Cyl r={0.14} h={0.05} color={c.ink} position={[0.36, 0.72, 0.1]} rotation={[Math.PI / 2, 0, 0]} />
        <Box size={[0.2, 0.12, 0.2]} color={c.accent} position={[0.3, 0.66, -0.2]} />
      </group>

      {/* 28 schools; the orange roof lands when the kit gets there */}
      {schools.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <Box size={[0.44, 0.26, 0.24]} color={c.paper} position={[0, 0.13, 0]} />
          <Box size={[0.48, 0.05, 0.28]} color={c.mute} position={[0, 0.285, 0]} />
        </group>
      ))}
      <group ref={lit}>
        {schools.map(([x, z], i) => (
          <Box key={i} size={[0.5, 0.06, 0.3]} color={c.accent} position={[x, 0.29, z]} />
        ))}
      </group>

      {/* 3,392 students */}
      <instancedMesh ref={students} args={[undefined, undefined, STUDENTS]} frustumCulled={false}>
        <boxGeometry args={[0.02, 0.02, 0.02]} />
        <meshBasicMaterial color={c.dot} />
      </instancedMesh>

      {/* failure rate, to scale: 30% then 10% */}
      <mesh ref={bar30} castShadow position={[3.5, 0.75, 0]}>
        <boxGeometry args={[0.44, 1.5, 0.44]} />
        <meshStandardMaterial color={c.mute} roughness={0.85} />
      </mesh>
      <mesh ref={bar10} castShadow position={[4.1, 0.25, 0]}>
        <boxGeometry args={[0.44, 0.5, 0.44]} />
        <meshStandardMaterial color={c.accent} roughness={0.85} />
      </mesh>
    </group>
  );
}

// ── GSAT: a test-prep platform, built from scratch in three layers ────────────
// Bottom to top, in the order the page lists them: product, engineering, go-to-market.
const LAYERS: { size: V3; tone: keyof Palette }[] = [
  { size: [3.6, 0.34, 2.6], tone: 'ink' },
  { size: [3.2, 0.34, 2.3], tone: 'mute' },
  { size: [2.8, 0.34, 2.0], tone: 'accent' },
];
const PITCH = 0.4;
const ROWS = 8;
const CHOICES = 5;

export function Gsat({ progress, c }: SceneProps) {
  const layers = useRef<Group>(null);
  const sheet = useRef<Group>(null);

  useScrub(progress, (p) => {
    let y = 0;
    layers.current?.children.forEach((m, i) => {
      const k = seg(p, 0.08 + i * 0.28, 0.36 + i * 0.28);
      m.scale.setScalar(tiny(k));
      m.position.y = y + (PITCH / 2 - 0.03) * k;
      y += PITCH * k;
    });
    if (sheet.current) sheet.current.position.y = y;
  });

  return (
    <group position={[-0.3, 0, 0]} scale={1.25}>
      <group ref={layers}>
        {LAYERS.map((l, i) => <Box key={i} size={l.size} color={c[l.tone]} />)}
      </group>
      {/* the answer sheet the whole thing is for */}
      <group ref={sheet}>
        <Box size={[2.1, 0.03, 1.4]} color={c.paper} position={[0, 0.015, 0]} />
        {Array.from({ length: ROWS * CHOICES }, (_, n) => {
          const row = n % ROWS;
          const choice = Math.floor(n / ROWS);
          const marked = (row * 3 + 1) % CHOICES === choice;
          return (
            <mesh key={n} position={[-0.77 + row * 0.22, 0.035, -0.44 + choice * 0.22]}>
              <cylinderGeometry args={[0.07, 0.07, 0.012, 16]} />
              <meshStandardMaterial color={marked ? c.accent : c.line} roughness={0.85} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}
