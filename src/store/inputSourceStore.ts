import { create } from "zustand";

export interface HandPosition {
  x: number;
  y: number;
  fingers: number;
  confidence: number;
  isPinching: boolean; // thumb-index pinch gesture active
  isScrolling: boolean; // pinch-drag scroll gesture active
}

// What the camera adds to the head's yaw (x) and pitch (y): how far it tilts sideways
// (radians), where the face sits in the frame (-1..1), how close it is (1 = usual), and the face.
export interface HeadPose {
  x: number;
  y: number;
  roll?: number;
  shift?: number;
  near?: number;
  // The face, each 0..1: mouth open, smiling, eyebrows raised, and each eye closed
  // (left and right as they appear on screen, like a mirror).
  mouth?: number;
  smile?: number;
  brow?: number;
  blinkL?: number;
  blinkR?: number;
}

// A trick the hero robot plays back when the camera sees the matching gesture.
export type RobotMove = "wave" | "spin" | "jump" | "nod" | "cheer";

interface InputSourceState {
  headPosition: HeadPose;
  robotMove: { kind: RobotMove; at: number } | null;
  handPositions: HandPosition[];
  scrollIntent: number;
  inputSource: "mouse" | "camera";
  setHeadPosition: (pos: HeadPose) => void;
  setRobotMove: (kind: RobotMove | null) => void;
  setHandPositions: (hands: HandPosition[]) => void;
  setScrollIntent: (delta: number) => void;
  setInputSource: (source: "mouse" | "camera") => void;
}

export const useInputSourceStore = create<InputSourceState>((set) => ({
  headPosition: { x: 0, y: 0 },
  robotMove: null,
  handPositions: [],
  scrollIntent: 0,
  inputSource: "mouse",
  setHeadPosition: (pos) => set({ headPosition: pos }),
  setRobotMove: (kind) => set({ robotMove: kind && { kind, at: performance.now() } }),
  setHandPositions: (hands) => set({ handPositions: hands }),
  setScrollIntent: (delta) => set({ scrollIntent: delta }),
  setInputSource: (source) => set({ inputSource: source }),
}));
