import { OrbitControls, Environment } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useRef } from "react";
import { useThemeStore } from "../../store/themeStore";
import { ChevroletC10 } from "./ChevroletC10";

export default function PartsAssemblingCanvas() {
  const group = useRef();
  const progressRef = useRef(0);
  const { darkMode } = useThemeStore();

  useEffect(() => {
    const handleScrollAnimationProgress = (event) => {
      progressRef.current = event.detail;
    };

    document.addEventListener(
      "scrollAnimationProgress",
      handleScrollAnimationProgress
    );

    return () => {
      document.removeEventListener(
        "scrollAnimationProgress",
        handleScrollAnimationProgress
      );
    };
  }, []);

  const RotationController = () => {
    useFrame(() => {
      if (group.current) {
        group.current.rotation.y =
          progressRef.current * Math.PI * 2 * 0.4;
      }
    });
    return null;
  };

  return (
    <div className="parts-assembling" data-drag-me={true}>
      <Canvas camera={{ position: [400, 150, 400], fov: 50 }}>
        <OrbitControls enableZoom={false} />
        <directionalLight
          position={[5, 10, 5]}
          intensity={darkMode ? 1.0 : 2.0}
          castShadow
        />
        <directionalLight
          position={[-5, 5, -5]}
          intensity={darkMode ? 0.3 : 0.6}
        />
        <ambientLight intensity={darkMode ? 0.5 : 0.8} />
        <Suspense>
          <ChevroletC10
            progressRef={progressRef}
            groupRef={group}
            scale={1}
            position={[0, -100, 0]}
          />
          <RotationController />
        </Suspense>
      </Canvas>
    </div>
  );
}
