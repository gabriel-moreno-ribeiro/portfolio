// The repair's clock, shared by the laptop and the bench. Step 2 takes the laptop apart, step 3 puts
// it back together in the reverse order. Every piece has a window in each: [start taking apart,
// start putting back, how long its move lasts], in seconds into its step.
import * as THREE from 'three';
import { clamp01, ease, slice, type Play, type V3 } from './kit';

export const APART = 1; // the step that takes it apart
export const BACK = 2; // the step that puts it back
export type Win = [number, number, number];

export const N_SCREWS = 8;
export const N_PARTS = 8;

// Taking apart: hinge screws, the screen off, turned over, the bottom screws, the cover, the parts.
// Putting back: the swap, the parts, the cover, the screws, turned back, the screen on, its screws.
export const T = {
  hinge: [0, 1].map((i): Win => [0.85 + i * 0.22, 5.0 + i * 0.22, 0.3]),
  display: [1.4, 4.4, 0.55] as Win,
  flip: [2.0, 3.9, 0.45] as Win,
  screws: Array.from({ length: N_SCREWS }, (_, i): Win => [2.5 + i * 0.12, 2.85 + i * 0.1, 0.3]),
  cover: [3.65, 2.42, 0.38] as Win,
  parts: Array.from({ length: N_PARTS }, (_, i): Win => [4.05 + i * 0.12, 1.2 + (N_PARTS - 1 - i) * 0.12, 0.34]),
  swap: [0.75, 1.15] as [number, number], // step 3: the old part and the new one change places
  on: 5.6, // step 3: the screen comes on
};

/** 0 while assembled, 1 while apart; moving through the piece's window in steps 2 and 3. */
const apartAt = (step: number, age: number, [a, b, d]: Win) => (step === APART ? slice(age, a, a + d) : step === BACK ? 1 - slice(age, b, b + d) : 0);
export function apart(p: Play, w: Win) {
  if (p.from === p.to) return apartAt(p.to, p.age, w);
  return THREE.MathUtils.lerp(apartAt(p.from, p.was, w), apartAt(p.to, p.age, w), ease(p.t));
}

const onBench = (s: number) => s === APART || s === BACK;
/** The bench's own things (mat, tools, loose parts): there in steps 2 and 3, in at the end of the travel, out at its start. */
export function benchScale(p: Play) {
  const a = onBench(p.from);
  const b = onBench(p.to);
  if (p.from === p.to || (a && b)) return b ? 1 : 0;
  if (b) return clamp01(slice(p.t, 0.7, 1) * 1.6) ** 0.5;
  return a ? 1 - ease(slice(p.t, 0, 0.3)) : 0;
}

/** A point in a track: [time, x, y, z, tilt about Z]. */
export type Key5 = [number, number, number, number, number];
export function track(keys: Key5[], a: number, out: number[]) {
  let i = 0;
  while (i < keys.length - 2 && a > keys[i + 1][0]) i++;
  const [t0, ...p] = keys[i];
  const [t1, ...q] = keys[i + 1];
  const u = ease(clamp01((a - t0) / (t1 - t0)));
  for (let k = 0; k < 4; k++) out[k] = THREE.MathUtils.lerp(p[k], q[k], u);
}

/**
 * The screwdriver's path for a run of screws: from its rest, above each screw, down onto it while
 * it turns (the first 25% of the screw's move, see `screwAt`), and back to rest.
 * `out`: taking apart (the turn starts the screw's move) or putting back (the turn ends it).
 */
export function driverKeys(rest: V3, tops: V3[], wins: Win[], out: boolean, slot: 0 | 1): { keys: Key5[]; turns: [number, number][] } {
  const keys: Key5[] = [];
  const turns: [number, number][] = [];
  const turnAt = (w: Win) => (out ? w[slot] : w[slot] + w[2] * 0.75);
  const first = turnAt(wins[0]);
  keys.push([first - 0.4, ...rest, Math.PI / 2]);
  tops.forEach((top, i) => {
    const t = turnAt(wins[i]);
    const d = wins[i][2] * 0.25;
    keys.push([t - 0.05, top[0], top[1] + 0.22, top[2], 0], [t, top[0], top[1], top[2], 0], [t + d, top[0], top[1] + (out ? 0.035 : 0), top[2], 0]);
    turns.push([t, t + d]);
  });
  keys.push([turnAt(wins[wins.length - 1]) + wins[0][2] * 0.25 + 0.35, ...rest, Math.PI / 2]);
  return { keys, turns };
}
