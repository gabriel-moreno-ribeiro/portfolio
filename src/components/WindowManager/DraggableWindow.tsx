import {
  motion,
  useDragControls,
  useMotionValue,
  useAnimation,
  AnimatePresence,
} from "motion/react";
import {
  useRef,
  useCallback,
  ReactNode,
  useEffect,
  useState,
  PointerEvent as ReactPointerEvent,
} from "react";
import {
  useWindowManagerStore,
  WindowId,
  useWindow,
  getDockIconRect,
} from "../../store/windowManagerStore";
import MacButtons from "../Home/MacButtons";
import useIsMobile from "../../hooks/useIsMobile";

interface DraggableWindowProps {
  windowId: WindowId;
  title: string;
  children: ReactNode;
  headerExtra?: ReactNode;
  className?: string;
}

// Genie keyframes for minimize
const GENIE_CLIP_PATHS = [
  "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)",
  "polygon(10% 0%, 90% 0%, 85% 100%, 15% 100%)",
  "polygon(25% 0%, 75% 0%, 65% 100%, 35% 100%)",
  "polygon(40% 20%, 60% 20%, 55% 100%, 45% 100%)",
  "polygon(47% 50%, 53% 50%, 52% 100%, 48% 100%)",
];

function DraggableWindow({
  windowId,
  title,
  children,
  headerExtra,
  className = "",
}: DraggableWindowProps) {
  const win = useWindow(windowId);
  const closeWindow = useWindowManagerStore((s) => s.closeWindow);
  const minimizeWindow = useWindowManagerStore((s) => s.minimizeWindow);
  const maximizeWindow = useWindowManagerStore((s) => s.maximizeWindow);
  const unmaximizeWindow = useWindowManagerStore((s) => s.unmaximizeWindow);
  const focusWindow = useWindowManagerStore((s) => s.focusWindow);
  const updatePosition = useWindowManagerStore((s) => s.updatePosition);

  const isMobile = useIsMobile();
  const dragControls = useDragControls();
  const controls = useAnimation();
  const windowRef = useRef<HTMLDivElement>(null);
  const [isAnimatingGenie, setIsAnimatingGenie] = useState(false);

  const x = useMotionValue(win?.position.x ?? 0);
  const y = useMotionValue(win?.position.y ?? 0);

  // Sync motion values when store position changes (e.g. from restore)
  useEffect(() => {
    if (win && !isAnimatingGenie) {
      x.set(win.position.x);
      y.set(win.position.y);
    }
  }, [win?.position.x, win?.position.y, isAnimatingGenie]);

  const handlePointerDown = useCallback(() => {
    focusWindow(windowId);
  }, [focusWindow, windowId]);

  const handleHeaderPointerDown = useCallback(
    (e: ReactPointerEvent) => {
      if (isMobile || win?.status === "maximized") return;
      dragControls.start(e);
    },
    [dragControls, isMobile, win?.status]
  );

  const handleDragEnd = useCallback(() => {
    updatePosition(windowId, { x: x.get(), y: y.get() });
  }, [windowId, updatePosition, x, y]);

  const handleClose = useCallback(() => {
    closeWindow(windowId);
  }, [closeWindow, windowId]);

  const handleMinimize = useCallback(async () => {
    const dockIconRect = getDockIconRect(windowId);
    const windowEl = windowRef.current;

    if (!windowEl) {
      minimizeWindow(windowId);
      return;
    }

    setIsAnimatingGenie(true);

    // Calculate target position (dock center or bottom center of screen)
    const targetX = dockIconRect
      ? dockIconRect.x + dockIconRect.width / 2
      : window.innerWidth / 2;
    const targetY = dockIconRect
      ? dockIconRect.y
      : window.innerHeight - 40;

    const currentX = x.get();
    const currentY = y.get();
    const windowWidth = windowEl.offsetWidth;

    await controls.start({
      clipPath: GENIE_CLIP_PATHS,
      scaleX: [1, 0.8, 0.5, 0.2, 0.05],
      scaleY: [1, 0.7, 0.4, 0.15, 0.05],
      x: [
        currentX,
        currentX,
        targetX - windowWidth / 2,
        targetX - windowWidth / 2,
        targetX - windowWidth / 2,
      ],
      y: [
        currentY,
        currentY + 50,
        targetY - 200,
        targetY - 50,
        targetY,
      ],
      opacity: [1, 1, 0.8, 0.5, 0],
      transition: {
        duration: 0.28,
        ease: [0.4, 0, 1, 1],
        times: [0, 0.15, 0.5, 0.8, 1],
      },
    });

    setIsAnimatingGenie(false);
    minimizeWindow(windowId);

    // Reset animation state for next open
    controls.set({
      clipPath: GENIE_CLIP_PATHS[0],
      scaleX: 1,
      scaleY: 1,
      opacity: 1,
    });
  }, [controls, minimizeWindow, windowId, x, y]);

  const handleExpand = useCallback(() => {
    if (win?.status === "maximized") {
      unmaximizeWindow(windowId);
    } else {
      maximizeWindow(windowId);
    }
  }, [win?.status, maximizeWindow, unmaximizeWindow, windowId]);

  if (!win || win.status === "minimized") return null;

  const isMaximized = win.status === "maximized";

  return (
    <motion.div
      ref={windowRef}
      className={`draggable-window ${isMaximized ? "draggable-window--maximized" : ""} ${isMobile ? "draggable-window--mobile" : ""} ${className}`}
      style={{
        x: isMaximized ? 0 : x,
        y: isMaximized ? 0 : y,
        zIndex: win.zIndex,
        width: isMaximized ? "100vw" : win.size.width,
        height: isMaximized ? "100vh" : "auto",
      }}
      drag={!isMobile && !isMaximized ? true : false}
      dragControls={dragControls}
      dragListener={false}
      dragElastic={0}
      dragMomentum={false}
      dragConstraints={{
        top: 0,
        left: -(win.size.width - 100),
        right: window.innerWidth - 100,
        bottom: window.innerHeight - 50,
      }}
      onDragEnd={handleDragEnd}
      onPointerDown={handlePointerDown}
      animate={controls}
      initial={{
        opacity: 1,
        scale: 1,
        clipPath: GENIE_CLIP_PATHS[0],
      }}
      layout={false}
    >
      <div
        className="draggable-window__header"
        onPointerDown={handleHeaderPointerDown}
        style={{ cursor: isMobile || isMaximized ? "default" : "grab" }}
      >
        <MacButtons
          onClose={handleClose}
          onMinimise={handleMinimize}
          onExpand={handleExpand}
          isExpanded={isMaximized}
        />
        {headerExtra}
        <span className="draggable-window__title">{title}</span>
      </div>
      <div className="draggable-window__body">{children}</div>
    </motion.div>
  );
}

// Wrapper that adds an overlay backdrop when windows are open
export function WindowOverlay({
  children,
}: {
  children: ReactNode;
}) {
  const hasOpenWindows = useWindowManagerStore((s) =>
    Object.values(s.windows).some((w) => w.status !== "minimized")
  );

  return (
    <>
      <AnimatePresence>
        {hasOpenWindows && (
          <motion.div
            className="window-overlay-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          />
        )}
      </AnimatePresence>
      {children}
    </>
  );
}

export default DraggableWindow;
