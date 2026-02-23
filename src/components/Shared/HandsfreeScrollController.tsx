import { useEffect, useRef } from "react";
import { useInputSourceStore } from "../../store/inputSourceStore";
import { useHandsfreeStore } from "../../store/handsfreeStore";

// Smoothing factor (0-1, higher = more responsive)
const SMOOTH = 0.25;

const HandsfreeScrollController: React.FC = () => {
  const isEnabled = useHandsfreeStore((s) => s.isEnabled);
  const rafRef = useRef<number | null>(null);
  const smoothed = useRef(0);

  useEffect(() => {
    if (!isEnabled) {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      smoothed.current = 0;
      return;
    }

    const tick = () => {
      const { scrollIntent } = useInputSourceStore.getState();

      // Exponential smoothing on the velocity signal
      smoothed.current += (scrollIntent - smoothed.current) * SMOOTH;

      // Apply scroll when above noise threshold
      if (Math.abs(smoothed.current) > 0.3) {
        window.scrollBy(0, smoothed.current);
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
