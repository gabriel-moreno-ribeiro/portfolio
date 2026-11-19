// Laptop repair in six steps, the first four one repair on one bench: a broken laptop comes in; it is
// taken apart (the screen off, turned over, the screws, the cover: the insides, and a broken fan);
// WiFixit, on the laptop as it lies open (a hand photographs the fan, the repair guide comes back);
// the fan is swapped for the new one and it all goes back together. Then a Hindi tutorial goes through
// the Python script and comes back in Portuguese, and 121 laptops go to 21 states. Facts: src/content/onePager.ts.
// Between steps, what leaves goes first and what arrives comes after, so nothing passes through anything.
import * as THREE from 'three';
import { Act, ageOf, Arrow, at, bump, ease, Morph, pop, Rig, ring, settle, slice, spring, Tag, wins, type Play, type Shot, type V3, type Wins } from './kit';
import { Bench, FAN_AT, Mat, MAT, MAT_CENTER } from './LaptopBench';
import { Desk, DESK_H } from './LaptopDesk';
import {
  BrazilMap,
  Carton,
  H_BASE,
  landAt,
  Hand,
  Laptop,
  LiveTag,
  onScreen,
  Phone,
  PHONE_LENS,
  PHONE_SCREEN,
  SALVADOR_AT,
  SCREEN,
  showOn,
  SubtitleChip,
  Terminal,
  toWorld,
  TutorialCard,
  Wave,
  REACHED,
} from './LaptopParts';
import { apart, APART, BACK, benchScale, onBench, OPENED, PHOTO, SHOT, stepOf, T, whole } from './teardown';

const lerp = THREE.MathUtils.lerp;
const HIDE = 1e-4;
const HINDI = 4;
const MAP = 5;
const smooth = (u: number) => u * u * (3 - 2 * u);
/**
 * Who moves when, for something that is there on steps `on`: it leaves in the first third of a travel
 * and arrives in the last (`arrive`), unless `table` says otherwise for a pair of steps. So whichever
 * step is picked by hand, what leaves has gone before what arrives is there.
 */
const io = (on: number[], table: Record<string, [number, number]> = {}, arrive: [number, number] = [0.5, 0.9]): Wins => {
  const w = wins(table);
  return (from, to) => w(from, to) ?? (on.includes(to) ? arrive : [0, 0.3]);
};
/** Like `at`, for small things in the air: gone at once when the story leaves step `i`. */
const here = (p: Play, i: number) => (p.to === i ? (p.from === i ? 1 : p.t) : p.from === i ? 1 - ease(slice(p.t, 0, 0.3)) : 0);

// ── Where things are ─────────────────────────────────────────────────────────
const CARTON_AT: V3 = [-1.15, 0, -1.75];
const CARTON_YAW = 0.2;
const BENCH: V3 = [0, MAT[1], -0.15];
// The map lies on the desk, in front of what stands at its back.
const MAP_AT: V3 = [0.1, 0, 0.35];
const MAP_SCALE = 0.85;
const MAT_POSE = { p: [BENCH[0] + MAT_CENTER[0], 0, BENCH[2] + MAT_CENTER[2]] as V3 };
const TUTORIAL_AT: V3 = [-1.6, 0, 0.3];
/** The laptop at each step: position and turn about Y. */
const SPOT: { p: V3; yaw: number }[] = [
  { p: [0.95, 0, 0.8], yaw: -0.2 }, // out of the carton, set down in front of it
  { p: BENCH, yaw: 0 }, // taken apart on the mat
  { p: BENCH, yaw: 0 }, // photographed, open
  { p: BENCH, yaw: 0 }, // put back together
  { p: TUTORIAL_AT, yaw: 0.42 }, // playing the tutorial
  { p: TUTORIAL_AT, yaw: 0.42 }, // gone
];
const TERMINAL: V3 = [1.6, 0, -0.3];
const TERMINAL_YAW = -0.35;
const WAVE_AT: V3 = [0.25, 0, 1.2];
// The photo: a hand holds a phone over the open laptop, the screen up towards us and the camera on
// its back looking down at the broken fan.
const HOLD_AT: V3 = [2.05, 0.82, 1.3]; // the bottom of the phone
const HOLD_K = 1.25;
const HOLD = new THREE.Euler(-0.95, 0.75, 0, 'YXZ'); // tipped back, turned towards the fan

/** A point given in something's own space (at `o`, turned `yaw`, scaled `k`), in the world. */
const place = (o: V3, yaw: number, [x, y, z]: V3, k = 1): V3 => [o[0] + (x * Math.cos(yaw) + z * Math.sin(yaw)) * k, o[1] + y * k, o[2] + (-x * Math.sin(yaw) + z * Math.cos(yaw)) * k];
/** A point in the held phone's own space, in the world. */
const onPhone = (v: V3): V3 => new THREE.Vector3(...v).multiplyScalar(HOLD_K).applyEuler(HOLD).add(new THREE.Vector3(...HOLD_AT)).toArray() as V3;

// ── 1 · It comes in ──────────────────────────────────────────────────────────
// The flaps spring open one by one, the laptop is lifted out and set down beside the carton, its lid
// opens, and it tries to start: the screen flickers and all it can do is pull a sad face.
const FLAPS = 0.55;
const LIFT: [number, number] = [0.95, 1.3];
const OVER: [number, number] = [1.22, 1.78];
const LID_AT = 1.74;
const SAD_AT = 2.08;
const flapOf = (p: Play, k: number) => 2.45 * spring(ageOf(p, 0) - FLAPS - k * 0.09, 1.3, 5);
// The lid: springing open out of the carton, and nodding once when the laptop starts again.
const lidOf = (p: Play) => 1 - at(p, 0) * (1 - Math.min(1.04, spring(ageOf(p, 0) - LID_AT, 1.4, 5))) + 0.05 * ring(ageOf(p, BACK) - T.on, 3.2, 5) * at(p, BACK);
// The carton has a body too: it gives as the laptop is pulled out of it.
const cartonAct = (g: THREE.Group, p: Play) => void (g.scale.y = 1 - 0.07 * bump(slice(ageOf(p, 0), LIFT[0] - 0.05, LIFT[0] + 0.3)) * at(p, 0));

// ── The laptop's path ────────────────────────────────────────────────────────
interface Pose { x: number; y: number; z: number; yaw: number; tilt: number; s: number }
const pose = (): Pose => ({ x: 0, y: 0, z: 0, yaw: 0, tilt: 0, s: 1 });
/** Where the laptop is `age` seconds into `step`. */
function laptopAt(step: number, age: number, o: Pose) {
  const s = SPOT[step];
  o.x = s.p[0];
  o.y = s.p[1];
  o.z = s.p[2];
  o.yaw = s.yaw;
  o.tilt = 0;
  o.s = step === MAP ? 0 : 1;
  // Fixed, it gives a small jump of joy as the screen comes on.
  if (step === BACK) o.y += 0.09 * bump(slice(age, T.on + 0.02, T.on + 0.3));
  if (step !== 0) return;
  // In the carton, lifted straight up out of it, then over and down beside it, where it bounces once.
  const up = ease(slice(age, LIFT[0], LIFT[1]));
  const u = slice(age, OVER[0], OVER[1]);
  const e = settle(u, 0.5);
  o.x = lerp(CARTON_AT[0], s.p[0], e);
  o.z = lerp(CARTON_AT[2], s.p[2], e);
  // It stays up until it is clear of the carton's front wall and flap, and only then comes down.
  o.y = lerp(0.08 + 1.35 * up, s.p[1], ease(slice(u, 0.45, 1))) + 0.3 * bump(u) + 0.07 * bump(slice(age, OVER[1], OVER[1] + 0.2));
  o.yaw = lerp(CARTON_YAW, s.yaw, ease(u));
  o.tilt = bump(u) * 0.12;
}
const A = pose();
const B = pose();
function put(g: THREE.Group, o: Pose, s: number) {
  g.position.set(o.x, o.y, o.z);
  g.rotation.set(0, o.yaw, o.tilt);
  g.scale.setScalar(Math.max(s, HIDE));
  g.visible = s > 0.001;
}
const laptopAct = (g: THREE.Group, p: Play) => {
  laptopAt(p.to, p.age, B);
  if (p.from === p.to) return put(g, B, B.s);
  laptopAt(p.from, p.was, A);
  // It only travels in one piece, between two places it stands in. Otherwise (taken apart, leaving
  // the story, still or back in the closed carton) it shrinks away where it is and pops in where it will be.
  const from = onBench(p.from);
  const to = onBench(p.to);
  // On the bench it stays put and comes and goes with the bench.
  if (from && to) return put(g, B, benchScale(p));
  if (A.s === 0 || B.s === 0 || p.to === 0 || (p.from === 0 && p.was < OVER[1]) || !whole(p.from, p.was) || !whole(p.to, 0)) {
    if (p.t < 0.5) return put(g, A, A.s * (1 - ease(slice(p.t, 0, 0.3))));
    return put(g, B, B.s * (p.to === 0 ? (p.t >= 1 ? 1 : 0) : to ? benchScale(p) : pop(slice(p.t, 0.55, 0.9))));
  }
  const u = slice(p.t, p.from === BACK ? 0.4 : 0.15, 0.9);
  const f = settle(u, 0.5);
  const hop = A.x !== B.x || A.z !== B.z ? Math.sin(u * Math.PI) * 0.45 : 0;
  g.position.set(lerp(A.x, B.x, f), lerp(A.y, B.y, f) + hop, lerp(A.z, B.z, f));
  g.rotation.set(0, lerp(A.yaw, B.yaw, f), lerp(A.tilt, B.tilt, f));
  g.scale.setScalar(1);
  g.visible = true;
};

const SWAP = 2.1; // the subtitles come back in Portuguese
const screenOf = (p: Play) => {
  const s = stepOf(p);
  if (s === 0) return ageOf(p, 0) > SAD_AT ? SCREEN.sad : SCREEN.off;
  if (s === BACK) return ageOf(p, BACK) > T.on ? SCREEN.on : SCREEN.off;
  if (s === HINDI) return ageOf(p, HINDI) > SWAP ? SCREEN.portuguese : SCREEN.hindi;
  return SCREEN.off;
};
// Broken, the screen flickers twice as it tries to start. Fixed, it flashes up and settles: the end of the repair.
const glowOf = (p: Play) => {
  const a = ageOf(p, 0) - SAD_AT;
  return (0.5 * bump(slice(a, 0, 0.1)) + 0.4 * bump(slice(a, 0.16, 0.3))) * at(p, 0) + 0.9 * bump(slice(ageOf(p, BACK), T.on, T.on + 0.6)) * at(p, BACK);
};
const flipOf = (p: Play) => apart(p, T.flip);
const detachedOf = (p: Play) => apart(p, T.display);
const coverOf = (p: Play) => apart(p, T.cover);
const screwOf = (p: Play, k: number) => apart(p, T.screws[k]);
const hingeOf = (p: Play, k: number) => apart(p, T.hinge[k]);

// ── 5 · The script ───────────────────────────────────────────────────────────
// The Hindi subtitle leaves the screen for the script, the script works on it, and it comes back in
// Portuguese (orange): the screen changes and the dub starts.
const SEND: [number, number] = [0.72, 1.16];
const TYPE: [number, number] = [1.12, 1.7];
const RETURN: [number, number] = [1.66, SWAP];
const typedOf = (p: Play) => slice(ageOf(p, HINDI), TYPE[0], TYPE[1]);
const waveAct = (g: THREE.Group, p: Play) => {
  const s = (p.to === HINDI ? pop(slice(ageOf(p, HINDI), SWAP, SWAP + 0.35)) : 1) * (p.from === HINDI && p.to !== HINDI ? 1 - ease(slice(p.t, 0, 0.3)) : p.to === HINDI ? 1 : 0);
  g.scale.setScalar(Math.max(s, HIDE));
  g.visible = s > 0.001;
};
// The script has a body: it swallows the subtitle, shakes while it works and gives as it sends the answer out.
const terminalAct = (g: THREE.Group, p: Play) => {
  const a = ageOf(p, HINDI);
  const busy = slice(a, TYPE[0], TYPE[0] + 0.1) * (1 - slice(a, TYPE[1] - 0.1, TYPE[1]));
  g.scale.y = 1 + (0.07 * bump(slice(a, SEND[1] - 0.06, SEND[1] + 0.16)) - 0.035 * busy * Math.abs(Math.sin(a * 26)) - 0.08 * bump(slice(a, RETURN[0] - 0.04, RETURN[0] + 0.2))) * at(p, HINDI);
};
// The trip to the script and back, from the laptop's screen to the terminal's.
const SCREEN_RIGHT = place(SPOT[HINDI].p, SPOT[HINDI].yaw, onScreen(0.9, 1.05));
const SCREEN_LOW = place(SPOT[HINDI].p, SPOT[HINDI].yaw, onScreen(0.95, 0.45));
const TERM_LEFT = place(TERMINAL, TERMINAL_YAW, [-0.98, 1.2, -0.05]);
const TERM_LOW = place(TERMINAL, TERMINAL_YAW, [-0.98, 0.62, -0.05]);
const SUBTITLE = place(SPOT[HINDI].p, SPOT[HINDI].yaw, [0, onScreen(0, 0.56)[1], onScreen(0, 0.56)[2] + 0.1]);
const TERM_SCREEN = place(TERMINAL, TERMINAL_YAW, [0, 0.98, 0.1]);
/** A subtitle in the air from `a` to `b` during `win`: out of one screen with a pop, over in an arc, into the other. */
const chipAct = (a: V3, b: V3, win: [number, number]) => (g: THREE.Group, p: Play) => {
  const u = slice(ageOf(p, HINDI), win[0], win[1]);
  const s = (u <= 0 || u >= 1 ? 0 : Math.min(pop(slice(u, 0, 0.3)), 1.25) * (1 - slice(u, 0.82, 1) ** 2)) * here(p, HINDI);
  g.visible = s > 0.001;
  if (!g.visible) return;
  const e = smooth(u);
  g.position.set(lerp(a[0], b[0], e), lerp(a[1], b[1], e) + Math.sin(u * Math.PI) * 0.5, lerp(a[2], b[2], e));
  g.rotation.set(-0.15, 0, Math.sin(u * Math.PI * 2) * (b[0] > a[0] ? -0.22 : 0.22));
  g.scale.setScalar(s);
};
// ── 3 · WiFixit ──────────────────────────────────────────────────────────────
// The laptop lies open as the teardown left it, its fan broken. A hand comes in with a phone, holds
// it over the laptop, the thumb goes to the button and presses, the flash fires, the phone thinks,
// and the repair guide for the fan comes up on its screen, step by step, still in the hand.
const tickAt = (i: number) => SHOT.guide[1] - 0.05 + i * 0.13;
const phoneScreen = (p: Play) => {
  const a = ageOf(p, PHOTO);
  return a < SHOT.flash ? SCREEN.viewfinder : a < SHOT.flash + 0.14 ? SCREEN.flash : SCREEN.waiting;
};
const phoneGlow = (p: Play) => 1.4 * bump(slice(ageOf(p, PHOTO), SHOT.flash - 0.02, SHOT.flash + 0.2));
// The thumb swings over to the button, presses as the flash fires, and goes back to the edge of the phone.
const thumbOf = (p: Play) => {
  const a = ageOf(p, PHOTO);
  return ease(slice(a, SHOT.aim - 0.02, SHOT.flash - 0.04)) * (1 - ease(slice(a, SHOT.flash + 0.12, SHOT.flash + 0.42)));
};
// The hand comes in along its own forearm from outside the frame, a little past its place and back
// (taking aim), kicks as it shoots, and never holds quite still. It leaves the way it came.
const ARM = new THREE.Vector3(0, -1, 0).applyEuler(HOLD);
const handAct = (g: THREE.Group, p: Play, time: number) => {
  const a = ageOf(p, PHOTO);
  const k = p.to === PHOTO ? settle(slice(a, SHOT.in[0], SHOT.in[1]), 0.8) : p.from === PHOTO ? 1 - ease(slice(p.t, 0, 0.4)) : 0;
  g.visible = k > 0.001;
  if (!g.visible) return;
  const out = (1 - k) * 3.4 - 0.06 * bump(slice(a, SHOT.flash, SHOT.flash + 0.22));
  g.position.set(HOLD_AT[0] + ARM.x * out, HOLD_AT[1] + ARM.y * out + Math.sin(time * 2.3) * 0.012, HOLD_AT[2] + ARM.z * out);
  g.rotation.order = 'YXZ';
  g.rotation.set(HOLD.x + Math.sin(time * 1.7) * 0.012 - 0.05 * bump(slice(a, SHOT.flash, SHOT.flash + 0.25)), HOLD.y, 0);
};
const cardAct = (g: THREE.Group, p: Play) => {
  const u = slice(ageOf(p, PHOTO), SHOT.guide[0], SHOT.guide[1]);
  const s = (u <= 0 ? 0 : lerp(0.3, 1, pop(u, 2))) * at(p, PHOTO);
  g.position.set(PHONE_SCREEN[0], PHONE_SCREEN[1], lerp(0.03, 0.05, u));
  g.scale.setScalar(Math.max(s, HIDE));
  g.visible = s > 0.001;
};
const tickOf = (p: Play, i: number) => pop(slice(ageOf(p, PHOTO), tickAt(i), tickAt(i) + 0.22), 2.2);
const LENS = onPhone(PHONE_LENS);
const FAN: V3 = [BENCH[0] + FAN_AT[0], BENCH[1] + FAN_AT[1], BENCH[2] + FAN_AT[2]];
// The camera's view: from the lens to the two sides of the fan.
const VIEW: V3[] = [
  [FAN[0] - 0.26, FAN[1] + 0.03, FAN[2] - 0.1],
  [FAN[0] + 0.26, FAN[1] + 0.03, FAN[2] + 0.1],
];
// Where "Photo of the problem" hangs on the view: near the lens.
const VIEW_TAG: V3 = [lerp(VIEW[0][0], LENS[0], 0.8), lerp(VIEW[0][1], LENS[1], 0.8), lerp(VIEW[0][2], LENS[2], 0.8)];

// ── 6 · 21 states ────────────────────────────────────────────────────────────
const landed = (p: Play) => {
  const a = ageOf(p, MAP);
  let n = 0;
  for (let k = 0; k < REACHED.length; k++) if (a >= landAt(k)) n++;
  return p.to === MAP || p.from === MAP ? n : 0;
};

// ── Camera: a frame per step and a move inside each ──────────────────────────
// The bench has its frames: on the laptop (the screen comes off, it turns over), close over the base
// (the screws, the cover, the insides), the whole mat (open, with everything that came off around it),
// the same moved over to make room for the hand, and the laptop alone as it is closed and starts.
const NEAR = { pos: [0.2, 4.5, 6.0] as V3, look: [0, 0.3, -0.6] as V3 };
const OVER_IT = { pos: [0, 5.2, 4.3] as V3, look: [0, 0.05, -0.32] as V3 };
const OPEN = { pos: [-0.35, 5.6, 5.5] as V3, look: [-0.35, 0.1, -0.72] as V3 };
const MID = { pos: [-0.15, 6.1, 5.9] as V3, look: [-0.15, 0.6, -0.75] as V3 };
const SHOTS: Shot[] = [
  { pos: [-0.1, 3.9, 7.85], look: [-0.35, 0.75, -0.45], to: { pos: [0.2, 3.6, 7.25], look: [-0.2, 0.68, -0.33] }, over: [0.7, 2.4] },
  {
    pos: NEAR.pos,
    look: NEAR.look,
    path: [
      { at: 0, ...NEAR },
      { at: T.flip[0] + 0.3, ...NEAR },
      { at: T.screws[4][0], ...OVER_IT },
      { at: T.cover[0] + 0.2, ...OVER_IT },
      { at: OPENED + 0.3, ...OPEN },
    ],
  },
  { pos: [0, 5.6, 6.2], look: [0, 0.2, -0.62], to: { pos: [0.05, 5.35, 5.95], look: [0.03, 0.25, -0.6] }, over: [SHOT.aim, 2.4] },
  {
    pos: OPEN.pos,
    look: OPEN.look,
    path: [
      { at: 0, ...OPEN },
      { at: T.swap[1], ...OPEN },
      { at: T.screws[0][2] + 0.25, ...MID },
      { at: T.display[2] + 0.16, ...MID },
      { at: T.on + 0.1, pos: [0.15, 2.8, 5.0], look: [0, 0.82, -0.5] },
    ],
  },
  { pos: [0, 3.6, 8.1], look: [0, 0.8, 0.2], to: { pos: [0, 3.4, 7.6], look: [0, 0.78, 0.2] }, over: [0.5, 2.3] },
  { pos: [0.2, 6.3, 6.7], look: [0.1, 0, 0.25], to: { pos: [0.2, 5.95, 6.3], look: [0.1, 0, 0.25] }, over: [0.5, 2.6] },
];
// Everything stands on the desk, which stands on the page: the cameras go up with it.
const up = ([x, y, z]: V3): V3 => [x, y + DESK_H, z];
const CAMERA: Shot[] = SHOTS.map((c) => ({
  ...c,
  pos: up(c.pos),
  look: up(c.look),
  to: c.to && { pos: up(c.to.pos), look: up(c.to.look) },
  path: c.path?.map((f) => ({ at: f.at, pos: up(f.pos), look: up(f.look) })),
}));

export default function LaptopScene() {
  return (
    <group position={[0, DESK_H, 0]}>
      <Rig k={CAMERA} />
      <Desk />

      {/* 1 · the carton: it comes back with the loop (closed, the laptop inside), and folds away as the laptop goes to the bench */}
      <Morph k={[{ p: CARTON_AT, r: [0, CARTON_YAW, 0] }, null, null, null, null, null]} win={io([0], { '0>1': [0, 0.35], '5>0': [0.3, 0.85] }, [0.45, 1])} bounce={0.12}>
        <Act f={cartonAct}>
          <Carton flap={flapOf} />
        </Act>
        <Tag at={[-0.9, 0.8, 1]} dx={-26} dy={-52} on={[0]} after={FLAPS}>By referral</Tag>
      </Morph>

      {/* 1 to 5 · the laptop */}
      <Act f={laptopAct}>
        <Laptop lid={lidOf} screen={screenOf} glow={glowOf} flip={flipOf} detached={detachedOf} cover={coverOf} screw={screwOf} hinge={hingeOf} />
        <Tag at={onScreen(0.7, 1.2)} dx={40} dy={-34} on={[0]} after={SAD_AT + 0.15}>Broken</Tag>
        <Tag at={onScreen(0.6, 1.25)} dx={44} dy={-30} on={[BACK]} after={T.on + 0.15}>Works again</Tag>
        <Tag at={onScreen(0, 1.42)} dx={0} dy={-22} on={[HINDI]}>Hindi tutorial</Tag>
      </Act>

      {/* 1 to 5 · the mat on the desk; 2 to 4 · the bench: the insides, the tools, every loose piece */}
      <Morph k={[MAT_POSE, MAT_POSE, MAT_POSE, MAT_POSE, MAT_POSE, null]} win={io([0, APART, PHOTO, BACK, HINDI], {}, [0.2, 0.55])}>
        <group position={[0, MAT[1], 0]}>
          <Mat />
        </group>
      </Morph>
      <group position={BENCH}>
        <Bench />
      </group>

      {/* 3 · WiFixit: a hand photographs the broken fan in the open laptop, and the repair guide comes back on the phone */}
      <Act f={handAct} scale={HOLD_K}>
        <Phone screen={phoneScreen} glow={phoneGlow}>
          <Act f={cardAct}>
            <TutorialCard step={tickOf} />
          </Act>
          <Hand thumb={thumbOf} />
          <Tag at={[0.3, 0.95, 0.05]} dx={54} dy={-6} on={[PHOTO]} after={SHOT.guide[1]}>Tutorial</Tag>
          <Tag at={[0.34, 0.5, 0.05]} dx={50} dy={16} on={[PHOTO]} after={SHOT.in[1]}>WiFixit</Tag>
        </Phone>
      </Act>
      {VIEW.map((v, i) => (
        <Arrow key={i} a={LENS} b={v} lift={0} head={false} on={[PHOTO]} after={SHOT.aim} />
      ))}
      <Tag at={VIEW_TAG} dx={-12} dy={-94} on={[PHOTO]} after={SHOT.flash + 0.05}>{'Photo of\nthe problem'}</Tag>

      {/* 5 · the Hindi subtitle goes to the script, and comes back in Portuguese, with a dub */}
      <Morph k={[null, null, null, null, { p: TERMINAL, r: [0, TERMINAL_YAW, 0] }, null]} win={io([HINDI], { '3>4': [0.7, 1] })} bounce={0.1}>
        <Act f={terminalAct}>
          <Terminal typed={typedOf} />
        </Act>
        <Tag at={[0, 1.75, -0.05]} dx={0} dy={-22} on={[HINDI]} after={SEND[1] - 0.15}>Python script</Tag>
      </Morph>
      <Arrow a={SCREEN_RIGHT} b={TERM_LEFT} lift={0.45} on={[HINDI]} after={SEND[0]} />
      <Arrow a={TERM_LOW} b={SCREEN_LOW} lift={-0.15} on={[HINDI]} after={RETURN[0]} />
      <Act f={chipAct(SUBTITLE, TERM_SCREEN, SEND)}>
        <SubtitleChip />
      </Act>
      <Act f={chipAct(TERM_SCREEN, SUBTITLE, RETURN)}>
        <SubtitleChip portuguese />
      </Act>
      <Act position={WAVE_AT} f={waveAct}>
        <Wave on={(p) => slice(ageOf(p, HINDI), SWAP, SWAP + 0.3) * at(p, HINDI)} />
        <Tag at={[0.6, 0.2, 0]} dx={40} dy={30} on={[HINDI]} after={SWAP + 0.25}>Portuguese dub</Tag>
      </Act>

      {/* 6 · 121 laptops, 21 states: one boxed laptop after another from Salvador; each state turns orange as its box lands */}
      <group position={MAP_AT} scale={MAP_SCALE}>
        <BrazilMap />
        <Tag at={[SALVADOR_AT[0], H_BASE + 0.25, SALVADOR_AT[2]]} dx={56} dy={34} on={[MAP]} after={0.6}>{'Salvador\n121 laptops'}</Tag>
        <LiveTag at={toWorld([52, 196])} dx={0} dy={0} on={showOn([MAP], landAt(0))} text={(p) => (landed(p) === 1 ? '1 state' : `${landed(p)} states`)}>21 states</LiveTag>
      </group>
    </group>
  );
}
