import { AnimatePresence, motion } from "motion/react";
import React, { useEffect, useRef, useState } from "react";
import { getVideoElement } from "../../providers/CameraInputProvider";
import { useHandsfreeStore } from "../../store/handsfreeStore";

const CameraFeedback: React.FC = () => {
  const isEnabled = useHandsfreeStore((s) => s.isEnabled);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!isEnabled) {
      setVisible(false);
      return;
    }

    setVisible(true);

    // Auto-fade after 10 seconds
    const timer = setTimeout(() => setVisible(false), 10000);

    let rafId: number;
    const draw = () => {
      const video = getVideoElement();
      const ctx = canvasRef.current?.getContext("2d");
      if (video && ctx && canvasRef.current) {
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(
          video,
          -canvasRef.current.width,
          0,
          canvasRef.current.width,
          canvasRef.current.height
        );
        ctx.restore();
      }
      rafId = requestAnimationFrame(draw);
    };

    // Wait a bit for video to be ready
    const startTimer = setTimeout(() => {
      rafId = requestAnimationFrame(draw);
    }, 500);

    return () => {
      clearTimeout(timer);
      clearTimeout(startTimer);
      cancelAnimationFrame(rafId);
    };
  }, [isEnabled]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="camera-feedback"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          style={{
            position: "fixed",
            bottom: 16,
            left: 16,
            width: 160,
            height: 120,
            borderRadius: 12,
            overflow: "hidden",
            zIndex: 9997,
            boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
            border: "2px solid rgba(240, 115, 45, 0.6)",
          }}
        >
          <canvas
            ref={canvasRef}
            width={160}
            height={120}
            style={{ width: "100%", height: "100%", display: "block" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CameraFeedback;
