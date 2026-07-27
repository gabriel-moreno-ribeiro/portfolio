import { useWindowManagerStore } from "../store/windowManagerStore";

// Opens (or toggles) the floating Terminal window — usable from anywhere.
export function toggleTerminalWindow() {
  const state = useWindowManagerStore.getState();
  if (state.windows["terminal"]) {
    state.closeWindow("terminal");
    return;
  }
  state.openWindow({
    id: "terminal",
    title: "Terminal",
    type: "terminal",
    status: "open",
    position: {
      x: Math.max(0, window.innerWidth / 2 - 480),
      y: Math.max(0, window.innerHeight / 2 - 300),
    },
    size: { width: 960, height: 0 },
  });
}
