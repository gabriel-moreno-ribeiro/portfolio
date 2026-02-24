import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useCallback } from "react";
import {
  useMinimizedWindows,
  useWindowManagerStore,
  setDockIconRect,
  removeDockIconRect,
  WindowState,
} from "../../store/windowManagerStore";

function DockItem({
  win,
  onRestore,
}: {
  win: WindowState;
  onRestore: (id: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Register position for genie animation targeting
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const update = () => {
      setDockIconRect(win.id, el.getBoundingClientRect());
    };

    update();
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
      removeDockIconRect(win.id);
    };
  }, [win.id]);

  const getIcon = () => {
    switch (win.type) {
      case "terminal":
        return ">";
      case "workcard":
        return (win.title.charAt(0) || "W").toUpperCase();
      case "handsfree-intro":
        return "H";
      case "gesture-tutorial":
        return "G";
      default:
        return win.title.charAt(0).toUpperCase();
    }
  };

  return (
    <motion.div
      ref={ref}
      className="dock__item"
      data-window-id={win.id}
      initial={{ scale: 0, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0, opacity: 0, y: 20 }}
      whileHover={{ scale: 1.15, y: -8 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onClick={() => onRestore(win.id)}
    >
      <div className={`dock__icon dock__icon--${win.type}`}>
        <span>{getIcon()}</span>
      </div>
      <span className="dock__label">{win.title}</span>
    </motion.div>
  );
}

function Dock() {
  const minimizedWindows = useMinimizedWindows();
  const restoreWindow = useWindowManagerStore((s) => s.restoreWindow);

  const handleRestore = useCallback(
    (id: string) => {
      restoreWindow(id);
    },
    [restoreWindow]
  );

  return (
    <AnimatePresence>
      {minimizedWindows.length > 0 && (
        <motion.div
          className="dock"
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <AnimatePresence mode="popLayout">
            {minimizedWindows.map((win) => (
              <DockItem
                key={win.id}
                win={win}
                onRestore={handleRestore}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Dock;
