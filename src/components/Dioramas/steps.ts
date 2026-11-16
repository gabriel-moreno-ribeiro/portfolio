// What each diorama says. Every sentence here is cut from src/content/projects.ts
// (the line it comes from is noted); nothing is added. Kept free of three.js so the
// page and the home card can render steps, labels and the poster without the 3D chunk.

export interface DioramaStep {
  title: string;
  body: string;
}

export interface DioramaLabel {
  text: string;
  /** Point in the scene the leader line lands on. */
  at: [number, number, number];
  /** Step the label belongs to: it shows once the scroll reaches that step. */
  step: number;
  /** Where the text sits relative to the point (default: above). */
  side?: 'up' | 'down' | 'right';
  /** Leader length in px (default 30). */
  lead?: number;
}

export interface DioramaSpec {
  /** Alt text of the poster: the finished scene, in words. */
  alt: string;
  steps: DioramaStep[];
  labels: DioramaLabel[];
}

export const dioramas: Record<string, DioramaSpec> = {
  hibeex: {
    alt: 'Diagram: raw data leaves a small business, passes through the HIBEEX backoffice AI and comes out as decisions.',
    steps: [
      // projects.ts:64 "Backoffice AI for small and medium businesses. Raw data goes in, decisions come out."
      { title: 'Raw data goes in', body: 'HIBEEX is backoffice AI for small and medium businesses. Their raw data goes in.' },
      // projects.ts:76
      {
        title: 'Backoffice AI',
        body: 'TypeScript, Next.js and Node.js. Supabase and PostgreSQL for data. AWS for infrastructure.',
      },
      // projects.ts:64
      { title: 'Decisions come out', body: 'Raw data in, decisions out.' },
    ],
    labels: [
      { text: 'Small / medium business', at: [-3.2, 1.15, 0], step: 0 },
      { text: 'Raw data', at: [-1.2, 0.1, 0.35], step: 0, side: 'down' },
      { text: 'Backoffice AI', at: [0.6, 1.95, 0], step: 1 },
      { text: 'Decisions', at: [3.1, 0.75, 0], step: 2 },
    ],
  },
  candela: {
    alt: 'Diagram: a wooden physics kit, the 28 public schools it went to, the 3,392 students who used it, and the failure rate falling from 30% to 10%.',
    steps: [
      // projects.ts:116
      {
        title: 'The kit',
        body: 'A wooden box built to be carried between classrooms. Inside: a caliper, a spring scale, a stopwatch, a measuring tape, weights, a graduated cylinder, and the parts for five experiments.',
      },
      // projects.ts:93, 110
      { title: '28 public schools', body: 'Built and taken to 28 public schools in Salvador. Most of them teach physics without a lab.' },
      // projects.ts:123
      { title: '3,392 students', body: '3,392 students have used the kits. Each dot is one of them.' },
      // projects.ts:123
      { title: '30% → 10%', body: 'In the classrooms that ran them, physics failure rates went from 30% to 10%.' },
    ],
    labels: [
      { text: 'The kit', at: [-3.6, 1.25, 0.2], step: 0, lead: 14 },
      { text: '28 public schools', at: [-0.85, 0.3, -1.5], step: 1, lead: 22 },
      { text: '3,392 students', at: [0.35, 0, 2.05], step: 2, side: 'down' },
      { text: '30% → 10% failure', at: [3.8, 1.5, 0], step: 3, lead: 22 },
    ],
  },
  gsat: {
    alt: 'Diagram: a test answer sheet resting on three stacked layers: product, engineering and go-to-market.',
    steps: [
      // projects.ts:164
      { title: 'Standardized test prep', body: 'An EdTech platform for standardized test prep.' },
      // projects.ts:164, 157
      {
        title: 'Built from scratch',
        body: 'I built it from scratch: product, engineering and go-to-market. November 2025 to May 2026.',
      },
    ],
    labels: [
      { text: 'Test prep', at: [-1.05, 1.53, -0.38], step: 0, lead: 40 },
      { text: 'Product', at: [1.95, 0.21, 1.63], step: 1, side: 'right' },
      { text: 'Engineering', at: [1.7, 0.71, 1.44], step: 1, side: 'right' },
      { text: 'Go-to-market', at: [1.45, 1.21, 1.25], step: 1, side: 'right' },
    ],
  },
};

// ── Camera, shared by the canvas and by the HTML labels ───────────────────────
// Orthographic, so a scene point lands on the same % of the 16:10 stage at any size.
export const ASPECT = 16 / 10;
export const CAMERA = { position: [4, 6, 9], target: [0, 0.75, 0], halfHeight: 3.1 } as const;

type V3 = readonly [number, number, number];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const unit = (a: V3): V3 => { const l = Math.hypot(...a); return [a[0] / l, a[1] / l, a[2] / l]; };

const forward = unit(sub(CAMERA.target, CAMERA.position));
const right = unit(cross(forward, [0, 1, 0]));
const up = cross(right, forward);

/** Scene point → position on the stage, in %. */
export function project(p: V3): { left: string; top: string } {
  const d = sub(p, CAMERA.target);
  const x = dot(d, right) / (CAMERA.halfHeight * ASPECT);
  const y = dot(d, up) / CAMERA.halfHeight;
  return { left: `${(50 + x * 50).toFixed(2)}%`, top: `${(50 - y * 50).toFixed(2)}%` };
}

/** Scroll progress 0..1 → continuous step position 0..n-1. Step 0 is in place from the start. */
export const stepAt = (progress: number, steps: number) => progress * (steps - 1);
