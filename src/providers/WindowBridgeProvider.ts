import {
  useWindowBridgeStore,
  type WindowInfo,
  type TransferringChip,
} from "../store/windowBridgeStore";

const CHANNEL_NAME = "portfolio-handsfree";
const HEARTBEAT_INTERVAL = 500;
const STALE_THRESHOLD = 2000;
const ADJACENCY_THRESHOLD = 80; // px gap between window edges

let channel: BroadcastChannel | null = null;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
const remoteWindows = new Map<string, WindowInfo>();

function getMyWindowInfo(): WindowInfo {
  return {
    id: useWindowBridgeStore.getState().windowId,
    screenX: window.screenX,
    screenY: window.screenY,
    innerWidth: window.innerWidth,
    innerHeight: window.innerHeight,
    lastSeen: Date.now(),
  };
}

function detectAdjacency() {
  const me = getMyWindowInfo();
  const store = useWindowBridgeStore.getState();
  const now = Date.now();

  // Prune stale windows
  for (const [id, info] of remoteWindows) {
    if (now - info.lastSeen > STALE_THRESHOLD) {
      remoteWindows.delete(id);
    }
  }

  store.setAdjacentWindows(new Map(remoteWindows));

  // Determine glow edge
  let glowEdge: "left" | "right" | null = null;
  const myRight = me.screenX + me.innerWidth;
  const myLeft = me.screenX;

  for (const [, info] of remoteWindows) {
    // Vertical overlap check
    const verticalOverlap =
      me.screenY < info.screenY + info.innerHeight &&
      me.screenY + me.innerHeight > info.screenY;

    if (!verticalOverlap) continue;

    // Check if another window's left edge is near my right edge
    if (Math.abs(info.screenX - myRight) < ADJACENCY_THRESHOLD) {
      glowEdge = "right";
      break;
    }
    // Check if another window's right edge is near my left edge
    if (
      Math.abs(info.screenX + info.innerWidth - myLeft) < ADJACENCY_THRESHOLD
    ) {
      glowEdge = "left";
      break;
    }
  }

  store.setGlowEdge(glowEdge);
}

function handleMessage(
  event: MessageEvent<{
    type: string;
    window?: WindowInfo;
    chip?: TransferringChip;
  }>
) {
  const { type } = event.data;

  if (type === "heartbeat" && event.data.window) {
    remoteWindows.set(event.data.window.id, event.data.window);
    detectAdjacency();
  }

  if (type === "chip-transfer" && event.data.chip) {
    const store = useWindowBridgeStore.getState();
    // Only accept if this chip is targeted at us (nearest adjacent window)
    store.addIncomingChip(event.data.chip);
  }

  if (type === "window-close" && event.data.window) {
    remoteWindows.delete(event.data.window.id);
    detectAdjacency();
  }
}

export function startWindowBridge() {
  if (typeof BroadcastChannel === "undefined") return;
  if (channel) return;

  channel = new BroadcastChannel(CHANNEL_NAME);
  channel.addEventListener("message", handleMessage);

  // Start heartbeat
  heartbeatTimer = setInterval(() => {
    channel?.postMessage({ type: "heartbeat", window: getMyWindowInfo() });
    detectAdjacency();
  }, HEARTBEAT_INTERVAL);

  // Send initial heartbeat
  channel.postMessage({ type: "heartbeat", window: getMyWindowInfo() });

  // Announce close on unload
  window.addEventListener("beforeunload", () => {
    channel?.postMessage({ type: "window-close", window: getMyWindowInfo() });
  });
}

export function stopWindowBridge() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  if (channel) {
    channel.postMessage({
      type: "window-close",
      window: getMyWindowInfo(),
    });
    channel.removeEventListener("message", handleMessage);
    channel.close();
    channel = null;
  }
  remoteWindows.clear();
}

export function broadcastChipTransfer(chip: TransferringChip) {
  channel?.postMessage({ type: "chip-transfer", chip });
}
