import {
  useInputSourceStore,
  type HandPosition,
} from "../store/inputSourceStore";
import { useWindowSyncStore } from "../store/windowSyncStore";

const CHANNEL_NAME = "portfolio-window-sync";
const HEARTBEAT_INTERVAL = 1000;

// --- Message types ---

type SyncMessage =
  | {
      type: "peer-join";
      peerId: string;
      screenX: number;
      screenY: number;
      innerWidth: number;
      innerHeight: number;
    }
  | {
      type: "peer-leave";
      peerId: string;
    }
  | {
      type: "heartbeat";
      peerId: string;
      screenX: number;
      screenY: number;
      innerWidth: number;
      innerHeight: number;
    }
  | {
      type: "state";
      peerId: string;
      timestamp: number;
      screenX: number;
      screenY: number;
      innerWidth: number;
      innerHeight: number;
      headPosition: { x: number; y: number };
      handPositions: HandPosition[];
      inputSource: "mouse" | "camera";
      scrollY: number;
      skillsCursorActive: boolean;
      isReturning: boolean;
    };

// --- Module state ---

let channel: BroadcastChannel | null = null;
let rafId: number | null = null;
let heartbeatId: number | null = null;
let running = false;
let frameToggle = false;

function getMyWindowInfo() {
  return {
    screenX: window.screenX,
    screenY: window.screenY,
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
  };
}

// --- Broadcast state at ~30fps (only when this window is active) ---

function broadcastTick() {
  frameToggle = !frameToggle;
  if (frameToggle) {
    rafId = requestAnimationFrame(broadcastTick);
    return;
  }

  const inputState = useInputSourceStore.getState();
  const syncState = useWindowSyncStore.getState();

  // Only broadcast full state if this window is the active peer
  if (
    inputState.skillsCursorActive ||
    inputState.isReturning
  ) {
    const win = getMyWindowInfo();
    const msg: SyncMessage = {
      type: "state",
      peerId: syncState.myPeerId,
      timestamp: Date.now(),
      screenX: win.screenX,
      screenY: win.screenY,
      innerWidth: win.innerWidth,
      innerHeight: win.innerHeight,
      headPosition: inputState.headPosition,
      handPositions: inputState.handPositions,
      inputSource: inputState.inputSource,
      scrollY: window.scrollY,
      skillsCursorActive: inputState.skillsCursorActive,
      isReturning: inputState.isReturning,
    };
    channel?.postMessage(msg);
  }

  rafId = requestAnimationFrame(broadcastTick);
}

// --- Heartbeat: peer discovery + stale peer cleanup ---

function sendHeartbeat() {
  const syncState = useWindowSyncStore.getState();
  const win = getMyWindowInfo();
  const msg: SyncMessage = {
    type: "heartbeat",
    peerId: syncState.myPeerId,
    screenX: win.screenX,
    screenY: win.screenY,
    innerWidth: win.innerWidth,
    innerHeight: win.innerHeight,
  };
  channel?.postMessage(msg);
  syncState.clearStalePeers();
}

// --- Handle incoming messages ---

function onMessage(event: MessageEvent<SyncMessage>) {
  const msg = event.data;
  if (!msg || !msg.type) return;

  const syncStore = useWindowSyncStore.getState();
  const myId = syncStore.myPeerId;

  // Ignore our own messages
  if ("peerId" in msg && msg.peerId === myId) return;

  switch (msg.type) {
    case "peer-join": {
      syncStore.setPeerInfo(msg.peerId, {
        peerId: msg.peerId,
        screenX: msg.screenX,
        screenY: msg.screenY,
        innerWidth: msg.innerWidth,
        innerHeight: msg.innerHeight,
        lastSeen: Date.now(),
      });
      // Respond so the joiner discovers us
      const win = getMyWindowInfo();
      channel?.postMessage({
        type: "peer-join",
        peerId: myId,
        ...win,
      } satisfies SyncMessage);
      break;
    }

    case "peer-leave": {
      syncStore.removePeer(msg.peerId);
      break;
    }

    case "heartbeat": {
      syncStore.setPeerInfo(msg.peerId, {
        peerId: msg.peerId,
        screenX: msg.screenX,
        screenY: msg.screenY,
        innerWidth: msg.innerWidth,
        innerHeight: msg.innerHeight,
        lastSeen: Date.now(),
      });
      break;
    }

    case "state": {
      // Update peer position info
      syncStore.setPeerInfo(msg.peerId, {
        peerId: msg.peerId,
        screenX: msg.screenX,
        screenY: msg.screenY,
        innerWidth: msg.innerWidth,
        innerHeight: msg.innerHeight,
        lastSeen: Date.now(),
      });

      // Accept this peer as active (arbitration by timestamp)
      if (msg.skillsCursorActive) {
        syncStore.setActivePeer(msg.peerId, msg.timestamp);
      } else if (
        syncStore.activePeerId === msg.peerId &&
        !msg.skillsCursorActive &&
        !msg.isReturning
      ) {
        // Active peer released control completely
        syncStore.setActivePeer(null, 0);
      }

      // Only apply state if this peer is (or just became) the active one
      const currentActive = useWindowSyncStore.getState().activePeerId;
      if (currentActive !== msg.peerId) break;

      const inputStore = useInputSourceStore.getState();
      inputStore.setHeadPosition(msg.headPosition);
      inputStore.setHandPositions(msg.handPositions);
      inputStore.setInputSource(msg.inputSource);
      inputStore.setSkillsCursorActive(msg.skillsCursorActive);
      inputStore.setIsReturning(msg.isReturning);

      // Scroll sync — 2px dead zone
      const diff = Math.abs(window.scrollY - msg.scrollY);
      if (diff > 2) {
        window.scrollTo({ top: msg.scrollY, behavior: "instant" });
      }
      break;
    }
  }
}

// --- Announce leave on page unload ---

function onBeforeUnload() {
  const myId = useWindowSyncStore.getState().myPeerId;
  channel?.postMessage({ type: "peer-leave", peerId: myId } satisfies SyncMessage);
}

// --- Public API ---

export function startWindowSync() {
  if (running) return;
  running = true;
  channel = new BroadcastChannel(CHANNEL_NAME);
  channel.onmessage = onMessage;

  // Announce self
  const syncState = useWindowSyncStore.getState();
  const win = getMyWindowInfo();
  channel.postMessage({
    type: "peer-join",
    peerId: syncState.myPeerId,
    ...win,
  } satisfies SyncMessage);

  // Start heartbeat
  sendHeartbeat();
  heartbeatId = window.setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

  // Start state broadcast loop
  rafId = requestAnimationFrame(broadcastTick);

  // Clean up on page close
  window.addEventListener("beforeunload", onBeforeUnload);
}

export function stopWindowSync() {
  running = false;

  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  if (heartbeatId !== null) {
    clearInterval(heartbeatId);
    heartbeatId = null;
  }

  window.removeEventListener("beforeunload", onBeforeUnload);
  onBeforeUnload(); // announce leave

  if (channel) {
    channel.onmessage = null;
    channel.close();
    channel = null;
  }
  frameToggle = false;
}
