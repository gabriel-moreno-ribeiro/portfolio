import { motion, useAnimation, useInView } from "motion/react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import l_icon1 from "../../assets/skills/light/icon1.webp";
import l_icon10 from "../../assets/skills/light/icon10.webp";
import l_icon11 from "../../assets/skills/light/icon11.webp";
import l_icon12 from "../../assets/skills/light/icon12.webp";
import l_icon13 from "../../assets/skills/light/icon13.webp";
import l_icon2 from "../../assets/skills/light/icon2.webp";
import l_icon3 from "../../assets/skills/light/icon3.webp";
import l_icon4 from "../../assets/skills/light/icon4.webp";
import l_icon5 from "../../assets/skills/light/icon5.webp";
import l_icon6 from "../../assets/skills/light/icon6.webp";
import l_icon7 from "../../assets/skills/light/icon7.webp";
import l_icon8 from "../../assets/skills/light/icon8.webp";
import l_icon9 from "../../assets/skills/light/icon9.webp";

import d_icon1 from "../../assets/skills/dark/icon1.webp";
import d_icon10 from "../../assets/skills/dark/icon10.webp";
import d_icon11 from "../../assets/skills/dark/icon11.webp";
import d_icon12 from "../../assets/skills/dark/icon12.webp";
import d_icon13 from "../../assets/skills/dark/icon13.webp";
import d_icon2 from "../../assets/skills/dark/icon2.webp";
import d_icon3 from "../../assets/skills/dark/icon3.webp";
import d_icon4 from "../../assets/skills/dark/icon4.webp";
import d_icon5 from "../../assets/skills/dark/icon5.webp";
import d_icon6 from "../../assets/skills/dark/icon6.webp";
import d_icon7 from "../../assets/skills/dark/icon7.webp";
import d_icon8 from "../../assets/skills/dark/icon8.webp";
import d_icon9 from "../../assets/skills/dark/icon9.webp";
import useIsMobile from "../../hooks/useIsMobile";
import { broadcastChipTransfer } from "../../providers/WindowBridgeProvider";
import { useInputSourceStore } from "../../store/inputSourceStore";
import { useThemeStore } from "../../store/themeStore";
import { useWindowBridgeStore } from "../../store/windowBridgeStore";

const lightIcons = [
  l_icon1,
  l_icon2,
  l_icon3,
  l_icon4,
  l_icon5,
  l_icon6,
  l_icon7,
  l_icon8,
  l_icon9,
  l_icon10,
  l_icon11,
  l_icon12,
  l_icon13,
];

const darkIcons = [
  d_icon1,
  d_icon2,
  d_icon3,
  d_icon4,
  d_icon5,
  d_icon6,
  d_icon7,
  d_icon8,
  d_icon9,
  d_icon10,
  d_icon11,
  d_icon12,
  d_icon13,
];

const initialPosition = {
  x: 0,
  y: 0,
};

const deskstopFinalPositions = [
  { x: -500, y: 0 },
  { x: 650, y: 100 },
  { x: 600, y: -50 },
  { x: -600, y: -150 },
  { x: -600, y: 250 },
  { x: 100, y: -250 },
  { x: -400, y: -300 },
  { x: 500, y: 200 },
  { x: -300, y: 0 },
  { x: 300, y: 0 },
  { x: 250, y: 300 },
  { x: 550, y: -300 },
  { x: -250, y: 250 },
];

const mobileFinalPositions = [
  { x: -100, y: 120 },
  { x: 150, y: 110 },
  { x: 120, y: -150 },
  { x: -120, y: -275 },
  { x: 0, y: 325 },
  { x: 10, y: -280 },
  { x: -100, y: -150 },
  { x: 5, y: 150 },
  { x: -150, y: 300 },
  { x: 150, y: 380 },
  { x: 125, y: -360 },
  { x: -150, y: -370 },
  { x: 100, y: 250 },
];

const randomInRange = (min: number, max: number) =>
  Math.random() * (max - min) + min;

// Spring physics constants for hand tracking mode
const ATTRACTION_STRENGTH = 0.08;
const REPULSION_STRENGTH = 4000;
const ORBIT_RADIUS_MIN = 30; // pinched
const ORBIT_RADIUS_MAX = 200; // spread open
const DAMPING_FACTOR = 0.85;

interface ChipState {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const Skills: React.FC = () => {
  const isMobile = useIsMobile();
  const { darkMode } = useThemeStore();
  const controls = useAnimation();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, {
    margin: "0px 0px -200px 0px",
    once: true,
  });

  // Refs for handsfree chip physics
  const chipRefs = useRef<(HTMLImageElement | null)[]>([]);
  const chipStates = useRef<ChipState[]>([]);
  const handsfreeRafRef = useRef<number | null>(null);
  const hasEnteredView = useRef(false);
  const hiddenChips = useRef<Set<number>>(new Set());

  // Scale chip positions to viewport width for true edge-to-edge
  const [vpWidth, setVpWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1400
  );
  useEffect(() => {
    const onResize = () => setVpWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const finalPositions = useMemo(() => {
    if (isMobile) return mobileFinalPositions;
    // Scale so chips reach near viewport edges (designed for 1400px)
    const scale = Math.max(1, vpWidth / 1400);
    return deskstopFinalPositions.map((p) => ({
      x: p.x * scale,
      y: p.y,
    }));
  }, [isMobile, vpWidth]);

  const bubbleVariants = {
    initial: { scale: 0 },
    animate: (i: number) => ({
      scale: [0, 1.5, 1],
      x: [initialPosition.x, finalPositions[i].x],
      y: [initialPosition.y, finalPositions[i].y],
      transition: {
        delay: i * 0.075,
        duration: 0.5,
        ease: "easeInOut" as const,
      },
    }),
    oscillate: (i: number) => ({
      y: [
        finalPositions[i].y,
        finalPositions[i].y + randomInRange(-10, 10),
        finalPositions[i].y + randomInRange(-10, 10),
        finalPositions[i].y,
      ],
      x: [
        finalPositions[i].x,
        finalPositions[i].x + randomInRange(-10, 10),
        finalPositions[i].x + randomInRange(-10, 10),
        finalPositions[i].x,
      ],
      transition: {
        duration: 2,
        ease: "easeInOut" as const,
        repeat: Infinity,
        repeatType: "mirror" as const,
      },
    }),
  };

  // Initialize chip states from final positions
  const initChipStates = useCallback(() => {
    chipStates.current = finalPositions.map((pos) => ({
      x: pos.x,
      y: pos.y,
      vx: 0,
      vy: 0,
    }));
  }, [finalPositions]);

  // Start/stop handsfree chip physics loop
  const startHandsfreePhysics = useCallback(() => {
    if (handsfreeRafRef.current !== null) return;

    // Zero out framer-motion's cached x/y so it doesn't fight our DOM writes.
    // Then use the separate CSS `translate` property which won't conflict.
    controls.stop();
    for (let i = 0; i < finalPositions.length; i++) {
      const el = chipRefs.current[i];
      if (el) {
        // Clear framer-motion's transform by setting it to none, use translate instead
        el.style.transform = "none";
      }
    }

    const tick = () => {
      const { handPositions, inputSource } = useInputSourceStore.getState();

      if (inputSource !== "camera" || handPositions.length === 0) {
        handsfreeRafRef.current = requestAnimationFrame(tick);
        return;
      }

      const containerEl = ref.current;
      if (!containerEl) {
        handsfreeRafRef.current = requestAnimationFrame(tick);
        return;
      }

      const rect = containerEl.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Convert hand NDC positions (-1..1) to pixel positions relative to container center
      const handTargets = handPositions.map((h) => ({
        x: h.x * centerX,
        y: h.y * centerY,
        spread: h.spread,
      }));

      const states = chipStates.current;
      const numChips = states.length;

      // Split chips between hands: 1 hand → all, 2 hands → 7/6 split
      const splitIndex =
        handTargets.length > 1 ? Math.ceil(numChips / 2) : numChips;

      for (let i = 0; i < numChips; i++) {
        const chip = states[i];
        const handIdx = i < splitIndex ? 0 : 1;
        const target = handTargets[Math.min(handIdx, handTargets.length - 1)];

        // Compute orbit radius from hand spread: pinch = tight cluster, open = wide
        const orbitRadius =
          ORBIT_RADIUS_MIN +
          (target.spread ?? 0.5) * (ORBIT_RADIUS_MAX - ORBIT_RADIUS_MIN);

        // Compute orbit target (spread chips around hand in a circle)
        const chipsForThisHand =
          handIdx === 0 ? splitIndex : numChips - splitIndex;
        const idxInGroup = handIdx === 0 ? i : i - splitIndex;
        const angle =
          ((2 * Math.PI) / chipsForThisHand) * idxInGroup +
          performance.now() * 0.0003;
        const orbitX = target.x + Math.cos(angle) * orbitRadius;
        const orbitY = target.y + Math.sin(angle) * orbitRadius;

        // Attraction toward orbit point
        const dx = orbitX - chip.x;
        const dy = orbitY - chip.y;
        chip.vx += dx * ATTRACTION_STRENGTH;
        chip.vy += dy * ATTRACTION_STRENGTH;

        // Repulsion from other chips
        for (let j = 0; j < numChips; j++) {
          if (i === j) continue;
          const other = states[j];
          const rx = chip.x - other.x;
          const ry = chip.y - other.y;
          const distSq = rx * rx + ry * ry;
          if (distSq < 1) continue;
          const force = REPULSION_STRENGTH / distSq;
          const dist = Math.sqrt(distSq);
          chip.vx += (rx / dist) * force;
          chip.vy += (ry / dist) * force;
        }

        // Apply damping and update position
        chip.vx *= DAMPING_FACTOR;
        chip.vy *= DAMPING_FACTOR;
        chip.x += chip.vx;
        chip.y += chip.vy;

        // Use CSS `translate` property (separate from framer-motion's `transform`)
        const el = chipRefs.current[i];
        if (el) {
          if (hiddenChips.current.has(i)) {
            el.style.opacity = "0";
          } else {
            el.style.opacity = "1";
            el.style.translate = `${chip.x}px ${chip.y}px`;
          }
        }

        // Check if chip is near viewport edge for multi-window transfer
        const { glowEdge, adjacentWindows, windowId } =
          useWindowBridgeStore.getState();
        if (
          glowEdge &&
          adjacentWindows.size > 0 &&
          !hiddenChips.current.has(i)
        ) {
          const chipScreenX = centerX + chip.x;
          const edgeThreshold = 60;
          const atRightEdge =
            glowEdge === "right" &&
            chipScreenX > rect.width - edgeThreshold &&
            chip.vx > 2;
          const atLeftEdge =
            glowEdge === "left" &&
            chipScreenX < edgeThreshold &&
            chip.vx < -2;

          if (atRightEdge || atLeftEdge) {
            const normalizedY = (centerY + chip.y) / rect.height;
            broadcastChipTransfer({
              chipIndex: i,
              iconSrc: icons[i],
              velocityX: chip.vx,
              velocityY: chip.vy,
              entryY: normalizedY,
              fromWindowId: windowId,
            });
            hiddenChips.current.add(i);
            if (el) el.style.opacity = "0";
          }
        }
      }

      handsfreeRafRef.current = requestAnimationFrame(tick);
    };

    handsfreeRafRef.current = requestAnimationFrame(tick);
  }, [controls, finalPositions]);

  const stopHandsfreePhysics = useCallback(() => {
    if (handsfreeRafRef.current !== null) {
      cancelAnimationFrame(handsfreeRafRef.current);
      handsfreeRafRef.current = null;
    }
  }, []);

  // Standard entrance + oscillation animation
  useEffect(() => {
    if (inView && !hasEnteredView.current) {
      hasEnteredView.current = true;
      initChipStates();
      controls
        .start((i) => bubbleVariants.animate(i))
        .then(() => {
          controls.start((i) => bubbleVariants.oscillate(i));
        });
    }
  }, [controls, inView]);

  // Subscribe to input source changes for handsfree physics
  useEffect(() => {
    const unsub = useInputSourceStore.subscribe((state, prevState) => {
      if (!hasEnteredView.current) return;

      if (
        state.inputSource === "camera" &&
        prevState.inputSource !== "camera"
      ) {
        // Switching to camera: stop framer motion oscillation, start physics
        initChipStates();
        startHandsfreePhysics();
      } else if (
        state.inputSource !== "camera" &&
        prevState.inputSource === "camera"
      ) {
        // Switching back to mouse: stop physics, restore framer-motion control
        stopHandsfreePhysics();
        hiddenChips.current.clear();
        chipRefs.current.forEach((el) => {
          if (el) {
            el.style.translate = "";
            el.style.transform = "";
            el.style.opacity = "";
          }
        });
        controls.start((i) => bubbleVariants.oscillate(i));
      }
    });

    // If already in camera mode when chips enter view
    if (
      hasEnteredView.current &&
      useInputSourceStore.getState().inputSource === "camera"
    ) {
      initChipStates();
      startHandsfreePhysics();
    }

    return () => {
      unsub();
      stopHandsfreePhysics();
    };
  }, [controls, initChipStates, startHandsfreePhysics, stopHandsfreePhysics]);

  const icons = useMemo(() => {
    return darkMode ? darkIcons : lightIcons;
  }, [darkMode]);

  // Keep an up-to-date ref of icons for the physics loop
  const iconsRef = useRef(icons);
  iconsRef.current = icons;

  // Handle incoming chips from other windows
  useEffect(() => {
    const unsub = useWindowBridgeStore.subscribe((state, prev) => {
      if (state.incomingChips.length <= prev.incomingChips.length) return;

      const newest = state.incomingChips[state.incomingChips.length - 1];
      if (!newest) return;

      // Find a hidden chip slot to reuse, or the matching index
      let targetIdx = newest.chipIndex;
      if (targetIdx >= chipStates.current.length) {
        targetIdx = chipStates.current.length - 1;
      }

      // Unhide the chip and set its position at the entry edge
      hiddenChips.current.delete(targetIdx);
      const containerEl = ref.current;
      if (containerEl) {
        const rect = containerEl.getBoundingClientRect();
        const entryX =
          newest.velocityX > 0 ? -rect.width / 2 + 40 : rect.width / 2 - 40;
        const entryYPx = newest.entryY * rect.height - rect.height / 2;

        if (chipStates.current[targetIdx]) {
          chipStates.current[targetIdx].x = entryX;
          chipStates.current[targetIdx].y = entryYPx;
          chipStates.current[targetIdx].vx = newest.velocityX;
          chipStates.current[targetIdx].vy = newest.velocityY;
        }
      }

      useWindowBridgeStore.getState().clearIncomingChip(newest.chipIndex);
    });

    return unsub;
  }, []);

  return (
    <div className="skills-container" ref={ref} id="skills">
      <p className="main-text" data-color-inverted={"true"}>
        Always Building, <br />
        Always Growing.
      </p>
      {icons.map((icon, i) => (
        <motion.img
          ref={(el) => {
            chipRefs.current[i] = el;
          }}
          src={icon}
          className="bubble"
          custom={i}
          initial="initial"
          animate={controls}
          variants={bubbleVariants as any}
          key={`icon-${i}`}
        />
      ))}
    </div>
  );
};

export default Skills;
