import { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';

interface MedalData {
  id: string;
  name: string;
  olympiad: string;
  year: string;
  type: 'gold' | 'silver' | 'bronze';
  glb?: string;
}

const MEDALS: MedalData[] = [
  { id: 'obqjr', name: 'OBQJr', olympiad: 'Brazilian Chemistry Olympiad Junior', year: '2020', type: 'gold', glb: '/honors/medals/obqjr.glb' },
  { id: 'medal-02', name: 'OBF', olympiad: 'Brazilian Physics Olympiad', year: '2020', type: 'gold' },
  { id: 'medal-03', name: 'OBM', olympiad: 'Brazilian Math Olympiad', year: '2020', type: 'gold' },
  { id: 'medal-04', name: 'OBA', olympiad: 'Brazilian Astronomy Olympiad', year: '2020', type: 'gold' },
  { id: 'medal-05', name: 'OBMEP', olympiad: 'Brazilian Public School Math Olympiad', year: '2021', type: 'gold' },
  { id: 'medal-06', name: 'ONNEQ', olympiad: 'National Northeast Chemistry Olympiad', year: '2021', type: 'gold' },
  { id: 'medal-07', name: 'IFT-UNESP', olympiad: 'IFT-UNESP Physics', year: '2021', type: 'gold' },
  { id: 'medal-08', name: 'OBQ', olympiad: 'Brazilian Chemistry Olympiad', year: '2021', type: 'gold' },
  { id: 'medal-09', name: 'OBAQ', olympiad: 'Brazilian Chemistry Analysis Olympiad', year: '2021', type: 'gold' },
  { id: 'medal-10', name: 'ONC', olympiad: 'National Science Olympiad', year: '2021', type: 'gold' },
  { id: 'medal-11', name: 'OBF-2', olympiad: 'Brazilian Physics Olympiad', year: '2021', type: 'gold' },
  { id: 'medal-12', name: 'OBM-2', olympiad: 'Brazilian Math Olympiad', year: '2021', type: 'gold' },
  { id: 'medal-13', name: 'OQBA', olympiad: 'Bahia Chemistry Olympiad', year: '2022', type: 'gold' },
  { id: 'medal-14', name: 'OBA-2', olympiad: 'Brazilian Astronomy Olympiad', year: '2022', type: 'gold' },
  { id: 'medal-15', name: 'OBF-3', olympiad: 'Brazilian Physics Olympiad', year: '2022', type: 'gold' },
  { id: 'medal-16', name: 'ONNEQ-2', olympiad: 'National Northeast Chemistry Olympiad', year: '2022', type: 'gold' },
  { id: 'medal-17', name: 'OBMEP-2', olympiad: 'Brazilian Public School Math Olympiad', year: '2022', type: 'gold' },
  { id: 'medal-18', name: 'OBQ-2', olympiad: 'Brazilian Chemistry Olympiad', year: '2022', type: 'gold' },
  { id: 'medal-19', name: 'ONC-2', olympiad: 'National Science Olympiad', year: '2022', type: 'gold' },
  { id: 'medal-20', name: 'OBM-3', olympiad: 'Brazilian Math Olympiad', year: '2022', type: 'silver' },
  { id: 'medal-21', name: 'OBA-3', olympiad: 'Brazilian Astronomy Olympiad', year: '2022', type: 'silver' },
  { id: 'medal-22', name: 'OBFEP', olympiad: 'Brazilian Public School Physics Olympiad', year: '2022', type: 'silver' },
  { id: 'medal-23', name: 'OBF-4', olympiad: 'Brazilian Physics Olympiad', year: '2023', type: 'silver' },
  { id: 'medal-24', name: 'OBQ-3', olympiad: 'Brazilian Chemistry Olympiad', year: '2023', type: 'silver' },
  { id: 'medal-25', name: 'OBMEP-3', olympiad: 'Brazilian Public School Math Olympiad', year: '2023', type: 'silver' },
  { id: 'medal-26', name: 'ONC-3', olympiad: 'National Science Olympiad', year: '2023', type: 'silver' },
  { id: 'medal-27', name: 'OBA-4', olympiad: 'Brazilian Astronomy Olympiad', year: '2023', type: 'silver' },
  { id: 'medal-28', name: 'ONNEQ-3', olympiad: 'National Northeast Chemistry Olympiad', year: '2023', type: 'silver' },
  { id: 'medal-29', name: 'OBM-4', olympiad: 'Brazilian Math Olympiad', year: '2023', type: 'silver' },
  { id: 'medal-30', name: 'OBFEP-2', olympiad: 'Brazilian Public School Physics Olympiad', year: '2023', type: 'silver' },
  { id: 'medal-31', name: 'OBF-5', olympiad: 'Brazilian Physics Olympiad', year: '2023', type: 'bronze' },
  { id: 'medal-32', name: 'OBQ-4', olympiad: 'Brazilian Chemistry Olympiad', year: '2024', type: 'bronze' },
  { id: 'medal-33', name: 'OBA-5', olympiad: 'Brazilian Astronomy Olympiad', year: '2024', type: 'bronze' },
  { id: 'medal-34', name: 'OBMEP-4', olympiad: 'Brazilian Public School Math Olympiad', year: '2024', type: 'bronze' },
  { id: 'medal-35', name: 'ONC-4', olympiad: 'National Science Olympiad', year: '2024', type: 'bronze' },
  { id: 'medal-36', name: 'OBF-6', olympiad: 'Brazilian Physics Olympiad', year: '2024', type: 'bronze' },
  { id: 'medal-37', name: 'OBM-5', olympiad: 'Brazilian Math Olympiad', year: '2024', type: 'bronze' },
  { id: 'medal-38', name: 'ONNEQ-4', olympiad: 'National Northeast Chemistry Olympiad', year: '2024', type: 'bronze' },
  { id: 'medal-39', name: 'OBFEP-3', olympiad: 'Brazilian Public School Physics Olympiad', year: '2024', type: 'bronze' },
];

function MedalModel({ glbPath }: { glbPath: string }) {
  const { scene } = useGLTF(glbPath);
  const groupRef = useRef<THREE.Group>(null);
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    groupRef.current.position.y = Math.sin(t * 1.8) * 0.12;
    groupRef.current.rotation.y = t * 0.7;
  });

  return (
    <group ref={groupRef}>
      <primitive object={clonedScene} scale={2} />
    </group>
  );
}

function Medal3DCell({ medal }: { medal: MedalData }) {
  return (
    <div className={`medal-cell medal-${medal.type}`}>
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 40 }}
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.5} />
        <directionalLight position={[3, 4, 4]} intensity={1} />
        <directionalLight position={[-2, -1, -2]} intensity={0.3} />
        <Suspense fallback={null}>
          <MedalModel glbPath={medal.glb!} />
          <Environment preset="studio" />
        </Suspense>
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          autoRotate={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.5}
        />
      </Canvas>
      <div className="medal-label">
        <span className="medal-name">{medal.name}</span>
      </div>
    </div>
  );
}

function MedalPlaceholderCell({ medal }: { medal: MedalData }) {
  return (
    <div className={`medal-cell medal-${medal.type} placeholder`}>
      <div className="medal-ph">
        <span className="medal-emoji">🏅</span>
        <span className="medal-name">{medal.name}</span>
        <span className="medal-year">{medal.year}</span>
      </div>
    </div>
  );
}

function Honors() {
  const goldCount = MEDALS.filter(m => m.type === 'gold').length;
  const silverCount = MEDALS.filter(m => m.type === 'silver').length;
  const bronzeCount = MEDALS.filter(m => m.type === 'bronze').length;

  return (
    <div className="honors-section" id="honors">
      <h1 className="heading" data-color-inverted="true" data-fun="The Fridge Magnet Collection">
        The Medal Wall.
      </h1>

      <p className="medal-summary">
        {MEDALS.length} medals across 49 olympiads — {goldCount} gold, {silverCount} silver, {bronzeCount} bronze.
      </p>

      <div className="medal-grid">
        {MEDALS.map((medal) =>
          medal.glb ? (
            <Medal3DCell key={medal.id} medal={medal} />
          ) : (
            <MedalPlaceholderCell key={medal.id} medal={medal} />
          )
        )}
      </div>
    </div>
  );
}

MEDALS.forEach(m => { if (m.glb) useGLTF.preload(m.glb); });

export default Honors;
