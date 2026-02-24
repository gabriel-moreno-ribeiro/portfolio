import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useCallback } from "react";
import { FiX } from "react-icons/fi";
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
  onClose,
}: {
  win: WindowState;
  onRestore: (id: string) => void;
  onClose: (id: string) => void;
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

  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose(win.id);
  };

  return (
    <motion.div
      ref={ref}
      className="dock__item"
      data-window-id={win.id}
      initial={{ scale: 0, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0, opacity: 0, y: 20 }}
      whileHover={{ scale: 1.05, y: -4 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onClick={() => onRestore(win.id)}
    >
      <div className="dock__preview">
        {win.thumbnail ? (
          <img
            src={win.thumbnail}
            alt={win.title}
            className="dock__thumbnail"
            draggable={false}
          />
        ) : (
          <div className={`dock__placeholder dock__placeholder--${win.type}`}>
            <span className="dock__placeholder-title">{win.title}</span>
          </div>
        )}
        <button className="dock__close" onClick={handleClose}>
          <FiX />
        </button>
      </div>
      <span className="dock__label">{win.title}</span>
    </motion.div>
  );
}

function Dock() {
  const minimizedWindows = useMinimizedWindows();
  const restoreWindow = useWindowManagerStore((s) => s.restoreWindow);
  const closeWindow = useWindowManagerStore((s) => s.closeWindow);

  const handleRestore = useCallback(
    (id: string) => {
      restoreWindow(id);
    },
    [restoreWindow]
  );

  const handleClose = useCallback(
    (id: string) => {
      closeWindow(id);
    },
    [closeWindow]
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
                onClose={handleClose}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default Dock;
