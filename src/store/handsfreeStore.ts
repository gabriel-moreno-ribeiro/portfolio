import { create } from "zustand";

interface HandsfreeState {
  isEnabled: boolean;
  chipsActive: boolean;
  hasSeenIntro: boolean;
  showIntroModal: boolean;
  cameraPermission: "prompt" | "granted" | "denied";
  modelLoadProgress: number;
  isSecondary: boolean;
  setEnabled: (enabled: boolean) => void;
  setChipsActive: (active: boolean) => void;
  setHasSeenIntro: (seen: boolean) => void;
  setShowIntroModal: (show: boolean) => void;
  setCameraPermission: (perm: "prompt" | "granted" | "denied") => void;
  setModelLoadProgress: (progress: number) => void;
  setIsSecondary: (secondary: boolean) => void;
}

const isSecondaryWindow =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).has("secondary");

export const useHandsfreeStore = create<HandsfreeState>((set) => ({
  isEnabled: false,
  chipsActive: false,
  hasSeenIntro:
    isSecondaryWindow ||
    localStorage.getItem("handsfree-intro-seen") === "true",
  showIntroModal: false,
  cameraPermission: "prompt",
  modelLoadProgress: 0,
  isSecondary: isSecondaryWindow,
  setEnabled: (enabled) => set({ isEnabled: enabled }),
  setChipsActive: (active) => set({ chipsActive: active }),
  setHasSeenIntro: (seen) => {
    localStorage.setItem("handsfree-intro-seen", String(seen));
    set({ hasSeenIntro: seen });
  },
  setShowIntroModal: (show) => set({ showIntroModal: show }),
  setCameraPermission: (perm) => set({ cameraPermission: perm }),
  setModelLoadProgress: (progress) => set({ modelLoadProgress: progress }),
  setIsSecondary: (secondary) => set({ isSecondary: secondary }),
}));
