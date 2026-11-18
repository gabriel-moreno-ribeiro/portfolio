import { useInputSourceStore, type HeadPose, type RobotMove } from "../store/inputSourceStore";
import { useHandsfreeStore, type CameraError } from "../store/handsfreeStore";

let videoEl: HTMLVideoElement | null = null;
let stream: MediaStream | null = null;
let faceLandmarker: any = null;
let handLandmarker: any = null;
let rafId: number | null = null;
let frameCount = 0;

const MODELS = "https://storage.googleapis.com/mediapipe-models";
const bytes = (url: string) =>
  fetch(url).then((r) => {
    if (!r.ok) throw new Error(`model ${r.status}`);
    return r.arrayBuffer();
  }).then((b) => new Uint8Array(b));

// Everything is fetched at once (the library, its wasm and the two models, ~12 MB);
// only building the two trackers, which is quick, happens one after the other.
async function loadModels(onProgress: (progress: number) => void) {
  let done = 0;
  const step = <T,>(p: Promise<T>) => p.then((v) => (onProgress(10 + ++done * 20), v));
  const [{ FaceLandmarker, HandLandmarker, FilesetResolver }, faceModel, handModel] = await Promise.all([
    step(import("@mediapipe/tasks-vision")),
    step(bytes(`${MODELS}/face_landmarker/face_landmarker/float16/1/face_landmarker.task`)),
    step(bytes(`${MODELS}/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`)),
  ]);
  const filesetResolver = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.32/wasm" // keep in step with package.json
  );

  const face = await FaceLandmarker.createFromOptions(filesetResolver, {
    baseOptions: { modelAssetBuffer: faceModel, delegate: "GPU" },
    runningMode: "VIDEO",
    outputFaceBlendshapes: false,
    outputFacialTransformationMatrixes: false,
    numFaces: 1,
  });
  onProgress(85);

  const hand = await HandLandmarker.createFromOptions(filesetResolver, {
    baseOptions: { modelAssetBuffer: handModel, delegate: "GPU" },
    runningMode: "VIDEO",
    numHands: 2,
  });
  onProgress(100);
  return { face, hand };
}

// The models don't need the camera: the intro window starts them, so they are usually
// ready by the time the visitor allows the camera. One load at a time, shared.
type Models = Awaited<ReturnType<typeof loadModels>>;
let modelsPromise: Promise<Models> | null = null;
let modelPct = 0;
let cameraUp = false;
// The loader stays up until the camera is running too, however early the models arrive.
const reportProgress = () =>
  useHandsfreeStore.getState().setModelLoadProgress(cameraUp ? modelPct : Math.min(modelPct, 95));

export function preloadModels(): Promise<Models> {
  if (!modelsPromise) {
    modelPct = 5;
    reportProgress();
    const mine = (modelsPromise = loadModels((pct) => {
      if (modelsPromise !== mine) return;
      modelPct = pct;
      reportProgress();
    }));
    mine.catch(() => {
      if (modelsPromise === mine) modelsPromise = null;
    });
  }
  return modelsPromise;
}

function extractHeadPoseFromLandmarks(
  landmarks: { x: number; y: number; z: number }[]
): HeadPose {
  // Use face landmarks directly — more reliable than matrix decomposition.
  // Nose tip (4) relative to face center (midpoint of eyes) gives yaw/pitch.
  const nose = landmarks[4];
  const leftEye = landmarks[263]; // left eye outer corner
  const rightEye = landmarks[33]; // right eye outer corner
  const forehead = landmarks[10];
  const chin = landmarks[152];

  // Face center from eyes
  const faceCenterX = (leftEye.x + rightEye.x) / 2;
  const faceCenterY = (forehead.y + chin.y) / 2;

  // Face dimensions for normalization
  const faceWidth = Math.abs(leftEye.x - rightEye.x);
  const faceHeight = Math.abs(chin.y - forehead.y);

  // Nose offset from face center, normalized by face size
  // Multiply by sensitivity factor (~3) to get -1..1 from typical head turns
  const rawYaw = (nose.x - faceCenterX) / (faceWidth || 0.1);
  const rawPitch = (nose.y - faceCenterY) / (faceHeight || 0.1);

  // Negate X for camera mirror, keep Y (nose below center = looking down = positive)
  const normalizedX = Math.max(-1, Math.min(1, -rawYaw * 3));
  const normalizedY = Math.max(-1, Math.min(1, rawPitch * 3));

  // Sideways tilt from the line between the eyes; where the face is and how big it looks.
  const roll = Math.atan2(leftEye.y - rightEye.y, leftEye.x - rightEye.x);
  const shift = Math.max(-1, Math.min(1, -(faceCenterX - 0.5) * 2.5));
  const near = Math.max(0.9, Math.min(1.18, 1 + (faceWidth - 0.16) * 1.6));

  return { x: normalizedX, y: normalizedY, roll, shift, near };
}

function countExtendedFingers(landmarks: any[]): number {
  // Rotation-invariant: tip further from wrist than MCP = extended
  const wrist = landmarks[0];
  const tips = [4, 8, 12, 16, 20];
  const mcps = [2, 5, 9, 13, 17];

  let count = 0;
  for (let i = 0; i < 5; i++) {
    const tip = landmarks[tips[i]];
    const mcp = landmarks[mcps[i]];
    const tipDist = Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
    const mcpDist = Math.hypot(mcp.x - wrist.x, mcp.y - wrist.y);
    if (tipDist > mcpDist * 1.15) count++;
  }
  return count;
}

function countNonPinchFingers(landmarks: any[]): number {
  // Count only middle, ring, pinky — excludes thumb & index (the pinching fingers)
  const wrist = landmarks[0];
  const tips = [12, 16, 20];
  const mcps = [9, 13, 17];

  let count = 0;
  for (let i = 0; i < 3; i++) {
    const tip = landmarks[tips[i]];
    const mcp = landmarks[mcps[i]];
    const tipDist = Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
    const mcpDist = Math.hypot(mcp.x - wrist.x, mcp.y - wrist.y);
    if (tipDist > mcpDist * 1.15) count++;
  }
  return count;
}

// Raw landmarks for ML overlay drawing
let latestFaceLandmarks: any[] | null = null;
let latestHandLandmarks: any[][] | null = null;

// ── Position smoothing (EMA) ──
const POSITION_SMOOTHING = 0.45;
const SCROLL_Y_SMOOTHING = 0.4;

interface SmoothedHand {
  x: number;
  y: number;
  initialized: boolean;
}

const smoothedHands: SmoothedHand[] = [
  { x: 0, y: 0, initialized: false },
  { x: 0, y: 0, initialized: false },
];

// ── Gesture debounce ──
const GESTURE_DEBOUNCE_FRAMES = 3;

// ── Scroll constants (used by pinch-drag scroll) ──
const SCROLL_SENSITIVITY = 8; // px multiplier for direct tracking
const MOMENTUM_DECAY = 0.95; // per-frame velocity decay (lower = stops faster)
const MOMENTUM_MIN = 0.5; // velocity threshold to stop coasting
const VELOCITY_SMOOTHING = 0.3; // EMA factor for velocity (0-1, lower = smoother)

// Shared scroll state for momentum coasting after pinch release
const scrollState = { velocity: 0 };
let momentumRafId: number | null = null;

function startMomentumScroll() {
  if (momentumRafId !== null) return;

  const coast = () => {
    scrollState.velocity *= MOMENTUM_DECAY;

    if (Math.abs(scrollState.velocity) < MOMENTUM_MIN) {
      scrollState.velocity = 0;
      momentumRafId = null;
      return;
    }

    window.scrollBy({ top: scrollState.velocity, behavior: "instant" });
    momentumRafId = requestAnimationFrame(coast);
  };

  momentumRafId = requestAnimationFrame(coast);
}

function stopMomentumScroll() {
  if (momentumRafId !== null) {
    cancelAnimationFrame(momentumRafId);
    momentumRafId = null;
  }
}

// ── Pinch gesture state (click + drag-to-scroll) ──
const PINCH_THRESHOLD = 0.05; // normalized thumb-index distance to trigger pinch (stricter)
const PINCH_RELEASE_THRESHOLD = 0.08; // hysteresis for release
const PINCH_COOLDOWN_MS = 300;
const PINCH_SCROLL_THRESHOLD = 15; // px of Y movement before pinch becomes scroll

interface PinchState {
  isPinching: boolean;
  isScrolling: boolean;
  pinchFrames: number;
  releaseFrames: number;
  lastClickTime: number;
  // Scroll tracking (active during pinch hold)
  startScreenY: number;
  lastScreenY: number;
  smoothedScreenY: number;
  velocity: number;
}

const makePinchState = (): PinchState => ({
  isPinching: false,
  isScrolling: false,
  pinchFrames: 0,
  releaseFrames: 0,
  lastClickTime: 0,
  startScreenY: 0,
  lastScreenY: 0,
  smoothedScreenY: 0,
  velocity: 0,
});

const pinchStates: PinchState[] = [makePinchState(), makePinchState()];

// ── Fist cooldown: prevent fist→pinch transition artifacts ──
const FIST_COOLDOWN_MS = 200;
const fistTracker = [{ lastFistTime: 0 }, { lastFistTime: 0 }];

function isFist(landmarks: any[]): boolean {
  // Fist = 0-1 extended fingers. Thumb may poke out.
  // We DON'T check thumb-index distance here — during a fist the thumb
  // naturally rests on/near the curled index finger, which would look like
  // a pinch distance-wise. Finger extension count is the reliable signal.
  return countExtendedFingers(landmarks) <= 1;
}

function detectPinch(landmarks: any[]): boolean {
  if (isFist(landmarks)) return false;
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  if (Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y) >= PINCH_THRESHOLD) return false;

  // Confirm the index finger is at least semi-extended (reaching toward thumb).
  // In a fist, the index tip curls into the palm — close to palm center (landmark 9).
  // In a pinch, the index tip extends outward — far from palm center.
  const palmCenter = landmarks[9];
  const wrist = landmarks[0];
  const palmSize = Math.hypot(palmCenter.x - wrist.x, palmCenter.y - wrist.y);
  const tipToPalm = Math.hypot(indexTip.x - palmCenter.x, indexTip.y - palmCenter.y);
  if (tipToPalm < palmSize * 0.4) return false; // index curled into palm → fist, not pinch

  return true;
}

function isPinchReleased(landmarks: any[]): boolean {
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  return Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y) > PINCH_RELEASE_THRESHOLD;
}

function dispatchClick(screenX: number, screenY: number) {
  const el = document.elementFromPoint(screenX, screenY);
  if (!el) return;
  el.dispatchEvent(
    new MouseEvent("mouseover", { bubbles: true, clientX: screenX, clientY: screenY })
  );
  const shared = { bubbles: true, cancelable: true, clientX: screenX, clientY: screenY };
  el.dispatchEvent(new PointerEvent("pointerdown", { ...shared, pointerId: 1, pointerType: "mouse" }));
  el.dispatchEvent(new MouseEvent("mousedown", shared));
  el.dispatchEvent(new PointerEvent("pointerup", { ...shared, pointerId: 1, pointerType: "mouse" }));
  el.dispatchEvent(new MouseEvent("mouseup", shared));
  el.dispatchEvent(new MouseEvent("click", shared));
}

function processPinchGesture(
  landmarks: any[],
  handIdx: number,
  screenX: number,
  screenY: number
): { isPinching: boolean; isScrolling: boolean } {
  const state = pinchStates[handIdx];
  const now = performance.now();

  // ── Fist gate: track fist and enforce cooldown ──
  if (isFist(landmarks)) {
    fistTracker[handIdx].lastFistTime = now;
    // If pinch was active, cancel it (fist overrides pinch)
    if (state.isPinching) {
      if (state.isScrolling && Math.abs(state.velocity) > MOMENTUM_MIN) {
        scrollState.velocity = state.velocity;
        startMomentumScroll();
      }
      state.isPinching = false;
      state.isScrolling = false;
      state.velocity = 0;
      state.pinchFrames = 0;
      state.releaseFrames = 0;
    }
    return { isPinching: false, isScrolling: false };
  }

  // Suppress pinch right after fist release (prevents transition artifacts)
  if (now - fistTracker[handIdx].lastFistTime < FIST_COOLDOWN_MS) {
    state.pinchFrames = 0;
    return { isPinching: state.isPinching, isScrolling: state.isScrolling };
  }

  const pinching = detectPinch(landmarks);
  const released = isPinchReleased(landmarks);

  // Count consecutive frames for debounce
  if (pinching) {
    state.pinchFrames++;
    state.releaseFrames = 0;
  } else if (released) {
    state.releaseFrames++;
    state.pinchFrames = 0;
  }

  // Enter pinch
  if (!state.isPinching && state.pinchFrames >= GESTURE_DEBOUNCE_FRAMES) {
    if (now - state.lastClickTime < PINCH_COOLDOWN_MS)
      return { isPinching: false, isScrolling: false };
    state.isPinching = true;
    state.isScrolling = false;
    state.startScreenY = screenY;
    state.lastScreenY = screenY;
    state.smoothedScreenY = screenY;
    state.velocity = 0;
    stopMomentumScroll();
    return { isPinching: true, isScrolling: false };
  }

  // While pinching: check for drag → scroll
  if (state.isPinching && !state.isScrolling) {
    const yDelta = Math.abs(screenY - state.startScreenY);
    if (yDelta > PINCH_SCROLL_THRESHOLD) {
      state.isScrolling = true;
      state.lastScreenY = screenY;
      state.smoothedScreenY = screenY;
    }
  }

  // Active scroll during pinch
  if (state.isPinching && state.isScrolling && state.releaseFrames === 0) {
    state.smoothedScreenY =
      state.smoothedScreenY * (1 - SCROLL_Y_SMOOTHING) +
      screenY * SCROLL_Y_SMOOTHING;

    const smoothedDelta = state.smoothedScreenY - state.lastScreenY;
    state.lastScreenY = state.smoothedScreenY;

    const scrollAmount = -smoothedDelta * SCROLL_SENSITIVITY; // inverted: drag down = scroll up (grab & pull)

    state.velocity =
      state.velocity * (1 - VELOCITY_SMOOTHING) +
      scrollAmount * VELOCITY_SMOOTHING;

    window.scrollBy({ top: scrollAmount, behavior: "instant" });
  }

  // Release pinch
  if (state.isPinching && state.releaseFrames >= GESTURE_DEBOUNCE_FRAMES) {
    if (state.isScrolling) {
      // Was scrolling → kick off momentum, no click
      if (Math.abs(state.velocity) > MOMENTUM_MIN) {
        scrollState.velocity = state.velocity;
        startMomentumScroll();
      }
    } else {
      // Was not scrolling → dispatch click
      dispatchClick(screenX, screenY);
    }
    state.isPinching = false;
    state.isScrolling = false;
    state.lastClickTime = performance.now();
    state.velocity = 0;
    return { isPinching: false, isScrolling: false };
  }

  return { isPinching: state.isPinching, isScrolling: state.isScrolling };
}

// ── Gestures the hero robot answers (wave, peace sign, fist then open, thumbs up, both hands up) ──
const HOLD_FRAMES = 8; // a pose must last this long, so a passing hand shape doesn't count
const MOVE_COOLDOWN_MS = 1700; // the longest trick, so they never overlap
const WAVE_SWING = 0.05; // how far the palm travels (share of the frame) before a turn counts
const WAVE_WINDOW_MS = 1300;
const makeGestureState = () => ({ peace: 0, thumb: 0, fist: 0, dir: 0, edge: 0, turns: [] as number[] });
let gestureStates = [makeGestureState(), makeGestureState()];
let bothUp = 0;
let lastMoveAt = 0;

function fingersUp(lm: any[]): boolean[] {
  const wrist = lm[0];
  const d = (i: number) => Math.hypot(lm[i].x - wrist.x, lm[i].y - wrist.y);
  return [[4, 2], [8, 5], [12, 9], [16, 13], [20, 17]].map(([tip, mcp]) => d(tip) > d(mcp) * 1.15);
}

/** Which trick, if any, the hands in this frame ask for. Exported so it can be exercised without a camera. */
export function readRobotMove(hands: any[][], now: number): RobotMove | null {
  const asked: RobotMove[] = [];
  const open = hands.map((lm) => fingersUp(lm).filter(Boolean).length >= 4);

  // Both palms open in the top half of the picture.
  bothUp = hands.length === 2 && open[0] && open[1] && hands.every((lm) => lm[9].y < 0.45) ? bothUp + 1 : 0;
  if (bothUp >= HOLD_FRAMES) asked.push("cheer");

  hands.slice(0, 2).forEach((lm, i) => {
    const g = gestureStates[i];
    const [thumb, index, middle, ring, pinky] = fingersUp(lm);
    const palm = Math.hypot(lm[9].x - lm[0].x, lm[9].y - lm[0].y);

    // An open palm swinging side to side: count the turns.
    if (open[i]) {
      const x = lm[9].x;
      if (!g.dir) {
        g.dir = 1;
        g.edge = x;
      }
      if ((x - g.edge) * g.dir > 0) g.edge = x; // still going the same way
      else if (Math.abs(x - g.edge) > WAVE_SWING) {
        g.dir = -g.dir;
        g.edge = x;
        g.turns.push(now);
      }
      g.turns = g.turns.filter((t) => now - t < WAVE_WINDOW_MS);
      if (g.turns.length >= 3) {
        asked.push("wave");
        g.turns = [];
      }
    } else g.dir = 0;

    g.peace = index && middle && !ring && !pinky ? g.peace + 1 : 0;
    if (g.peace >= HOLD_FRAMES) {
      asked.push("spin");
      g.peace = 0;
    }

    // Thumb out and pointing up (y grows downwards), the other four curled.
    const thumbUp = thumb && !index && !middle && !ring && !pinky && lm[4].y < lm[0].y - palm * 0.9;
    g.thumb = thumbUp ? g.thumb + 1 : 0;
    if (g.thumb >= HOLD_FRAMES) {
      asked.push("nod");
      g.thumb = 0;
    }

    // A closed hand that then opens.
    const closed = !index && !middle && !ring && !pinky && !thumbUp;
    if (closed) g.fist++;
    else if (open[i]) {
      if (g.fist >= HOLD_FRAMES) asked.push("jump");
      g.fist = 0;
    } else g.fist = Math.max(0, g.fist - 1);
  });

  // "cheer" comes first in the list, so two waving hands held high cheer instead of waving.
  if (!asked.length || now - lastMoveAt < MOVE_COOLDOWN_MS) return null;
  lastMoveAt = now;
  bothUp = 0;
  return asked[0];
}

function resetGestures() {
  gestureStates = [makeGestureState(), makeGestureState()];
  bothUp = 0;
  lastMoveAt = 0;
}

function processFrame() {
  if (!videoEl || videoEl.readyState < 2) {
    rafId = requestAnimationFrame(processFrame);
    return;
  }

  frameCount++;
  const store = useInputSourceStore.getState();

  // Process face every other frame (~15fps at 30fps camera)
  if (faceLandmarker && frameCount % 2 === 0) {
    try {
      const faceResult = faceLandmarker.detectForVideo(
        videoEl,
        performance.now()
      );
      if (
        faceResult.faceLandmarks &&
        faceResult.faceLandmarks.length > 0
      ) {
        latestFaceLandmarks = faceResult.faceLandmarks[0];
        const pose = extractHeadPoseFromLandmarks(faceResult.faceLandmarks[0]);
        store.setHeadPosition(pose);
      }
    } catch {
      // Skip frame on error
    }
  }

  // Process hands every frame for responsive gestures
  if (handLandmarker) {
    try {
      const handResult = handLandmarker.detectForVideo(
        videoEl,
        performance.now()
      );
      if (handResult.landmarks && handResult.landmarks.length > 0) {
        latestHandLandmarks = handResult.landmarks;
        const move = readRobotMove(handResult.landmarks, performance.now());
        if (move) store.setRobotMove(move);
        const hands = handResult.landmarks.map(
          (landmarks: any[], idx: number) => {
            if (idx > 1) return null; // max 2 hands
            const palm = landmarks[9];
            const fingers = countExtendedFingers(landmarks);
            const confidence =
              handResult.handedness?.[idx]?.[0]?.score ?? 0.5;

            // Raw normalized position
            const rawX = -(palm.x * 2 - 1);
            const rawY = palm.y * 2 - 1;

            // EMA smoothing — eliminates landmark jitter
            const sh = smoothedHands[idx];
            if (!sh.initialized) {
              sh.x = rawX;
              sh.y = rawY;
              sh.initialized = true;
            } else {
              sh.x += (rawX - sh.x) * POSITION_SMOOTHING;
              sh.y += (rawY - sh.y) * POSITION_SMOOTHING;
            }

            // Screen coords from smoothed position
            const screenX = ((sh.x + 1) / 2) * window.innerWidth;
            const screenY = ((sh.y + 1) / 2) * window.innerHeight;

            // Pinch gesture handles both click and drag-to-scroll
            const pinchResult = processPinchGesture(landmarks, idx, screenX, screenY);

            return {
              x: sh.x,
              y: sh.y,
              fingers,
              confidence,
              isPinching: pinchResult.isPinching,
              isScrolling: pinchResult.isScrolling,
            };
          }
        ).filter(Boolean) as any[];

        store.setHandPositions(hands);
      } else {
        store.setHandPositions([]);
        latestHandLandmarks = null;
        // Reset gesture states when hands disappear
        for (const ps of pinchStates) {
          if (ps.isScrolling && Math.abs(ps.velocity) > MOMENTUM_MIN) {
            scrollState.velocity = ps.velocity;
            startMomentumScroll();
          }
          Object.assign(ps, makePinchState());
        }
        fistTracker[0].lastFistTime = 0;
        fistTracker[1].lastFistTime = 0;
        smoothedHands[0].initialized = false;
        smoothedHands[1].initialized = false;
      }
    } catch {
      // Skip frame on error
    }
  }

  rafId = requestAnimationFrame(processFrame);
}

// getUserMedia names its failures; anything else broke while loading the models.
export function cameraErrorKind(err: unknown): CameraError {
  const name = (err as { name?: string } | null)?.name;
  if (name === "NotAllowedError" || name === "SecurityError") return "blocked";
  if (name === "NotFoundError" || name === "OverconstrainedError") return "missing";
  if (name === "NotReadableError" || name === "AbortError") return "busy";
  return "load";
}

// Each start gets a number; stop bumps it, so a start still waiting on the
// camera or the models finds out it was cancelled and cleans up after itself.
let session = 0;

export async function startCameraInput() {
  const handsfreeState = useHandsfreeStore.getState();
  const mine = ++session;

  try {
    handsfreeState.setCameraError(null);
    cameraUp = false;
    // The models download while the browser asks for the camera.
    const loading = preloadModels();
    loading.catch(() => {}); // reported below; this only keeps a camera refusal from leaving it unhandled

    const granted = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, facingMode: "user" },
    });
    if (mine !== session) {
      granted.getTracks().forEach((t) => t.stop());
      return;
    }
    stream = granted;

    handsfreeState.setCameraPermission("granted");

    videoEl = document.createElement("video");
    videoEl.srcObject = stream;
    videoEl.setAttribute("playsinline", "true");
    videoEl.style.position = "fixed";
    videoEl.style.top = "-9999px";
    videoEl.style.left = "-9999px";
    videoEl.style.width = "1px";
    videoEl.style.height = "1px";
    document.body.appendChild(videoEl);
    const [models] = await Promise.all([loading, videoEl.play()]);
    // Cancelled meanwhile: the stop already released the camera and these models.
    if (mine !== session) return;
    faceLandmarker = models.face;
    handLandmarker = models.hand;

    useInputSourceStore.getState().setInputSource("camera");
    frameCount = 0;
    cameraUp = true;
    reportProgress();
    rafId = requestAnimationFrame(processFrame);
  } catch (err) {
    const kind = cameraErrorKind(err);
    if (kind === "blocked") handsfreeState.setCameraPermission("denied");
    if (mine === session) handsfreeState.setCameraError(kind);
    throw err;
  }
}

export function stopCameraInput() {
  session++;
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }

  if (stream) {
    stream.getTracks().forEach((t) => t.stop());
    stream = null;
  }

  if (videoEl) {
    videoEl.remove();
    videoEl = null;
  }

  // Also drops models that were preloaded (or are still loading) and never used.
  const loaded = modelsPromise;
  modelsPromise = null;
  loaded?.then((m) => (m.face.close(), m.hand.close())).catch(() => {});
  faceLandmarker = null;
  handLandmarker = null;
  modelPct = 0;
  cameraUp = false;

  latestFaceLandmarks = null;
  latestHandLandmarks = null;
  for (let i = 0; i < pinchStates.length; i++) {
    pinchStates[i] = makePinchState();
  }
  fistTracker[0].lastFistTime = 0;
  fistTracker[1].lastFistTime = 0;
  for (const sh of smoothedHands) sh.initialized = false;
  scrollState.velocity = 0;
  stopMomentumScroll();
  resetGestures();

  const inputStore = useInputSourceStore.getState();
  inputStore.setInputSource("mouse");
  inputStore.setHandPositions([]);
  inputStore.setHeadPosition({ x: 0, y: 0 });
  inputStore.setRobotMove(null);

  useHandsfreeStore.getState().setModelLoadProgress(0);
}

export function getVideoElement(): HTMLVideoElement | null {
  return videoEl;
}

export function getFaceLandmarks(): any[] | null {
  return latestFaceLandmarks;
}

export function getHandLandmarks(): any[][] | null {
  return latestHandLandmarks;
}
