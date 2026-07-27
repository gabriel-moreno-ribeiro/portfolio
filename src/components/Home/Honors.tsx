import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, Environment } from '@react-three/drei';
import * as THREE from 'three';

const MEDAL_GLB_PATH = '/honors/medals/obqjr.glb';

function MedalModel() {
  const { scene } = useGLTF(MEDAL_GLB_PATH);
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const t = clock.getElapsedTime();
    // Sims-style: gentle bob up/down + slow spin
    groupRef.current.position.y = Math.sin(t * 1.8) * 0.15;
    groupRef.current.rotation.y = t * 0.8;
  });

  return (
    <group ref={groupRef}>
      <primitive object={scene} scale={2.2} />
    </group>
  );
}

function MedalFallback() {
  return (
    <div className="medal-3d-fallback">
      <span>🏅</span>
      <small>Loading medal...</small>
    </div>
  );
}

function Honors() {
  return (
    <div className="honors-section" id="honors">
      <h1 className="heading" data-color-inverted="true" data-fun="The Fridge Magnet Collection">
        The Medal Wall.
      </h1>

      <div className="medal-showcase">
        <div className="medal-3d-container">
          <Suspense fallback={<MedalFallback />}>
            <Canvas
              camera={{ position: [0, 0, 5], fov: 40 }}
              style={{ width: '100%', height: '100%' }}
            >
              <ambientLight intensity={0.6} />
              <directionalLight position={[3, 5, 4]} intensity={1.2} />
              <directionalLight position={[-3, -2, -2]} intensity={0.3} />
              <MedalModel />
              <OrbitControls
                enableZoom={false}
                enablePan={false}
                autoRotate={false}
                minPolarAngle={Math.PI / 3}
                maxPolarAngle={Math.PI / 1.5}
              />
              <Environment preset="studio" />
            </Canvas>
          </Suspense>
        </div>

        <div className="medal-info">
          <h3>OBQJr — Brazilian Chemistry Olympiad Junior</h3>
          <p className="medal-desc">
            First medal in the collection. The one that started it all.
          </p>
          <p className="medal-note">
            Drop your <code>.glb</code> file at<br />
            <code>/honors/medals/obqjr.glb</code>
          </p>
        </div>
      </div>
    </div>
  );
}

useGLTF.preload(MEDAL_GLB_PATH);

export default Honors;
