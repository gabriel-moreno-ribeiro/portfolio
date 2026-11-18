// The repair's clock, shared by the laptop and the bench. Step 2 takes the laptop apart, step 3 puts
// it back together in the reverse order (and faster: by then the hands know the way). Every piece has a
// window in each: [taking apart: start, length; putting back: start, length], in seconds into its step.
// Moves overlap: the next piece leaves while the last one is still in the air.
import * as THREE from 'three';
import { clamp01, ease, slice, type Play } from './kit';

export const APART = 1; // the step that takes it apart
export const BACK = 2; // the step that puts it back
export type Win = [number, number, number, number];

export const N_SCREWS = 8;
export const N_PARTS = 8;

// Taking apart: hinge screws, the screen off, turned over, the bottom screws, the cover, the parts.
// Putting back: the swap, the parts, the cover, the screws, turned back, the screen on, its screws.
export const T = {
  hinge: [0, 1].map((i): Win => [0.66 + i * 0.2, 0.3, 2.96 + i * 0.08, 0.24]),
  display: [1.0, 0.5, 2.62, 0.42] as Win,
  flip: [1.34, 0.5, 2.3, 0.42] as Win,
  // The screwdriver goes along the back row, then the front one: a beat between the two.
  screws: Array.from({ length: N_SCREWS }, (_, i): Win => [1.86 + i * 0.1 + (i > 3 ? 0.06 : 0), 0.34, 1.62 + i * 0.055 + (i > 3 ? 0.04 : 0), 0.26]),
  cover: [2.76, 0.42, 1.3, 0.36] as Win,
  parts: Array.from({ length: N_PARTS }, (_, i): Win => [2.94 + i * 0.085, 0.4, 0.56 + (N_PARTS - 1 - i) * 0.07, 0.32]),
  swap: [0.1, 0.62] as [number, number], // step 3: the old part and the new one change places
  on: 3.3, // step 3: the screen comes on
};
/** How much of a screw's move is the turn in its hole (the rest carries it to the tray). */
export const TURN = 0.22;
/** 0 while assembled, 1 while apart; moving through the piece's window in steps 2 and 3. */
const apartAt = (step: number, age: number, [a, d, b, e]: Win) => (step === APART ? slice(age, a, a + d) : step === BACK ? 1 - slice(age, b, b + e) : 0);
const onBench = (s: number) => s === APART || s === BACK;
/** The laptop is in one piece `age` seconds into `step`. */
export const whole = (step: number, age: number) => (step === APART ? age <= T.hinge[0][0] : step === BACK ? age >= T.hinge[1][2] + T.hinge[1][3] : true);

/**
 * One bench step runs into the other without a cut only end to start: all apart into all apart, or
 * whole into whole. Stepping by hand in the middle of either, nothing flies across: the bench shrinks
 * away as it is and pops in as it will be. The same to or from any other step (see `laptopAct`).
 */
const follows = (p: Play) => (p.from === APART && p.to === BACK ? p.was >= T.parts[N_PARTS - 1][0] + T.parts[N_PARTS - 1][1] : p.from === BACK && p.to === APART && whole(BACK, p.was));
export function apart(p: Play, w: Win) {
  if (p.from === p.to) return apartAt(p.to, p.age, w);
  return p.t < 0.5 ? apartAt(p.from, p.was, w) : apartAt(p.to, p.age, w);
}

/** The bench's own things (the laptop on it, tools, loose parts): there in steps 2 and 3, in at the end of the travel, out at its start. */
export function benchScale(p: Play) {
  const a = onBench(p.from);
  const b = onBench(p.to);
  if (p.from === p.to) return b ? 1 : 0;
  if (a && b && follows(p)) return 1;
  if (p.t < 0.5) return a ? 1 - ease(slice(p.t, 0, 0.3)) : 0;
  return b ? clamp01(slice(p.t, 0.55, 0.9) * 1.6) ** 0.5 : 0;
}

/** A key of the screwdriver's track: [time, x, y, z, lean, hop]. With `hop` it skips to this key at a steady pace, in an arc that high; without, it eases there. */
export type Key6 = [number, number, number, number, number, number];
/** Where the track is at `a` seconds: x, y, z and lean into `out`. */
export function track(keys: Key6[], a: number, out: number[]) {
  let i = 0;
  while (i < keys.length - 2 && a > keys[i + 1][0]) i++;
  const p = keys[i];
  const q = keys[i + 1];
  const u = clamp01((a - p[0]) / (q[0] - p[0]));
  const e = q[5] ? u : ease(u);
  for (let k = 1; k < 5; k++) out[k - 1] = THREE.MathUtils.lerp(p[k], q[k], e);
  out[1] += Math.sin(u * Math.PI) * q[5];
}
