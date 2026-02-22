import { create } from "zustand";

export interface PeerInfo {
  peerId: string;
  screenX: number;
  screenY: number;
  innerWidth: number;
  innerHeight: number;
  lastSeen: number;
}

interface WindowSyncState {
  myPeerId: string;
  connectedPeers: Map<string, PeerInfo>;
  activePeerId: string | null;
  activeTimestamp: number;

  setPeerInfo: (peerId: string, info: PeerInfo) => void;
  removePeer: (peerId: string) => void;
  setActivePeer: (peerId: string | null, timestamp: number) => void;
  clearStalePeers: () => void;
}

const STALE_THRESHOLD = 3000; // 3 seconds

export const useWindowSyncStore = create<WindowSyncState>((set, get) => ({
  myPeerId: crypto.randomUUID(),
  connectedPeers: new Map(),
  activePeerId: null,
  activeTimestamp: 0,

  setPeerInfo: (peerId, info) =>
    set((state) => {
      const next = new Map(state.connectedPeers);
      next.set(peerId, info);
      return { connectedPeers: next };
    }),

  removePeer: (peerId) =>
    set((state) => {
      const next = new Map(state.connectedPeers);
      next.delete(peerId);
      const activePeerId =
        state.activePeerId === peerId ? null : state.activePeerId;
      return { connectedPeers: next, activePeerId };
    }),

  setActivePeer: (peerId, timestamp) =>
    set((state) => {
      // Accept if no current active, or new timestamp is more recent
      if (
        peerId === null ||
        state.activePeerId === null ||
        state.activePeerId === peerId ||
        timestamp > state.activeTimestamp
      ) {
        return { activePeerId: peerId, activeTimestamp: timestamp };
      }
      return state;
    }),

  clearStalePeers: () =>
    set((state) => {
      const now = Date.now();
      let changed = false;
      const next = new Map(state.connectedPeers);
      let activePeerId = state.activePeerId;
      for (const [id, info] of next) {
        if (now - info.lastSeen > STALE_THRESHOLD) {
          next.delete(id);
          if (activePeerId === id) activePeerId = null;
          changed = true;
        }
      }
      return changed ? { connectedPeers: next, activePeerId } : state;
    }),
}));

// Derived selectors
export const useIsFollowing = () =>
  useWindowSyncStore(
    (s) => s.activePeerId !== null && s.activePeerId !== s.myPeerId
  );

export const usePeerCount = () =>
  useWindowSyncStore((s) => s.connectedPeers.size);

export const useActivePeerInfo = () =>
  useWindowSyncStore((s) =>
    s.activePeerId ? s.connectedPeers.get(s.activePeerId) ?? null : null
  );
