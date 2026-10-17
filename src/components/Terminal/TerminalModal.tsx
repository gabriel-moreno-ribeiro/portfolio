import { useEffect, useCallback } from "react";
import {
  useWindowManagerStore,
  useWindow,
} from "../../store/windowManagerStore";
import useIsMobile from "../../hooks/useIsMobile";

function TerminalModal() {
  const terminalWindow = useWindow("terminal");
  const openWindow = useWindowManagerStore((s) => s.openWindow);
  const closeWindow = useWindowManagerStore((s) => s.closeWindow);
  const restoreWindow = useWindowManagerStore((s) => s.restoreWindow);
  const isMobile = useIsMobile();

  const toggle = useCallback(() => {
    if (terminalWindow?.status === "minimized") {
      restoreWindow("terminal");
    } else if (terminalWindow) {
      closeWindow("terminal");
    } else {
      openWindow({
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
  }, [terminalWindow, openWindow, closeWindow, restoreWindow]);

  // Lock scroll only on mobile (desktop windows float over scrollable content)
  useEffect(() => {
    const isVisible = terminalWindow && terminalWindow.status !== "minimized";
    if (isMobile && isVisible) {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
    } else {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    }
    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, [terminalWindow?.status, isMobile]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K (Mac) or Ctrl+K (Windows/Linux). Caps Lock or Shift sends "K".
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggle();
      }
      // Escape closes the terminal unless it was meant for another dialog (a photo viewer)
      const inOtherDialog = (e.target as Element | null)?.closest?.('[role="dialog"]:not(.draggable-window)');
      if (e.key === "Escape" && terminalWindow && terminalWindow.status !== "minimized" && !inOtherDialog) {
        closeWindow("terminal");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [terminalWindow, toggle, closeWindow]);

  // Rendering is handled by WindowRenderer
  return null;
}

export default TerminalModal;
