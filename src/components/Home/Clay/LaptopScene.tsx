// Laptop repair in five steps: a broken laptop comes in, it is fixed on the bench, a Hindi tutorial
// goes through the Python script and comes back in Portuguese, WiFixit (a photo of the problem, the
// tutorial back), and 121 laptops to 21 states. Facts: src/content/onePager.ts.
// Between steps, what leaves goes first and what arrives comes after, so nothing passes through anything.
import * as THREE from 'three';
import { STATES } from './brazilMap';
import { Act, ageOf, Arrow, at, bump, ease, Morph, pop, Rig, settle, slice, spring, Tag, wins, type Play, type Shot, type V3 } from './kit';
import {
  BrazilMap,
  Carton,
  Dish,
  H_BASE,
  landAt,
  Laptop,
  LiveTag,
  Mat,
  MAT,
  NewPart,
  OLD_REST,
  OldPart,
  onScreen,
  PART,
  Phone,
  PHONE_FRAME,
  PHONE_LEAN,
  PHONE_LENS,
  PHONE_SCREEN,
  REACHED,
  REPAIR,
  SALVADOR_AT,
  SCREEN,
  Screw,
  Screwdriver,
  showOn,
  Terminal,
  toWorld,
  TutorialCard,
  Wave,
} from './LaptopParts';

const lerp = THREE.MathUtils.lerp;
const HIDE = 1e-4;

// ── Where things are ─────────────────────────────────────────────────────────
const CARTON_AT: V3 = [-1.7, 0, -0.35];
const CARTON_YAW = 0.2;
/** The laptop at each step: position, turn about Y, scale. */
const SPOT: { p: V3; yaw: number }[] = [
  { p: [1.4, 0, 0.55], yaw: -0.2 }, // out of the carton
  { p: [0.9, MAT[1], 0], yaw: 0 }, // on the mat
  { p: [-1.75, 0, 0.25], yaw: 0.42 }, // playing the tutorial
  { p: [-0.9, 0, -0.45], yaw: 0.2 }, // the problem on screen
  { p: [-0.9, 0, -0.45], yaw: 0.2 }, // gone
];
const TERMINAL: V3 = [1.6, 0, -0.35];
const TERMINAL_YAW = -0.35;
const WAVE_AT: V3 = [0.3, 0, 1.15];
const PHONE_AT: V3 = [1.35, 0, 0.9];
const PHONE_YAW = 0.45;
const PHONE_K = 1.15;

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
  o.s = step === 4 ? 0 : 1;
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
    else u = slice(p.t, p.from === 1 ? 0.4 : 0.15, 0.9);
  }
  const f = p.from === p.to ? 1 : B.s === 0 || A.s === 0 ? u : settle(u, 0.5);
  const src = p.from === p.to ? B : A;
  g.position.set(lerp(src.x, B.x, f), lerp(src.y, B.y, f) + (p.from === p.to || A.s === 0 || B.s === 0 ? 0 : Math.sin(u * Math.PI) * 0.45), lerp(src.z, B.z, f));
  g.rotation.set(0, lerp(src.yaw, B.yaw, f), lerp(src.tilt, B.tilt, f));
  const s = p.from === p.to ? B.s : A.s === 0 ? (u >= 1 ? 1 : 0) : lerp(A.s, B.s, u);
  g.scale.setScalar(Math.max(s, HIDE));
  g.visible = s > 0.001;
};

// The deck: off at the start of the repair, back on as the story leaves the bench.
const DECK_OFF: V3 = [-2.85, -0.18, 0.35];
const offAt = (age: number) => ease(slice(age, REPAIR.deck[0], REPAIR.deck[1]));
const deckAct = (g: THREE.Group, p: Play) => {
  const off = p.to === 1 ? offAt(p.age) : p.from === 1 ? offAt(p.was) * (1 - ease(slice(p.t, 0, 0.4))) : 0;
  g.position.set(DECK_OFF[0] * off, DECK_OFF[1] * off + Math.sin(off * Math.PI) * 0.8, DECK_OFF[2] * off);
  g.rotation.set(0, 0.15 * off, Math.sin(off * Math.PI) * 0.25);
};
const stepOf = (p: Play) => (p.t > 0.5 ? p.to : p.from);
const SWAP = 2.05; // the subtitles come back in Portuguese
const screenOf = (p: Play) => [SCREEN.off, ageOf(p, 1) > REPAIR.fixed ? SCREEN.on : SCREEN.off, ageOf(p, 2) > SWAP ? SCREEN.portuguese : SCREEN.hindi, SCREEN.error, SCREEN.off][stepOf(p)];
const fanOf = (p: Play) => slice(ageOf(p, 1), REPAIR.fixed - 0.1, REPAIR.fixed + 0.3) * at(p, 1);

// ── 3 · The script ───────────────────────────────────────────────────────────
const TYPE: [number, number] = [1.15, 1.85];
const typedOf = (p: Play) => slice(ageOf(p, 2), TYPE[0], TYPE[1]);
const waveAct = (g: THREE.Group, p: Play) => {
  const s = (p.to === 2 ? pop(slice(ageOf(p, 2), SWAP + 0.05, SWAP + 0.4)) : 1) * (p.from === 2 && p.to !== 2 ? 1 - ease(slice(p.t, 0, 0.3)) : p.to === 2 ? 1 : 0);
  g.scale.setScalar(Math.max(s, HIDE));
  g.visible = s > 0.001;
};
// The trip to the script and back, from the laptop's screen to the terminal's.
const SCREEN_RIGHT = place(SPOT[2].p, SPOT[2].yaw, onScreen(0.9, 1.05));
const SCREEN_LOW = place(SPOT[2].p, SPOT[2].yaw, onScreen(0.95, 0.45));
const TERM_LEFT = place(TERMINAL, TERMINAL_YAW, [-0.98, 1.2, -0.05]);
const TERM_LOW = place(TERMINAL, TERMINAL_YAW, [-0.98, 0.62, -0.05]);

// ── 4 · WiFixit ──────────────────────────────────────────────────────────────
const AIM = 0.85; // the camera finds the problem
const FLASH = 1.2;
const BACK: [number, number] = [1.75, 2.3];
const phoneScreen = (p: Play) => {
  const a = ageOf(p, 3);
  return a < FLASH ? SCREEN.viewfinder : a < FLASH + 0.14 ? SCREEN.flash : SCREEN.waiting;
};
const phoneGlow = (p: Play) => 1.4 * bump(slice(ageOf(p, 3), FLASH - 0.02, FLASH + 0.2));
const snapAct = (g: THREE.Group, p: Play) => void (g.scale.y = 1 - 0.06 * bump(slice(ageOf(p, 3), FLASH, FLASH + 0.18)));
const CARD_FROM: V3 = [0.15, 2.05, 0.35];
const CARD_AT: V3 = [PHONE_SCREEN[0], PHONE_SCREEN[1], 0.05];
const cardAct = (g: THREE.Group, p: Play) => {
  const a = ageOf(p, 3);
  const u = slice(a, BACK[0], BACK[1]);
  const e = settle(u, 0.6);
  g.position.set(lerp(CARD_FROM[0], CARD_AT[0], e), lerp(CARD_FROM[1], CARD_AT[1], e), lerp(CARD_FROM[2], CARD_AT[2], e));
  g.rotation.set(0.3 * (1 - ease(u)), -0.5 * (1 - ease(u)), 0.2 * (1 - ease(u)));
  const s = pop(slice(a, BACK[0] - 0.1, BACK[0] + 0.15)) * at(p, 3);
  g.scale.setScalar(Math.max(s, HIDE));
  g.visible = s > 0.001;
};
const LENS = onPhone(PHONE_LENS);
// The camera's view: from the lens to the near corners of the screen, so no line crosses the picture.
const VIEW = [onScreen(0.99, 1.39), onScreen(0.99, 0.21)].map((v) => place(SPOT[3].p, SPOT[3].yaw, v));
const VIEW_TOP: V3 = [(LENS[0] + VIEW[0][0]) / 2, (LENS[1] + VIEW[0][1]) / 2, (LENS[2] + VIEW[0][2]) / 2];

// ── 5 · 21 states ────────────────────────────────────────────────────────────
const AM = STATES.find((s) => s.uf === 'AM')!;
const landed = (p: Play) => {
  const a = ageOf(p, 4);
  let n = 0;
  for (let k = 0; k < REACHED.length; k++) if (a >= landAt(k)) n++;
  return p.to === 4 || p.from === 4 ? n : 0;
};

// ── Camera: a frame per step and a push-in on its moment ─────────────────────
const CAMERA: Shot[] = [
  { pos: [0, 4.3, 9.7], look: [-0.15, 0.75, 0.1], to: { pos: [0.15, 3.9, 9], look: [-0.1, 0.7, 0.1] }, over: [0.8, 2.8] },
  { pos: [0.1, 7.1, 7.9], look: [-0.2, 0.25, 0.15], to: { pos: [0.3, 6.6, 7.2], look: [0, 0.25, 0.15] }, over: [0.8, 3.2] },
  { pos: [0, 4.4, 10.3], look: [-0.1, 0.85, 0], to: { pos: [0, 4.2, 9.8], look: [-0.1, 0.85, 0] } },
  { pos: [0.35, 3.5, 9.6], look: [0.15, 1.2, 0], to: { pos: [0.45, 3.3, 9], look: [0.2, 1.2, 0.05] }, over: [0.6, 2.6] },
  { pos: [0.3, 7.9, 8.4], look: [0.15, 0, 0.15], to: { pos: [0.3, 7.5, 7.9], look: [0.15, 0, 0.15] }, over: [0.6, 3.2] },
];

export default function LaptopScene() {
  return (
    <>
      <Rig k={CAMERA} />

      {/* 1 · the carton: it comes back with the loop (closed, the laptop inside), and folds away as the laptop goes to the bench */}
      <Morph k={[{ p: CARTON_AT, r: [0, CARTON_YAW, 0] }, null, null, null, null]} win={wins({ '0>1': [0, 0.35], '4>0': [0.45, 1] }, [0, 0.35])}>
        <Carton flap={flapOf} />
        <Tag at={[0.85, 0.85, 1]} dx={30} dy={-46} on={[0]} after={FLAPS}>By referral</Tag>
      </Morph>

      {/* 1 to 4 · the laptop */}
      <Act f={laptopAct}>
        <Laptop lid={lidOf} screen={screenOf} deck={deckAct} fan={fanOf} />
        <Tag at={onScreen(0.7, 1.2)} dx={40} dy={-34} on={[0]} after={LID_AT + 0.45}>Broken</Tag>
        <Tag at={onScreen(0, 1.42)} dx={0} dy={-22} on={[2]}>Hindi tutorial</Tag>
        <Tag at={onScreen(-0.9, 1.42)} dx={-30} dy={-30} on={[3]}>Software problem</Tag>
      </Act>

      {/* 2 · the bench: the mat, the tools, the parts (in the laptop's own space, the mat's top at y = 0) */}
      <Morph k={[null, { p: [SPOT[1].p[0] - 1, 0, SPOT[1].p[2] + 0.3] }, null, null, null]} win={wins({ '0>1': [0.3, 0.65], '1>2': [0.2, 0.5] }, [0, 0.3])}>
        <group position={[0, MAT[1], 0]}>
          <Mat />
        </group>
      </Morph>
      <group position={[SPOT[1].p[0], MAT[1], SPOT[1].p[2]]}>
        <Act
          position={[1.75, 0, 0.78]}
          f={(g, p) => {
            const s = p.to === 1 ? (p.from === 1 ? 1 : pop(slice(p.t, 0.7, 1))) : p.from === 1 ? 1 - ease(slice(p.t, 0, 0.3)) : 0;
            g.scale.setScalar(Math.max(s, HIDE));
            g.visible = s > 0.001;
          }}
        >
          <Dish />
        </Act>
        <Screwdriver />
        <Screw k={0} />
        <Screw k={1} />
        <OldPart />
        <NewPart />
        <Tag at={[0.55, 0.1, 1.14]} dx={-36} dy={34} on={[1]} after={2.5}>Screwdriver</Tag>
        <Tag at={[OLD_REST[0] + 0.1, 0.05, OLD_REST[2]]} dx={48} dy={-18} on={[1]} after={2.85}>Old part</Tag>
        <Tag at={[PART[0] - 0.2, 0.12, PART[2]]} dx={-96} dy={-6} on={[1]} after={REPAIR.in[1] + 0.05}>New part</Tag>
      </group>

      {/* 3 · the Hindi tutorial goes to the script, and comes back with Portuguese subtitles and a dub */}
      <Morph k={[null, null, { p: TERMINAL, r: [0, TERMINAL_YAW, 0] }, null, null]} win={wins({ '1>2': [0.75, 1] }, [0, 0.35])} bounce={0.08}>
        <Terminal typed={typedOf} />
        <Tag at={[0, 1.75, -0.05]} dx={0} dy={-22} on={[2]} after={TYPE[0] - 0.1}>Python script</Tag>
      </Morph>
      <Arrow a={SCREEN_RIGHT} b={TERM_LEFT} lift={0.45} on={[2]} after={0.95} />
      <Arrow a={TERM_LOW} b={SCREEN_LOW} lift={-0.15} on={[2]} after={TYPE[1] + 0.05} />
      <Act position={WAVE_AT} f={waveAct}>
        <Wave on={(p) => slice(ageOf(p, 2), SWAP, SWAP + 0.3) * at(p, 2)} />
        <Tag at={[0.6, 0.2, 0]} dx={40} dy={30} on={[2]} after={SWAP + 0.3}>Portuguese dub</Tag>
      </Act>

      {/* 4 · WiFixit: the phone photographs the problem, and the tutorial comes back to it */}
      <Morph k={[null, null, null, { p: PHONE_AT, r: [0, PHONE_YAW, 0], s: PHONE_K }, null]} win={wins({ '2>3': [0.6, 1] }, [0, 0.3])} bounce={0.08}>
        <Act f={snapAct}>
          <Phone screen={phoneScreen} glow={phoneGlow}>
            <Act f={cardAct}>
              <TutorialCard />
            </Act>
            <Tag at={[0.3, 0.95, 0.05]} dx={46} dy={-14} on={[3]} after={BACK[1] + 0.05}>Tutorial</Tag>
          </Phone>
        </Act>
        <Tag at={[0.34, 0.06, 0.3]} dx={40} dy={26} on={[3]}>WiFixit</Tag>
      </Morph>
      {VIEW.map((v, i) => (
        <Arrow key={i} a={LENS} b={v} lift={0} head={false} on={[3]} after={AIM} />
      ))}
      <Tag at={VIEW_TOP} dx={6} dy={-46} on={[3]} after={FLASH + 0.1}>{'Photo of\nthe problem'}</Tag>

      {/* 5 · 121 laptops, 21 states: one laptop after another from Salvador; each state turns orange as its laptop lands */}
      <BrazilMap />
      <Tag at={[SALVADOR_AT[0], H_BASE + 0.25, SALVADOR_AT[2]]} dx={56} dy={34} on={[4]} after={0.7}>{'Salvador\n121 laptops'}</Tag>
      <LiveTag at={toWorld([52, 196])} dx={0} dy={0} on={showOn([4], landAt(0))} text={(p) => `${landed(p)} states`}>21 states</LiveTag>
      <Tag at={toWorld(AM.c, H_BASE)} dx={-16} dy={-44} on={[4]} after={landAt(REACHED.length - 1) + 0.3}>Not reached</Tag>
    </>
  );
}
