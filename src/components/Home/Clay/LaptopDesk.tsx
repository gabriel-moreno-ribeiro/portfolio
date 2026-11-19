// The desk the whole laptop story happens on, and what a repair bench has lying around its mat: a
// lamp, laptops waiting their turn, the screwdriver set, small parts, paste and tweezers, the tape
// and the knife that opened the box, a charger, a multimeter. None of it moves: it is one mesh.
import * as THREE from 'three';
import type { V3 } from './kit';
import { box, cyl, Lump, puck, rod, type Piece } from './LaptopParts';

const HALF_PI = Math.PI / 2;
/** The desk top is the scene's floor (y = 0); the desk goes this far down to the page. */
export const DESK_H = 0.22;
const DESK: V3 = [10.4, DESK_H, 8.2];
const DESK_Z = -0.7;
const CABLE = new THREE.CatmullRomCurve3([new THREE.Vector3(-3.95, 0.03, 0.4), new THREE.Vector3(-3.55, 0.03, 0.95), new THREE.Vector3(-3.95, 0.03, 1.6), new THREE.Vector3(-3.45, 0.03, 2.15)]);
const LEAD = new THREE.CatmullRomCurve3([new THREE.Vector3(4.05, 0.03, -1.1), new THREE.Vector3(3.7, 0.03, -0.7), new THREE.Vector3(3.95, 0.03, -0.2), new THREE.Vector3(3.6, 0.03, 0.25)]);

const pieces = (): Piece[] => [
  box(DESK, [0, -DESK_H / 2, DESK_Z], { r: 0.07, tone: 'desk' }),
  // The lamp, at the back left, its head over the corner of the mat
  puck(0.36, 0.08, [-4.4, 0.04, -3.7], { segments: 18, tone: 'dark' }),
  box([0.07, 1.5, 0.07], [-4.22, 0.78, -3.62], { rot: [0.1, 0, -0.24], tone: 'mid' }),
  cyl(0.075, 0.13, [-4.04, 1.51, -3.54], { rot: [HALF_PI, 0, 0], segments: 10, tone: 'dark' }),
  box([1.2, 0.07, 0.07], [-3.46, 1.63, -3.41], { rot: [0, -0.22, 0.2], tone: 'mid' }),
  puck(0.3, 0.32, [-2.86, 1.66, -3.27], { segments: 16, rot: [0.3, 0, -0.45], tone: 'dark' }),
  cyl(0.21, 0.03, [-2.79, 1.51, -3.22], { rot: [0.3, 0, -0.45], segments: 14 }),
  // Three laptops waiting their turn, a note on the top one
  ...[0, 1, 2].map((i) => box([2.3, 0.16, 1.55], [-0.7 + (i - 1) * 0.07, 0.08 + i * 0.17, -4.0 + (i % 2) * 0.06], { r: 0.03, rot: [0, (i - 1) * 0.08, 0], tone: i === 1 ? 'mid' : 'clay' })),
  ...[0, 1, 2].map((i) => box([2.1, 0.02, 0.05], [-0.7 + (i - 1) * 0.07, 0.09 + i * 0.17, -3.2 + (i % 2) * 0.06], { rot: [0, (i - 1) * 0.08, 0], tone: 'dark' })),
  box([0.44, 0.006, 0.44], [-0.15, 0.505, -3.85], { rot: [0, 0.2, 0], tone: 'accent' }),
  ...[0, 1].map((i) => box([0.28 - i * 0.08, 0.004, 0.03], [-0.17 - i * 0.03, 0.51, -3.93 + i * 0.1], { rot: [0, 0.2, 0], tone: 'dark' })),
  // The screwdriver set, open, at the back right corner: eight bits in a row
  box([1.9, 0.07, 0.72], [3.4, 0.035, -3.9], { r: 0.03, tone: 'dark' }),
  box([1.9, 0.66, 0.06], [3.4, 0.33, -4.34], { r: 0.03, rot: [-0.3, 0, 0], tone: 'dark' }),
  ...[0, 1, 2, 3, 4, 5, 6, 7].flatMap((i) => [
    cyl(0.02, 0.34, [2.65 + i * 0.215, 0.1, -4.0], { rot: [HALF_PI, 0, 0], segments: 6, tone: 'mid' }),
    cyl(0.05, 0.22, [2.65 + i * 0.215, 0.1, -3.71], { rot: [HALF_PI, 0, 0], segments: 8, tone: i % 2 ? 'accent' : 'clay' }),
  ]),
  // Small parts, sorted, by the lamp
  box([1.1, 0.14, 0.8], [-4.45, 0.07, -2.85], { r: 0.03, tone: 'mid' }),
  ...[0, 1, 2].flatMap((x) => [0, 1].map((z) => box([0.3, 0.02, 0.33], [-4.79 + x * 0.34, 0.14, -3.04 + z * 0.38], { tone: 'dark' }))),
  ...[0, 1, 2, 3, 4].map((i) => cyl(0.03, 0.02, [-4.85 + ((i * 0.31) % 0.8), 0.155, -3.1 + ((i * 0.23) % 0.5)], { segments: 6 })),
  // Thermal paste, tweezers and a brush, to the right of the mat
  cyl(0.05, 0.46, [2.95, 0.05, -1.7], { rot: [HALF_PI, 0, 0.3], segments: 8 }),
  cyl(0.06, 0.1, [3.04, 0.05, -1.42], { rot: [HALF_PI, 0, 0.3], segments: 8, tone: 'accent' }),
  box([0.03, 0.03, 0.6], [3.26, 0.015, -0.85], { rot: [0, 0.1, 0], tone: 'mid' }),
  box([0.03, 0.03, 0.6], [3.33, 0.015, -0.85], { rot: [0, -0.1, 0], tone: 'mid' }),
  box([0.07, 0.05, 0.5], [3.12, 0.025, 0.02], { rot: [0, 0.3, 0], tone: 'kraft' }),
  box([0.11, 0.05, 0.16], [3.02, 0.025, -0.29], { rot: [0, 0.3, 0], tone: 'dark' }),
  // The tape and the knife that opened the box, to the left
  puck(0.32, 0.17, [-4.1, 0.085, -1.9], { hole: 0.2, segments: 18, tone: 'accent' }),
  puck(0.2, 0.17, [-4.1, 0.085, -1.9], { hole: 0.16, segments: 14, tone: 'kraft' }),
  box([0.55, 0.05, 0.12], [-3.95, 0.025, -1.05], { r: 0.02, rot: [0, 0.5, 0], tone: 'dark' }),
  box([0.16, 0.02, 0.08], [-3.66, 0.025, -1.21], { rot: [0, 0.5, 0], tone: 'mid' }),
  // The charger and its cable; a pad of notes and a pen
  box([0.55, 0.16, 0.3], [-4.2, 0.08, 0.4], { r: 0.04, tone: 'dark' }),
  rod(CABLE, 0.028, 14, 'dark'),
  box([0.5, 0.06, 0.5], [-3.9, 0.03, 2.6], { rot: [0, -0.2, 0], tone: 'accent' }),
  cyl(0.028, 0.62, [-3.25, 0.03, 2.7], { rot: [HALF_PI, 0, 0.5], segments: 6, tone: 'dark' }),
  // The multimeter and one of its leads
  box([0.6, 0.12, 1.0], [4.3, 0.06, -1.6], { r: 0.05, tone: 'dark' }),
  box([0.4, 0.01, 0.26], [4.3, 0.125, -1.86]),
  cyl(0.15, 0.04, [4.3, 0.14, -1.42], { segments: 12, tone: 'accent' }),
  rod(LEAD, 0.022, 12, 'accent'),
];

/** The desk and everything on it that never moves. Its top is at y = 0. */
export function Desk() {
  return <Lump id="desk" pieces={pieces} />;
}
