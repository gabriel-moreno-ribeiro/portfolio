import { OrbitControls, Environment } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useRef, useCallback } from "react";
import { useThemeStore } from "../../store/themeStore";
import { D20Truck } from "./D20Truck";

const REDUCED_MOTION =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function RotationController({ progressRef, groupRef }) {
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y = progressRef.current * Math.PI * 0.8;
    }
  });
  return null;
}

function CameraSetup() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(30, 12, 30);
    camera.lookAt(0, 4, 0);
    camera.updateProjectionMatrix();
  }, [camera]);
  return null;
}

export default function PartsAssemblingCanvas() {
  const group = useRef();
  const progressRef = useRef(0);
  const containerRef = useRef(null);
  const { darkMode } = useThemeStore();

  const updateProgress = useCallback(() => {
    const wrapper = document.getElementById("work-experience");
    if (!wrapper) return;

    const rect = wrapper.getBoundingClientRect();
    const wh = window.innerHeight;
    const totalScroll = rect.height - wh;

    if (totalScroll <= 0) {
      progressRef.current = 0;
      return;
    }

    const scrolled = -rect.top;
    const raw = scrolled / totalScroll;
    progressRef.current = REDUCED_MOTION ? 0 : Math.max(0, Math.min(1, raw));
  }, []);

  useEffect(() => {
    // Also listen the custom event as fallback (from GSAP ScrollTrigger)
    const handleCustom = (event) => {
      const val = event.detail;
      if (typeof val === "number" && isFinite(val)) {
        progressRef.current = REDUCED_MOTION ? 0 : Math.max(0, Math.min(1, val));
      }
    };

    // Compute initial progress immediately
    updateProgress();

    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress, { passive: true });
    document.addEventListener("scrollAnimationProgress", handleCustom);

    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
      document.removeEventListener("scrollAnimationProgress", handleCustom);
    };
  }, [updateProgress]);

  return (
    <div className="parts-assembling" ref={containerRef} data-drag-me={true}>
      <Canvas
        camera={{ position: [30, 12, 30], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ width: "100%", height: "100%" }}
      >
        <CameraSetup />
        <OrbitControls enableZoom={false} enablePan={false} enableRotate={false} />
        <directionalLight
          position={[10, 20, 10]}
          intensity={darkMode ? 1.2 : 2.5}
          castShadow
        />
        <directionalLight
          position={[-10, 10, -10]}
          intensity={darkMode ? 0.4 : 0.8}
        />
        <ambientLight intensity={darkMode ? 0.6 : 1.0} />
        <Suspense fallback={null}>
          <D20Truck
            progressRef={progressRef}
            groupRef={group}
            scale={1}
            position={[0, -2, 0]}
          />
          <Environment preset="studio" />
          {!REDUCED_MOTION && (
            <RotationController progressRef={progressRef} groupRef={group} />
          )}
        </Suspense>
      </Canvas>
    </div>
  );
}
