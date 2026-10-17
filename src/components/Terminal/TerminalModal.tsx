import { useEffect } from "react";
import {
  useWindowManagerStore,
  useWindow,
} from "../../store/windowManagerStore";
import useIsMobile from "../../hooks/useIsMobile";
import { toggleTerminalWindow } from "../../utils/terminalWindow";

function TerminalModal() {
  const terminalWindow = useWindow("terminal");
  const closeWindow = useWindowManagerStore((s) => s.closeWindow);
  const isMobile = useIsMobile();

  const toggle = toggleTerminalWindow;

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
