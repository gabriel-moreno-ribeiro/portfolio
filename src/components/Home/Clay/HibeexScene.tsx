// HIBEEX in five steps, on one mat, with one batch of paper and the same three bees (its agents; the
// mark is a bee): raw data pours out of the systems accounting firms already use, through HIBEEX; it
// goes through the hive again and comes out clean and in order; the bees get to work on it
// (reconciliation, collections, contracts); they fly the work back to the people who look after the
// business; and the numbers at one client. Facts: public/llms.txt.
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import * as THREE from 'three';
import { bee, Calendar, Clock, COMB_H, HexMat, Hive, HIVE_H, Honeycomb, Pad, Pen, People, reamTop, Reams, Stamp, Swarm, Systems, TOOL, Tray, TRAY_FLOOR, type Bee } from './HibeexParts';
import { Act, ageOf, Arrow, at, Box, bump, clamp01, ease, Morph, pop, Rig, slice, Tag, useClay, wins, type Play, type Shot, type V3, type Wins } from './kit';

const HALF_PI = Math.PI / 2;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const F = 0.04; // the top of the mat: everything stands on it
const X = [-2.25, 0, 2.25]; // three columns: a bee, its work, its person, a result
const PAGE = 0.016; // a sheet in a pile

// ── Where things are ─────────────────────────────────────────────────────────
// 1 · raw data: the systems at the back, the hive in front of them, the heap in front of the hive.
const SYSTEMS = [-3, -1.2, 1.2, 3];
const NAMES = ['Domínio', 'Conta Azul', 'Nibo', 'Omie'];
const SYSTEMS_Z = -2.3;
const HIVE_AT: V3[] = [[0, F, -0.6], [0, F, 0.1]];
const HEAP = { x: 0, z: 1.45, rx: 2, rz: 0.72 };
const HOLE_Y = F + HIVE_H / 2;
const POUR = 0.55; // the hive is there: the data starts to pour
const ROOF = F + HIVE_H + 0.17; // a bee sitting on the hive
// 2 · clean: the hive turns; raw paper goes in on the left and comes out flat on the right.
const WAY = 0.265; // the way through the hive, off the X axis
const DIR = [Math.cos(WAY), Math.sin(WAY)];
const HEAP2 = [-2.6, -0.6];
const TRAY_AT: V3 = [2.4, F, 0.76];
const TRAY_N = 6; // plain sheets already in the tray
const RAW = 8; // sheets that stay in the heap
const RIDERS = 8; // sheets on their way through
const LAP = 1.76; // seconds from heap to tray: one sheet through the hive every 0.22 s
// 3 · agents at work: a stack per bee (two for reconciliation), and what is done in front of it.
const AGENTS = ['Reconciliation', 'Collections', 'Contracts'];
const BEAT = 1.1;
const REAM_N = 11;
const STACK_TOP = F + reamTop(REAM_N + 1); // with the sheet that waits on it
const Z_ST = 0;
const Z_DN = 1.05;
const DONE_Y = F + PAGE / 2;
const ITEMS = 5; // going round each lane: one worked on, three done, one waiting under it
const FIRST = [0, 10, 15]; // each lane's first sheet: five pairs, five sheets, five sheets
const laneOf = (i: number) => (i < 10 ? 0 : i < 15 ? 1 : i < 20 ? 2 : -1);
/** Lane `l`'s clock, in beats: each lane a third of a beat after the one before. */
const beats = (l: number, time: number) => time / BEAT + l / 3;
const SLIDE: [number, number] = [0.45, 0.85]; // when what is done slides off the stack (0..1 through a beat)
const STAMP = 0.3; // when the stamp hits
const SIGN: [number, number] = [0.2, 0.45]; // when the pen writes
const HOVER = 1.02;
const CONTACT = STACK_TOP + PAGE + TOOL;
const REACH = 0.3; // a bee holds its tool this far in front of it
// 4 · back to the people: a desk, three people behind it.
const PEOPLE = ['Accountant', 'Finance BPO', 'Lawyer'];
const DESK_Z = -0.55;
const DESK_TOP = F + 0.62;
const SEAT = -0.5; // each person stands this far left of their column, and their bee ends on the right
const PERSON_K = 1.3;
const CARRY = 0.3; // how far under a bee the sheet it carries hangs
const startOf = (b: number) => 0.55 + b * 0.3; // when bee `b` sets off
const DROP_AT = 1; // seconds after that, the sheet is on the desk
// 5 · the result
const H = 2; // height of a "before" pad
const TOPS = [1.95, H + 0.17, COMB_H + 0.1];

// ── The bees ────────────────────────────────────────────────────────────────
/** Where bee `b` is `time` seconds into `step`. */
function beeAt(step: number, b: number, time: number, o: Bee) {
  const side = b - 1;
  const bob = Math.sin(time * 5 + b * 2.1) * 0.04;
  o.x = X[b];
  o.y = HOVER + bob;
  o.z = 0;
  o.yaw = 0;
  o.pitch = 0.2;
  o.roll = 0;
  o.s = 1;
  o.flap = 1;
  if (step === 0) {
    // Waiting for the data: one sits on the hive, two hover beside it. They start as the paper bursts out.
    const startle = bump(slice(time, POUR + Math.abs(side) * 0.1, POUR + 0.5));
    if (b === 1) {
      o.y = ROOF + 0.16 * startle;
      o.z = HIVE_AT[0][2];
      o.flap = 0.1 + startle;
      o.pitch = 0.1;
    } else {
      o.x = side * 2.8;
      o.y = 0.8 + bob + 0.16 * startle;
      o.z = 1.15;
      o.yaw = -side * 1.1;
      o.pitch = 0.3;
    }
  } else if (step === 1) {
    // Still waiting: nothing acts on the data before it is clean. They watch it go through.
    if (b === 1) {
      o.y = ROOF + 0.035 * bump(sincePass(time));
      o.z = HIVE_AT[1][2];
      o.yaw = 0.55;
      o.flap = 0.1;
      o.pitch = 0.1;
    } else if (b === 0) {
      // One follows each sheet as it leaves the heap.
      o.x = -3.35 + 0.25 * bump(sincePass(time + 0.6));
      o.y = 1.15 + bob;
      o.z = -1.5;
      o.yaw = 1;
      o.pitch = 0.45;
    } else {
      // One nods at each sheet as it lands, flat.
      o.x = 2.1;
      o.y = 1.3 + bob;
      o.z = -0.75;
      o.yaw = 0.35;
      o.pitch = 0.42 + 0.22 * bump(sincePass(time - 0.75));
    }
  } else if (step === 2) {
    const t = beats(b, time);
    const a = t - Math.floor(t);
    o.pitch = 0.28;
    if (b === 0) {
      // Reconciliation: it taps the two stacks, and a sheet from each slides out to meet the other.
      o.z = Z_ST - 0.3;
      o.y = lerp(HOVER + bob, CONTACT - 0.2, bump(slice(a, 0.1, 0.5)));
    } else if (b === 1) {
      // Collections: it winds up and brings the stamp down.
      const down = slice(a, 0.2, STAMP) ** 2 - ease(slice(a, 0.42, 0.7));
      o.x += 0.12;
      o.z = Z_ST + 0.2 - REACH;
      o.y = lerp(HOVER + bob + 0.15 * ease(slice(a, 0, 0.2)) * (1 - slice(a, 0.2, STAMP)), CONTACT, down);
    } else {
      // Contracts: it comes down with the pen and signs along the line.
      const down = ease(slice(a, 0.05, SIGN[0])) - ease(slice(a, SIGN[1] + 0.02, SIGN[1] + 0.17));
      o.x += -0.15 + 0.3 * (slice(a, SIGN[0], SIGN[1]) - ease(slice(a, 0.62, 0.95)));
      o.z = Z_ST + 0.22 - REACH + 0.025 * Math.sin(a * 70) * slice(a, SIGN[0], SIGN[0] + 0.03) * (1 - slice(a, SIGN[1] - 0.03, SIGN[1]));
      o.y = lerp(HOVER + bob, CONTACT, down);
    }
  } else if (step === 3) {
    // Each carries what it has done to its person, lays it on the desk and stays beside them.
    const t0 = startOf(b);
    const fly = ease(slice(time, t0, t0 + 0.8));
    const lower = ease(slice(time, t0 + 0.72, t0 + DROP_AT));
    const away = ease(slice(time, t0 + DROP_AT + 0.05, t0 + DROP_AT + 0.65));
    o.x = X[b] + lerp(SEAT * fly, 0.625, away);
    o.z = lerp(Z_DN, DESK_Z + 0.08, fly) - 0.7 * away;
    o.y = lerp(lerp(lerp(DONE_Y + 3 * PAGE + CARRY + 0.3, 1.5, fly), DESK_TOP + PAGE / 2 + CARRY, lower), 1.95, away) + bob * Math.max(1 - fly, away);
    o.yaw = Math.PI * ease(slice(time, t0, t0 + 0.35)) + (Math.PI + 0.3) * away;
    if (o.yaw > Math.PI) o.yaw -= Math.PI * 2;
    o.pitch = 0.2;
  } else {
    // The numbers: each over a result, and a turn of joy when it is in.
    o.y = TOPS[b] + 0.5 + bob;
    o.z = 0.15;
    o.yaw = Math.PI * 2 * ease(slice(time, 2.2 + b * 0.14, 2.9 + b * 0.14));
    o.y += 0.18 * bump(slice(time, 2.2 + b * 0.14, 2.9 + b * 0.14));
  }
}
const FROM = bee();
/** Where bee `b` is right now, travels included: it flies from where it was to where it will be. */
function beeNow(b: number, p: Play, o: Bee) {
  beeAt(p.to, b, p.age, o);
  if (p.from === p.to) return;
  beeAt(p.from, b, p.was, FROM);
  const u = slice(p.t, 0.04 + b * 0.06, 0.82 + b * 0.06);
  const f = ease(u);
  const far = Math.min(1, Math.hypot(o.x - FROM.x, o.z - FROM.z) / 2);
  o.y = lerp(FROM.y, o.y, f) + Math.sin(u * Math.PI) * 0.3 * far;
  o.roll = Math.sin(u * Math.PI) * 0.35 * far * Math.sign(FROM.x - o.x);
  o.x = lerp(FROM.x, o.x, f);
  o.z = lerp(FROM.z, o.z, f);
  o.yaw = lerp(FROM.yaw, o.yaw, f);
  o.pitch = lerp(FROM.pitch, o.pitch, f);
  o.flap = Math.max(lerp(FROM.flap, o.flap, f), bump(u));
}
/** There on step `i`: gone in the first third of a travel away, popping in at the end of a travel to it. */
const inOut = (p: Play, i: number) => (p.to === i ? (p.from === i ? 1 : pop(slice(p.t, 0.55, 0.95))) : p.from === i ? 1 - ease(slice(p.t, 0, 0.3)) : 0);
const HELD = bee();
/** What bee `b` holds under it while the agents work. */
const toolAct = (b: number) => (g: THREE.Group, p: Play) => {
  const k = inOut(p, 2);
  g.visible = k > 0.01;
  if (!g.visible) return;
  beeNow(b, p, HELD);
  g.position.set(HELD.x, HELD.y, HELD.z + REACH);
  g.scale.setScalar(k);
};

/** 0..1: how long since a sheet went through the hive (0 as it does). */
const sincePass = (time: number) => {
  const g = (time / LAP - 0.45) * RIDERS;
  return g - Math.floor(g);
};
// The hive has a body: it coughs the raw data out, and swallows every sheet that goes through it.
const hivePulse = (p: Play) => {
  if (p.to === 0) return slice(p.age, POUR - 0.05, POUR + 0.1) * (1 - slice(p.age, POUR + 1.3, POUR + 1.7)) * Math.abs(Math.sin(p.age * 13));
  return p.to === 1 ? bump(slice(sincePass(p.age), 0, 0.55)) * 0.8 * at(p, 1) : 0;
};

// ── Sheets ──────────────────────────────────────────────────────────────────
// One instanced mesh, one batch of paper for the whole story. Every sheet has a place in every step
// and a part in its performance (pouring out and piling up, going through the hive, being worked
// on, being carried to a desk). `c` is how crumpled it is: raw data is crumpled, clean data is flat.
const N = 30;
interface Sheet { x: number; y: number; z: number; rx: number; ry: number; rz: number; s: number; hot: number; c: number }
const blank = (): Sheet => ({ x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1, hot: 0, c: 0 });

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// A fixed scatter per sheet: where it lies in a pile, how it is turned.
const SCATTER = (() => {
  const rand = rng(11);
  return Array.from({ length: N }, () => {
    const a = rand() * Math.PI * 2;
    const d = Math.sqrt(rand());
    return { ax: Math.cos(a) * d, az: Math.sin(a) * d, yaw: rand() * Math.PI * 2, tx: (rand() - 0.5) * 0.18, tz: (rand() - 0.5) * 0.18, skew: (rand() - 0.5) * 1.1, off: (rand() - 0.5) * 0.44 };
  });
})();
const STREAM = 6; // sheets that keep coming out of the hive when the first step is left to run

function pile(i: number, cx: number, cz: number, rx: number, rz: number, levels: number, o: Sheet) {
  const c = SCATTER[i];
  o.x = cx + c.ax * rx;
  o.z = cz + c.az * rz;
  o.y = F + 0.012 + (i % levels) * 0.018;
  o.rx = c.tx;
  o.ry = c.yaw;
  o.rz = c.tz;
}
const CARRIER = bee();

/** Where sheet `i` is `time` seconds into `step`. */
function sheetAt(step: number, i: number, time: number, o: Sheet) {
  const c = SCATTER[i];
  o.s = 1;
  o.hot = 0;
  o.c = 0;
  o.rx = o.ry = o.rz = 0;
  if (step === 0) {
    // Raw: it bursts out of the hive, flutters down and piles up.
    pile(i, HEAP.x, HEAP.z, HEAP.rx, HEAP.rz, 10, o);
    o.c = 0.5 + (c.off + 0.22) * 1.1;
    let a = time - POUR - i * 0.04;
    // Left to run, the last few keep coming, one after the other.
    if (i >= N - STREAM && time > 3.4) a = (time - 3.4 + (N - i) * 0.4) % 2.4;
    const u = clamp01(a / 0.8);
    if (u < 1) {
      const e = ease(u);
      o.x = lerp(((i % 3) - 1) * 0.2, o.x, e) + Math.sin(a * 9 + i) * 0.25 * Math.sin(u * Math.PI);
      o.z = lerp(HIVE_AT[0][2] + 0.1, o.z, e);
      o.y = lerp(HOLE_Y, o.y, e) + Math.sin(e * Math.PI) * 0.7;
      o.rx = c.tx + (1 - e) * (1.1 + Math.sin(a * 13 + i) * 0.7);
      o.rz = c.tz + Math.sin(a * 10 + i * 2) * 0.6 * (1 - e);
      o.ry = c.yaw * e;
      o.s = slice(a, 0, 0.1);
    }
  } else if (step === 1) {
    if (i < RAW) {
      o.c = 0.9;
      return pile(i, HEAP2[0], HEAP2[1], 0.8, 0.7, RAW, o);
    }
    const top = F + TRAY_FLOOR + reamTop(TRAY_N + N - RAW - RIDERS);
    if (i < RAW + RIDERS) {
      // Clean: off the heap, through the hive (crumpled in, flat out with a snap), onto the stack.
      const ph = (time / LAP + (i - RAW) / RIDERS) % 1;
      const hop = ease(slice(ph, 0, 0.32));
      const land = ease(slice(ph, 0.58, 0.94));
      const d = lerp(-1.05, 1.05, slice(ph, 0.32, 0.58));
      const loose = 1 - slice(ph, 0.18, 0.42);
      o.x = lerp(lerp(HEAP2[0] + c.ax * 0.5, HIVE_AT[1][0] + DIR[0] * d, hop), TRAY_AT[0], land);
      o.z = lerp(lerp(HEAP2[1] + c.az * 0.4, HIVE_AT[1][2] + DIR[1] * d, hop), TRAY_AT[2], land);
      o.y = lerp(lerp(F + 0.2, HOLE_Y, hop), top + PAGE / 2, land) + Math.sin(hop * Math.PI) * 0.3 + Math.sin(land * Math.PI) * 0.3;
      o.c = 0.95 * (1 - slice(ph, 0.4, 0.5));
      o.rx = c.tx * 2.5 * loose;
      o.ry = -WAY + c.skew * loose;
      o.rz = c.tz * 2.5 * loose;
      o.s = slice(ph, 0, 0.06) * (1 + 0.16 * bump(slice(ph, 0.47, 0.62)));
      return;
    }
    // In order: the top of the stack in the tray.
    o.x = TRAY_AT[0];
    o.z = TRAY_AT[2];
    o.y = F + TRAY_FLOOR + reamTop(TRAY_N + i - RAW - RIDERS) + PAGE / 2;
    o.ry = -WAY;
  } else if (step === 2) {
    const l = laneOf(i);
    if (l < 0) {
      // Not worked on in this step.
      o.s = 0;
      return;
    }
    // Each lane has five items going round: on top of the stack and worked on (then it slides off, done), three done, and the next one waiting.
    const t = beats(l, time);
    const tick = Math.floor(t);
    const a = t - tick;
    const side = l === 0 ? (i & 1 ? 1 : -1) : 0;
    const k = ((l === 0 ? i >> 1 : i - FIRST[l]) + tick) % ITEMS;
    const u = k === 0 ? ease(slice(a, SLIDE[0], SLIDE[1])) : 1;
    // Reconciliation: one sheet from each stack, and they end side by side, matched.
    if (k === ITEMS - 1) {
      o.x = X[l] + side * 0.37;
      o.y = STACK_TOP - PAGE / 2;
      o.z = Z_ST;
      return;
    }
    o.x = X[l] + side * lerp(0.37, 0.315, u);
    o.z = lerp(Z_ST, Z_DN, u);
    o.y = k === 0 ? lerp(STACK_TOP + PAGE / 2, DONE_Y + 3 * PAGE, u) + 0.14 * Math.sin(u * Math.PI) : DONE_Y + (3 - k) * PAGE;
    if (k === 0 && l === 0) o.y += 0.07 * bump(slice(a, SLIDE[1], 1));
  } else {
    // Back to the people: one sheet per bee (the orange thing of this step: a decision), carried to the desk. Then the paper is gone.
    const l = laneOf(i);
    o.x = X[l < 0 ? i % 3 : l];
    o.y = DONE_Y;
    o.z = Z_DN;
    if (step > 3 || l < 0 || i !== FIRST[l]) {
      if (step > 3 && l >= 0 && i === FIRST[l]) {
        o.x += SEAT;
        o.y = DESK_TOP + PAGE / 2;
        o.z = DESK_Z + 0.08;
      }
      o.s = 0;
      return;
    }
    o.hot = 1;
    o.ry = Math.PI;
    if (time < startOf(l) + DROP_AT) {
      beeAt(3, l, time, CARRIER);
      o.x = CARRIER.x;
      o.y = CARRIER.y - CARRY;
      o.z = CARRIER.z;
      o.ry = CARRIER.yaw;
    } else {
      o.x += SEAT;
      o.y = DESK_TOP + PAGE / 2;
      o.z = DESK_Z + 0.08;
    }
  }
}

/** Crumples a sheet material: every vertex is pushed up or down by its instance's `aCrumple`, and the facets are lit flat, like creased paper. */
function crumpled(m: THREE.MeshStandardMaterial) {
  m.flatShading = true;
  m.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aCrumple;')
      .replace(
        '#include <begin_vertex>',
        '#include <begin_vertex>\ntransformed.y += (fract(sin(dot(floor(position.xz * 40.0) + float(gl_InstanceID), vec2(127.1, 311.7))) * 43758.5453) - 0.5) * 0.17 * aCrumple;\ntransformed.xz *= 1.0 - 0.12 * aCrumple;',
      );
  };
  return m;
}

/** A statement, not a blank page: a header block, lines of text and a table. Clay-coloured, tone on tone. */
function sheetTexture() {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 352;
  const g = c.getContext('2d')!;
  g.fillStyle = '#fff';
  g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = '#aaa39c';
  g.fillRect(26, 28, 96, 16);
  g.fillStyle = '#c9c3bc';
  g.fillRect(194, 24, 36, 36);
  g.fillStyle = '#d3cec8';
  [204, 176, 204, 140].forEach((w, i) => g.fillRect(26, 70 + i * 17, w, 6));
  // The table
  g.strokeStyle = '#c4beb7';
  g.lineWidth = 2;
  g.strokeRect(26, 150, 204, 132);
  g.fillStyle = '#e3dfda';
  g.fillRect(27, 151, 202, 20);
  g.beginPath();
  for (let r = 1; r < 6; r++) g.rect(26, 150 + r * 22, 204, 0);
  for (const x of [112, 172]) g.rect(x, 150, 0, 132);
  g.stroke();
  g.fillStyle = '#d3cec8';
  for (let r = 1; r < 6; r++) [[34, 60], [120, 40], [180, 38]].forEach(([x, w]) => g.fillRect(x, 158 + r * 22, w - ((r * 7) % 16), 5));
  g.fillStyle = '#aaa39c';
  g.fillRect(150, 300, 80, 9);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

// What each agent leaves on the paper: a tick where two sheets match, a stamp, a signature.
function tickGeometry() {
  const s = new THREE.Shape();
  [[-0.14, 0.01], [-0.095, 0.055], [-0.04, 0], [0.095, 0.135], [0.14, 0.09], [-0.04, -0.09]].forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
  s.closePath();
  return new THREE.ExtrudeGeometry(s, { depth: 0.014, bevelEnabled: false }).rotateX(-HALF_PI);
}
function signatureGeometry() {
  const pts = Array.from({ length: 13 }, (_, i) => new THREE.Vector3((i / 12) * 0.3, 0, Math.sin(i * 1.9) * 0.035 * (1 - i / 16)));
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 36, 0.011, 5);
}

function Sheets() {
  const { play, mats } = useClay();
  const ref = useRef<THREE.InstancedMesh>(null);
  const ticks = useRef<THREE.InstancedMesh>(null);
  const stamps = useRef<THREE.InstancedMesh>(null);
  const names = useRef<THREE.InstancedMesh>(null);
  const { geo, materials, tick, ring, name, crumple } = useMemo(() => {
    const side = crumpled(new THREE.MeshStandardMaterial({ roughness: 0.95 }));
    const top = crumpled(new THREE.MeshStandardMaterial({ roughness: 0.95, map: sheetTexture() }));
    const geo = new THREE.BoxGeometry(0.62, 0.014, 0.84, 6, 1, 8);
    const crumple = new THREE.InstancedBufferAttribute(new Float32Array(N), 1);
    geo.setAttribute('aCrumple', crumple);
    return { geo, materials: [side, side, top, side, side, side], tick: tickGeometry(), ring: new THREE.RingGeometry(0.075, 0.11, 28).rotateX(-HALF_PI), name: signatureGeometry(), crumple };
  }, []);
  useEffect(
    () => () => {
      geo.dispose();
      tick.dispose();
      ring.dispose();
      name.dispose();
      materials[0].dispose();
      materials[2].map?.dispose();
      materials[2].dispose();
    },
    [geo, tick, ring, name, materials],
  );
  const tmp = useMemo(() => ({ o: new THREE.Object3D(), c: new THREE.Color(), a: blank(), b: blank(), qa: new THREE.Quaternion(), qb: new THREE.Quaternion(), e: new THREE.Euler() }), []);

  useFrame(() => {
    const m = ref.current;
    if (!m) return;
    const { o, c, a, b, qa, qb, e } = tmp;
    const still = play.from === play.to;
    // On the numbers there is no paper left to draw.
    m.visible = !(still && play.to === 4);
    for (let i = 0; m.visible && i < N; i++) {
      sheetAt(play.to, i, play.age, b);
      if (still) {
        o.position.set(b.x, b.y, b.z);
        o.rotation.set(b.rx, b.ry, b.rz);
        o.scale.setScalar(Math.max(b.s, 1e-4));
        c.copy(mats.clay.color).lerp(mats.accent.color, b.hot);
        crumple.array[i] = b.c;
      } else {
        // Sheets leave one after the other and fly in an arc; on the way to the numbers they just clear out.
        sheetAt(play.from, i, play.was, a);
        const u = play.to === 4 ? slice(play.t, 0, 0.35) : slice(play.t, (i / N) * 0.3, 0.7 + (i / N) * 0.3);
        const f = ease(u);
        // What is leaving the story shrinks where it is; what joins it grows where it will be.
        const g = b.s <= 0 ? 0 : a.s <= 0 ? 1 : f;
        o.position.set(lerp(a.x, b.x, g), lerp(a.y, b.y, g) + Math.sin(u * Math.PI) * 0.6 * Math.min(a.s, b.s), lerp(a.z, b.z, g));
        o.quaternion.slerpQuaternions(qa.setFromEuler(e.set(a.rx, a.ry, a.rz)), qb.setFromEuler(e.set(b.rx, b.ry, b.rz)), f);
        o.scale.setScalar(Math.max(lerp(a.s, b.s, f), 1e-4));
        c.copy(mats.clay.color).lerp(mats.accent.color, lerp(a.hot, b.hot, f));
        crumple.array[i] = lerp(a.c, b.c, f);
      }
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      m.setColorAt(i, c);
    }
    m.instanceMatrix.needsUpdate = true;
    crumple.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;

    // The agents' marks: on the item being worked on (0) and on the one done before it (1), which the next one covers.
    const working = play.to === 2 && play.from !== 2 ? slice(play.t, 0.9, 1) : inOut(play, 2);
    for (let l = 0; l < 3; l++) {
      const k = l === 0 ? ticks.current : l === 1 ? stamps.current : names.current;
      if (!k) continue;
      k.visible = working > 0.01;
      if (!k.visible) continue;
      const time = ageOf(play, 2);
      const t = beats(l, time);
      const beat = Math.floor(t);
      const act = t - beat;
      for (let which = 0; which < 2; which++) {
        sheetAt(2, FIRST[l] + ((((which - beat) % ITEMS) + ITEMS) % ITEMS) * (l === 0 ? 2 : 1), time, b);
        o.rotation.set(0, 0, 0);
        o.scale.setScalar(working);
        if (l === 0) {
          // The tick lands on the seam as the two sheets meet.
          o.position.set(X[0], b.y + 0.008, b.z + 0.1);
          if (!which) o.scale.setScalar(Math.max(pop(slice(act, SLIDE[1] - 0.03, SLIDE[1] + 0.12), 2.4) * working, 1e-4));
        } else if (l === 1) {
          // The stamp's mark lands big and settles.
          o.position.set(b.x + 0.12, b.y + 0.009, b.z + 0.2);
          if (!which) o.scale.setScalar(act > STAMP ? (1 + 0.8 * (1 - slice(act, STAMP, STAMP + 0.18))) * working : 1e-4);
        } else {
          // The signature grows from the pen.
          o.position.set(b.x - 0.15, b.y + 0.012, b.z + 0.22);
          if (!which) o.scale.x = Math.max(slice(act, SIGN[0], SIGN[1]) * working, 1e-4);
        }
        o.updateMatrix();
        k.setMatrixAt(which, o.matrix);
      }
      k.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <>
      <instancedMesh ref={ref} args={[geo, materials, N]} castShadow receiveShadow frustumCulled={false} />
      <instancedMesh ref={ticks} args={[tick, mats.accent, 2]} frustumCulled={false} />
      <instancedMesh ref={stamps} args={[ring, mats.accent, 2]} frustumCulled={false} />
      <instancedMesh ref={names} args={[name, mats.accent, 2]} frustumCulled={false} />
    </>
  );
}

// ── Staging ─────────────────────────────────────────────────────────────────
/**
 * Who moves when, for something that is there on steps `on`: it leaves in the first third of a travel
 * and arrives in the last part, unless `table` says otherwise. What leaves has gone before what arrives is there.
 */
const io = (on: number[], table: Record<string, [number, number]> = {}): Wins => {
  const w = wins(table);
  return (from, to) => w(from, to) ?? (on.includes(to) ? [0.5, 0.92] : [0, 0.3]);
};
const STACKS: V3[] = [[X[0] - 0.37, F, Z_ST], [X[0] + 0.37, F, Z_ST], [X[1], F, Z_ST], [X[2], F, Z_ST]];
const IN_TRAY: V3[] = [[0, TRAY_FLOOR, 0]];
const SEATS = X.map((x) => x / PERSON_K);
const reactOf = (i: number, p: Play) => (p.to === 3 ? bump(slice(p.age, startOf(i) + DROP_AT - 0.05, startOf(i) + DROP_AT + 0.75)) : 0);

/**
 * Shown from its third frame. The painted models have a shader of their own; this way it compiles
 * after the first frame has drawn, not with it: two short tasks at mount instead of one long one.
 */
function Late({ children }: { children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  const frames = useRef(0);
  useFrame(() => {
    if (ref.current && frames.current < 3) ref.current.visible = ++frames.current >= 3;
  });
  return (
    <group ref={ref} visible={false}>
      {children}
    </group>
  );
}

// A frame for every step, and a push-in on what matters in it.
const CAMERA: Shot[] = [
  { pos: [0, 5.1, 9.7], look: [0, 0.35, 0.25], to: { pos: [0, 4.8, 9.2], look: [0, 0.35, 0.3] } },
  { pos: [4.5, 5, 8], look: [0.25, 0.55, -0.2], to: { pos: [4.2, 4.7, 7.5], look: [0.25, 0.55, -0.2] } }, // along the way through the hive, on a diagonal
  { pos: [0, 5.3, 8.2], look: [0, 0.35, 0.3], to: { pos: [0, 5, 7.75], look: [0, 0.35, 0.3] } }, // over the three bees at work
  { pos: [0.4, 3.9, 9], look: [0.4, 1.3, -0.5], to: { pos: [0.4, 3.7, 8.6], look: [0.4, 1.3, -0.5] }, over: [0.5, 2.2] },
  { pos: [0, 3.7, 9.6], look: [0, 1.1, 0.2], to: { pos: [0, 3.5, 9.1], look: [0, 1.1, 0.2] }, over: [0.6, 1.8] },
];

export default function HibeexScene() {
  const { mats } = useClay();
  return (
    <>
      <Rig k={CAMERA} />
      <group position={[0, F / 2, 0]}>
        <HexMat r={4.5} h={F} />
      </group>
      <Sheets />
      <Late>
        <Swarm n={3} pose={beeNow} />
      </Late>

      {/* 1 · raw data: four systems plugged into the hive */}
      <Morph k={[{ p: [0, F, SYSTEMS_Z] }, null, null, null, null]} win={io([0], { '4>0': [0.35, 0.85] })}>
        <Late>
          <Systems xs={SYSTEMS} on={0} />
        </Late>
        {SYSTEMS.map((x, i) => (
          <Tag key={NAMES[i]} at={[x, 1.3, 0]} dx={0} dy={-16} on={[0]}>{NAMES[i]}</Tag>
        ))}
      </Morph>
      {SYSTEMS.map((x, i) => (
        <Arrow key={x} a={[x * 0.93, 0.2, SYSTEMS_Z + 0.35]} b={[Math.sign(x) * (i % 3 ? 0.5 : 0.74), i % 3 ? 0.24 : 0.8, HIVE_AT[0][2] - 0.46]} lift={0.25} on={[0]} />
      ))}

      {/* 1 and 2 · the hive: the data comes out of it raw, then goes through it and comes out clean */}
      <Morph k={[{ p: HIVE_AT[0] }, { p: HIVE_AT[1], r: [0, HALF_PI - WAY, 0] }, null, null, null]} win={io([0, 1], { '0>1': [0.1, 0.8], '1>0': [0.1, 0.8], '4>0': [0.3, 0.8] })}>
        <Hive pulse={hivePulse} />
      </Morph>

      {/* 2 · clean, and in order */}
      <Morph k={[null, { p: TRAY_AT, r: [0, -WAY, 0] }, null, null, null]} win={io([1])}>
        <Tray />
        <Reams spots={IN_TRAY} n={TRAY_N} />
      </Morph>
      <Tag at={[HEAP2[0], 0.45, HEAP2[1]]} dx={-30} dy={-34} on={[1]}>Raw</Tag>
      <Tag at={[HIVE_AT[1][0] + 0.55, F + HIVE_H * 0.9, HIVE_AT[1][2] + 0.3]} dx={46} dy={-30} on={[1]}>Clean</Tag>
      <Tag at={[TRAY_AT[0] + 0.3, 0.3, TRAY_AT[2] + 0.5]} dx={20} dy={30} on={[1]}>In order</Tag>

      {/* 3 · the agents at work: a stack each, a tool each */}
      <Morph k={[null, null, {}, null, null]} win={io([2])}>
        <Reams spots={STACKS} n={REAM_N} />
      </Morph>
      <Act f={toolAct(1)}>
        <Stamp />
      </Act>
      <Act f={toolAct(2)}>
        <Pen />
      </Act>
      {AGENTS.map((name, i) => (
        <Tag key={name} at={[X[i], F, Z_DN + 0.62]} dx={0} dy={10} on={[2]}>{name}</Tag>
      ))}

      {/* 4 · back to the people */}
      <Morph k={[null, null, null, { p: [0, F, DESK_Z] }, null]} win={io([3])}>
        <Box size={[6.7, DESK_TOP - F, 0.9]} position={[0.1, (DESK_TOP - F) / 2, 0]} r={0.05} material={mats.shade.board} />
        <group position={[SEAT, 0, -0.72]} scale={PERSON_K}>
          <People xs={SEATS} react={reactOf} />
        </group>
        {PEOPLE.map((name, i) => (
          <Tag key={name} at={[X[i] + SEAT, 2.13 * PERSON_K, -0.72]} dx={0} dy={-10} on={[3]}>{name}</Tag>
        ))}
      </Morph>

      {/* 5 · the result at one client. Clay is before, orange is after. */}
      {/* 8 hours of work became 2 */}
      <Clock on={4} p={[X[0], F, 0]} from={8} to={2} />
      <Tag at={[X[0] - 0.13, F, 1.1]} dx={0} dy={12} on={[4]}>{'8h → 2h\nAccounting service'}</Tag>
      {/* 63.9 days to get paid became 9: a page a day, torn off until 9 are left */}
      <Pad on={4} p={[X[1] - 0.48, F, 0]} w={0.84} h={H} />
      <Calendar on={4} p={[X[1] + 0.48, F, 0]} w={0.84} h={H} days={63.9} keep={9} />
      <Tag at={[X[1], F, 1.1]} dx={0} dy={12} on={[4]}>{'63.9 → 9\nDays to get paid'}</Tag>
      {/* 94 of every 100 reconciled right */}
      <Honeycomb on={4} n={94} p={[X[2], F, 0]} />
      <Tag at={[X[2], F, 1.1]} dx={0} dy={12} on={[4]}>{'94% accurate\nReconciliation'}</Tag>
    </>
  );
}
