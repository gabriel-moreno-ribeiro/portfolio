import { useEffect, useRef } from "react";
import { useInputSourceStore } from "../../store/inputSourceStore";
import { useHandsfreeStore } from "../../store/handsfreeStore";

const HandCursor: React.FC = () => {
  const isEnabled = useHandsfreeStore((s) => s.isEnabled);
  const containerRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<HTMLDivElement[]>([]);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isEnabled) {
      if (containerRef.current) containerRef.current.style.display = "none";
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      return;
    }

    if (containerRef.current) containerRef.current.style.display = "block";

    const tick = () => {
      const { handPositions, inputSource } = useInputSourceStore.getState();

      if (inputSource !== "camera") {
        if (containerRef.current) containerRef.current.style.display = "none";
        rafRef.current = requestAnimationFrame(tick);
        return;
      }

      if (containerRef.current) containerRef.current.style.display = "block";

      // Update each dot (up to 2 hands)
      for (let i = 0; i < 2; i++) {
        const dot = dotsRef.current[i];
        if (!dot) continue;

        if (i < handPositions.length) {
          const h = handPositions[i];
          // Convert -1..1 to screen coordinates
          const screenX = ((h.x + 1) / 2) * window.innerWidth;
          const screenY = ((h.y + 1) / 2) * window.innerHeight;
          // Size based on spread: pinched = small, open = large
          const size = 24 + h.spread * 32;

          dot.style.display = "block";
          dot.style.left = `${screenX}px`;
          dot.style.top = `${screenY}px`;
          dot.style.width = `${size}px`;
          dot.style.height = `${size}px`;
          dot.style.opacity = h.fingers <= 2 ? "0.4" : "0.8";
          // Visual feedback for pinch: fill the circle
          dot.style.background = h.isPinching
            ? "rgba(240, 115, 45, 0.5)"
            : "rgba(240, 115, 45, 0.15)";
          dot.style.borderColor = h.isPinching
            ? "rgba(240, 115, 45, 1)"
            : "rgba(240, 115, 45, 0.8)";
        } else {
          dot.style.display = "none";
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [isEnabled]);

  return (
    <div ref={containerRef} style={{ display: "none" }}>
      {[0, 1].map((i) => (
        <div
          key={i}
          ref={(el) => {
            if (el) dotsRef.current[i] = el;
          }}
          style={{
            position: "fixed",
            display: "none",
            borderRadius: "50%",
            border: "2px solid rgba(240, 115, 45, 0.8)",
            background: "rgba(240, 115, 45, 0.15)",
            pointerEvents: "none",
            zIndex: 9996,
            transform: "translate(-50%, -50%)",
            transition: "width 0.15s, height 0.15s, opacity 0.15s",
          }}
        />
      ))}
    </div>
  );
};

export default HandCursor;
