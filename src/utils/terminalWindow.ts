import { useWindowManagerStore } from "../store/windowManagerStore";

// Opens, restores (if minimized) or closes the floating Terminal window — usable from anywhere.
export function toggleTerminalWindow() {
  const state = useWindowManagerStore.getState();
  const win = state.windows["terminal"];
  if (win?.status === "minimized") return state.restoreWindow("terminal");
  if (win) return state.closeWindow("terminal");
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
