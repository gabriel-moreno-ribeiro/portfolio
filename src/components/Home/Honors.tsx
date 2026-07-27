import { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Environment } from '@react-three/drei';
import * as THREE from 'three';

interface MedalData {
  id: string;
  name: string;
  glb: string;
}

const MEDALS: MedalData[] = [
  { id: 'obqjr', name: 'OBQJr', glb: '/honors/medals/obqjr.glb' },
];

const SPACING = 3.5;
const BOB_SPEED = 1.6;
const BOB_AMOUNT = 0.12;
const SPIN_SPEED = 0.4;
const MOUSE_RADIUS = 5;
const MOUSE_STRENGTH = 1.0;

function MedalModel({ glbPath, position, index }: { glbPath: string; position: [number, number, number]; index: number }) {
  const { scene } = useGLTF(glbPath);
  const groupRef = useRef<THREE.Group>(null);
  const clonedScene = useMemo(() => scene.clone(), [scene]);
  const targetRot = useRef({ x: 0, y: 0 });
  const { pointer, viewport } = useThree();

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();

    const mx = (pointer.x * viewport.width) / 2;
    const my = (pointer.y * viewport.height) / 2;
    const dx = mx - position[0];
    const dy = my - position[1];
    const dist = Math.sqrt(dx * dx + dy * dy);

    groupRef.current.position.y = position[1] + Math.sin(t * BOB_SPEED + index * 0.5) * BOB_AMOUNT;

    if (dist < MOUSE_RADIUS) {
      const influence = 1 - dist / MOUSE_RADIUS;
      targetRot.current.y = Math.atan2(dx, 3) * influence * MOUSE_STRENGTH;
      targetRot.current.x = Math.atan2(-dy, 3) * influence * MOUSE_STRENGTH;
    } else {
      targetRot.current.x = 0;
      targetRot.current.y = t * SPIN_SPEED;
    }

    groupRef.current.rotation.x += (targetRot.current.x - groupRef.current.rotation.x) * 0.06;
    groupRef.current.rotation.y += (targetRot.current.y - groupRef.current.rotation.y) * 0.06;
  });

  return (
    <group ref={groupRef} position={position}>
      <primitive object={clonedScene} scale={2.5} />
    </group>
  );
}

function MedalScene() {
  const cols = Math.min(MEDALS.length, 5);
  const rows = Math.ceil(MEDALS.length / 5);
  const offsetX = ((cols - 1) * SPACING) / 2;
  const offsetY = ((rows - 1) * SPACING) / 2;

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 6]} intensity={1.2} />
      <directionalLight position={[-3, -2, -4]} intensity={0.3} />
      <Suspense fallback={null}>
        {MEDALS.map((medal, i) => {
          const col = i % 5;
          const row = Math.floor(i / 5);
          const pos: [number, number, number] = [
            col * SPACING - offsetX,
            -(row * SPACING - offsetY),
            0,
          ];
          return <MedalModel key={medal.id} glbPath={medal.glb} position={pos} index={i} />;
        })}
        <Environment preset="studio" />
      </Suspense>
    </>
  );
}

function Honors() {
  const cameraZ = MEDALS.length <= 5 ? 7 : MEDALS.length <= 10 ? 12 : 18;

  return (
    <div className="honors-section" id="honors">
      <h1 className="heading" data-color-inverted="true" data-fun="The Fridge Magnet Collection">
        The Medal Wall.
      </h1>
      <p className="medal-summary">
        39 medals across 49 olympiads — 19 gold, 11 silver, 9 bronze.
      </p>
      <div className="medal-canvas-wrap">
        <Canvas camera={{ position: [0, 0, cameraZ], fov: 45 }}>
          <MedalScene />
        </Canvas>
      </div>
    </div>
  );
}

MEDALS.forEach(m => useGLTF.preload(m.glb));

export default Honors;
