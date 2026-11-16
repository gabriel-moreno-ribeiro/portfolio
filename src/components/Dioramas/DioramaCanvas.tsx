// The 3D half of a diorama. Loaded lazily by Diorama.tsx, so three.js and the scenes
// stay out of the page bundle; the poster is already on screen when this arrives.
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import type { MotionValue } from 'motion/react';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { usePageVisible } from '../../lib/motion';
import { Candela, Gsat, Hibeex, type Palette } from './scenes';
import { CAMERA } from './steps';

const LIGHT: Palette = { paper: '#ffffff', ink: '#26211d', mute: '#cfc4ba', line: '#eadfd6', accent: '#f0732d', wood: '#cf9f6c', dot: '#26211d' };
const DARK: Palette = { paper: '#efe6de', ink: '#4a3f37', mute: '#7d7067', line: '#2e2620', accent: '#f0732d', wood: '#b98a59', dot: '#b0a69c' };

const SCENES = { hibeex: Hibeex, candela: Candela, gsat: Gsat } as const;
export const hasScene = (slug: string): slug is keyof typeof SCENES => slug in SCENES;

/** Fits the camera to the stage and reports the first painted frame. */
function Rig({ onReady }: { onReady: () => void }) {
  const camera = useThree((s) => s.camera);
  const height = useThree((s) => s.size.height);
  const invalidate = useThree((s) => s.invalidate);
  const frameloop = useThree((s) => s.frameloop);
  const painted = useRef(false);

  useLayoutEffect(() => {
    camera.position.set(...CAMERA.position);
    camera.lookAt(...CAMERA.target);
    camera.zoom = height / (2 * CAMERA.halfHeight);
    camera.updateProjectionMatrix();
    invalidate();
  }, [camera, height, invalidate]);

  // Back from a hidden tab: one frame to catch up with the scroll.
  useEffect(() => { if (frameloop === 'demand') invalidate(); }, [frameloop, invalidate]);

  useFrame(() => {
    if (painted.current) return;
    painted.current = true;
    onReady();
  });
  return null;
}

interface Props {
  slug: string;
  dark: boolean;
  progress: MotionValue<number>;
  onReady: () => void;
}

export default function DioramaCanvas({ slug, dark, progress, onReady }: Props) {
  const pageVisible = usePageVisible();
  if (!hasScene(slug)) return null;
  const Scene = SCENES[slug];

  return (
    <Canvas
      orthographic
      shadows
      dpr={[1, 1.5]}
      frameloop={pageVisible ? 'demand' : 'never'}
      camera={{ near: 0.1, far: 60 }}
      gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
      style={{ background: 'transparent' }}
      aria-hidden="true"
    >
      <Rig onReady={onReady} />
      <ambientLight intensity={dark ? 1.5 : 1.9} />
      <directionalLight
        castShadow
        position={[5, 9, 6]}
        intensity={dark ? 1.4 : 1.6}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
      />
      {/* the floor only exists as the shadow it catches */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[30, 30]} />
        <shadowMaterial opacity={dark ? 0.4 : 0.16} />
      </mesh>
      <Scene progress={progress} c={dark ? DARK : LIGHT} />
    </Canvas>
  );
}
