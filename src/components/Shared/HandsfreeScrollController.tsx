import { useEffect, useRef } from "react";
import { useInputSourceStore } from "../../store/inputSourceStore";
import { useHandsfreeStore } from "../../store/handsfreeStore";

const DAMPING = 0.6;
const THRESHOLD = 0.5;

const HandsfreeScrollController: React.FC = () => {
  const isEnabled = useHandsfreeStore((s) => s.isEnabled);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isEnabled) {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      return;
    }

    const tick = () => {
      const { scrollIntent } = useInputSourceStore.getState();
      if (Math.abs(scrollIntent) > THRESHOLD) {
        window.scrollBy({ top: scrollIntent * DAMPING, behavior: "auto" });
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
