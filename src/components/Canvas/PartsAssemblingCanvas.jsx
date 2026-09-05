import { Environment } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useRef, useCallback } from "react";
import { Vector3 } from "three";
import { useThemeStore } from "../../store/themeStore";
import { D20Truck } from "./D20Truck";

const REDUCED_MOTION =
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Fraction of the section scroll during which the truck assembles. After that
// it is complete and idles (turntable spin + gentle bob) for the rest of the
// section. 0.2 ≈ the second job entry reaching the middle of the viewport.
const ASSEMBLY_END = 0.2;

// Model: ~13.6 wide × 13.6 tall × 33.6 long, base at y=0 (before the -2 offset).
const TRUCK_CENTER = new Vector3(0, 4.8, 0.7);
const TRUCK_FIT_RADIUS = 21; // half the XZ diagonal + margin, so no rotation clips
const CAMERA_FOV = 50;
const CAMERA_DIR = new Vector3(1, 0.42, 1).normalize();

const GROUP_BASE_Y = -2;
const IDLE_SPIN_SPEED = 0.35; // rad/s
const IDLE_BOB_AMPLITUDE = 0.4;
const IDLE_BOB_SPEED = 1.1;

function smoothstep(t) {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
}

// Scroll drives the rotation while the truck assembles; once assembled it
// keeps spinning on its own so the scene never freezes.
function TruckMotion({ sectionProgressRef, groupRef }) {
  const idleTimeRef = useRef(0);

  useFrame((_, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const p = sectionProgressRef.current;
    const assembly = Math.min(1, p / ASSEMBLY_END);
    // Ramps 0→1 as the last part clicks in, so the spin fades in smoothly.
    const idle = smoothstep((assembly - 0.75) / 0.25);

    idleTimeRef.current += Math.min(delta, 0.05) * idle;
    const t = idleTimeRef.current;

    group.rotation.y = assembly * Math.PI * 0.6 + t * IDLE_SPIN_SPEED;
    group.position.y =
      GROUP_BASE_Y + Math.sin(t * IDLE_BOB_SPEED) * IDLE_BOB_AMPLITUDE * idle;
  });
  return null;
}

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
  const sectionProgressRef = useRef(0); // 0..1 across the whole section
  const assemblyProgressRef = useRef(0); // 0..1 across the assembly window
  const containerRef = useRef(null);
  const { darkMode } = useThemeStore();

  const setProgress = useCallback((raw) => {
    const p = REDUCED_MOTION ? 1 : Math.max(0, Math.min(1, raw));
    sectionProgressRef.current = p;
    assemblyProgressRef.current = Math.min(1, p / ASSEMBLY_END);
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
    // Also listen the custom event as fallback (from GSAP ScrollTrigger)
    const handleCustom = (event) => {
      const val = event.detail;
      if (typeof val === "number" && isFinite(val)) setProgress(val);
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
  }, [updateProgress, setProgress]);

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
            progressRef={assemblyProgressRef}
            groupRef={group}
            scale={1}
            position={[0, GROUP_BASE_Y, 0]}
          />
          <Environment files="/assets/3d/studio.hdr" />
          {!REDUCED_MOTION && (
            <TruckMotion sectionProgressRef={sectionProgressRef} groupRef={group} />
          )}
        </Suspense>
      </Canvas>
    </div>
  );
}
