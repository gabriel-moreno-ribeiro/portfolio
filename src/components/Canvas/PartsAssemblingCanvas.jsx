import { Environment } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useRef, useCallback } from "react";
import { Vector3 } from "three";
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

// Model: ~13.6 wide × 13.6 tall × 33.6 long, base at y=0 (before the -2 offset).
const TRUCK_CENTER = new Vector3(0, 4.8, 0.7);
const TRUCK_FIT_RADIUS = 21; // half the XZ diagonal + margin, so no rotation clips
const CAMERA_FOV = 50;
const CAMERA_DIR = new Vector3(1, 0.42, 1).normalize();

// Places the camera so the whole truck fits in the sticky column at any
// rotation, whatever the column's aspect ratio is.
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
        camera={{ fov: CAMERA_FOV }}
        gl={{ antialias: true, alpha: true }}
        style={{ width: "100%", height: "100%" }}
      >
        <CameraSetup />
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
          <Environment files="/assets/3d/studio.hdr" />
          {!REDUCED_MOTION && (
            <RotationController progressRef={progressRef} groupRef={group} />
          )}
        </Suspense>
      </Canvas>
    </div>
  );
}
