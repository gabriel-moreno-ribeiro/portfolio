import { create } from "zustand";

interface HandsfreeState {
  isEnabled: boolean;
  hasSeenIntro: boolean;
  showIntroModal: boolean;
  cameraPermission: "prompt" | "granted" | "denied";
  modelLoadProgress: number;
  setEnabled: (enabled: boolean) => void;
  setHasSeenIntro: (seen: boolean) => void;
  setShowIntroModal: (show: boolean) => void;
  setCameraPermission: (perm: "prompt" | "granted" | "denied") => void;
  setModelLoadProgress: (progress: number) => void;
}

export const useHandsfreeStore = create<HandsfreeState>((set) => ({
  isEnabled: false,
  hasSeenIntro: localStorage.getItem("handsfree-intro-seen") === "true",
  showIntroModal: false,
  cameraPermission: "prompt",
  modelLoadProgress: 0,
  setEnabled: (enabled) => set({ isEnabled: enabled }),
  setHasSeenIntro: (seen) => {
    localStorage.setItem("handsfree-intro-seen", String(seen));
    set({ hasSeenIntro: seen });
  },
  setShowIntroModal: (show) => set({ showIntroModal: show }),
  setCameraPermission: (perm) => set({ cameraPermission: perm }),
  setModelLoadProgress: (progress) => set({ modelLoadProgress: progress }),
}));
