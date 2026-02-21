import { AnimatePresence, motion } from "motion/react";
import React, { useEffect, useRef } from "react";
import {
  getVideoElement,
  getFaceLandmarks,
  getHandLandmarks,
} from "../../providers/CameraInputProvider";
import { useHandsfreeStore } from "../../store/handsfreeStore";

const PREVIEW_W = 200;
const PREVIEW_H = 150;

// MediaPipe hand connections (pairs of landmark indices)
const HAND_CONNECTIONS = [
  [0, 1], [1, 2], [2, 3], [3, 4],       // thumb
  [0, 5], [5, 6], [6, 7], [7, 8],       // index
  [5, 9], [9, 10], [10, 11], [11, 12],  // middle
  [9, 13], [13, 14], [14, 15], [15, 16],// ring
  [13, 17], [17, 18], [18, 19], [19, 20],// pinky
  [0, 17],                                // palm base
];

// Key face mesh connections for a clean overlay (contour + brows + nose + lips)
const FACE_OVAL = [
  10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288,
  397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136,
  172, 58, 132, 93, 234, 127, 162, 21, 54, 103, 67, 109, 10,
];
const LEFT_EYE = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398, 362];
const RIGHT_EYE = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246, 33];
const LIPS_OUTER = [61, 146, 91, 181, 84, 17, 314, 405, 321, 375, 291, 409, 270, 269, 267, 0, 37, 39, 40, 185, 61];

function drawFaceMesh(ctx: CanvasRenderingContext2D, landmarks: any[]) {
  ctx.strokeStyle = "rgba(240, 115, 45, 0.5)";
  ctx.lineWidth = 1;

  const drawPath = (indices: number[]) => {
    ctx.beginPath();
    for (let i = 0; i < indices.length; i++) {
      const lm = landmarks[indices[i]];
      // Mirror X for camera preview
      const x = (1 - lm.x) * PREVIEW_W;
      const y = lm.y * PREVIEW_H;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  };

  drawPath(FACE_OVAL);
  drawPath(LEFT_EYE);
  drawPath(RIGHT_EYE);
  drawPath(LIPS_OUTER);

  // Draw key points as small dots
  ctx.fillStyle = "rgba(240, 115, 45, 0.7)";
  const keyPoints = [4, 1, 33, 263, 61, 291, 10, 152]; // nose, eyes, mouth, forehead, chin
  for (const idx of keyPoints) {
    const lm = landmarks[idx];
    const x = (1 - lm.x) * PREVIEW_W;
    const y = lm.y * PREVIEW_H;
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHandSkeleton(
  ctx: CanvasRenderingContext2D,
  handsLandmarks: any[][]
) {
  const colors = ["rgba(45, 200, 115, 0.8)", "rgba(45, 115, 240, 0.8)"];

  for (let h = 0; h < handsLandmarks.length; h++) {
    const landmarks = handsLandmarks[h];
    const color = colors[h % 2];

    // Draw connections
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    for (const [a, b] of HAND_CONNECTIONS) {
      const lmA = landmarks[a];
      const lmB = landmarks[b];
      ctx.beginPath();
      ctx.moveTo((1 - lmA.x) * PREVIEW_W, lmA.y * PREVIEW_H);
      ctx.lineTo((1 - lmB.x) * PREVIEW_W, lmB.y * PREVIEW_H);
      ctx.stroke();
    }

    // Draw joints
    ctx.fillStyle = color;
    for (const lm of landmarks) {
      ctx.beginPath();
      ctx.arc((1 - lm.x) * PREVIEW_W, lm.y * PREVIEW_H, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

const CameraFeedback: React.FC = () => {
  const isEnabled = useHandsfreeStore((s) => s.isEnabled);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isEnabled) return;

    let rafId: number;
    const draw = () => {
      const video = getVideoElement();
      const ctx = canvasRef.current?.getContext("2d");
      if (video && ctx && canvasRef.current) {
        // Draw mirrored video
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(video, -PREVIEW_W, 0, PREVIEW_W, PREVIEW_H);
        ctx.restore();

        // Draw face mesh overlay
        const faceLandmarks = getFaceLandmarks();
        if (faceLandmarks && faceLandmarks.length > 0) {
          drawFaceMesh(ctx, faceLandmarks);
        }

        // Draw hand skeleton overlay
        const handLandmarks = getHandLandmarks();
        if (handLandmarks && handLandmarks.length > 0) {
          drawHandSkeleton(ctx, handLandmarks);
        }
      }
      rafId = requestAnimationFrame(draw);
    };

    const startTimer = setTimeout(() => {
      rafId = requestAnimationFrame(draw);
    }, 500);

    return () => {
      clearTimeout(startTimer);
      cancelAnimationFrame(rafId);
    };
  }, [isEnabled]);

  return (
    <AnimatePresence>
      {isEnabled && (
        <motion.div
          className="camera-feedback"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          style={{
            position: "fixed",
            bottom: 16,
            left: 16,
            width: PREVIEW_W,
            height: PREVIEW_H,
            borderRadius: 12,
            overflow: "hidden",
            zIndex: 9997,
            boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
            border: "2px solid rgba(240, 115, 45, 0.6)",
          }}
        >
          <canvas
            ref={canvasRef}
            width={PREVIEW_W}
            height={PREVIEW_H}
            style={{ width: "100%", height: "100%", display: "block" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CameraFeedback;
