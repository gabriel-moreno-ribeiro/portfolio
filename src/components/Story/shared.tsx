import { motion, useInView, useReducedMotion } from 'motion/react';
import { ReactNode, useEffect, useRef, useState } from 'react';

export const EASE = [0.22, 1, 0.36, 1] as const;

/** True once the element has scrolled into view (never flips back). */
export function useRevealed<T extends HTMLElement = HTMLDivElement>(margin = '0px 0px -12% 0px') {
  const ref = useRef<T>(null);
  const inView = useInView(ref, { once: true, margin: margin as any });
  return { ref, inView };
}

/** Counts from 0 to `value` once `start` is true. Honors reduced motion. */
export function useCountUp(value: number, start: boolean, duration = 1400, delay = 0) {
  const reduced = useReducedMotion();
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!start) return;
    if (reduced) { setN(value); return; }
    let raf = 0;
    let t0 = 0;
    const tick = (t: number) => {
      if (!t0) t0 = t + delay;
      const p = Math.max(0, Math.min(1, (t - t0) / duration));
      setN(value * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, value, duration, delay, reduced]);
  return n;
}

export function CountUp({
  value, start, decimals = 0, duration, delay, format,
}: {
  value: number;
  start: boolean;
  decimals?: number;
  duration?: number;
  delay?: number;
  format?: (n: number) => string;
}) {
  const n = useCountUp(value, start, duration, delay);
  if (format) return <>{format(n)}</>;
  return <>{n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}</>;
}

/** Fades/rises children in when they enter the viewport. */
export function Reveal({
  children, className, delay = 0, y = 22, as = 'div',
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  as?: 'div' | 'figure' | 'section';
}) {
  const { ref, inView } = useRevealed();
  const reduced = useReducedMotion();
  const Tag = motion[as];
  return (
    <Tag
      ref={ref as any}
      className={className}
      initial={reduced ? false : { opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.7, ease: EASE, delay }}
    >
      {children}
    </Tag>
  );
}
