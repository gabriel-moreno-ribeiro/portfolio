// Laptop repair in five steps: a broken laptop comes in, it is fixed on the bench, the Hindi
// tutorials go through the Python script and come out in Portuguese, WiFixit (a photo of the
// problem, the tutorial back), and 121 laptops to 21 states. Facts: src/content/onePager.ts.
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { SALVADOR, STATES } from './brazilMap';
import { Act, ageOf, Arrow, at, bump, ease, Morph, pop, Rig, settle, slice, spring, Tag, useClay, wins, type Play, type Pose, type Shot, type V3 } from './kit';
import { BrazilMap, Carton, FIXED_AT, H_LIT, Laptop, Phone, PHONE_SCREEN, PhotoCard, SCREEN, Script, toWorld, TutorialCard, Wave } from './LaptopParts';

const lerp = THREE.MathUtils.lerp;

// ── Where things are, per step ───────────────────────────────────────────────
const SALVADOR_AT = toWorld(SALVADOR, H_LIT);
const CARTON: Pose[] = [{ p: [-1.75, 0, -0.4], r: [0, 0.22, 0] }, null, null, null, { p: SALVADOR_AT, r: [0, 0.3, 0], s: 0.13 }];
const LAPTOP: Pose[] = [
  { p: [1.05, 0, 0.6], r: [0, -0.22, 0] }, // out of the carton
  { p: [0.35, 0, 0.15], r: [0, -0.1, 0], s: 1.15 }, // on the bench, deck off
  { p: [-2.6, 0, 0.25], r: [0, 0.5, 0], s: 0.95 }, // playing the tutorial
  { p: [-0.75, 0, -0.55], r: [0, 0.15, 0] }, // the problem on screen
  null,
];
const DECK: Pose[] = [{}, { p: [-2.75, -0.15, 0.55], r: [0, 0.35, 0] }, {}, {}, {}];
const W_DECK = wins({ '0>1': [0, 0.65], '1>2': [0.1, 0.8] }, [0, 0.6]);
const W_LAPTOP = wins({ '4>0': [0.2, 0.8] }, [0, 0.8]);

// ── 1 · It comes in ──────────────────────────────────────────────────────────
/** How high the carton still is as it drops in, `a` seconds into the first step. */
const dropAt = (a: number) => 2.4 * (1 - slice(a, 0.05, 0.42) ** 2);
const FLAPS = 0.5;
const HOP: [number, number] = [1, 1.55];
const LID_AT = 1.6;
const cartonAct = (g: THREE.Group, p: Play) => {
  const a = ageOf(p, 0);
  g.position.y = dropAt(a) * at(p, 0);
  g.scale.y = 1 - 0.14 * bump(slice(a, 0.42, 0.62)) * at(p, 0);
};
const openFlaps = (p: Play) => spring(ageOf(p, 0) - FLAPS, 1.3, 5) * at(p, 0);
// The laptop waits inside the carton, then hops out over its wall to where it stands.
const INSIDE = new THREE.Vector3(CARTON[0]!.p![0] - LAPTOP[0]!.p![0], 0.08, CARTON[0]!.p![2] - LAPTOP[0]!.p![2]);
const hopAct = (g: THREE.Group, p: Play) => {
  const a = ageOf(p, 0);
  const u = slice(a, HOP[0], HOP[1]);
  // Only while the story is on (or leaving) the first step.
  const k = (1 - ease(u)) * at(p, 0);
  g.position.set(INSIDE.x * k, (INSIDE.y + dropAt(a)) * k + Math.sin(u * Math.PI) * 1.5 * at(p, 0), INSIDE.z * k);
  g.rotation.set(0, 0, Math.sin(u * Math.PI) * 0.25 * at(p, 0));
};
/** Closed in the carton, it opens once it has landed; open the rest of the story. */
const lidOf = (p: Play) => 1 - at(p, 0) * (1 - spring(ageOf(p, 0) - LID_AT, 1.5, 4.5));
const stepOf = (p: Play) => (p.t > 0.5 ? p.to : p.from);
const screenOf = (p: Play) => [SCREEN.off, ageOf(p, 1) > FIXED_AT ? SCREEN.on : SCREEN.off, SCREEN.video, SCREEN.error, SCREEN.off][stepOf(p)];

// ── 3 · Hindi in, Portuguese out ─────────────────────────────────────────────
// Frames of the tutorial leave the screen, go into the script, and come out of it orange.
const TILES = 8;
const LOOP = 2.4; // seconds for one frame to make the whole trip
const SRC = new THREE.Vector3(-2.75, 0.95, -0.15);
const IN = new THREE.Vector3(-0.75, 0.95, -0.25);
const OUT = new THREE.Vector3(0.75, 0.95, -0.25);
const DST = new THREE.Vector3(2.35, 0.55, 0.35);
const SCRIPT: V3 = [0, 0, -0.35];
const WAVE: V3 = [2.65, 0, 0.35];

function Frames() {
  const { play, mats } = useClay();
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = useMemo(() => new THREE.BoxGeometry(0.26, 0.17, 0.025), []);
  useEffect(() => () => geo.dispose(), [geo]);
  const tmp = useMemo(() => ({ o: new THREE.Object3D(), c: new THREE.Color() }), []);
  useFrame(() => {
    const m = ref.current;
    if (!m) return;
    const here = at(play, 2);
    m.visible = here > 0.01;
    if (!m.visible) return;
    const { o, c } = tmp;
    const age = ageOf(play, 2);
    for (let i = 0; i < TILES; i++) {
      // They start leaving once the camera has arrived.
      const t = age - 0.6 - (i * LOOP) / TILES;
      const u = t < 0 ? 0 : (t % LOOP) / LOOP;
      const seen = t < 0 ? 0 : 1;
      let s: number;
      if (u < 0.45) {
        const v = u / 0.45;
        o.position.lerpVectors(SRC, IN, v);
        o.position.y += Math.sin(v * Math.PI) * 0.55;
        s = slice(v, 0, 0.1) * (1 - slice(v, 0.85, 1));
        c.copy(mats.clay.color);
      } else {
        const v = slice(u, 0.55, 1);
        o.position.lerpVectors(OUT, DST, v);
        o.position.y += Math.sin(v * Math.PI) * 0.55;
        s = u < 0.55 ? 0 : slice(v, 0, 0.15) * (1 - slice(v, 0.85, 1));
        c.copy(mats.accent.color);
      }
      o.rotation.set(0, 0, Math.sin(u * Math.PI * 4 + i) * 0.15);
      o.scale.setScalar(Math.max(s * seen * here, 1e-4));
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      m.setColorAt(i, c);
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[geo, mats.clay, TILES]} castShadow frustumCulled={false} />;
}

// ── 4 · WiFixit ─────────────────────────────────────────────────────────────
const PHONE: Pose[] = [null, null, null, { p: [1.3, 0, 0.95], r: [0, 0.42, 0], s: 1.15 }, null];
const SNAP = 0.9; // the photo is taken
const SENT: [number, number] = [1, 1.55];
const BACK: [number, number] = [1.65, 2.35];
const TOP: V3 = [0, 2.2, 0];
const snapAct = (g: THREE.Group, p: Play) => {
  g.scale.y = 1 - 0.07 * bump(slice(ageOf(p, 3), SNAP, SNAP + 0.18));
};
const photoAct = (g: THREE.Group, p: Play) => {
  const u = slice(ageOf(p, 3), SENT[0], SENT[1]);
  g.position.set(lerp(PHONE_SCREEN[0], TOP[0], ease(u)), lerp(PHONE_SCREEN[1], TOP[1], ease(u)), PHONE_SCREEN[2] + 0.05 + bump(u) * 0.2);
  g.scale.setScalar(Math.max(pop(slice(ageOf(p, 3), SNAP, SNAP + 0.15)) * (1 - slice(u, 0.75, 1)) * at(p, 3), 1e-4));
};
const tutorialAct = (g: THREE.Group, p: Play) => {
  const a = ageOf(p, 3);
  const u = slice(a, BACK[0] + 0.15, BACK[1]);
  g.position.set(lerp(TOP[0], PHONE_SCREEN[0], settle(u, 0.6)), lerp(TOP[1], PHONE_SCREEN[1] + 0.03, settle(u, 0.6)), PHONE_SCREEN[2] + 0.025 + bump(u) * 0.25);
  g.rotation.set(0, (1 - ease(u)) * Math.PI * 2, 0);
  g.scale.setScalar(Math.max(pop(slice(a, BACK[0], BACK[0] + 0.25)) * 0.96 * at(p, 3), 1e-4));
};

// A different frame for every step, and a push-in on its moment.
const CAMERA: Shot[] = [
  { pos: [0.1, 4.3, 9.6], look: [-0.3, 0.72, 0.1], to: { pos: [0.25, 3.8, 8.7], look: [-0.25, 0.7, 0.1] }, over: [0.6, 2.4] },
  { pos: [0.2, 7.3, 8.3], look: [-0.45, 0.45, 0], to: { pos: [0.35, 6.7, 7.5], look: [-0.3, 0.45, 0] }, over: [0.8, 3] },
  { pos: [0, 4.3, 10.6], look: [-0.15, 0.8, 0], to: { pos: [0, 4.1, 10], look: [-0.15, 0.8, 0] } },
  { pos: [0.7, 3.1, 8.2], look: [0.25, 1, -0.1], to: { pos: [0.8, 2.9, 7.5], look: [0.3, 1.05, 0] }, over: [0.6, 2.4] },
  { pos: [0.4, 9.6, 7.6], look: [0.2, 0, 0.35], to: { pos: [0.4, 9.1, 7.1], look: [0.2, 0, 0.35] }, over: [0.6, 2.6] },
];

const AM = STATES.find((s) => s.uf === 'AM')!;
const SP = STATES.find((s) => s.uf === 'SP')!;

export default function LaptopScene() {
  return (
    <>
      <Rig k={CAMERA} />

      {/* 1 · the carton drops in and opens; 5 · it waits, small, in Salvador */}
      <Act f={cartonAct}>
        <Morph k={CARTON} win={wins({ '3>4': [0.2, 0.7], '4>0': [0, 0.6] }, [0, 0.5])} bounce={0.12}>
          <Carton open={openFlaps} />
          <Tag at={[0.85, 0.85, 1]} dx={36} dy={-44} on={[0]} after={0.5}>By referral</Tag>
        </Morph>
      </Act>

      {/* 1 to 4 · the laptop */}
      <Act f={hopAct}>
        <Morph k={LAPTOP} win={W_LAPTOP}>
          <Laptop lid={lidOf} screen={screenOf} deck={DECK} win={W_DECK} />
          <Tag at={[0.55, 1.2, -0.95]} dx={44} dy={-30} on={[0]} after={LID_AT + 0.5}>Broken</Tag>
          <Tag at={[1.55, 0.05, 0.28]} dx={-14} dy={-44} on={[1]} after={2.6}>Old part</Tag>
          <Tag at={[0.2, 0.12, -0.3]} dx={-44} dy={-40} on={[1]} after={2.95}>New part</Tag>
          <Tag at={[0, 1.78, -1.15]} dx={0} dy={-22} on={[2]}>Hindi tutorial</Tag>
          <Tag at={[-0.55, 1.75, -1.1]} dx={-40} dy={-26} on={[3]}>Software problem</Tag>
        </Morph>
      </Act>

      {/* 3 · the script, and the dub that comes out of it */}
      <Morph k={[null, null, { p: SCRIPT }, null, null]} win={wins({ '1>2': [0.25, 0.8] }, [0, 0.5])} bounce={0.1}>
        <Script />
        <Tag at={[0, 1.6, -0.05]} dx={0} dy={-22} on={[2]}>Python script</Tag>
      </Morph>
      <Morph k={[null, null, { p: WAVE, r: [0, -0.4, 0] }, null, null]} win={wins({ '1>2': [0.35, 0.9] }, [0, 0.5])} bounce={0.1}>
        <Wave on={(p) => slice(ageOf(p, 2), 1.2, 1.5) * at(p, 2)} />
        <Tag at={[0, 0.75, 0]} dx={0} dy={-30} on={[2]} after={1.2}>Portuguese dub</Tag>
      </Morph>
      <Frames />
      <Arrow a={[-2.45, 0.55, 0.05]} b={[-1.05, 0.55, -0.2]} lift={0.25} on={[2]} />
      <Arrow a={[1.05, 0.55, -0.2]} b={[1.85, 0.3, 0.3]} lift={0.25} on={[2]} />

      {/* 4 · WiFixit: the phone photographs the problem and the tutorial comes back */}
      <Morph k={PHONE} win={wins({ '2>3': [0.3, 0.9] }, [0, 0.5])} bounce={0.1}>
        <Act f={snapAct}>
          <Phone screen={() => SCREEN.error}>
            <Act f={photoAct}>
              <PhotoCard />
            </Act>
            <Act f={tutorialAct}>
              <TutorialCard />
            </Act>
            <Arrow a={[-0.45, 1.05, 0]} b={[-0.45, 1.95, 0]} lift={0} bend={[-0.18, 0, 0]} on={[3]} after={SENT[0]} />
            <Arrow a={[0.45, 1.95, 0]} b={[0.45, 1.05, 0]} lift={0} bend={[0.18, 0, 0]} on={[3]} after={BACK[0]} />
            <Tag at={[-0.6, 1.5, 0]} dx={-36} dy={-10} on={[3]} after={SENT[0]}>{'Photo of\nthe problem'}</Tag>
            <Tag at={[0.6, 1.5, 0]} dx={36} dy={-10} on={[3]} after={BACK[0]}>Tutorial</Tag>
          </Phone>
        </Act>
        <Tag at={[0.35, 0.08, 0.3]} dx={40} dy={26} on={[3]}>WiFixit</Tag>
      </Morph>

      {/* 5 · 121 laptops, 21 states: a box from Salvador to each state reached */}
      <BrazilMap from={[SALVADOR_AT[0], SALVADOR_AT[1] + 0.14, SALVADOR_AT[2]]} />
      <Tag at={[SALVADOR_AT[0], H_LIT + 0.15, SALVADOR_AT[2]]} dx={64} dy={-14} on={[4]}>{'Salvador\n121 laptops'}</Tag>
      <Tag at={toWorld(SP.c, H_LIT)} dx={-40} dy={44} on={[4]} after={2.2}>21 states</Tag>
      <Tag at={toWorld(AM.c, 0.07)} dx={-10} dy={-40} on={[4]}>Not reached</Tag>
    </>
  );
}
