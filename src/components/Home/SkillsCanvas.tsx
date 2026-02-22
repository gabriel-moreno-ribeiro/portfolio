import React, { useCallback, useEffect, useRef } from "react";
import { useInputSourceStore } from "../../store/inputSourceStore";

// --- Types ---

interface IconState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  restX: number;
  restY: number;
  baseRestX: number;
  baseRestY: number;
  scale: number;
  image: HTMLImageElement | null;
}

// --- Physics constants ---

const SPRING_K = 0.045;
const DAMPING = 0.86;
const TRAIL_LERP = 0.12;
const TRAIL_SPACING = 8; // frames between each icon in the trail
const MOUSE_HISTORY_SIZE = 160;
const ENTRANCE_DURATION = 500;
const STAGGER = 75;
const OSCILLATION_INTERVAL = 2000;

// --- Helpers ---

const easeOutBack = (t: number): number => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

const randomInRange = (min: number, max: number) =>
  Math.random() * (max - min) + min;

// --- Hook: preload images ---

const usePreloadedImages = (iconUrls: string[]) => {
  const imagesRef = useRef<HTMLImageElement[]>([]);
  const loadedRef = useRef(false);
  const urlsKeyRef = useRef("");

  const urlsKey = iconUrls.join(",");
  if (urlsKeyRef.current !== urlsKey) {
    urlsKeyRef.current = urlsKey;
    loadedRef.current = false;
  }

  useEffect(() => {
    if (loadedRef.current) return;
    let cancelled = false;

    const promises = iconUrls.map(
      (url) =>
        new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = url;
        })
    );

    Promise.all(promises).then((imgs) => {
      if (!cancelled) {
        imagesRef.current = imgs;
        loadedRef.current = true;
      }
    });

    return () => {
      cancelled = true;
    };
  }, [urlsKey]);

  return imagesRef;
};

// --- Component ---

interface SkillsCanvasProps {
  iconUrls: string[];
  finalPositions: Array<{ x: number; y: number }>;
  isMobile: boolean;
  triggerEntrance: boolean;
}

const SkillsCanvas: React.FC<SkillsCanvasProps> = ({
  iconUrls,
  finalPositions,
  isMobile,
  triggerEntrance,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imagesRef = usePreloadedImages(iconUrls);

  const iconsRef = useRef<IconState[]>([]);
  const mouseRef = useRef({ x: 0, y: 0, active: false });
  const returningRef = useRef(false);
  const phaseRef = useRef<"waiting" | "entering" | "idle">("waiting");
  const entranceStartRef = useRef(0);
  const oscillationTimerRef = useRef(0);
  const lastTimestampRef = useRef(0);
  const canvasSizeRef = useRef({ w: 0, h: 0, cssW: 0, cssH: 0 });
  const rafRef = useRef(0);

  // Trail state
  const mouseHistoryRef = useRef<Array<{ x: number; y: number }>>([]);
  const chainOrderRef = useRef<number[]>([]);
  // Hand tracking: finger count drives magnet strength
  const handFingersRef = useRef(5);
  const handTrailLerpRef = useRef(TRAIL_LERP);

  const iconSize = isMobile ? 60 : 80;

  // Initialize icon state
  const initIcons = useCallback(() => {
    iconsRef.current = finalPositions.map((pos) => ({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      restX: pos.x,
      restY: pos.y,
      baseRestX: pos.x,
      baseRestY: pos.y,
      scale: 0,
      image: null,
    }));
  }, [finalPositions]);

  useEffect(() => {
    initIcons();
  }, [initIcons]);

  // Sync images when they load or theme changes
  useEffect(() => {
    const interval = setInterval(() => {
      const imgs = imagesRef.current;
      if (imgs.length > 0 && iconsRef.current.length > 0) {
        for (let i = 0; i < iconsRef.current.length; i++) {
          if (i < imgs.length) {
            iconsRef.current[i].image = imgs[i];
          }
        }
        clearInterval(interval);
      }
    }, 50);
    return () => clearInterval(interval);
  }, [iconUrls]);

  // Update rest positions when finalPositions change (resize)
  useEffect(() => {
    const icons = iconsRef.current;
    for (let i = 0; i < icons.length && i < finalPositions.length; i++) {
      icons[i].baseRestX = finalPositions[i].x;
      icons[i].baseRestY = finalPositions[i].y;
      icons[i].restX = finalPositions[i].x;
      icons[i].restY = finalPositions[i].y;
    }
  }, [finalPositions]);

  // Trigger entrance animation
  useEffect(() => {
    if (triggerEntrance && phaseRef.current === "waiting") {
      phaseRef.current = "entering";
      entranceStartRef.current = performance.now();
    }
  }, [triggerEntrance]);

  // Canvas resize via ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      canvasSizeRef.current = {
        w: width * dpr,
        h: height * dpr,
        cssW: width,
        cssH: height,
      };
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Main animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const loop = (timestamp: number) => {
      const dt = lastTimestampRef.current
        ? timestamp - lastTimestampRef.current
        : 16;
      lastTimestampRef.current = timestamp;

      const { w, h, cssW, cssH } = canvasSizeRef.current;
      if (w === 0 || h === 0) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      const icons = iconsRef.current;
      const mouse = mouseRef.current;
      const phase = phaseRef.current;
      const returning = returningRef.current;
      const mouseHistory = mouseHistoryRef.current;
      const chainOrder = chainOrderRef.current;

      // --- Entrance phase ---
      if (phase === "entering") {
        const elapsed = timestamp - entranceStartRef.current;
        let allDone = true;

        for (let i = 0; i < icons.length; i++) {
          const iconElapsed = elapsed - i * STAGGER;
          if (iconElapsed < 0) {
            allDone = false;
            continue;
          }
          const t = Math.min(iconElapsed / ENTRANCE_DURATION, 1);
          if (t < 1) allDone = false;

          const eased = easeOutBack(t);
          icons[i].x = icons[i].baseRestX * eased;
          icons[i].y = icons[i].baseRestY * eased;
          icons[i].scale =
            t < 0.5 ? lerp(0, 1.5, t * 2) : lerp(1.5, 1, (t - 0.5) * 2);
        }

        if (allDone) {
          phaseRef.current = "idle";
          for (let i = 0; i < icons.length; i++) {
            icons[i].x = icons[i].baseRestX;
            icons[i].y = icons[i].baseRestY;
            icons[i].scale = 1;
            icons[i].vx = 0;
            icons[i].vy = 0;
          }
        }
      }

      // --- Hand tracking: poll store each frame ---
      const inputState = useInputSourceStore.getState();
      if (inputState.inputSource === "camera" && inputState.handPositions.length > 0) {
        const hand = inputState.handPositions[0];
        const fingers = hand.fingers;
        handFingersRef.current = fingers;

        // Convert normalized (-1..1) to canvas center-relative coords
        mouse.x = hand.x * (cssW / 2);
        mouse.y = hand.y * (cssH / 2);

        if (fingers <= 3) {
          // Closed hand → attract mode
          // Fewer fingers = tighter follow (0 fingers = 0.22, 3 fingers = 0.07)
          handTrailLerpRef.current = 0.22 - fingers * 0.05;
          mouse.active = true;
          returningRef.current = false;
        } else {
          // Open hand (4-5 fingers) → release, spring back to rest
          if (mouse.active || !returningRef.current) {
            mouse.active = false;
            returningRef.current = true;
            chainOrderRef.current = [];
            mouseHistoryRef.current = [];
          }
        }
      } else if (inputState.inputSource === "camera" && inputState.handPositions.length === 0) {
        // Hand disappeared — freeze icons in place
        if (mouse.active) {
          mouse.active = false;
          chainOrderRef.current = [];
          mouseHistoryRef.current = [];
        }
        handFingersRef.current = 5;
      }

      // --- Idle phase: physics ---
      if (phase === "idle") {
        if (mouse.active && !returning) {
          // --- Trailing mode ---

          // Record mouse position into history
          mouseHistory.push({ x: mouse.x, y: mouse.y });
          if (mouseHistory.length > MOUSE_HISTORY_SIZE) {
            mouseHistory.shift();
          }

          // Establish chain order on first attraction (sort by distance to cursor)
          if (chainOrder.length === 0 && mouseHistory.length > 0) {
            const sorted = icons
              .map((icon, i) => ({
                i,
                dist: Math.hypot(icon.x - mouse.x, icon.y - mouse.y),
              }))
              .sort((a, b) => a.dist - b.dist)
              .map((e) => e.i);
            chainOrderRef.current.push(...sorted);
          }

          // Each icon in the chain follows a different point in the mouse history
          for (let rank = 0; rank < chainOrder.length; rank++) {
            const icon = icons[chainOrder[rank]];
            const histIdx =
              mouseHistory.length - 1 - rank * TRAIL_SPACING;

            if (histIdx >= 0) {
              const target = mouseHistory[histIdx];
              // In camera mode, finger count modulates lerp strength
              const activeLerp = inputState.inputSource === "camera"
                ? handTrailLerpRef.current
                : TRAIL_LERP;
              icon.x = lerp(icon.x, target.x, activeLerp);
              icon.y = lerp(icon.y, target.y, activeLerp);
              // Kill velocity so spring doesn't interfere later
              icon.vx = 0;
              icon.vy = 0;
            }
            // Icons whose history slot isn't populated yet stay put
          }
        } else if (returning) {
          // --- Returning mode: spring back to rest ---
          for (const icon of icons) {
            const restDx = icon.restX - icon.x;
            const restDy = icon.restY - icon.y;
            icon.vx += restDx * SPRING_K;
            icon.vy += restDy * SPRING_K;
            icon.vx *= DAMPING;
            icon.vy *= DAMPING;
            icon.x += icon.vx;
            icon.y += icon.vy;
          }

          // Gentle oscillation while returning
          oscillationTimerRef.current += dt;
          if (oscillationTimerRef.current > OSCILLATION_INTERVAL) {
            oscillationTimerRef.current = 0;
            for (let i = 0; i < icons.length; i++) {
              icons[i].restX = icons[i].baseRestX + randomInRange(-10, 10);
              icons[i].restY = icons[i].baseRestY + randomInRange(-10, 10);
            }
          }
        }
        // else: frozen — no physics, icons stay where they are
      }

      // --- Draw ---
      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.translate(cssW / 2, cssH / 2);

      ctx.globalAlpha = 1;
      for (const icon of icons) {
        if (icon.scale <= 0 || !icon.image) continue;
        ctx.save();
        ctx.translate(icon.x, icon.y);
        ctx.scale(icon.scale, icon.scale);
        ctx.drawImage(
          icon.image,
          -iconSize / 2,
          -iconSize / 2,
          iconSize,
          iconSize
        );
        ctx.restore();
      }

      ctx.restore();

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [iconSize]);

  // --- Event handlers ---

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      mouseRef.current.x = e.clientX - rect.left - rect.width / 2;
      mouseRef.current.y = e.clientY - rect.top - rect.height / 2;
      mouseRef.current.active = true;
      // Cancel returning so icons can be attracted again
      returningRef.current = false;
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    // Icons freeze in place — only click sends them back
    mouseRef.current.active = false;
    chainOrderRef.current = [];
    mouseHistoryRef.current = [];
  }, []);

  // Click → disperse back to rest positions
  const handleClick = useCallback(() => {
    mouseRef.current.active = false;
    returningRef.current = true;
    chainOrderRef.current = [];
    mouseHistoryRef.current = [];
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      mouseRef.current.x = touch.clientX - rect.left - rect.width / 2;
      mouseRef.current.y = touch.clientY - rect.top - rect.height / 2;
      mouseRef.current.active = true;
      returningRef.current = false;
    }
  }, []);

  // Tap → disperse back
  const handleTouchEnd = useCallback(() => {
    mouseRef.current.active = false;
    returningRef.current = true;
    chainOrderRef.current = [];
    mouseHistoryRef.current = [];
  }, []);

  return (
    <div
      ref={containerRef}
      className="skills-canvas-container"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <canvas ref={canvasRef} />
    </div>
  );
};

export default SkillsCanvas;
