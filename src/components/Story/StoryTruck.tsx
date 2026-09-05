// 3D Chevrolet D20 for /story. Assembly is driven only by the scroll position of
// the sticky section (`sectionId`); it never moves on its own.
import { Environment } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useCallback, useEffect, useRef } from 'react';
import { Vector3 } from 'three';
import { useThemeStore } from '../../store/themeStore';
// @ts-ignore — JSX module without types
import { D20Truck } from '../Canvas/D20Truck';

// Model: ~13.6 wide × 13.6 tall × 33.6 long, base at y=0 (before the -2 offset).
const TRUCK_CENTER = new Vector3(0, 4.8, 0.7);
const TRUCK_FIT_RADIUS = 21;
const CAMERA_FOV = 50;
const CAMERA_DIR = new Vector3(1, 0.42, 1).normalize();

function CameraSetup() {
  const { camera, size } = useThree();
  useEffect(() => {
    const aspect = size.width / size.height;
    const halfFov = (CAMERA_FOV / 2) * (Math.PI / 180);
    const distance = TRUCK_FIT_RADIUS / (Math.tan(halfFov) * Math.min(aspect, 1));
    camera.position.copy(CAMERA_DIR).multiplyScalar(distance).add(TRUCK_CENTER);
    camera.lookAt(TRUCK_CENTER);
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height]);
  return null;
}

function Rotation({ progressRef, groupRef }: { progressRef: React.MutableRefObject<number>; groupRef: React.MutableRefObject<any> }) {
  useFrame(() => {
    if (groupRef.current) groupRef.current.rotation.y = -0.6 + progressRef.current * Math.PI * 0.9;
  });
  return null;
}

export default function StoryTruck({ sectionId }: { sectionId: string }) {
  const group = useRef<any>(null);
  const progressRef = useRef(0);
  const { darkMode } = useThemeStore();

  const update = useCallback(() => {
    const el = document.getElementById(sectionId);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const total = rect.height - window.innerHeight;
    if (total <= 0) { progressRef.current = 1; return; }
    progressRef.current = Math.max(0, Math.min(1, -rect.top / total));
  }, [sectionId]);

  useEffect(() => {
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update, { passive: true });
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [update]);

  return (
    <Canvas camera={{ fov: CAMERA_FOV }} gl={{ antialias: true, alpha: true }} style={{ width: '100%', height: '100%' }}>
      <CameraSetup />
      <directionalLight position={[10, 20, 10]} intensity={darkMode ? 1.2 : 2.5} />
      <directionalLight position={[-10, 10, -10]} intensity={darkMode ? 0.4 : 0.8} />
      <ambientLight intensity={darkMode ? 0.6 : 1.0} />
      <Suspense fallback={null}>
        <D20Truck progressRef={progressRef} groupRef={group} scale={1} position={[0, -2, 0]} />
        <Environment files="/assets/3d/studio.hdr" />
        <Rotation progressRef={progressRef} groupRef={group} />
      </Suspense>
    </Canvas>
  );
}
