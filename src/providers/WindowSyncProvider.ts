import {
  useInputSourceStore,
  type HandPosition,
} from "../store/inputSourceStore";

const CHANNEL_NAME = "portfolio-window-sync";

interface SyncMessage {
  type: "sync";
  headPosition: { x: number; y: number };
  handPositions: HandPosition[];
  inputSource: "mouse" | "camera";
  scrollY: number;
  skillsCursorActive: boolean;
  isReturning: boolean;
}

let channel: BroadcastChannel | null = null;
let rafId: number | null = null;
let running = false;
let frameToggle = false;

// --- Leader: broadcast state at ~30fps ---

function broadcastTick() {
  frameToggle = !frameToggle;
  if (frameToggle) {
    // Skip every other frame → ~30fps at 60Hz monitors
    rafId = requestAnimationFrame(broadcastTick);
    return;
  }

  const state = useInputSourceStore.getState();
  const msg: SyncMessage = {
    type: "sync",
    headPosition: state.headPosition,
    handPositions: state.handPositions,
    inputSource: state.inputSource,
    scrollY: window.scrollY,
    skillsCursorActive: state.skillsCursorActive,
    isReturning: state.isReturning,
  };
  channel!.postMessage(msg);

  rafId = requestAnimationFrame(broadcastTick);
}

// --- Follower: receive and apply state ---

function onMessage(event: MessageEvent<SyncMessage>) {
  const msg = event.data;
  if (msg.type !== "sync") return;

  const store = useInputSourceStore.getState();
  store.setHeadPosition(msg.headPosition);
  store.setHandPositions(msg.handPositions);
  store.setInputSource(msg.inputSource);
  store.setSkillsCursorActive(msg.skillsCursorActive);
  store.setIsReturning(msg.isReturning);

  // Scroll sync — 2px dead zone to prevent micro-jitter
  const diff = Math.abs(window.scrollY - msg.scrollY);
  if (diff > 2) {
    window.scrollTo({ top: msg.scrollY, behavior: "instant" });
  }
}

// --- Public API ---

export function startWindowSync(role: "leader" | "follower") {
  if (running) return;
  running = true;
  channel = new BroadcastChannel(CHANNEL_NAME);

  if (role === "leader") {
    rafId = requestAnimationFrame(broadcastTick);
  } else {
    channel.onmessage = onMessage;
  }
}

export function stopWindowSync() {
  running = false;
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  if (channel) {
    channel.onmessage = null;
    channel.close();
    channel = null;
  }
  frameToggle = false;
}
