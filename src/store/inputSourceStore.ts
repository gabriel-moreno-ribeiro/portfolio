import { create } from "zustand";

export interface HandPosition {
  x: number;
  y: number;
  fingers: number;
  confidence: number;
  isPinching: boolean; // thumb-index pinch gesture active
  isScrolling: boolean; // two-finger scroll gesture active
}

interface InputSourceState {
  headPosition: { x: number; y: number };
  handPositions: HandPosition[];
  scrollIntent: number;
  inputSource: "mouse" | "camera";
  setHeadPosition: (pos: { x: number; y: number }) => void;
  setHandPositions: (hands: HandPosition[]) => void;
  setScrollIntent: (delta: number) => void;
  setInputSource: (source: "mouse" | "camera") => void;
}

export const useInputSourceStore = create<InputSourceState>((set) => ({
  headPosition: { x: 0, y: 0 },
  handPositions: [],
  scrollIntent: 0,
  inputSource: "mouse",
  setHeadPosition: (pos) => set({ headPosition: pos }),
  setHandPositions: (hands) => set({ handPositions: hands }),
  setScrollIntent: (delta) => set({ scrollIntent: delta }),
  setInputSource: (source) => set({ inputSource: source }),
}));
