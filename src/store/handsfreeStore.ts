import { create } from "zustand";
import { readStore, writeStore } from "./themeStore";

// Why the camera didn't start, so the visitor gets told what to do about it.
export type CameraError = "blocked" | "missing" | "busy" | "load";

interface HandsfreeState {
  isEnabled: boolean;
  hasSeenIntro: boolean;
  showIntroModal: boolean;
  showGestureTutorial: boolean;
  cameraPermission: "prompt" | "granted" | "denied";
  modelLoadProgress: number;
  cameraError: CameraError | null;
  setEnabled: (enabled: boolean) => void;
  setHasSeenIntro: (seen: boolean) => void;
  setShowIntroModal: (show: boolean) => void;
  setShowGestureTutorial: (show: boolean) => void;
  setCameraPermission: (perm: "prompt" | "granted" | "denied") => void;
  setModelLoadProgress: (progress: number) => void;
  setCameraError: (error: CameraError | null) => void;
}

export const useHandsfreeStore = create<HandsfreeState>((set) => ({
  isEnabled: false,
  hasSeenIntro: readStore("handsfree-intro-seen") === "true",
  showIntroModal: false,
  showGestureTutorial: false,
  cameraPermission: "prompt",
  modelLoadProgress: 0,
  cameraError: null,
  setEnabled: (enabled) => set({ isEnabled: enabled }),
  setHasSeenIntro: (seen) => {
    writeStore("handsfree-intro-seen", String(seen));
    set({ hasSeenIntro: seen });
  },
  setShowIntroModal: (show) => set({ showIntroModal: show }),
  setShowGestureTutorial: (show) => set({ showGestureTutorial: show }),
  setCameraPermission: (perm) => set({ cameraPermission: perm }),
  setModelLoadProgress: (progress) => set({ modelLoadProgress: progress }),
  setCameraError: (error) => set({ cameraError: error }),
}));

// The camera button and the robot's speech bubble do the same thing: the first time,
// explain; after that, switch.
export function toggleHandsfree() {
  const s = useHandsfreeStore.getState();
  if (!s.hasSeenIntro) s.setShowIntroModal(true);
  else s.setEnabled(!s.isEnabled);
}
