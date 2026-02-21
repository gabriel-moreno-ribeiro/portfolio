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
  // Tip indices: thumb(4), index(8), middle(12), ring(16), pinky(20)
  // MCP joints (more stable than PIP): thumb(2), index(5), middle(9), ring(13), pinky(17)
  const tips = [4, 8, 12, 16, 20];
  const mcps = [2, 5, 9, 13, 17];

  let count = 0;
  for (let i = 0; i < 5; i++) {
    const tip = landmarks[tips[i]];
    const mcp = landmarks[mcps[i]];
    if (i === 0) {
      // Thumb: compare distance from tip to MCP in x
      if (Math.abs(tip.x - mcp.x) > 0.06) count++;
    } else {
      // Other fingers: tip must be significantly above MCP (lower y = higher on screen)
      if (mcp.y - tip.y > 0.03) count++;
    }
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

  // Process hands every other frame (offset from face)
  if (handLandmarker && frameCount % 2 === 1) {
    try {
      const handResult = handLandmarker.detectForVideo(
        videoEl,
        performance.now()
      );
      if (handResult.landmarks && handResult.landmarks.length > 0) {
        latestHandLandmarks = handResult.landmarks;
        const hands = handResult.landmarks.map(
          (landmarks: any[], idx: number) => {
            const palm = landmarks[9];
            const fingers = countExtendedFingers(landmarks);
            const spread = measureSpread(landmarks);
            const confidence =
              handResult.handedness?.[idx]?.[0]?.score ?? 0.5;

            return {
              x: -(palm.x * 2 - 1),
              y: palm.y * 2 - 1,
              fingers,
              confidence,
              spread,
            };
          }
        );

        store.setHandPositions(hands);
      } else {
        store.setHandPositions([]);
        latestHandLandmarks = null;
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
