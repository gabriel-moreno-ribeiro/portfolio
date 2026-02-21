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
    outputFacialTransformationMatrixes: true,
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

function extractHeadPose(matrix: Float32Array): { x: number; y: number } {
  // The transformation matrix is 4x4 column-major.
  // We extract yaw and pitch from the rotation sub-matrix.
  // matrix[0..3] = column 0, matrix[4..7] = column 1, etc.
  const yaw = Math.atan2(matrix[8], matrix[0]);
  const pitch = Math.asin(-matrix[4]);

  // Normalize to roughly -1..1 range (head typically rotates +-30 deg)
  // Negate both: X is mirrored by camera, Y convention is inverted
  const normalizedX = Math.max(-1, Math.min(1, -yaw / (Math.PI / 6)));
  const normalizedY = Math.max(-1, Math.min(1, -pitch / (Math.PI / 6)));

  return { x: normalizedX, y: normalizedY };
}

function countExtendedFingers(landmarks: any[]): number {
  // Tip landmark indices for each finger: thumb(4), index(8), middle(12), ring(16), pinky(20)
  // PIP joint indices: thumb(3), index(6), middle(10), ring(14), pinky(18)
  const tips = [4, 8, 12, 16, 20];
  const pips = [3, 6, 10, 14, 18];

  let count = 0;
  for (let i = 0; i < 5; i++) {
    const tip = landmarks[tips[i]];
    const pip = landmarks[pips[i]];
    // For thumb, check x distance; for others, check y (tip above pip = extended)
    if (i === 0) {
      if (Math.abs(tip.x - pip.x) > 0.04) count++;
    } else {
      if (tip.y < pip.y) count++;
    }
  }
  return count;
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
        faceResult.facialTransformationMatrixes &&
        faceResult.facialTransformationMatrixes.length > 0
      ) {
        const matrix = faceResult.facialTransformationMatrixes[0].data;
        const pose = extractHeadPose(matrix);
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
        const hands = handResult.landmarks.map(
          (landmarks: any[], idx: number) => {
            // Landmark 9 = middle finger MCP = approximate palm center
            const palm = landmarks[9];
            const fingers = countExtendedFingers(landmarks);
            const confidence =
              handResult.handedness?.[idx]?.[0]?.score ?? 0.5;

            return {
              // Mirror X since camera is mirrored, map to -1..1
              x: -(palm.x * 2 - 1),
              y: palm.y * 2 - 1,
              fingers,
              confidence,
            };
          }
        );

        store.setHandPositions(hands);

        // Detect scroll gesture: exactly 2 fingers extended on any hand
        const scrollHand = hands.find(
          (h: { fingers: number; confidence: number }) =>
            h.fingers === 2 && h.confidence > 0.5
        );
        if (scrollHand) {
          // Use absolute Y position as scroll speed: above center = scroll up, below = scroll down
          // scrollHand.y is -1..1, use it directly as speed signal
          store.setScrollIntent(scrollHand.y);
        } else {
          store.setScrollIntent(0);
        }
      } else {
        store.setHandPositions([]);
        store.setScrollIntent(0);
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

  const inputStore = useInputSourceStore.getState();
  inputStore.setInputSource("mouse");
  inputStore.setHandPositions([]);
  inputStore.setScrollIntent(0);

  useHandsfreeStore.getState().setModelLoadProgress(0);
}

export function getVideoElement(): HTMLVideoElement | null {
  return videoEl;
}
