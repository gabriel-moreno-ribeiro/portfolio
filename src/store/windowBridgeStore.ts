import { create } from "zustand";

export interface WindowInfo {
  id: string;
  screenX: number;
  screenY: number;
  innerWidth: number;
  innerHeight: number;
  lastSeen: number;
}

export interface TransferringChip {
  chipIndex: number;
  iconSrc: string;
  velocityX: number;
  velocityY: number;
  entryY: number; // Y position at the edge where it enters (0..1 normalized)
  fromWindowId: string;
}

interface WindowBridgeState {
  windowId: string;
  adjacentWindows: Map<string, WindowInfo>;
  incomingChips: TransferringChip[];
  glowEdge: "left" | "right" | null;
  setAdjacentWindows: (windows: Map<string, WindowInfo>) => void;
  addIncomingChip: (chip: TransferringChip) => void;
  clearIncomingChip: (chipIndex: number) => void;
  setGlowEdge: (edge: "left" | "right" | null) => void;
}

const windowId = `win_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const useWindowBridgeStore = create<WindowBridgeState>((set) => ({
  windowId,
  adjacentWindows: new Map(),
  incomingChips: [],
  glowEdge: null,
  setAdjacentWindows: (windows) => set({ adjacentWindows: windows }),
  addIncomingChip: (chip) =>
    set((state) => ({ incomingChips: [...state.incomingChips, chip] })),
  clearIncomingChip: (chipIndex) =>
    set((state) => ({
      incomingChips: state.incomingChips.filter(
        (c) => c.chipIndex !== chipIndex
      ),
    })),
  setGlowEdge: (edge) => set({ glowEdge: edge }),
}));
