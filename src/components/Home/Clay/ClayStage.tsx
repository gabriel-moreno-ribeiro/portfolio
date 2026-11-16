// The clay stage (lazy chunk): a transparent canvas where matte white models sit on an
// invisible floor that only catches their shadows. The page shows through everywhere else.
import { ContactShadows } from '@react-three/drei';
import { Canvas, useFrame } from '@react-three/fiber';
import { useMotionValueEvent, type MotionValue } from 'motion/react';
import { useEffect, useMemo, useRef } from 'react';
import CandelaScene from './CandelaScene';
import HibeexScene from './HibeexScene';
import { ClayCtx, makeMats } from './kit';
import { stepOf } from './steps';

export interface ClayStageProps {
  slug: string;
  steps: number;
  /** 0..1 across the pinned scroll of the row. */
  progress: MotionValue<number>;
  /** On screen and tab visible: the only time frames are drawn continuously. */
  active: boolean;
  dark: boolean;
  onReady: () => void;
  onFail: () => void;
}

function Lights({ dark }: { dark: boolean }) {
  return (
    <>
      <hemisphereLight args={['#ffffff', dark ? '#3d342e' : '#ddd6ce', dark ? 1.15 : 1.95]} />
      <directionalLight
        castShadow
        position={[-5, 9.5, 6]}
        intensity={dark ? 3.1 : 1.65}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.025}
        shadow-radius={12}
        shadow-blurSamples={25}
      >
        <orthographicCamera attach="shadow-camera" args={[-8.5, 8.5, 7, -7, 1, 32]} />
      </directionalLight>
      <directionalLight position={[7, 3, 5]} intensity={0.22} />
      {/* The floor is only a shadow catcher. */}
      <mesh rotation-x={-Math.PI / 2} position-y={-0.02} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <shadowMaterial transparent depthWrite={false} opacity={dark ? 0.5 : 0.24} />
      </mesh>
      {/* Just under the floor, looking up: models standing on y=0 show it their undersides. */}
      <ContactShadows position={[0, -0.01, 0]} scale={24} resolution={512} blur={2.4} far={2.6} opacity={dark ? 0.75 : 0.6} color={dark ? '#000000' : '#3a2c22'} />
    </>
  );
}

function Ready({ onReady }: { onReady: () => void }) {
  const done = useRef(false);
  useFrame(() => {
    if (done.current) return;
    done.current = true;
    onReady();
  });
  return null;
}

export default function ClayStage({ slug, steps, progress, active, dark, onReady, onFail }: ClayStageProps) {
  const step = useRef(stepOf(progress.get(), steps));
  useMotionValueEvent(progress, 'change', (v) => {
    step.current = stepOf(v, steps);
  });
  const mats = useMemo(() => makeMats(dark), [dark]);
  useEffect(
    () => () => {
      mats.clay.dispose();
      mats.accent.dispose();
      mats.ink.dispose();
    },
    [mats],
  );
  const ctx = useMemo(() => ({ step, mats, dark }), [mats, dark]);
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
      gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => gl.domElement.addEventListener('webglcontextlost', onFail)}
    >
      <ClayCtx.Provider value={ctx}>
        <Lights dark={dark} />
        <Scene />
        <Ready onReady={onReady} />
      </ClayCtx.Provider>
    </Canvas>
  );
}
