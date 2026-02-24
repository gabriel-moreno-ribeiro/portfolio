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
import html2canvas from "html2canvas-pro";
import MacButtons from "../Home/MacButtons";
import useIsMobile from "../../hooks/useIsMobile";

const MIN_WIDTH = 300;
const MIN_HEIGHT = 200;

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

  const updateSize = useWindowManagerStore((s) => s.updateSize);
  const setThumbnail = useWindowManagerStore((s) => s.setThumbnail);

  const isMobile = useIsMobile();
  const dragControls = useDragControls();
  const controls = useAnimation();
  const windowRef = useRef<HTMLDivElement>(null);
  const [isAnimatingGenie, setIsAnimatingGenie] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const prevStatusRef = useRef<string | undefined>(undefined);
  const [resizing, setResizing] = useState<{
    edge: "right" | "bottom" | "corner";
    startX: number;
    startY: number;
    startW: number;
    startH: number;
  } | null>(null);

  const x = useMotionValue(win?.position.x ?? 0);
  const y = useMotionValue(win?.position.y ?? 0);

  // Sync motion values when store position changes (e.g. from restore)
  useEffect(() => {
    if (win && !isAnimatingGenie && !isRestoring) {
      x.set(win.position.x);
      y.set(win.position.y);
    }
  }, [win?.position.x, win?.position.y, isAnimatingGenie, isRestoring]);

  // Reverse genie: animate from dock → window position when restoring
  useEffect(() => {
    const wasMinimized = prevStatusRef.current === "minimized";
    prevStatusRef.current = win?.status;

    if (!wasMinimized || !win || win.status !== "open") return;

    const dockIconRect = getDockIconRect(windowId);
    const targetX = win.position.x;
    const targetY = win.position.y;
    const startX = dockIconRect
      ? dockIconRect.x + dockIconRect.width / 2
      : window.innerWidth - 50;
    const startY = dockIconRect
      ? dockIconRect.y + dockIconRect.height / 2
      : window.innerHeight - 40;

    setIsRestoring(true);

    controls.start({
      clipPath: [...GENIE_CLIP_PATHS].reverse(),
      scaleX: [0.02, 0.08, 0.25, 0.6, 1],
      scaleY: [0.02, 0.08, 0.2, 0.5, 1],
      x: [startX, startX, startX + (targetX - startX) * 0.4, targetX, targetX],
      y: [startY, startY - 20, startY + (targetY - startY) * 0.5, targetY, targetY],
      opacity: [0, 0.3, 0.7, 0.9, 1],
      transition: {
        duration: 0.3,
        ease: [0, 0, 0.2, 1],
        times: [0, 0.15, 0.45, 0.8, 1],
      },
    }).then(() => {
      setIsRestoring(false);
      x.set(targetX);
      y.set(targetY);
    });
  }, [win?.status]);

  // Resize handlers
  const handleResizeStart = useCallback(
    (edge: "right" | "bottom" | "corner", e: ReactPointerEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (!win) return;
      // Use actual rendered size when height is auto (0)
      const el = windowRef.current;
      setResizing({
        edge,
        startX: e.clientX,
        startY: e.clientY,
        startW: win.size.width,
        startH: win.size.height || el?.offsetHeight || 400,
      });
    },
    [win]
  );

  useEffect(() => {
    if (!resizing) return;

    const handleMove = (e: PointerEvent) => {
      const dx = e.clientX - resizing.startX;
      const dy = e.clientY - resizing.startY;
      let newW = resizing.startW;
      let newH = resizing.startH;

      if (resizing.edge === "right" || resizing.edge === "corner") {
        newW = Math.max(MIN_WIDTH, resizing.startW + dx);
      }
      if (resizing.edge === "bottom" || resizing.edge === "corner") {
        newH = Math.max(MIN_HEIGHT, resizing.startH + dy);
      }

      updateSize(windowId, { width: newW, height: newH });
    };

    const handleUp = () => {
      setResizing(null);
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [resizing, windowId, updateSize]);

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
    const windowEl = windowRef.current;

    if (!windowEl) {
      minimizeWindow(windowId);
      return;
    }

    // Capture thumbnail before animating
    try {
      const canvas = await html2canvas(windowEl, {
        scale: 0.25,
        useCORS: true,
        logging: false,
        backgroundColor: null,
      });
      setThumbnail(windowId, canvas.toDataURL("image/png", 0.6));
    } catch {
      // Ignore capture errors
    }

    setIsAnimatingGenie(true);

    // Target: dock icon if it exists, otherwise bottom-right where dock will appear
    const dockIconRect = getDockIconRect(windowId);
    const targetX = dockIconRect
      ? dockIconRect.x + dockIconRect.width / 2
      : window.innerWidth - 50;
    const targetY = dockIconRect
      ? dockIconRect.y + dockIconRect.height / 2
      : window.innerHeight - 40;

    const currentX = x.get();
    const currentY = y.get();
    const windowWidth = windowEl.offsetWidth;

    // Lerp X from current center toward target
    const midX = currentX + (targetX - currentX - windowWidth / 2) * 0.5;

    await controls.start({
      clipPath: GENIE_CLIP_PATHS,
      scaleX: [1, 0.6, 0.25, 0.08, 0.02],
      scaleY: [1, 0.5, 0.2, 0.08, 0.02],
      x: [
        currentX,
        midX,
        targetX - windowWidth / 2,
        targetX - windowWidth / 2,
        targetX - windowWidth / 2,
      ],
      y: [
        currentY,
        currentY + (targetY - currentY) * 0.3,
        targetY - 80,
        targetY - 20,
        targetY,
      ],
      opacity: [1, 0.9, 0.6, 0.2, 0],
      transition: {
        duration: 0.3,
        ease: [0.5, 0, 1, 1],
        times: [0, 0.2, 0.55, 0.85, 1],
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
  }, [controls, minimizeWindow, windowId, x, y, setThumbnail]);

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
        height: isMaximized ? "100vh" : win.size.height || "auto",
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
      {!isMobile && !isMaximized && (
        <>
          <div
            className="draggable-window__resize draggable-window__resize--right"
            onPointerDown={(e) => handleResizeStart("right", e)}
          />
          <div
            className="draggable-window__resize draggable-window__resize--bottom"
            onPointerDown={(e) => handleResizeStart("bottom", e)}
          />
          <div
            className="draggable-window__resize draggable-window__resize--corner"
            onPointerDown={(e) => handleResizeStart("corner", e)}
          />
        </>
      )}
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
