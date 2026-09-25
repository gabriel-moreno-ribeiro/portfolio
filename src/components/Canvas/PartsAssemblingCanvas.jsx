import { Environment } from "@react-three/drei";
import { Canvas, invalidate, useFrame, useThree } from "@react-three/fiber";
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
    // Imperative camera change: demand a frame, nothing else will ask for one.
    invalidate();
  }, [camera, size.width, size.height]);
  return null;
}

export default function PartsAssemblingCanvas() {
  const group = useRef();
  const progressRef = useRef(0);
  const containerRef = useRef(null);
  const { darkMode } = useThemeStore();

  // Nothing here animates on its own: the truck is a pure function of scroll
  // progress. Only ask for a frame when that number actually moves.
  const setProgress = useCallback((value) => {
    const next = REDUCED_MOTION ? 0 : Math.max(0, Math.min(1, value));
    if (next === progressRef.current) return;
    progressRef.current = next;
    invalidate();
  }, []);

  const updateProgress = useCallback(() => {
    const wrapper = document.getElementById("work-experience");
    if (!wrapper) return;

    const rect = wrapper.getBoundingClientRect();
    const wh = window.innerHeight;
    const totalScroll = rect.height - wh;

    if (totalScroll <= 0) {
      setProgress(0);
      return;
    }

    setProgress(-rect.top / totalScroll);
  }, [setProgress]);

  useEffect(() => {
    // Coalesce scroll events into one measurement per frame: reading the
    // wrapper's rect forces a layout.
    let raf = 0;
    const schedule = () => {
      if (!raf) {
        raf = requestAnimationFrame(() => {
          raf = 0;
          updateProgress();
        });
      }
    };

    // Also listen the custom event as fallback (from GSAP ScrollTrigger)
    const handleCustom = (event) => {
      const val = event.detail;
      if (typeof val === "number" && isFinite(val)) setProgress(val);
    };

    // Compute initial progress immediately
    updateProgress();

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    document.addEventListener("scrollAnimationProgress", handleCustom);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      document.removeEventListener("scrollAnimationProgress", handleCustom);
    };
  }, [updateProgress, setProgress]);

  return (
    <div className="parts-assembling" ref={containerRef} data-drag-me={true}>
      <Canvas
        camera={{ fov: CAMERA_FOV }}
        dpr={[1, 1.5]}
        frameloop="demand"
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
