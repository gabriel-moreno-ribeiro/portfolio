// Projeto Candela in five steps, with the kit in every one of them: the wooden box opens; what is
// inside is laid out on the desk; three of the experiments run, one after the other, the camera on each;
// then a hand holds a small magnifying glass up to the kit, the camera goes through it to the 28 schools its kits went to, and goes
// into one school to show the students: 3,392 reached, and those who fail physics from 30% to 10%.
import { useEffect } from 'react';
import * as THREE from 'three';
import { BAHIA, BAHIA_AT, CEARA, CEARA_AT, counted, DIVE, ENTER, kidAt, KIT_ON_LENS, Lens, Loupe, onLens, REACH, reached, RESULT, Schools, SCHOOLS, Students, TURN } from './CandelaPeople';
import { Caliper, CAR_GO, Cylinder, Desk, DESK, disposeTones, DROP_X, HANG, HUNG, Incline, KitBox, LET_GO, Lid, LID_OPEN, lidOpen, PULLEY_Y, Riding, SpringScale, Stand, Stopwatch, TagWhen, Tape, TimingHand, Track, Weights } from './CandelaParts';
import { Act, ageOf, at, bump, ease, Morph, Puck, Rig, settle, shown, slice, spring, Tag, useClay, wins, type Play, type Pose, type Shot, type V3 } from './kit';

const HALF_PI = Math.PI / 2;

/** A point given in a setup's own space, taken to the world (setup at `o`, turned `yaw` about Y, scaled `k`). */
const place = (o: V3, yaw: number, [x, y, z]: V3, k = 1): V3 => [
  o[0] + (x * Math.cos(yaw) + z * Math.sin(yaw)) * k,
  o[1] + y * k,
  o[2] + (-x * Math.sin(yaw) + z * Math.cos(yaw)) * k,
];

// ── Where things are, per step ───────────────────────────────────────────────
const BOX: Pose[] = [
  { p: [0, 0, 0.3], r: [0, -0.36, 0], s: 1.25 }, // the hero: it opens
  { p: [0, DESK, -1.15], s: 0.78 }, // open at the back of the desk, what was inside laid out in front of it
  { p: [-3.55, DESK, -2.3], r: [0, 0.35, 0], s: 0.7 }, // closed, at the back, while the experiments run
  { p: onLens(KIT_ON_LENS[0], KIT_ON_LENS[1]), r: [0, -0.12, 0], s: 0.42 }, // on the glass: kits leave it for the schools
  { p: onLens(KIT_ON_LENS[0], KIT_ON_LENS[1]), r: [0, -0.12, 0], s: 0.42 }, // still there, in front of the students
];
const HERO_YAW = BOX[0]!.r![1];
/** Back in the box at step `i`: gone, where the box stands. */
const inBox = (i: number): Pose => ({ p: [BOX[i]!.p![0], BOX[i]!.p![1] + 0.5 * (BOX[i]!.s as number), BOX[i]!.p![2]], s: 0 });
// Parts wait inside the box at the first step (each in its own place, world units from the box's
// centre), spring out of it at the second, turn into an experiment at the third (or go back in the box) and are gone after.
// Gone, they wait where they will be needed next: where they stood, then in their place in the box (so nothing flies across the stage).
const part = (packed: { at: V3; r?: V3; s: number }, laid: Pose, experiment: Pose = inBox(2)): Pose[] => {
  const home: Pose = { p: place(BOX[0]!.p!, HERO_YAW, packed.at), r: packed.r ?? [0, HERO_YAW, 0], s: packed.s };
  return [home, laid, experiment, { ...experiment, s: 0 }, { ...home, s: 0 }];
};
// The setups grow where they stand and fold away on the spot.
const setup = (pose: Pose): Pose[] => [null, null, pose, null, null];
const DESK_AT: Pose[] = [null, { p: [0, 0, 0.3], s: [0.84, 1, 1] }, { p: [0, 0, 0.3] }, null, null];

// Who moves when. The parts spring out of the box one after the other; what leaves a step goes before what arrives.
const W_BOX = wins({ '0>1': [0, 0.6], '1>2': [0, 0.6], '2>3': [0.15, 0.75], '3>4': [0.1, 0.8], '4>0': [0.25, 0.75] }, [0, 0.8]);
const W_DESK = wins({ '0>1': [0.1, 0.6], '1>2': [0, 0.5], '4>1': [0.3, 0.7], '4>2': [0.3, 0.7], '3>1': [0.3, 0.7], '3>2': [0.3, 0.7], '0>2': [0.3, 0.7] }, [0, 0.35]);
const wPart = (d: number) => wins({ '0>1': [0.04 + d, 0.74 + d], '1>2': [0.04 + d, 0.8 + d], '2>3': [d * 0.5, 0.35 + d * 0.5], '4>0': [0.5, 0.9] }, [0, 0.8]);
const wSetup = (d: number) => wins({ '1>2': [d, 0.35 + d], '2>3': [d, 0.38 + d] }, [0, 0.5]);
const SPRUNG = { kick: 2.4, twirl: 1, bounce: 0.18 }; // out of the box like a jack-in-the-box

const DUCK = 1.9; // seconds into the first step when the box gathers itself for the jump
/** A part looks out of the open box: up it comes `when` seconds into the first step, `rise` high, and bobs there. */
const peek = (rise: number, when: number, k: number) => (g: THREE.Group, p: Play, time: number) => {
  const a = ageOf(p, 0);
  // Just before they spring out they duck, as if taking a run-up.
  g.position.y = ((rise * spring(a - when, 2.3, 5) * (1 - 0.6 * bump(slice(a, DUCK, DUCK + 1))) + 0.035 * Math.sin(time * 5 + when * 20) * slice(a, when + 0.4, when + 0.8)) * at(p, 0)) / k;
};

/** The kit box has a body: it squats before the lid flies open, recoils when the parts spring out, pumps while it sends kits out, and gives a jump when it turns the class round. */
const boxAct = (g: THREE.Group, p: Play) => {
  const a0 = ageOf(p, 0);
  const a3 = ageOf(p, REACH) - ENTER; // the kits go once the camera is through the glass
  const a4 = ageOf(p, RESULT);
  const squat = (0.08 * bump(slice(a0, 0.02, 0.22)) - 0.06 * bump(slice(a0, 0.2, 0.5)) + 0.07 * bump(slice(a0, DUCK, DUCK + 1))) * at(p, 0);
  const recoil = p.to === 1 ? 0.16 * bump(slice(p.age, 0.02, 0.32)) : 0;
  const pump = 0.11 * Math.abs(Math.sin(a3 * Math.PI * 4)) * slice(a3, 0.85, 0.95) * (1 - slice(a3, 2.3, 2.6)) * at(p, REACH);
  const jump = bump(slice(a4, TURN - 0.05, TURN + 0.4)) * at(p, RESULT);
  g.scale.y = 1 - squat - recoil - pump - 0.12 * bump(slice(a4, TURN - 0.2, TURN)) * at(p, RESULT) + 0.08 * jump;
  g.position.y = 0.35 * jump;
};
// The lid: it springs open at the first step, stands open while what was inside is laid out, and opens again on the glass to let the kits out.
const lidOf = (p: Play) => lidOpen(ageOf(p, 0)) * at(p, 0) + LID_OPEN * at(p, 1) + LID_OPEN * spring(ageOf(p, REACH) - ENTER - 0.72, 1.7, 4.5) * at(p, REACH);

// ── The experiments, on the desk ─────────────────────────────────────────────
const EXPERIMENTS = 2;
const TRACK: V3 = [-2.2, DESK, 1.75];
const TRACK_K = 1.12;
const INCLINE: V3 = [1.25, DESK, -1.9];
const INCLINE_K = 1.15;
const STAND: V3 = [3.7, DESK, 1.15];
const STAND_YAW = -0.4;
const STAND_K = 1.1;
const WEIGHTS_K = 0.95; // the weights' scale while they hang from the plane
const SCALE_K = 0.9 * STAND_K; // the spring scale and the cylinder are smaller on the stand
const CYLINDER_K = 0.85 * STAND_K;
// The stopwatch is in a student's hand, in front of the track.
const HELD: Pose = { p: [-0.55, 1.0, 3.3], r: [-0.5, -0.25, 0.1], s: 1.15 };
// The hand comes in along its own forearm from outside the frame, and leaves the way it came.
const handAct = (g: THREE.Group, p: Play, time: number) => {
  const k = p.to === EXPERIMENTS ? settle(slice(p.age, 0.2, 0.75), 0.8) : p.from === EXPERIMENTS ? 1 - ease(slice(p.t, 0, 0.4)) : 0;
  g.visible = k > 0.001;
  const out = (1 - k) * 3;
  g.position.set(0.14 * out, -out + Math.sin(time * 2.3) * 0.008, 0);
};
// The camera goes to each experiment as it runs: when it is on each, and what its label shows.
const ON_TRACK: [number, number] = [0.95, 2.05];
const ON_INCLINE: [number, number] = [2.4, 3.2];
const ON_STAND = 3.55;
const during = ([a, b]: [number, number]) => (p: Play) => shown(p, [EXPERIMENTS], a) * (1 - slice(ageOf(p, EXPERIMENTS), b - 0.1, b + 0.1));

// ── Camera: a frame per step and a move inside each ──────────────────────────
const WIDE = { pos: [0, 7.6, 11] as V3, look: [0, 0.4, 0.3] as V3 };
const AT_TRACK = { pos: [-1.6, 5.35, 7.0] as V3, look: [-1.6, 0.2, 2.35] as V3 };
const AT_INCLINE = { pos: [1.55, 2.9, 2.85] as V3, look: [1.3, 0.7, -1.9] as V3 };
const AT_STAND = { pos: [3.9, 3.1, 8.9] as V3, look: [3.5, 1.5, 1.15] as V3 };
const FAR = { pos: [-0.9, 13.1, 12.3] as V3, look: [-0.9, 0.35, 2.0] as V3 };
const FIELD = { pos: [-0.6, 9.2, 7.75] as V3, look: [-0.6, 0.1, 0.55] as V3 };
const CAMERA: Shot[] = [
  { pos: [0.4, 3.75, 8.9], look: [0, 1.5, 0.25], to: { pos: [0.3, 3.9, 9.2], look: [0, 1.5, 0.1] }, over: [0, 0.9] },
  { pos: [0, 8.1, 9.9], look: [0, 0.85, 0.5], to: { pos: [0, 7.9, 9.6], look: [0, 0.85, 0.5] }, over: [0.6, 2.6] },
  {
    pos: WIDE.pos,
    look: WIDE.look,
    path: [
      { at: 0, ...WIDE },
      { at: 0.45, ...WIDE },
      { at: ON_TRACK[0], ...AT_TRACK },
      { at: ON_TRACK[1], ...AT_TRACK },
      { at: ON_INCLINE[0], ...AT_INCLINE },
      { at: ON_INCLINE[1], ...AT_INCLINE },
      { at: ON_STAND, ...AT_STAND },
    ],
  },
  // The schools: from far off, on the kit (it sits in the middle of the glass the hand holds up), then
  // through the glass to the round field. FAR to FIELD is DIVE_LEN long.
  {
    pos: FAR.pos,
    look: FAR.look,
    path: [
      { at: 0, ...FAR },
      { at: DIVE[0], ...FAR },
      { at: DIVE[1], ...FIELD },
      { at: DIVE[1] + 2.4, pos: [-0.6, 9.0, 7.6], look: FIELD.look },
    ],
  },
  // The students: on the middle of the field (a little to its right, for the labels on that side).
  { pos: [-0.6, 8.5, 8.95], look: [-0.6, 0.5, 0.75], to: { pos: [-0.6, 8.3, 8.75], look: [-0.6, 0.5, 0.75] }, over: [0.6, 2.2] },
];

export default function CandelaScene() {
  const { mats } = useClay();
  useEffect(() => () => disposeTones(mats), [mats]);
  const hang = place(STAND, STAND_YAW, HANG, STAND_K);
  const foot = place(STAND, STAND_YAW, [HANG[0], 0.09, HANG[2]], STAND_K);
  const mass: V3 = [INCLINE[0] + DROP_X * INCLINE_K, INCLINE[1] + (PULLEY_Y - 0.22) * INCLINE_K - 0.74 * WEIGHTS_K, INCLINE[2]];
  return (
    <>
      <Rig k={CAMERA} />

      {/* The kit: in every step */}
      <Act f={boxAct}>
        <Morph k={BOX} win={W_BOX} bounce={0.12} arc={0.35}>
          <KitBox />
          <group position={[0, 0.9, 0]}>
            <Lid open={lidOf} />
          </group>
        </Morph>
      </Act>
      <Morph k={DESK_AT} win={W_DESK}>
        <Desk w={10.4} d={6.8} />
      </Morph>

      {/* What's inside. They look out of the open box one by one, then spring out and land on the desk in front of it. */}
      <Morph k={part({ at: [-0.75, 0.55, -0.35], s: 0.85 }, { p: [3.45, DESK + 0.45, 0.55], s: 1.4 })} win={wPart(0.05)} {...SPRUNG}>
        <Act f={peek(0.75, 0.66, 0.85)}>
          <Tape />
        </Act>
        <Tag at={[0, 0.34, 0]} dx={0} dy={-18} on={[1]}>Measuring tape</Tag>
      </Morph>
      <Morph k={part({ at: [-0.3, 0.5, 0.45], r: [Math.PI, -HERO_YAW, 0], s: 0.75 }, { p: [-2.05, DESK + 0.04, 1.95], r: [-HALF_PI, 0, 0.05], s: 1.45 })} win={wPart(0.1)} {...SPRUNG}>
        <Act f={peek(-0.6, 0.78, 0.75)}>
          <Caliper />
        </Act>
        <Tag at={[0.75, -0.2, 0]} dx={0} dy={22} on={[1]}>Caliper</Tag>
      </Morph>
      <Morph k={part({ at: [1.35, 1, -0.45], s: 0.62 }, { p: [1.3, DESK + 0.17, 2.1], r: [-HALF_PI, 0, HALF_PI], s: 1.5 }, { p: hang, s: SCALE_K })} win={wPart(0.25)} {...SPRUNG}>
        <Act f={peek(0.65, 1.14, 0.62)}>
          <SpringScale
            bob={
              <Morph k={[null, null, { p: [0, -0.28, 0] }, null, null]}>
                <Puck r={0.07} h={0.2} bevel={0.03} material={mats.shade.dark} />
              </Morph>
            }
          />
        </Act>
        <Tag at={[-0.16, -0.6, 0]} dx={0} dy={14} on={[1]}>Spring scale</Tag>
      </Morph>
      <Morph k={part({ at: [-1.3, 0.52, 0.3], s: 0.8 }, { p: [0.3, DESK + 0.13, 0.65], r: [-HALF_PI, 0, 0.2], s: 1.5 }, HELD)} win={wPart(0)} {...SPRUNG}>
        <Act f={peek(0.55, 0.54, 0.8)}>
          <Stopwatch>
            <Act f={handAct}>
              <TimingHand />
            </Act>
          </Stopwatch>
        </Act>
        <Tag at={[0, -0.42, 0]} dx={0} dy={12} on={[1]}>Stopwatch</Tag>
      </Morph>
      <Morph k={part({ at: [0.55, 0.15, 0.45], s: 0.95 }, { p: [-2.05, DESK, 0.5], s: 1.5 }, { p: mass, s: WEIGHTS_K })} win={wPart(0.15)} {...SPRUNG}>
        <Act f={peek(0.6, 0.9, 0.95)}>
          <Riding k={INCLINE_K / WEIGHTS_K}>
            <Weights />
          </Riding>
        </Act>
        <Tag at={[0, 0.78, 0]} dx={0} dy={-16} on={[1]}>Weights</Tag>
      </Morph>
      <Morph k={part({ at: [1.3, 0.15, 0.35], s: 0.78 }, { p: [-3.5, DESK, 0.3], s: 1.35 }, { p: foot, s: CYLINDER_K })} win={wPart(0.2)} {...SPRUNG}>
        <Act f={peek(0.55, 1.02, 0.78)}>
          <Cylinder />
        </Act>
        <Tag at={[-0.1, 0.75, 0]} dx={-6} dy={-62} on={[1]}>{'Graduated\ncylinder'}</Tag>
      </Morph>

      {/* Three of the five experiments. Each runs as the camera gets to it. */}
      <Morph k={setup({ p: TRACK, r: [0, 0.06, 0], s: TRACK_K })} win={wSetup(0)}>
        <Track />
      </Morph>
      <Morph k={setup({ p: INCLINE, s: INCLINE_K })} win={wSetup(0.05)} bounce={0.1}>
        <Incline />
      </Morph>
      <Morph k={setup({ p: STAND, r: [0, STAND_YAW, 0], s: STAND_K })} win={wSetup(0.1)} bounce={0.1}>
        <Stand />
      </Morph>
      <TagWhen at={[TRACK[0] - 1.2, 0.2, TRACK[2] - 1.15]} dx={-10} dy={-40} on={during([CAR_GO + 0.1, ON_TRACK[1]])}>The car, timed</TagWhen>
      <TagWhen at={[INCLINE[0] - 0.4, 1.05, INCLINE[2]]} dx={-30} dy={-40} on={during([LET_GO + 0.1, ON_INCLINE[1]])}>Inclined plane</TagWhen>
      <TagWhen at={[hang[0] + 0.15, hang[1] - 0.6, hang[2]]} dx={70} dy={-10} on={during([HUNG + 0.2, 99])}>{'Spring scale\n+ cylinder'}</TagWhen>

      {/* The ending, through the magnifying glass: the 28 schools, then the students of one of them */}
      <Loupe />
      <Lens />
      <Schools />
      <TagWhen at={onLens(BAHIA_AT[0], BAHIA_AT[1], 0.6)} dx={-44} dy={-8} on={(p) => shown(p, [REACH], ENTER + 1.2)}>{`Bahia · ${BAHIA}`}</TagWhen>
      <TagWhen at={onLens(CEARA_AT[0], CEARA_AT[1], 0.6)} dx={30} dy={-30} on={(p) => shown(p, [REACH], ENTER + 1.6)}>{`Ceará · ${CEARA}`}</TagWhen>
      <TagWhen at={onLens(-1.75, 2.35, 0.05)} dx={-34} dy={30} on={(p) => shown(p, [REACH], ENTER + 1.05)} text={(p) => (reached(p) === 1 ? '1 school' : `${reached(p)} schools`)}>
        {`${SCHOOLS} schools`}
      </TagWhen>
      <Students />
      <TagWhen at={kidAt(0, 1.0)} dx={-16} dy={-50} on={(p) => shown(p, [RESULT], 0.55)} text={(p) => `${counted(p)} students`}>3,392 students</TagWhen>
      <TagWhen at={kidAt(25, 1.25)} dx={78} dy={-62} on={(p) => shown(p, [RESULT], 1.2)} text={(p) => (ageOf(p, RESULT) < TURN + 0.35 ? 'Failed physics · 30%' : 'Failed physics · 30% → 10%')}>
        {'Failed physics · 30% → 10%'}
      </TagWhen>
    </>
  );
}
