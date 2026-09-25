import { useInputSourceStore } from "../store/inputSourceStore";

let rafId: number | null = null;
let pendingX = 0;
let pendingY = 0;
let listening = false;

function onMouseMove(event: MouseEvent) {
  pendingX = (event.clientX / window.innerWidth) * 2 - 1;
  pendingY = (event.clientY / window.innerHeight) * 2 - 1;
  // One store write per frame, and only while the mouse is actually moving
  if (rafId === null) rafId = requestAnimationFrame(flush);
}

function flush() {
  rafId = null;
  const { inputSource } = useInputSourceStore.getState();
  if (inputSource === "mouse") {
    useInputSourceStore.getState().setHeadPosition({
      x: pendingX,
      y: pendingY,
    });
  }
}

export function startMouseInputProvider() {
  if (listening) return;
  listening = true;
  window.addEventListener("mousemove", onMouseMove, { passive: true });
}

export function stopMouseInputProvider() {
  listening = false;
  window.removeEventListener("mousemove", onMouseMove);
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}
