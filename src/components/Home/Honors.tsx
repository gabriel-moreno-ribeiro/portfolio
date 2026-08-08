import { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Environment } from '@react-three/drei';
import type { Group } from 'three';

useGLTF.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');

interface MedalData {
  id: string;
  name: string;
  year: string;
  glb: string;
}

const MEDALS: MedalData[] = [
  { id: 'obqjr', name: 'OBQJr', year: '2020', glb: '/honors/medals/obqjr.glb' },
  { id: 'obfep', name: 'OBFEP', year: '2022', glb: '/honors/medals/obfep.glb' },
];

function MedalModel({ glbPath }: { glbPath: string }) {
  const { scene } = useGLTF(glbPath);
  const groupRef = useRef<Group>(null);
  const clonedScene = useMemo(() => scene.clone(), [scene]);
  const targetRot = useRef({ x: 0, y: 0 });
  const { pointer } = useThree();

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();

    groupRef.current.position.y = Math.sin(t * 1.6) * 0.1;

    const mx = pointer.x;
    const my = pointer.y;
    const dist = Math.sqrt(mx * mx + my * my);

    if (dist < 1.5) {
      const influence = Math.max(0, 1 - dist / 1.5);
      targetRot.current.y = mx * influence * 0.8;
      targetRot.current.x = -my * influence * 0.6;
    } else {
      targetRot.current.x = 0;
      targetRot.current.y = t * 0.4;
    }

    groupRef.current.rotation.x += (targetRot.current.x - groupRef.current.rotation.x) * 0.06;
    groupRef.current.rotation.y += (targetRot.current.y - groupRef.current.rotation.y) * 0.06;
  });

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} scale={2.2} />
    </group>
  );
}

function MedalCard({ medal }: { medal: MedalData }) {
  return (
    <div className="medal-card">
      <div className="medal-canvas">
        <Canvas camera={{ position: [0, 0, 5], fov: 40 }} dpr={[1, 1.5]}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[3, 5, 4]} intensity={1} />
          <Suspense fallback={null}>
            <MedalModel glbPath={medal.glb} />
            <Environment preset="studio" />
          </Suspense>
        </Canvas>
      </div>
      <span className="medal-name">{medal.name}</span>
      <span className="medal-year">{medal.year}</span>
    </div>
  );
}

function Honors() {
  return (
    <div className="honors-section" id="honors">
      <h2 className="heading" data-color-inverted="true">
        The Medal Wall.
      </h2>
      <p className="medal-summary">
        39 medals across 49 olympiads — 19 gold, 11 silver, 9 bronze.
      </p>
      <div className="medal-grid">
        {MEDALS.map((medal) => (
          <MedalCard key={medal.id} medal={medal} />
        ))}
      </div>
    </div>
  );
}

export default Honors;
