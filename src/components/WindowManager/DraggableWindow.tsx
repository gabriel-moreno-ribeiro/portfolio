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
  useMemo,
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
import { useTabTransfer, pendingTransferEntries } from "../../hooks/useTabTransfer";

const MIN_WIDTH = 180;
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

  const { hasPeer, transferWindow, signalNearEdge, signalLeftEdge } =
    useTabTransfer();

  const isMobile = useIsMobile();
  const dragControls = useDragControls();
  const controls = useAnimation();
  const windowRef = useRef<HTMLDivElement>(null);
  const [isAnimatingGenie, setIsAnimatingGenie] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const prevStatusRef = useRef<string | undefined>(undefined);
  const nearEdgeRef = useRef<"left" | "right" | null>(null);
  const didTransferRef = useRef(false);
  const winRef = useRef(win);
  winRef.current = win;
  const hasPeerRef = useRef(hasPeer);
  hasPeerRef.current = hasPeer;
  const [resizing, setResizing] = useState<{
    edge: "right" | "bottom" | "corner" | "left";
    startX: number;
    startY: number;
    startW: number;
    startH: number;
    startWinX: number;
  } | null>(null);

  const x = useMotionValue(win?.position.x ?? 0);
  const y = useMotionValue(win?.position.y ?? 0);

  // Sync motion values when store position changes (e.g. from restore)
  useEffect(() => {
    if (win && !isAnimatingGenie && !isRestoring && !isTransferring) {
      x.set(win.position.x);
      y.set(win.position.y);
    }
  }, [win?.position.x, win?.position.y, isAnimatingGenie, isRestoring, isTransferring]);

  // Entry animation for windows received from another tab
  useEffect(() => {
    const entry = pendingTransferEntries.get(windowId);
    if (!entry || !win) return;

    pendingTransferEntries.delete(windowId);

    // Place window on the side it's entering from, then slide to a natural position
    const winWidth = win.size.width;
    const fromLeft = entry.fromEdge === "left";
    const startX = fromLeft ? -winWidth + 40 : window.innerWidth - 40;
    const restX = fromLeft
      ? Math.max(40, 80)
      : Math.min(window.innerWidth - winWidth - 40, window.innerWidth - winWidth - 80);
    const restY = Math.max(40, Math.min(win.position.y, window.innerHeight - 100));

    setIsTransferring(true);
    x.set(startX);
    y.set(restY);

    controls
      .start({
        x: [startX, restX],
        y: restY,
        opacity: [0, 1],
        transition: {
          duration: 0.35,
          ease: [0, 0, 0.2, 1],
        },
      })
      .then(() => {
        setIsTransferring(false);
        updatePosition(windowId, { x: restX, y: restY });
        x.set(restX);
        y.set(restY);
      });
  }, [windowId, win?.id]);

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
    (edge: "right" | "bottom" | "corner" | "left", e: ReactPointerEvent) => {
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
        startWinX: win.position.x,
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

      if (resizing.edge === "left") {
        newW = Math.max(MIN_WIDTH, resizing.startW - dx);
        // Shift position so the right edge stays pinned
        const newX = resizing.startWinX + (resizing.startW - newW);
        updatePosition(windowId, { x: newX, y: y.get() });
        x.set(newX);
      }
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

  // Real-time edge detection + mid-drag transfer.
  // Uses refs so the callback stays stable and avoids re-creation every render.
  const handleDrag = useCallback(() => {
    if (!hasPeerRef.current || !winRef.current || didTransferRef.current) return;

    const currentX = x.get();
    const winWidth = winRef.current.size.width;

    // Window's right edge past viewport right
    const pastRight = currentX + winWidth > window.innerWidth;
    // Window's left edge past viewport left
    const pastLeft = currentX < 0;

    // Signal glow when approaching edge (within 60px of viewport boundary)
    const nearRight = currentX + winWidth > window.innerWidth - 60;
    const nearLeft = currentX < 60;

    if (nearRight && !pastRight) {
      if (nearEdgeRef.current !== "right") {
        nearEdgeRef.current = "right";
        signalNearEdge(windowId, "right");
      }
    } else if (nearLeft && !pastLeft) {
      if (nearEdgeRef.current !== "left") {
        nearEdgeRef.current = "left";
        signalNearEdge(windowId, "left");
      }
    } else if (!pastRight && !pastLeft && nearEdgeRef.current) {
      nearEdgeRef.current = null;
      signalLeftEdge(windowId);
    }

    // Transfer mid-drag: when >60% of the window is off-screen, send it
    const offScreenRight = currentX > window.innerWidth - winWidth * 0.4;
    const offScreenLeft = currentX + winWidth < winWidth * 0.4;

    if (offScreenRight) {
      didTransferRef.current = true;
      nearEdgeRef.current = null;
      signalLeftEdge(windowId);
      updatePosition(windowId, { x: currentX, y: y.get() });
      transferWindow(windowId, "right");
    } else if (offScreenLeft) {
      didTransferRef.current = true;
      nearEdgeRef.current = null;
      signalLeftEdge(windowId);
      updatePosition(windowId, { x: currentX, y: y.get() });
      transferWindow(windowId, "left");
    }
  }, [x, y, windowId, signalNearEdge, signalLeftEdge, transferWindow, updatePosition]);

  const handleDragEnd = useCallback(() => {
    // If we already transferred mid-drag, just reset the flag
    if (didTransferRef.current) {
      didTransferRef.current = false;
      return;
    }

    // Clear edge signal
    if (nearEdgeRef.current) {
      nearEdgeRef.current = null;
      signalLeftEdge(windowId);
    }

    // Normal drag end — persist position
    updatePosition(windowId, { x: x.get(), y: y.get() });
  }, [windowId, updatePosition, x, y, signalLeftEdge]);

  const handleClose = useCallback(() => {
    closeWindow(windowId);
  }, [closeWindow, windowId]);

  const handleMinimize = useCallback(async () => {
    const windowEl = windowRef.current;

    if (!windowEl) {
      minimizeWindow(windowId);
      return;
    }

    // Lazy-load html2canvas only when needed to avoid bloating memory
    try {
      const { default: html2canvas } = await import("html2canvas-pro");
      const canvas = await html2canvas(windowEl, {
        scale: 0.15,
        useCORS: true,
        logging: false,
        backgroundColor: null,
      });
      setThumbnail(windowId, canvas.toDataURL("image/jpeg", 0.4));
      // Release the canvas immediately
      canvas.width = 0;
      canvas.height = 0;
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

  const dragConstraints = useMemo(() => {
    const winWidth = win?.size.width ?? 0;
    return hasPeer
      ? {
          top: 0,
          left: -(winWidth + 200),
          right: window.innerWidth + 200,
          bottom: window.innerHeight - 50,
        }
      : {
          top: 0,
          left: -(winWidth - 100),
          right: window.innerWidth - 100,
          bottom: window.innerHeight - 50,
        };
  }, [hasPeer, win?.size.width]);

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
      dragConstraints={dragConstraints}
      onDrag={handleDrag}
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
            className="draggable-window__resize draggable-window__resize--left"
            onPointerDown={(e) => handleResizeStart("left", e)}
          />
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

// Wrapper that adds an overlay backdrop on mobile only
export function WindowOverlay({
  children,
}: {
  children: ReactNode;
}) {
  const isMobile = useIsMobile();
  const hasOpenWindows = useWindowManagerStore((s) =>
    Object.values(s.windows).some((w) => w.status !== "minimized")
  );
  const windows = useWindowManagerStore((s) => s.windows);
  const closeWindow = useWindowManagerStore((s) => s.closeWindow);

  const handleBackdropClick = useCallback(() => {
    // On mobile, close all open windows when tapping the backdrop
    Object.values(windows).forEach((w) => {
      if (w.status !== "minimized") {
        closeWindow(w.id);
      }
    });
  }, [windows, closeWindow]);

  return (
    <>
      <AnimatePresence>
        {isMobile && hasOpenWindows && (
          <motion.div
            className="window-overlay-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleBackdropClick}
          />
        )}
      </AnimatePresence>
      {children}
    </>
  );
}

export default DraggableWindow;
