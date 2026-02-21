import { useInputSourceStore } from "../store/inputSourceStore";
import { useHandsfreeStore } from "../store/handsfreeStore";

let videoEl: HTMLVideoElement | null = null;
let stream: MediaStream | null = null;
let faceLandmarker: any = null;
let handLandmarker: any = null;
let rafId: number | null = null;
let frameCount = 0;

async function loadModels(
  onProgress: (progress: number) => void
) {
  const { FaceLandmarker, HandLandmarker, FilesetResolver } = await import(
    "@mediapipe/tasks-vision"
  );

  onProgress(10);

  const filesetResolver = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
  );

  onProgress(30);

  faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    outputFaceBlendshapes: false,
    outputFacialTransformationMatrixes: false,
    numFaces: 1,
  });

  onProgress(65);

  handLandmarker = await HandLandmarker.createFromOptions(filesetResolver, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
      delegate: "GPU",
    },
    runningMode: "VIDEO",
    numHands: 2,
  });

  onProgress(100);
}

function extractHeadPoseFromLandmarks(
  landmarks: { x: number; y: number; z: number }[]
): { x: number; y: number } {
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

  return { x: normalizedX, y: normalizedY };
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

function measureSpread(landmarks: any[]): number {
  // Measure how open the hand is: distance between thumb tip and pinky tip
  // normalized by palm size (wrist to middle MCP)
  const thumbTip = landmarks[4];
  const pinkyTip = landmarks[20];
  const wrist = landmarks[0];
  const middleMcp = landmarks[9];

  const palmSize = Math.hypot(
    middleMcp.x - wrist.x,
    middleMcp.y - wrist.y
  );
  if (palmSize < 0.01) return 0.5;

  const fingerSpan = Math.hypot(
    thumbTip.x - pinkyTip.x,
    thumbTip.y - pinkyTip.y
  );

  // Normalize: pinched ≈ 0.3 palm size, fully open ≈ 1.5 palm size
  const normalized = (fingerSpan / palmSize - 0.3) / 1.2;
  return Math.max(0, Math.min(1, normalized));
}

// Raw landmarks for ML overlay drawing
let latestFaceLandmarks: any[] | null = null;
let latestHandLandmarks: any[][] | null = null;

// ── Position smoothing (EMA) ──
const POSITION_SMOOTHING = 0.35;
const SPREAD_SMOOTHING = 0.3;
const SCROLL_Y_SMOOTHING = 0.4;

interface SmoothedHand {
  x: number;
  y: number;
  spread: number;
  initialized: boolean;
}

const smoothedHands: SmoothedHand[] = [
  { x: 0, y: 0, spread: 0.5, initialized: false },
  { x: 0, y: 0, spread: 0.5, initialized: false },
];

// ── Gesture debounce ──
const GESTURE_DEBOUNCE_FRAMES = 2;

// ── Pinch-to-click gesture state ──
const PINCH_THRESHOLD = 0.07; // normalized thumb-index distance to trigger pinch
const PINCH_RELEASE_THRESHOLD = 0.10; // hysteresis for release
const PINCH_COOLDOWN_MS = 300;

interface PinchState {
  isPinching: boolean;
  hasFiredClick: boolean;
  pinchFrames: number;
  releaseFrames: number;
  lastClickTime: number;
  targetX: number; // smoothed screen position locked during pinch
  targetY: number;
}

const pinchStates: PinchState[] = [
  { isPinching: false, hasFiredClick: false, pinchFrames: 0, releaseFrames: 0, lastClickTime: 0, targetX: 0, targetY: 0 },
  { isPinching: false, hasFiredClick: false, pinchFrames: 0, releaseFrames: 0, lastClickTime: 0, targetX: 0, targetY: 0 },
];

function detectPinch(landmarks: any[]): boolean {
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  return Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y) < PINCH_THRESHOLD;
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
): boolean {
  const state = pinchStates[handIdx];
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

  if (!state.isPinching && state.pinchFrames >= GESTURE_DEBOUNCE_FRAMES) {
    // Check cooldown from last click
    const now = performance.now();
    if (now - state.lastClickTime < PINCH_COOLDOWN_MS) return false;
    state.isPinching = true;
    state.hasFiredClick = false;
    // Lock click target to current smoothed cursor position
    state.targetX = screenX;
    state.targetY = screenY;
    return true;
  }

  if (state.isPinching && !state.hasFiredClick) {
    // Track cursor while holding pinch (user may drift)
    state.targetX = screenX;
    state.targetY = screenY;
  }

  if (state.isPinching && state.releaseFrames >= GESTURE_DEBOUNCE_FRAMES) {
    // Pinch released → click at the position tracked during pinch
    if (!state.hasFiredClick) {
      dispatchClick(state.targetX, state.targetY);
      state.hasFiredClick = true;
      state.lastClickTime = performance.now();
    }
    state.isPinching = false;
    return false;
  }

  return state.isPinching;
}

// ── Two-finger scroll with iOS-style momentum ──
const SCROLL_SENSITIVITY = 8; // px multiplier for direct tracking
const MOMENTUM_DECAY = 0.95; // per-frame velocity decay (lower = stops faster)
const MOMENTUM_MIN = 0.5; // velocity threshold to stop coasting
const VELOCITY_SMOOTHING = 0.3; // EMA factor for velocity (0-1, lower = smoother)

interface ScrollState {
  isScrolling: boolean;
  lastScreenY: number;
  smoothedScreenY: number;
  velocity: number; // smoothed scroll velocity in px/frame
  enterFrames: number;
  exitFrames: number;
}

const scrollState: ScrollState = {
  isScrolling: false,
  lastScreenY: 0,
  smoothedScreenY: 0,
  velocity: 0,
  enterFrames: 0,
  exitFrames: 0,
};

let momentumRafId: number | null = null;

// Rotation-invariant check: is fingertip further from wrist than its MCP?
function isFingerExtended(landmarks: any[], tipIdx: number, mcpIdx: number): boolean {
  const wrist = landmarks[0];
  const tip = landmarks[tipIdx];
  const mcp = landmarks[mcpIdx];
  const tipDist = Math.hypot(tip.x - wrist.x, tip.y - wrist.y);
  const mcpDist = Math.hypot(mcp.x - wrist.x, mcp.y - wrist.y);
  return tipDist > mcpDist * 1.15;
}

function isTwoFingerGesture(landmarks: any[]): boolean {
  // Index and middle extended, ring and pinky curled — works at any hand angle
  const indexOut = isFingerExtended(landmarks, 8, 5);
  const middleOut = isFingerExtended(landmarks, 12, 9);
  const ringIn = !isFingerExtended(landmarks, 16, 13);
  const pinkyIn = !isFingerExtended(landmarks, 20, 17);

  return indexOut && middleOut && ringIn && pinkyIn;
}

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

function processTwoFingerScroll(
  landmarks: any[],
  screenY: number
): boolean {
  const twoFingers = isTwoFingerGesture(landmarks);

  // Count consecutive frames for debounce
  if (twoFingers) {
    scrollState.enterFrames++;
    scrollState.exitFrames = 0;
  } else {
    scrollState.exitFrames++;
    scrollState.enterFrames = 0;
  }

  if (!scrollState.isScrolling && scrollState.enterFrames >= GESTURE_DEBOUNCE_FRAMES) {
    // Gesture started — stop any existing momentum
    stopMomentumScroll();
    scrollState.isScrolling = true;
    scrollState.lastScreenY = screenY;
    scrollState.smoothedScreenY = screenY;
    scrollState.velocity = 0;
    return true;
  }

  if (scrollState.isScrolling && scrollState.exitFrames >= GESTURE_DEBOUNCE_FRAMES) {
    // Gesture ended — kick off momentum coast
    scrollState.isScrolling = false;
    if (Math.abs(scrollState.velocity) > MOMENTUM_MIN) {
      startMomentumScroll();
    }
    return false;
  }

  if (scrollState.isScrolling) {
    // Smooth the raw Y input to reduce jitter
    scrollState.smoothedScreenY =
      scrollState.smoothedScreenY * (1 - SCROLL_Y_SMOOTHING) +
      screenY * SCROLL_Y_SMOOTHING;

    const smoothedDelta = scrollState.smoothedScreenY - scrollState.lastScreenY;
    scrollState.lastScreenY = scrollState.smoothedScreenY;

    const scrollAmount = smoothedDelta * SCROLL_SENSITIVITY;

    // EMA smoothing on velocity for momentum calculation
    scrollState.velocity =
      scrollState.velocity * (1 - VELOCITY_SMOOTHING) +
      scrollAmount * VELOCITY_SMOOTHING;

    window.scrollBy({ top: scrollAmount, behavior: "instant" });
    return true;
  }

  return false;
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
        const hands = handResult.landmarks.map(
          (landmarks: any[], idx: number) => {
            if (idx > 1) return null; // max 2 hands
            const palm = landmarks[9];
            const fingers = countExtendedFingers(landmarks);
            const rawSpread = measureSpread(landmarks);
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
              sh.spread = rawSpread;
              sh.initialized = true;
            } else {
              sh.x += (rawX - sh.x) * POSITION_SMOOTHING;
              sh.y += (rawY - sh.y) * POSITION_SMOOTHING;
              sh.spread += (rawSpread - sh.spread) * SPREAD_SMOOTHING;
            }

            // Screen coords from smoothed position
            const screenX = ((sh.x + 1) / 2) * window.innerWidth;
            const screenY = ((sh.y + 1) / 2) * window.innerHeight;

            // Two-finger scroll takes priority (only process on first hand)
            const isScrolling =
              idx === 0 && processTwoFingerScroll(landmarks, screenY);

            // Pinch-to-click (skip if currently scrolling)
            const isPinching =
              !isScrolling && processPinchGesture(landmarks, idx, screenX, screenY);

            return {
              x: sh.x,
              y: sh.y,
              fingers,
              confidence,
              spread: sh.spread,
              isPinching,
              isScrolling,
            };
          }
        ).filter(Boolean) as any[];

        store.setHandPositions(hands);
      } else {
        store.setHandPositions([]);
        latestHandLandmarks = null;
        // Reset all gesture + smoothing state when hands disappear
        pinchStates[0].isPinching = false;
        pinchStates[0].pinchFrames = 0;
        pinchStates[0].releaseFrames = 0;
        pinchStates[1].isPinching = false;
        pinchStates[1].pinchFrames = 0;
        pinchStates[1].releaseFrames = 0;
        smoothedHands[0].initialized = false;
        smoothedHands[1].initialized = false;
        scrollState.enterFrames = 0;
        scrollState.exitFrames = 0;
        if (scrollState.isScrolling) {
          scrollState.isScrolling = false;
          if (Math.abs(scrollState.velocity) > MOMENTUM_MIN) {
            startMomentumScroll();
          }
        }
      }
    } catch {
      // Skip frame on error
    }
  }

  rafId = requestAnimationFrame(processFrame);
}

export async function startCameraInput() {
  const handsfreeState = useHandsfreeStore.getState();

  try {
    handsfreeState.setModelLoadProgress(5);

    stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, facingMode: "user" },
    });

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
    await videoEl.play();

    await loadModels((progress) => {
      handsfreeState.setModelLoadProgress(progress);
    });

    useInputSourceStore.getState().setInputSource("camera");
    frameCount = 0;
    rafId = requestAnimationFrame(processFrame);
  } catch (err) {
    handsfreeState.setCameraPermission("denied");
    throw err;
  }
}

export function stopCameraInput() {
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

  faceLandmarker?.close();
  faceLandmarker = null;
  handLandmarker?.close();
  handLandmarker = null;

  latestFaceLandmarks = null;
  latestHandLandmarks = null;
  pinchStates[0].isPinching = false;
  pinchStates[0].pinchFrames = 0;
  pinchStates[0].releaseFrames = 0;
  pinchStates[0].lastClickTime = 0;
  pinchStates[1].isPinching = false;
  pinchStates[1].pinchFrames = 0;
  pinchStates[1].releaseFrames = 0;
  pinchStates[1].lastClickTime = 0;
  smoothedHands[0].initialized = false;
  smoothedHands[1].initialized = false;
  scrollState.isScrolling = false;
  scrollState.velocity = 0;
  scrollState.enterFrames = 0;
  scrollState.exitFrames = 0;
  stopMomentumScroll();

  const inputStore = useInputSourceStore.getState();
  inputStore.setInputSource("mouse");
  inputStore.setHandPositions([]);

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
