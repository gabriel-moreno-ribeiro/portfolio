import { useEffect, useRef } from "react";
import { useInputSourceStore } from "../../store/inputSourceStore";
import { useHandsfreeStore } from "../../store/handsfreeStore";

// Pixels per frame at max hand displacement
const MAX_SPEED = 18;
// Dead zone around center where no scrolling happens
const DEAD_ZONE = 0.15;
// Smoothing factor (0-1, lower = smoother)
const SMOOTH = 0.12;

const HandsfreeScrollController: React.FC = () => {
  const isEnabled = useHandsfreeStore((s) => s.isEnabled);
  const rafRef = useRef<number | null>(null);
  const smoothedSpeed = useRef(0);

  useEffect(() => {
    if (!isEnabled) {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      smoothedSpeed.current = 0;
      return;
    }

    const tick = () => {
      const { scrollIntent } = useInputSourceStore.getState();

      // Apply dead zone
      let target = 0;
      if (Math.abs(scrollIntent) > DEAD_ZONE) {
        // Map from dead zone..1 to 0..1, then scale to max speed
        const sign = scrollIntent > 0 ? 1 : -1;
        const magnitude =
          (Math.abs(scrollIntent) - DEAD_ZONE) / (1 - DEAD_ZONE);
        target = sign * magnitude * MAX_SPEED;
      }

      // Exponential smoothing
      smoothedSpeed.current += (target - smoothedSpeed.current) * SMOOTH;

      // Apply scroll
      if (Math.abs(smoothedSpeed.current) > 0.5) {
        window.scrollBy(0, smoothedSpeed.current);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [isEnabled]);

  return null;
};

export default HandsfreeScrollController;
