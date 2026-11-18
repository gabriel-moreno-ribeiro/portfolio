import { OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePageVisible } from "../../lib/motion";
import { useInputSourceStore } from "../../store/inputSourceStore";

// Self-hosted (copied from three/examples/jsm/libs/draco/gltf): the robot no
// longer depends on gstatic.com answering.
useGLTF.setDecoderPath("/draco/");

// The GLB has no animation tracks and no separate eye meshes, so "sleep" is done
// on the group: after 30s without input it tilts forward and bobs; the first input
// wakes it with a short startle.
const IDLE_MS = 30_000;
const SLEEP_TILT = (8 * Math.PI) / 180;
const BOB_PERIOD_S = 2;
const STARTLE_MS = 300;
const INPUT_EVENTS = ["mousemove", "scroll", "keydown", "pointerdown", "touchstart"];

// Tricks played back when the camera sees a gesture (hands-free mode): how long each
// lasts, and what it adds on top of the head tracking at progress p (0..1).
const MOVE_MS = { wave: 1400, spin: 900, jump: 700, nod: 900, cheer: 1600 };
function moveOffsets(kind, p) {
  const arc = Math.sin(p * Math.PI); // 0 → 1 → 0
  switch (kind) {
    case "wave": // rock side to side, like a hand waving
      return { rz: Math.sin(p * Math.PI * 6) * 0.32 * arc, y: arc * 0.12 };
    case "spin": // one full turn with a small hop
      return { ry: (p < 0.5 ? 2 * p * p : 1 - 2 * (1 - p) * (1 - p)) * Math.PI * 2, y: arc * 0.3 };
    case "jump": // stretch on the way up, squash on landing
      return { y: arc * 0.9, stretch: Math.sin(p * Math.PI * 2) * 0.1 };
    case "nod":
      return { rx: Math.sin(p * Math.PI * 4) * 0.3 * arc };
    case "cheer": // three hops, rocking
      return { y: Math.abs(Math.sin(p * Math.PI * 3)) * 0.55, rz: Math.sin(p * Math.PI * 6) * 0.18 };
    default:
      return {};
  }
}
const clamp = (v, lim) => Math.max(-lim, Math.min(lim, v));

function Model({ onReady, ...props }) {
  const { scene } = useGLTF("/assets/3d/robot.glb");
  const group = useRef();
  const lastInput = useRef(0);
  const wokeAt = useRef(-Infinity);
  const baseY = useRef(props.position?.[1] ?? 0);
  // Where the head tracking has the robot; the tricks are added on top of this each frame.
  const pose = useRef({ rx: 0, ry: 0, rz: 0, x: 0, y: props.position?.[1] ?? 0, s: 1 });
  const invalidate = useThree((s) => s.invalidate);
  const frameloop = useThree((s) => s.frameloop);
  // Back from a hidden tab or from off screen: settle (or keep bobbing) without waiting for input
  useEffect(() => {
    if (frameloop === "demand") invalidate();
  }, [frameloop, invalidate]);

  useEffect(() => {
    // Model is mounted = GLB is loaded and scene is ready
    onReady?.();
    invalidate();
  }, []);

  // Frames run on demand: any input (or a new head position from the camera)
  // asks for one, and useFrame keeps asking while the robot is still moving.
  useEffect(() => {
    lastInput.current = performance.now();
    // A settled robot asks for no frames, so falling asleep needs its own alarm.
    let alarm = setTimeout(invalidate, IDLE_MS + 50);
    const bump = () => {
      const now = performance.now();
      if (now - lastInput.current > IDLE_MS) wokeAt.current = now;
      lastInput.current = now;
      clearTimeout(alarm);
      alarm = setTimeout(invalidate, IDLE_MS + 50);
      invalidate();
    };
    INPUT_EVENTS.forEach((ev) => window.addEventListener(ev, bump, { passive: true }));
    // With the camera on there is no mouse or keyboard: a head or a hand in the picture is the input.
    const unsub = useInputSourceStore.subscribe((st, was) =>
      st.inputSource === "camera" && (st.headPosition !== was.headPosition || st.handPositions.length) ? bump() : invalidate()
    );
    return () => {
      INPUT_EVENTS.forEach((ev) => window.removeEventListener(ev, bump));
      unsub();
      clearTimeout(alarm);
    };
  }, [invalidate]);

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const t = state.clock.getElapsedTime();
    const now = performance.now();
    const asleep = now - lastInput.current > IDLE_MS;
    const startle = Math.max(0, 1 - (now - wokeAt.current) / STARTLE_MS);

    const { headPosition: head, robotMove } = useInputSourceStore.getState();
    const b = pose.current;
    const target = {
      ry: asleep ? 0 : head.x * 0.4,
      // Waking up: a short flinch backwards before the head settles on the cursor.
      rx: (asleep ? SLEEP_TILT : head.y * 0.4) - startle * 0.14,
      // Camera only: tilt, sidestep and lean in with the visitor.
      rz: asleep ? 0 : clamp(head.roll ?? 0, 0.6) * 0.9,
      x: asleep ? 0 : (head.shift ?? 0) * 0.55,
      s: asleep ? 1 : head.near ?? 1,
      y: baseY.current + (asleep ? Math.sin((t * 2 * Math.PI) / BOB_PERIOD_S) * 0.04 : 0),
    };
    const damp = asleep ? 0.03 : startle > 0 ? 0.35 : 0.2;
    let settling = false;
    for (const k in target) {
      b[k] += (target[k] - b[k]) * (k === "y" ? 0.05 : damp);
      if (Math.abs(target[k] - b[k]) > 0.0005) settling = true;
    }

    const p = robotMove ? (now - robotMove.at) / MOVE_MS[robotMove.kind] : 1;
    const m = p < 1 ? moveOffsets(robotMove.kind, p) : {};
    const stretch = m.stretch ?? 0;
    g.rotation.set(b.rx + (m.rx ?? 0), b.ry + (m.ry ?? 0), b.rz + (m.rz ?? 0));
    g.position.x = b.x;
    g.position.y = b.y + (m.y ?? 0);
    g.scale.set(b.s * (1 - stretch / 2), b.s * (1 + stretch), b.s * (1 - stretch / 2));

    // Keep rendering while anything is still settling (or while it bobs in its sleep)
    if (asleep || startle > 0 || settling || p < 1) invalidate();
  });

  return (
    <group ref={group} {...props} dispose={null}>
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload("/assets/3d/robot.glb");

// The canvas is bigger than the robot box (hero.scss) so a jump or a sidestep is not cut
// off. The camera still frames that box; the extra canvas shows what is around it.
const ROOM_SIDE = 110; // .hero-robot__canvas insets in hero.scss
const ROOM_ABOVE = 90;
function Framing() {
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  useEffect(() => {
    camera.manual = true; // keep the fiber from resetting the aspect on resize
    camera.aspect = 1;
    const box = size.width - ROOM_SIDE * 2;
    camera.setViewOffset(box, box, -ROOM_SIDE, -ROOM_ABOVE, size.width, size.height);
  }, [camera, size.width, size.height]);
  return null;
}

export default function CanvasComponent({ onReady }) {
  const pageVisible = usePageVisible();
  const ioRef = useRef(null);
  const [inView, setInView] = useState(true);

  // Frames are on demand (the model asks for them while it moves), and the loop
  // stops outright while it is scrolled out of view or the tab is hidden.
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
      frameloop={inView && pageVisible ? "demand" : "never"}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
    >
      {/* Same light in both themes: the dimmed dark-mode rig turned the orange
          shell maroon, and the static poster it replaces is lit like this */}
      <Framing />
      <ambientLight intensity={1} />
      <directionalLight position={[10, 10, 10]} intensity={2} />
      <Model onReady={onReady} position={[0, -1.8, 0]} />
      <OrbitControls enableZoom={false} />
    </Canvas>
  );
}
