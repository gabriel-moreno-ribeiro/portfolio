import { useCallback, useEffect, useRef, useState } from "react";
import type { Book } from "../../../types/book";
import {
  CAMERA_FOV,
  CAMERA_POS,
  computeBookPositions,
} from "./shelfConfig";

export type ShelfMode = "browse" | "focus";

export interface ShelfState {
  currentIndex: number;
  mode: ShelfMode;
  books: Book[];
  currentBook: Book;
  dragOffset: number;
  next: () => void;
  prev: () => void;
  goTo: (index: number) => void;
  focus: () => void;
  unfocus: () => void;
  containerRef: React.RefObject<HTMLElement | null>;
}

function pxToWorld(): number {
  if (typeof window === "undefined") return 0.005;
  const aspect = window.innerWidth / window.innerHeight;
  const visH = 2 * CAMERA_POS[2] * Math.tan((CAMERA_FOV * Math.PI / 180) / 2);
  return (visH * aspect) / window.innerWidth;
}

const COOLDOWN = 180;

export function useShelfState(books: Book[], initialIndex = 0): ShelfState {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [mode, setMode] = useState<ShelfMode>("browse");
  const [dragOffset, setDragOffset] = useState(0);
  const lastNavTime = useRef(0);
  const containerRef = useRef<HTMLElement | null>(null);
  const dragOffsetRef = useRef(0);

  useEffect(() => { dragOffsetRef.current = dragOffset; }, [dragOffset]);

  const canNav = useCallback(() => {
    const now = Date.now();
    if (now - lastNavTime.current < COOLDOWN) return false;
    lastNavTime.current = now;
    return true;
  }, []);

  const next = useCallback(() => {
    if (mode !== "browse" || !canNav()) return;
    setCurrentIndex((i) => (i + 1) % books.length);
  }, [books.length, mode, canNav]);

  const prev = useCallback(() => {
    if (mode !== "browse" || !canNav()) return;
    setCurrentIndex((i) => (i - 1 + books.length) % books.length);
  }, [books.length, mode, canNav]);

  const goTo = useCallback(
    (index: number) => {
      if (mode !== "browse") return;
      setCurrentIndex(Math.max(0, Math.min(index, books.length - 1)));
    },
    [books.length, mode]
  );

  const focus = useCallback(() => setMode("focus"), []);
  const unfocus = useCallback(() => setMode("browse"), []);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      switch (e.key) {
        case "ArrowRight": e.preventDefault(); next(); break;
        case "ArrowLeft": e.preventDefault(); prev(); break;
        case "Home": e.preventDefault(); goTo(0); break;
        case "End": e.preventDefault(); goTo(books.length - 1); break;
        case "Enter":
        case " ":
          if (mode === "browse") { e.preventDefault(); focus(); }
          break;
        case "Escape":
          if (mode === "focus") { e.preventDefault(); unfocus(); }
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev, goTo, focus, unfocus, mode, books.length]);

  // Wheel
  useEffect(() => {
    if (mode !== "browse") return;
    let accumulated = 0;
    const threshold = 60;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      accumulated += Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (accumulated > threshold) { next(); accumulated = 0; }
      else if (accumulated < -threshold) { prev(); accumulated = 0; }
    };

    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [mode, next, prev]);

  // Continuous pointer drag with inertia and snap
  useEffect(() => {
    if (mode !== "browse") return;
    const el = containerRef.current;
    if (!el) return;

    const positions = computeBookPositions(books);
    let dragging = false;
    let startX = 0;
    let hasMoved = false;
    let animFrame = 0;

    const velocitySamples: { x: number; t: number }[] = [];

    const snapFromOffset = (offset: number) => {
      const currentPos = positions[currentIndex] || 0;
      const effectiveCenter = currentPos - offset;
      let closestIdx = currentIndex;
      let closestDist = Infinity;
      for (let i = 0; i < positions.length; i++) {
        const dist = Math.abs(positions[i] - effectiveCenter);
        if (dist < closestDist) { closestDist = dist; closestIdx = i; }
      }
      setCurrentIndex(closestIdx);
      setDragOffset(0);
    };

    const runInertia = (vel: number) => {
      let v = vel;
      let offset = dragOffsetRef.current;
      const tick = () => {
        v *= 0.92;
        if (Math.abs(v) < 0.002) {
          snapFromOffset(offset);
          return;
        }
        offset += v * 0.016;
        setDragOffset(offset);
        dragOffsetRef.current = offset;
        animFrame = requestAnimationFrame(tick);
      };
      animFrame = requestAnimationFrame(tick);
    };

    const onPointerDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest("button, a, input, .shelf-overlay__detail, .shelf-search")) return;
      cancelAnimationFrame(animFrame);
      startX = e.clientX;
      dragging = true;
      hasMoved = false;
      velocitySamples.length = 0;
      velocitySamples.push({ x: e.clientX, t: performance.now() });
      el.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 5) hasMoved = true;
      const worldDx = dx * pxToWorld();
      setDragOffset(worldDx);
      dragOffsetRef.current = worldDx;
      velocitySamples.push({ x: e.clientX, t: performance.now() });
      if (velocitySamples.length > 6) velocitySamples.shift();
    };

    const onPointerUp = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      el.releasePointerCapture(e.pointerId);

      if (!hasMoved) { setDragOffset(0); return; }

      let velocity = 0;
      if (velocitySamples.length >= 2) {
        const first = velocitySamples[0];
        const last = velocitySamples[velocitySamples.length - 1];
        const dt = (last.t - first.t) / 1000;
        if (dt > 0.01) velocity = ((last.x - first.x) * pxToWorld()) / dt;
      }

      const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (prefersReduced || Math.abs(velocity) < 0.3) {
        snapFromOffset(dragOffsetRef.current);
      } else {
        runInertia(velocity);
      }
    };

    const onPointerCancel = (e: PointerEvent) => {
      if (!dragging) return;
      dragging = false;
      el.releasePointerCapture(e.pointerId);
      setDragOffset(0);
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerCancel);
    return () => {
      cancelAnimationFrame(animFrame);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerCancel);
    };
  }, [mode, books, currentIndex]);

  return {
    currentIndex,
    mode,
    books,
    currentBook: books[currentIndex],
    dragOffset,
    next,
    prev,
    goTo,
    focus,
    unfocus,
    containerRef,
  };
}
