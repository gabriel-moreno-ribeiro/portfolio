// Progresso 0..1 de uma seção, suavizado, com velocidade derivada.
// Um único rAF por seção, e ele só existe enquanto há trabalho: para quando assenta, quando a
// seção sai da viewport e quando a aba fica oculta.
import { useMotionValue } from 'motion/react';
import { useEffect } from 'react';
import type { ElementRef, SectionProgress, SectionProgressOptions } from './types';
import { useReducedMotion } from './useReducedMotion';

const EPSILON = 0.0005;

function clamp01(v: number): number {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

export function useSectionProgress(
  ref: ElementRef,
  { smoothing = 0.12 }: SectionProgressOptions = {},
): SectionProgress {
  const progress = useMotionValue(0);
  const velocity = useMotionValue(0);
  const raw = useMotionValue(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    // Reduced-motion: estado final, sem listeners e sem rAF.
    if (reduced) {
      raw.set(1);
      progress.set(1);
      velocity.set(0);
      return;
    }
    const el = ref.current;
    if (!el || typeof window === 'undefined') return;

    let rafId = 0;
    let measureId = 0;
    let inView = true;
    let lastTime = 0;
    let smoothVelocity = 0;

    const measure = (): number => {
      const rect = el.getBoundingClientRect();
      const span = rect.height - window.innerHeight;
      const value = span <= 0 ? (rect.top <= 0 ? 1 : 0) : clamp01(-rect.top / span);
      raw.set(value);
      return value;
    };

    const canRun = (): boolean => inView && !document.hidden;

    const frame = (time: number): void => {
      rafId = 0;
      if (!canRun()) return;
      const target = measure();
      const dt = lastTime ? Math.max(0.001, (time - lastTime) / 1000) : 0.016;
      lastTime = time;

      const value = progress.get();
      const diff = target - value;
      let next: number;
      if (Math.abs(diff) <= EPSILON) {
        next = target;
      } else {
        next = smoothing <= 0 ? target : value + diff * Math.min(1, smoothing);
      }
      progress.set(next);

      const instant = (next - value) / dt;
      smoothVelocity += (instant - smoothVelocity) * 0.25;
      if (Math.abs(smoothVelocity) < 0.001) smoothVelocity = 0;
      velocity.set(smoothVelocity);

      const settled = next === target && smoothVelocity === 0;
      if (settled) {
        lastTime = 0;
        return;
      }
      rafId = requestAnimationFrame(frame);
    };

    const start = (): void => {
      if (rafId || !canRun()) return;
      lastTime = 0;
      rafId = requestAnimationFrame(frame);
    };

    const stop = (): void => {
      if (rafId) cancelAnimationFrame(rafId);
      if (measureId) cancelAnimationFrame(measureId);
      rafId = 0;
      measureId = 0;
      lastTime = 0;
      smoothVelocity = 0;
      velocity.set(0);
    };

    // scroll/resize são coalescidos em um único rAF.
    const onScroll = (): void => {
      if (measureId || rafId) return;
      measureId = requestAnimationFrame(() => {
        measureId = 0;
        measure();
        start();
      });
    };

    const onVisibility = (): void => {
      if (document.hidden) stop();
      else {
        const target = measure();
        progress.set(target);
        start();
      }
    };

    const io =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            (entries) => {
              inView = entries[entries.length - 1].isIntersecting;
              if (inView) {
                measure();
                start();
              } else {
                stop();
              }
            },
            { rootMargin: '10% 0px' },
          )
        : null;
    io?.observe(el);

    measure();
    progress.set(raw.get());
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      stop();
      io?.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [ref, smoothing, reduced, progress, velocity, raw]);

  return { progress, velocity, raw };
}
