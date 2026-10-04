import { OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePageVisible } from "../../lib/motion";
import { useInputSourceStore } from "../../store/inputSourceStore";

useGLTF.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");

// The GLB has no animation tracks and no separate eye meshes, so "sleep" is done
// on the group: after 30s without input it tilts forward and bobs; the first input
// wakes it with a short startle.
const IDLE_MS = 30_000;
const SLEEP_TILT = (8 * Math.PI) / 180;
const BOB_PERIOD_S = 2;
const STARTLE_MS = 300;
const INPUT_EVENTS = ["mousemove", "scroll", "keydown", "pointerdown", "touchstart"];

function Model({ onReady, ...props }) {
  const { scene } = useGLTF("/assets/3d/robot.glb");
  const group = useRef();
  const lastInput = useRef(0);
  const wokeAt = useRef(-Infinity);
  const baseY = useRef(props.position?.[1] ?? 0);

  useEffect(() => {
    // Model is mounted = GLB is loaded and scene is ready
    onReady?.();
  }, []);

  useEffect(() => {
    lastInput.current = performance.now();
    const bump = () => {
      const now = performance.now();
      if (now - lastInput.current > IDLE_MS) wokeAt.current = now;
      lastInput.current = now;
    };
    INPUT_EVENTS.forEach((ev) => window.addEventListener(ev, bump, { passive: true }));
    return () => INPUT_EVENTS.forEach((ev) => window.removeEventListener(ev, bump));
  }, []);

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.getElapsedTime();
    const now = performance.now();
    const asleep = now - lastInput.current > IDLE_MS;
    const startle = Math.max(0, 1 - (now - wokeAt.current) / STARTLE_MS);

    const { headPosition } = useInputSourceStore.getState();
    let targetY = asleep ? 0 : headPosition.x * 0.4;
    let targetX = asleep ? SLEEP_TILT : headPosition.y * 0.4;
    // Waking up: a short flinch backwards before the head settles on the cursor.
    if (startle > 0) targetX -= startle * 0.14;

    const damp = asleep ? 0.03 : startle > 0 ? 0.35 : 0.2;
    g.rotation.y += (targetY - g.rotation.y) * damp;
    g.rotation.x += (targetX - g.rotation.x) * damp;

    const bob = asleep ? Math.sin((t * 2 * Math.PI) / BOB_PERIOD_S) * 0.04 : 0;
    g.position.y += (baseY.current + bob - g.position.y) * 0.05;
  });

  return (
    <group ref={group} {...props} dispose={null}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload("/assets/3d/robot.glb");

export default function CanvasComponent({ onReady }) {
  const pageVisible = usePageVisible();
  const ioRef = useRef(null);
  const [inView, setInView] = useState(true);

  // The robot damps toward the cursor every frame, so it cannot run on demand.
  // Stop the loop outright while it is scrolled out of view or the tab is hidden.
  // Canvas only mounts the <canvas> once it has measured itself, so hook the
  // observer up from a callback ref rather than an effect.
  const observeCanvas = useCallback((el) => {
    ioRef.current?.disconnect();
    ioRef.current = null;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), {
      threshold: 0,
    });
    io.observe(el);
    ioRef.current = io;
  }, []);

  useEffect(() => () => ioRef.current?.disconnect(), []);

  return (
    <Canvas
      ref={observeCanvas}
      camera={{ position: [0.4, 1.17, 11.35], fov: 25 }}
      className="robot-canvas"
      data-drag-me={true}
      dpr={[1, 1.5]}
      frameloop={inView && pageVisible ? "always" : "never"}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
    >
      {/* Same light in both themes: the dimmed dark-mode rig turned the orange
          shell maroon, and the static poster it replaces is lit like this */}
      <ambientLight intensity={1} />
      <directionalLight position={[10, 10, 10]} intensity={2} />
      <Model onReady={onReady} position={[0, -1.8, 0]} />
      <OrbitControls enableZoom={false} />
    </Canvas>
  );
}
