import { Suspense, useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useGLTF, Environment } from '@react-three/drei';
import * as THREE from 'three';

interface MedalData {
  id: string;
  name: string;
  glb?: string;
}

const MEDALS: MedalData[] = [
  { id: 'obqjr', name: 'OBQJr', glb: '/honors/medals/obqjr.glb' },
  { id: 'medal-02', name: 'OBF' },
  { id: 'medal-03', name: 'OBM' },
  { id: 'medal-04', name: 'OBA' },
  { id: 'medal-05', name: 'OBMEP' },
  { id: 'medal-06', name: 'ONNEQ' },
  { id: 'medal-07', name: 'IFT-UNESP' },
  { id: 'medal-08', name: 'OBQ' },
  { id: 'medal-09', name: 'OBAQ' },
  { id: 'medal-10', name: 'ONC' },
  { id: 'medal-11', name: 'OBF' },
  { id: 'medal-12', name: 'OBM' },
  { id: 'medal-13', name: 'OQBA' },
  { id: 'medal-14', name: 'OBA' },
  { id: 'medal-15', name: 'OBF' },
  { id: 'medal-16', name: 'ONNEQ' },
  { id: 'medal-17', name: 'OBMEP' },
  { id: 'medal-18', name: 'OBQ' },
  { id: 'medal-19', name: 'ONC' },
  { id: 'medal-20', name: 'OBM' },
  { id: 'medal-21', name: 'OBA' },
  { id: 'medal-22', name: 'OBFEP' },
  { id: 'medal-23', name: 'OBF' },
  { id: 'medal-24', name: 'OBQ' },
  { id: 'medal-25', name: 'OBMEP' },
  { id: 'medal-26', name: 'ONC' },
  { id: 'medal-27', name: 'OBA' },
  { id: 'medal-28', name: 'ONNEQ' },
  { id: 'medal-29', name: 'OBM' },
  { id: 'medal-30', name: 'OBFEP' },
  { id: 'medal-31', name: 'OBF' },
  { id: 'medal-32', name: 'OBQ' },
  { id: 'medal-33', name: 'OBA' },
  { id: 'medal-34', name: 'OBMEP' },
  { id: 'medal-35', name: 'ONC' },
  { id: 'medal-36', name: 'OBF' },
  { id: 'medal-37', name: 'OBM' },
  { id: 'medal-38', name: 'ONNEQ' },
  { id: 'medal-39', name: 'OBFEP' },
];

const GRID_COLS = 8;
const SPACING = 2.8;
const BOB_SPEED = 1.8;
const BOB_AMOUNT = 0.1;
const SPIN_SPEED = 0.5;
const MOUSE_INFLUENCE_RADIUS = 4.5;
const MOUSE_STRENGTH = 1.2;

function MedalModel({ glbPath, position, index }: { glbPath: string; position: [number, number, number]; index: number }) {
  const { scene } = useGLTF(glbPath);
  const groupRef = useRef<THREE.Group>(null);
  const clonedScene = useMemo(() => scene.clone(), [scene]);
  const targetRotation = useRef(new THREE.Euler(0, 0, 0));
  const mouseWorld = useRef(new THREE.Vector2(9999, 9999));
  const { pointer, viewport } = useThree();

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();

    const mx = (pointer.x * viewport.width) / 2;
    const my = (pointer.y * viewport.height) / 2;
    mouseWorld.current.set(mx, my);

    const dx = mx - position[0];
    const dy = my - position[1];
    const dist = Math.sqrt(dx * dx + dy * dy);

    const bobOffset = Math.sin(t * BOB_SPEED + index * 0.4) * BOB_AMOUNT;
    groupRef.current.position.y = position[1] + bobOffset;

    if (dist < MOUSE_INFLUENCE_RADIUS) {
      const influence = 1 - dist / MOUSE_INFLUENCE_RADIUS;
      const angleY = Math.atan2(dx, 3) * influence * MOUSE_STRENGTH;
      const angleX = Math.atan2(-dy, 3) * influence * MOUSE_STRENGTH;
      targetRotation.current.set(angleX, angleY, 0);
    } else {
      targetRotation.current.set(0, t * SPIN_SPEED, 0);
    }

    groupRef.current.rotation.x += (targetRotation.current.x - groupRef.current.rotation.x) * 0.08;
    groupRef.current.rotation.y += (targetRotation.current.y - groupRef.current.rotation.y) * 0.08;
  });

  return (
    <group ref={groupRef} position={position}>
      <primitive object={clonedScene} scale={1.4} />
    </group>
  );
}

function PlaceholderMedal({ position, index, name }: { position: [number, number, number]; index: number; name: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const targetRotation = useRef(new THREE.Euler(0, 0, 0));
  const { pointer, viewport } = useThree();

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();

    const mx = (pointer.x * viewport.width) / 2;
    const my = (pointer.y * viewport.height) / 2;
    const dx = mx - position[0];
    const dy = my - position[1];
    const dist = Math.sqrt(dx * dx + dy * dy);

    const bobOffset = Math.sin(t * BOB_SPEED + index * 0.4) * BOB_AMOUNT;
    meshRef.current.position.y = position[1] + bobOffset;

    if (dist < MOUSE_INFLUENCE_RADIUS) {
      const influence = 1 - dist / MOUSE_INFLUENCE_RADIUS;
      const angleY = Math.atan2(dx, 3) * influence * MOUSE_STRENGTH;
      const angleX = Math.atan2(-dy, 3) * influence * MOUSE_STRENGTH;
      targetRotation.current.set(angleX, angleY, 0);
    } else {
      targetRotation.current.set(0, t * SPIN_SPEED, 0);
    }

    meshRef.current.rotation.x += (targetRotation.current.x - meshRef.current.rotation.x) * 0.08;
    meshRef.current.rotation.y += (targetRotation.current.y - meshRef.current.rotation.y) * 0.08;
  });

  return (
    <mesh ref={meshRef} position={position}>
      <cylinderGeometry args={[0.9, 0.9, 0.12, 32]} />
      <meshStandardMaterial color="#d4a017" metalness={0.8} roughness={0.3} opacity={0.35} transparent />
    </mesh>
  );
}

function MedalScene() {
  const rows = Math.ceil(MEDALS.length / GRID_COLS);
  const offsetX = ((GRID_COLS - 1) * SPACING) / 2;
  const offsetY = ((rows - 1) * SPACING) / 2;

  const getPosition = useCallback((index: number): [number, number, number] => {
    const col = index % GRID_COLS;
    const row = Math.floor(index / GRID_COLS);
    return [col * SPACING - offsetX, -(row * SPACING - offsetY), 0];
  }, [offsetX, offsetY]);

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 8, 6]} intensity={1} />
      <directionalLight position={[-4, -2, -3]} intensity={0.25} />
      <Suspense fallback={null}>
        {MEDALS.map((medal, i) => {
          const pos = getPosition(i);
          return medal.glb ? (
            <MedalModel key={medal.id} glbPath={medal.glb} position={pos} index={i} />
          ) : (
            <PlaceholderMedal key={medal.id} position={pos} index={i} name={medal.name} />
          );
        })}
        <Environment preset="studio" />
      </Suspense>
    </>
  );
}

function Honors() {
  return (
    <div className="honors-section" id="honors">
      <h1 className="heading" data-color-inverted="true" data-fun="The Fridge Magnet Collection">
        The Medal Wall.
      </h1>
      <p className="medal-summary">
        39 medals across 49 olympiads — 19 gold, 11 silver, 9 bronze.
      </p>
      <div className="medal-canvas-wrap">
        <Canvas camera={{ position: [0, 0, 18], fov: 45 }}>
          <MedalScene />
        </Canvas>
      </div>
    </div>
  );
}

MEDALS.forEach(m => { if (m.glb) useGLTF.preload(m.glb); });

export default Honors;
