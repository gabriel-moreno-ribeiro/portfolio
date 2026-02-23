import { useMemo } from "react";
import { useHandPositions } from "./useHandPositions";
import { useInputSourceStore } from "../store/inputSourceStore";

export interface TrackedHand {
  x: number;
  y: number;
  fingerCount: number;
  confidence: number;
  isScrollGesture: boolean;
}

export function useHandTracking(): {
  leftHand: TrackedHand | null;
  rightHand: TrackedHand | null;
  isScrollGesture: boolean;
} {
  const handPositions = useHandPositions();
  const inputSource = useInputSourceStore((s) => s.inputSource);

  return useMemo(() => {
    if (inputSource !== "camera" || handPositions.length === 0) {
      return { leftHand: null, rightHand: null, isScrollGesture: false };
    }

    const toTracked = (h: (typeof handPositions)[0]): TrackedHand => ({
      x: h.x,
      y: h.y,
      fingerCount: h.fingers,
      confidence: h.confidence,
      isScrollGesture: h.fingers === 2 && h.confidence > 0.5,
    });

    const hands = handPositions.map(toTracked);
    // Sort by x position: leftmost = left hand
    const sorted = [...hands].sort((a, b) => a.x - b.x);

    const leftHand = sorted[0] ?? null;
    const rightHand = sorted.length > 1 ? sorted[1] : null;
    const isScrollGesture = hands.some((h) => h.isScrollGesture);

    return { leftHand, rightHand, isScrollGesture };
  }, [handPositions, inputSource]);
}
