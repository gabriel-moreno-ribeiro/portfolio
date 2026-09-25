import { OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useCallback, useEffect, useRef, useState } from "react";
import { useInputSourceStore } from "../../store/inputSourceStore";
import { useThemeStore } from "../../store/themeStore";

useGLTF.setDecoderPath("https://www.gstatic.com/draco/versioned/decoders/1.5.7/");

function Model({ onReady, ...props }) {
  const { scene } = useGLTF("/assets/3d/robot.glb");
  const group = useRef();

  useEffect(() => {
    // Model is mounted = GLB is loaded and scene is ready
    onReady?.();
  }, []);

  useFrame(() => {
    const { headPosition } = useInputSourceStore.getState();
    group.current.rotation.y +=
      (headPosition.x * 0.4 - group.current.rotation.y) * 0.2;
    group.current.rotation.x +=
      (headPosition.y * 0.4 - group.current.rotation.x) * 0.2;
  });

  return (
    <group ref={group} {...props} dispose={null}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload("/assets/3d/robot.glb");

export default function CanvasComponent({ onReady }) {
  const { darkMode } = useThemeStore();
  const ioRef = useRef(null);
  const [inView, setInView] = useState(true);

  // The robot damps toward the cursor every frame, so it cannot run on demand.
  // Stop the loop outright while it is scrolled out of view.
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
      frameloop={inView ? "always" : "never"}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={darkMode ? 0.25 : 1} />
      <directionalLight position={[10, 10, 10]} intensity={darkMode ? 0 : 2} />
      <Model onReady={onReady} position={[0, -1.8, 0]} />
      <OrbitControls enableZoom={false} />
    </Canvas>
  );
}
