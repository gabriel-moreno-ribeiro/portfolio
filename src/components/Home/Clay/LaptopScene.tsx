// Laptop repair in six steps: a broken laptop comes in; it is taken apart on the bench (the screen
// off, turned over, the screws, the cover, every part laid out); a part is swapped and it all goes
// back; a Hindi tutorial goes through the Python script and comes back in Portuguese; WiFixit (a photo
// of a hardware problem, the repair guide back); and 121 laptops to 21 states. Facts: src/content/onePager.ts.
// Between steps, what leaves goes first and what arrives comes after, so nothing passes through anything.
import * as THREE from 'three';
import { Act, ageOf, Arrow, at, bump, ease, Morph, pop, Rig, settle, slice, spring, Tag, wins, type Play, type Shot, type V3 } from './kit';
import { Bench, Crack, Fan, Mat, MAT, MAT_CENTER } from './LaptopBench';
import {
  BrazilMap,
  Carton,
  H_BASE,
  landAt,
  Laptop,
  LiveTag,
  onScreen,
  Phone,
  PHONE_FRAME,
  PHONE_LEAN,
  PHONE_LENS,
  PHONE_SCREEN,
  SALVADOR_AT,
  SCREEN,
  showOn,
  Terminal,
  toWorld,
  TutorialCard,
  Wave,
  REACHED,
} from './LaptopParts';
import { apart, BACK, T } from './teardown';

const lerp = THREE.MathUtils.lerp;
const HIDE = 1e-4;
const HINDI = 3;
const WIFIXIT = 4;
const MAP = 5;

// ── Where things are ─────────────────────────────────────────────────────────
const CARTON_AT: V3 = [-1.7, 0, -0.35];
const CARTON_YAW = 0.2;
const BENCH: V3 = [0, MAT[1], -0.15];
/** The laptop at each step: position and turn about Y. */
const SPOT: { p: V3; yaw: number }[] = [
  { p: [1.4, 0, 0.55], yaw: -0.2 }, // out of the carton
  { p: BENCH, yaw: 0 }, // taken apart on the mat
  { p: BENCH, yaw: 0 }, // put back together
  { p: [-1.75, 0, 0.25], yaw: 0.42 }, // playing the tutorial
  { p: [-1.35, MAT[1], -0.85], yaw: 0.2 }, // on a mat, beside the broken part
  { p: [-1.35, MAT[1], -0.85], yaw: 0.2 }, // gone
];
const TERMINAL: V3 = [1.6, 0, -0.35];
const TERMINAL_YAW = -0.35;
const WAVE_AT: V3 = [0.3, 0, 1.15];
const PHONE_AT: V3 = [1.55, MAT[1], 1.45];
const PHONE_YAW = 0.75;
const PHONE_K = 1.15;
const BROKEN_AT: V3 = [0.45, MAT[1] + 0.06, 0.45];
const BROKEN_K = 2.4;
const WIFI_MAT: V3 = [-0.3, 0, 0];
const WIFI_MAT_SIZE: V3 = [5.2, MAT[1], 3.8];

/** A point given in something's own space (at `o`, turned `yaw`, scaled `k`), in the world. */
const place = (o: V3, yaw: number, [x, y, z]: V3, k = 1): V3 => [o[0] + (x * Math.cos(yaw) + z * Math.sin(yaw)) * k, o[1] + y * k, o[2] + (-x * Math.sin(yaw) + z * Math.cos(yaw)) * k];
/** A point in the phone's leaning frame, in the world. */
const onPhone = ([x, y, z]: V3): V3 => {
  const c = Math.cos(PHONE_LEAN);
  const s = Math.sin(PHONE_LEAN);
  return place(PHONE_AT, PHONE_YAW, [PHONE_FRAME[0] + x, PHONE_FRAME[1] + y * c - z * s, PHONE_FRAME[2] + y * s + z * c], PHONE_K);
};

// ── 1 · It comes in ──────────────────────────────────────────────────────────
// The flaps open one by one, the laptop is lifted out and set down beside the carton, then its lid opens.
const FLAPS = 0.8;
const LIFT: [number, number] = [1.35, 1.7];
const OVER: [number, number] = [1.7, 2.25];
const LID_AT = 2.35;
const flapOf = (p: Play, k: number) => 2.45 * spring(ageOf(p, 0) - FLAPS - k * 0.12, 1.3, 5);
const lidOf = (p: Play) => 1 - at(p, 0) * (1 - Math.min(1.04, spring(ageOf(p, 0) - LID_AT, 1.4, 5)));

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
  if (step !== 0) return;
  // In the carton, lifted straight up out of it, then over and down beside it.
  const up = ease(slice(age, LIFT[0], LIFT[1]));
  const u = slice(age, OVER[0], OVER[1]);
  const e = settle(u, 0.5);
  o.x = lerp(CARTON_AT[0], s.p[0], e);
  o.z = lerp(CARTON_AT[2], s.p[2], e);
  o.y = lerp(0.08 + 1.35 * up, s.p[1], ease(u));
  o.yaw = lerp(CARTON_YAW, s.yaw, ease(u));
  o.tilt = bump(u) * 0.1;
}
const A = pose();
const B = pose();
const laptopAct = (g: THREE.Group, p: Play) => {
  laptopAt(p.to, p.age, B);
  let u = 1;
  if (p.from !== p.to) {
    laptopAt(p.from, p.was, A);
    // Leaving the story it shrinks early; coming back it is already in the closed carton.
    if (B.s === 0) u = ease(slice(p.t, 0, 0.3));
    else if (A.s === 0) u = p.t >= 1 ? 1 : 0;
    else u = slice(p.t, p.from === BACK ? 0.4 : 0.15, 0.9);
  }
  const still = p.from === p.to;
  const f = still ? 1 : B.s === 0 || A.s === 0 ? u : settle(u, 0.5);
  const src = still ? B : A;
  const moving = !still && A.s !== 0 && B.s !== 0 && (A.x !== B.x || A.z !== B.z);
  g.position.set(lerp(src.x, B.x, f), lerp(src.y, B.y, f) + (moving ? Math.sin(u * Math.PI) * 0.45 : 0), lerp(src.z, B.z, f));
  g.rotation.set(0, lerp(src.yaw, B.yaw, f), lerp(src.tilt, B.tilt, f));
  const s = still ? B.s : A.s === 0 ? (u >= 1 ? 1 : 0) : lerp(A.s, B.s, u);
  g.scale.setScalar(Math.max(s, HIDE));
  g.visible = s > 0.001;
};

const stepOf = (p: Play) => (p.t > 0.5 ? p.to : p.from);
const SWAP = 2.05; // the subtitles come back in Portuguese
const screenOf = (p: Play) =>
  [SCREEN.off, SCREEN.off, ageOf(p, BACK) > T.on ? SCREEN.on : SCREEN.off, ageOf(p, HINDI) > SWAP ? SCREEN.portuguese : SCREEN.hindi, SCREEN.off, SCREEN.off][stepOf(p)];
// The screen coming on is the end of the repair: it flashes up, then settles.
const glowOf = (p: Play) => 0.9 * bump(slice(ageOf(p, BACK), T.on, T.on + 0.7)) * at(p, BACK);
const flipOf = (p: Play) => apart(p, T.flip);
const detachedOf = (p: Play) => apart(p, T.display);
const coverOf = (p: Play) => apart(p, T.cover);
const screwOf = (p: Play, k: number) => apart(p, T.screws[k]);
const hingeOf = (p: Play, k: number) => apart(p, T.hinge[k]);

// ── 4 · The script ───────────────────────────────────────────────────────────
const TYPE: [number, number] = [1.15, 1.85];
const typedOf = (p: Play) => slice(ageOf(p, HINDI), TYPE[0], TYPE[1]);
const waveAct = (g: THREE.Group, p: Play) => {
  const s = (p.to === HINDI ? pop(slice(ageOf(p, HINDI), SWAP + 0.05, SWAP + 0.4)) : 1) * (p.from === HINDI && p.to !== HINDI ? 1 - ease(slice(p.t, 0, 0.3)) : p.to === HINDI ? 1 : 0);
  g.scale.setScalar(Math.max(s, HIDE));
  g.visible = s > 0.001;
};
// The trip to the script and back, from the laptop's screen to the terminal's.
const SCREEN_RIGHT = place(SPOT[HINDI].p, SPOT[HINDI].yaw, onScreen(0.9, 1.05));
const SCREEN_LOW = place(SPOT[HINDI].p, SPOT[HINDI].yaw, onScreen(0.95, 0.45));
const TERM_LEFT = place(TERMINAL, TERMINAL_YAW, [-0.98, 1.2, -0.05]);
const TERM_LOW = place(TERMINAL, TERMINAL_YAW, [-0.98, 0.62, -0.05]);

// ── 5 · WiFixit ──────────────────────────────────────────────────────────────
// A broken fan lies by the laptop. The phone photographs it, and a repair guide for it comes back.
const AIM = 0.85;
const FLASH = 1.2;
const RETURN: [number, number] = [1.75, 2.3];
const phoneScreen = (p: Play) => {
  const a = ageOf(p, WIFIXIT);
  return a < FLASH ? SCREEN.viewfinder : a < FLASH + 0.14 ? SCREEN.flash : SCREEN.waiting;
};
const phoneGlow = (p: Play) => 1.4 * bump(slice(ageOf(p, WIFIXIT), FLASH - 0.02, FLASH + 0.2));
const snapAct = (g: THREE.Group, p: Play) => void (g.scale.y = 1 - 0.06 * bump(slice(ageOf(p, WIFIXIT), FLASH, FLASH + 0.18)));
const CARD_FROM: V3 = [0.15, 2.05, 0.35];
const CARD_AT: V3 = [PHONE_SCREEN[0], PHONE_SCREEN[1], 0.05];
const cardAct = (g: THREE.Group, p: Play) => {
  const a = ageOf(p, WIFIXIT);
  const u = slice(a, RETURN[0], RETURN[1]);
  const e = settle(u, 0.6);
  g.position.set(lerp(CARD_FROM[0], CARD_AT[0], e), lerp(CARD_FROM[1], CARD_AT[1], e), lerp(CARD_FROM[2], CARD_AT[2], e));
  g.rotation.set(0.3 * (1 - ease(u)), -0.5 * (1 - ease(u)), 0.2 * (1 - ease(u)));
  const s = pop(slice(a, RETURN[0] - 0.1, RETURN[0] + 0.15)) * at(p, WIFIXIT);
  g.scale.setScalar(Math.max(s, HIDE));
  g.visible = s > 0.001;
};
const LENS = onPhone(PHONE_LENS);
// The camera's view: from the lens to the two sides of the fan.
const VIEW: V3[] = [
  [BROKEN_AT[0] - 0.44, BROKEN_AT[1], BROKEN_AT[2] - 0.16],
  [BROKEN_AT[0] + 0.4, BROKEN_AT[1], BROKEN_AT[2] + 0.24],
];
const VIEW_TOP: V3 = [(LENS[0] + VIEW[0][0]) / 2, (LENS[1] + VIEW[0][1]) / 2, (LENS[2] + VIEW[0][2]) / 2];

// ── 6 · 21 states ────────────────────────────────────────────────────────────
const landed = (p: Play) => {
  const a = ageOf(p, MAP);
  let n = 0;
  for (let k = 0; k < REACHED.length; k++) if (a >= landAt(k)) n++;
  return p.to === MAP || p.from === MAP ? n : 0;
};

// ── Camera: a frame per step and a move inside each ──────────────────────────
const WIDE = { pos: [-0.1, 5.7, 4.6] as V3, look: [-0.1, 0, 0.45] as V3 };
const SCREWS = { pos: [0.1, 4.7, 4.5] as V3, look: [0, 0.1, -0.15] as V3 };
const CAMERA: Shot[] = [
  { pos: [0, 4.3, 9.7], look: [-0.15, 0.75, 0.1], to: { pos: [0.15, 3.9, 9], look: [-0.1, 0.7, 0.1] }, over: [0.8, 2.8] },
  // Close on the laptop for the screen and the turn, over the screws, down into the open laptop (held),
  // then back just enough to see the parts laid out around it.
  {
    pos: [0.3, 4.2, 5.8],
    look: [0, 0.3, -0.3],
    path: [
      { at: 0, pos: [0.3, 4.2, 5.8], look: [0, 0.3, -0.3] },
      { at: 2.0, pos: [0.3, 4.2, 5.8], look: [0, 0.3, -0.3] },
      { at: 2.6, ...SCREWS },
      { at: 3.6, ...SCREWS },
      { at: 4.15, pos: [0, 3.7, 2.2], look: [0, 0, -0.1] },
      { at: 4.75, pos: [0, 3.7, 2.2], look: [0, 0, -0.1] },
      { at: 5.8, ...WIDE },
    ],
  },
  {
    pos: WIDE.pos,
    look: WIDE.look,
    path: [
      { at: 0, ...WIDE },
      { at: 2.3, ...WIDE },
      { at: 2.9, ...SCREWS },
      { at: 3.85, ...SCREWS },
      { at: 4.4, pos: [0.2, 4.0, 5.4], look: [0, 0.4, -0.4] },
      { at: 5.4, pos: [0.15, 2.6, 4.5], look: [0, 0.7, -0.5] },
    ],
  },
  { pos: [0, 4.4, 10.3], look: [-0.1, 0.85, 0], to: { pos: [0, 4.2, 9.8], look: [-0.1, 0.85, 0] } },
  { pos: [0.2, 3.7, 6.9], look: [-0.05, 0.55, 0.1], to: { pos: [0.3, 3.4, 6.4], look: [0.05, 0.6, 0.15] }, over: [0.6, 2.6] },
  { pos: [0.3, 7.9, 8.4], look: [0.15, 0, 0.15], to: { pos: [0.3, 7.5, 7.9], look: [0.15, 0, 0.15] }, over: [0.6, 3.2] },
];

export default function LaptopScene() {
  return (
    <>
      <Rig k={CAMERA} />

      {/* 1 · the carton: it comes back with the loop (closed, the laptop inside), and folds away as the laptop goes to the bench */}
      <Morph k={[{ p: CARTON_AT, r: [0, CARTON_YAW, 0] }, null, null, null, null, null]} win={wins({ '0>1': [0, 0.35], '5>0': [0.45, 1] }, [0, 0.35])}>
        <Carton flap={flapOf} />
        <Tag at={[0.85, 0.85, 1]} dx={30} dy={-46} on={[0]} after={FLAPS}>By referral</Tag>
      </Morph>

      {/* 1 to 5 · the laptop */}
      <Act f={laptopAct}>
        <Laptop lid={lidOf} screen={screenOf} glow={glowOf} flip={flipOf} detached={detachedOf} cover={coverOf} screw={screwOf} hinge={hingeOf} />
        <Tag at={onScreen(0.7, 1.2)} dx={40} dy={-34} on={[0]} after={LID_AT + 0.45}>Broken</Tag>
        <Tag at={onScreen(0.6, 1.25)} dx={44} dy={-30} on={[BACK]} after={T.on + 0.3}>Works again</Tag>
        <Tag at={onScreen(0, 1.42)} dx={0} dy={-22} on={[HINDI]}>Hindi tutorial</Tag>
      </Act>

      {/* 2 and 3 · the bench: the mat, the insides, the tools, every loose piece */}
      <Morph k={[null, { p: [BENCH[0] + MAT_CENTER[0], 0, BENCH[2] + MAT_CENTER[2]] }, { p: [BENCH[0] + MAT_CENTER[0], 0, BENCH[2] + MAT_CENTER[2]] }, null, null, null]} win={wins({ '0>1': [0.3, 0.65], '2>3': [0.2, 0.5] }, [0, 0.3])}>
        <group position={[0, MAT[1], 0]}>
          <Mat />
        </group>
      </Morph>
      <group position={BENCH}>
        <Bench />
      </group>

      {/* 4 · the Hindi tutorial goes to the script, and comes back with Portuguese subtitles and a dub */}
      <Morph k={[null, null, null, { p: TERMINAL, r: [0, TERMINAL_YAW, 0] }, null, null]} win={wins({ '2>3': [0.75, 1] }, [0, 0.35])} bounce={0.08}>
        <Terminal typed={typedOf} />
        <Tag at={[0, 1.75, -0.05]} dx={0} dy={-22} on={[HINDI]} after={TYPE[0] - 0.1}>Python script</Tag>
      </Morph>
      <Arrow a={SCREEN_RIGHT} b={TERM_LEFT} lift={0.45} on={[HINDI]} after={0.95} />
      <Arrow a={TERM_LOW} b={SCREEN_LOW} lift={-0.15} on={[HINDI]} after={TYPE[1] + 0.05} />
      <Act position={WAVE_AT} f={waveAct}>
        <Wave on={(p) => slice(ageOf(p, HINDI), SWAP, SWAP + 0.3) * at(p, HINDI)} />
        <Tag at={[0.6, 0.2, 0]} dx={40} dy={30} on={[HINDI]} after={SWAP + 0.3}>Portuguese dub</Tag>
      </Act>

      {/* 5 · WiFixit: a broken part of the laptop on the mat beside it, the phone photographs it, and the repair guide comes back to it */}
      <Morph k={[null, null, null, null, { p: WIFI_MAT }, null]} win={wins({ '3>4': [0.25, 0.6] }, [0, 0.3])}>
        <group position={[0, MAT[1], 0]}>
          <Mat size={WIFI_MAT_SIZE} />
        </group>
      </Morph>
      <Morph k={[null, null, null, null, { p: BROKEN_AT, r: [0, 0.4, 0], s: BROKEN_K }, null]} win={wins({ '3>4': [0.55, 0.9] }, [0, 0.3])} bounce={0.1}>
        <Fan broken />
        <Crack />
        <Tag at={[-0.14, 0.03, 0.1]} dx={-50} dy={40} on={[WIFIXIT]} after={0.3}>Hardware problem</Tag>
      </Morph>
      <Morph k={[null, null, null, null, { p: PHONE_AT, r: [0, PHONE_YAW, 0], s: PHONE_K }, null]} win={wins({ '3>4': [0.6, 1] }, [0, 0.3])} bounce={0.08}>
        <Act f={snapAct}>
          <Phone screen={phoneScreen} glow={phoneGlow}>
            <Act f={cardAct}>
              <TutorialCard />
            </Act>
            <Tag at={[0.3, 0.95, 0.05]} dx={46} dy={-14} on={[WIFIXIT]} after={RETURN[1] + 0.05}>Tutorial</Tag>
          </Phone>
        </Act>
        <Tag at={[0.34, 0.06, 0.3]} dx={40} dy={26} on={[WIFIXIT]}>WiFixit</Tag>
      </Morph>
      {VIEW.map((v, i) => (
        <Arrow key={i} a={LENS} b={v} lift={0} head={false} on={[WIFIXIT]} after={AIM} />
      ))}
      <Tag at={VIEW_TOP} dx={6} dy={-46} on={[WIFIXIT]} after={FLASH + 0.1}>{'Photo of\nthe problem'}</Tag>

      {/* 6 · 121 laptops, 21 states: one laptop after another from Salvador; each state turns orange as its laptop lands */}
      <BrazilMap />
      <Tag at={[SALVADOR_AT[0], H_BASE + 0.25, SALVADOR_AT[2]]} dx={56} dy={34} on={[MAP]} after={0.7}>{'Salvador\n121 laptops'}</Tag>
      <LiveTag at={toWorld([52, 196])} dx={0} dy={0} on={showOn([MAP], landAt(0))} text={(p) => `${landed(p)} states`}>21 states</LiveTag>
    </>
  );
}
