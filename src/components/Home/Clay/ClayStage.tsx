// The clay stage (lazy chunk): matte white models on a floor that is the page itself.
// The canvas is opaque and cleared with the page background, so the floor only shows where
// shadows and ambient occlusion darken it, and everything else continues the page.
import { ContactShadows } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, type RefObject } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import CandelaScene from './CandelaScene';
import HibeexScene from './HibeexScene';
import { ClayCtx, makeMats, useClay, type Play } from './kit';
import { TRAVEL_MS } from './steps';

export interface ClayStageProps {
  slug: string;
  /** The step the story should be on. The stage travels there on its own clock. */
  target: number;
  /** On screen and tab visible: the only time frames are drawn. */
  active: boolean;
  dark: boolean;
  /** The page background (CSS `--bg`), so the floor is the page. */
  bg: string;
  onReady: () => void;
  onFail: () => void;
}

/** Soft radial falloff, white in the middle: the pool of light the models stand in. */
function poolTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.3, 'rgba(255,255,255,0.7)');
  grad.addColorStop(0.65, 'rgba(255,255,255,0.16)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return new THREE.CanvasTexture(c);
}

function Lights({ dark }: { dark: boolean }) {
  const pool = useMemo(poolTexture, []);
  useEffect(() => () => pool.dispose(), [pool]);
  return (
    <>
      <hemisphereLight args={['#ffffff', dark ? '#3a312b' : '#d9d1c8', dark ? 0.95 : 1.8]} />
      <directionalLight
        castShadow
        position={[-5, 9.5, 6]}
        intensity={dark ? 2.5 : 1.85}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.025}
        shadow-radius={12}
        shadow-blurSamples={25}
      >
        <orthographicCamera attach="shadow-camera" args={[-9.5, 9.5, 8, -8, 1, 34]} />
      </directionalLight>
      <directionalLight position={[7, 3, 5]} intensity={0.22} />
      {/* The floor is the page: a pool of light, then only what darkens it. In the dark theme the pool is what lets the shadows show. */}
      <mesh rotation-x={-Math.PI / 2} position={[0, -0.03, -0.6]} renderOrder={0} userData={{ overlay: true }}>
        <planeGeometry args={[22, 18]} />
        <meshBasicMaterial map={pool} color={dark ? '#ffe9d6' : '#ffffff'} transparent opacity={dark ? 0.24 : 0.6} depthWrite={false} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position-y={-0.02} renderOrder={1} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <shadowMaterial transparent depthWrite={false} opacity={dark ? 0.72 : 0.36} />
      </mesh>
      {/* Just under the floor, looking up: models standing on y=0 show it their undersides. */}
      <ContactShadows renderOrder={2} position={[0, -0.01, 0]} scale={26} resolution={512} blur={2.2} far={2.4} opacity={dark ? 0.9 : 0.75} color={dark ? '#000000' : '#3a2c22'} />
    </>
  );
}

/** Moves the story towards `target`: one travel at a time, faster when it has to catch up. */
function Clock({ play, target }: { play: Play; target: RefObject<number> }) {
  useFrame(({ clock }, dt) => {
    // Held by a QA script: the whole scene stands at the moment it was given.
    if (play.frozen) return void (clock.elapsedTime = play.age);
    const want = target.current;
    const step = Math.min(dt, 0.1);
    play.age += step;
    if (play.t < 1) play.t = Math.min(1, play.t + (step * 1000) / (play.to === want ? TRAVEL_MS : TRAVEL_MS / 4));
    if (play.t >= 1) {
      play.from = play.to;
      if (play.to !== want) {
        play.was = play.age;
        play.to = want;
        play.t = 0;
        play.age = 0;
      }
    }
  }, -1);
  return null;
}

// Once a machine has shown it cannot afford the occlusion pass, no stage on the page tries again.
let aoAffordable = true;
const BUDGET_MS = 21; // slower than ~48 fps on average and the pass goes

/**
 * Draws the frame: scene, ambient occlusion, output. Watches its own frame time and drops
 * the occlusion pass first, then the pixel ratio, when the budget is missed.
 */
function Renderer({ bg, onReady }: { bg: string; onReady: () => void }) {
  const { gl, scene, camera, size, viewport, setDpr } = useThree();
  const { play } = useClay();
  const pipe = useMemo(() => {
    const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
    const composer = new EffectComposer(gl, target);
    const ao = new GTAOPass(scene, camera, 1, 1);
    ao.updateGtaoMaterial({ radius: 0.45, distanceExponent: 1.4, thickness: 1.2, scale: 1.2, samples: 16, distanceFallOff: 1 });
    // The raw pass is already clean at 16 samples; a wide denoise only adds its own grain.
    ao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 2.5, radiusExponent: 2, rings: 2, samples: 12 });
    ao.blendIntensity = 1;
    // Arrows, brackets and the light pool are drawn over the clay; they do not occlude anything.
    ao.overrideVisibility = function (this: GTAOPass & { _visibilityCache: Map<THREE.Object3D, boolean> }) {
      const cache = this._visibilityCache;
      scene.traverse((o) => {
        cache.set(o, o.visible);
        if ((o as THREE.Points).isPoints || (o as THREE.Line).isLine || o.userData.overlay) o.visible = false;
      });
    };
    composer.addPass(new RenderPass(scene, camera));
    composer.addPass(ao);
    composer.addPass(new OutputPass());
    return { composer, ao, target };
  }, [gl, scene, camera]);

  useEffect(() => void gl.setClearColor(bg, 1), [gl, bg]);
  useEffect(() => {
    camera.layers.enable(1);
    pipe.composer.setPixelRatio(viewport.dpr);
    pipe.composer.setSize(size.width, size.height);
  }, [pipe, camera, size.width, size.height, viewport.dpr]);
  useEffect(
    () => () => {
      pipe.ao.dispose();
      pipe.composer.dispose();
      pipe.target.dispose();
    },
    [pipe],
  );

  const watch = useRef({ frames: 0, sum: 0, ready: false, lowered: false });
  const draw = (withAO: boolean, dt = 0) => (withAO ? pipe.composer.render(dt) : gl.render(scene, camera));

  // Dev only, for the QA scripts in qa/surreal/clay: the cost of a frame with and without the
  // occlusion pass (fps.mjs), and a way to hold the story at a chosen moment: `age` seconds into
  // step `to`, coming from step `from` (stills.mjs, frames.mjs). Without arguments it runs again.
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const el = gl.domElement as HTMLCanvasElement & { __bench?: (withAO: boolean, n?: number) => number; __seek?: (from?: number, to?: number, age?: number) => void };
    el.__bench = (withAO, n = 40) => {
      const ctx = gl.getContext();
      const t0 = performance.now();
      for (let i = 0; i < n; i++) draw(withAO);
      ctx.finish();
      return (performance.now() - t0) / n;
    };
    el.__seek = (from, to = from, age = 0) => {
      play.frozen = from !== undefined;
      if (from === undefined || to === undefined) return;
      Object.assign(play, { from, to, age, was: 3, t: from === to ? 1 : Math.min(1, (age * 1000) / TRAVEL_MS) });
    };
    return () => {
      delete el.__bench;
      delete el.__seek;
    };
  });

  useFrame((_, dt) => {
    draw(aoAffordable, dt);
    const w = watch.current;
    if (!w.ready) {
      w.ready = true;
      onReady();
    }
    // Frame time: skip the first frames (shader compiles) and anything that is clearly a pause.
    if (dt <= 0 || dt > 0.1 || ++w.frames < 30) return;
    w.sum += dt * 1000;
    if (w.frames < 120) return;
    const avg = w.sum / (w.frames - 29);
    w.frames = 0;
    w.sum = 0;
    if (avg <= BUDGET_MS) return;
    if (aoAffordable) aoAffordable = false;
    else if (!w.lowered) {
      w.lowered = true;
      setDpr(1);
    }
    gl.domElement.dataset.degraded = aoAffordable ? '' : w.lowered ? 'ao+dpr' : 'ao';
  }, 1);
  return null;
}

export default function ClayStage({ slug, target, active, dark, bg, onReady, onFail }: ClayStageProps) {
  const want = useRef(target);
  want.current = target;
  const play = useMemo<Play>(() => ({ from: target, to: target, t: 1, age: 0, was: 0 }), []); // eslint-disable-line react-hooks/exhaustive-deps
  const mats = useMemo(() => makeMats(dark), [dark]);
  useEffect(
    () => () => {
      mats.clay.dispose();
      mats.accent.dispose();
      mats.ink.dispose();
    },
    [mats],
  );
  const ctx = useMemo(() => ({ play, mats, dark }), [play, mats, dark]);
  const Scene = slug === 'candela' ? CandelaScene : HibeexScene;

  return (
    <Canvas
      className="clay-stage__canvas"
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      flat
      shadows="variance"
      dpr={[1, 1.75]}
      frameloop={active ? 'always' : 'demand'}
      camera={{ fov: 30, near: 0.5, far: 80, position: [0, 5.6, 12.4] }}
      gl={{ alpha: false, antialias: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => gl.domElement.addEventListener('webglcontextlost', onFail)}
    >
      <ClayCtx.Provider value={ctx}>
        <Clock play={play} target={want} />
        <Lights dark={dark} />
        <Scene />
        <Renderer bg={bg} onReady={onReady} />
      </ClayCtx.Provider>
    </Canvas>
  );
}
