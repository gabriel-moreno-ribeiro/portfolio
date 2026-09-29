import { motion, useInView, useReducedMotion } from 'motion/react';
import { ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react';

export const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Content renders in its final state. Only when the element is off-screen at mount (and motion
 * is allowed) is it `armed`: it drops to its start state and plays in once scrolled into view.
 * `hidden` is true only while armed and not yet seen.
 */
export function useRevealed<T extends HTMLElement = HTMLDivElement>(margin = '0px 0px -12% 0px') {
  const ref = useRef<T>(null);
  const reduced = useReducedMotion();
  const [armed, setArmed] = useState(false);
  const inView = useInView(ref, { once: true, margin: margin as any });
  useLayoutEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    if (!(rect.top < window.innerHeight && rect.bottom > 0)) setArmed(true);
  }, [reduced]);
  return { ref, inView, armed, hidden: armed && !inView };
}

/** Shows `value`; counts up from 0 only when `armed`, once `start` is true. */
export function useCountUp(value: number, start: boolean, armed = false, duration = 1400, delay = 0) {
  const [n, setN] = useState(value);
  useLayoutEffect(() => {
    if (armed) setN(0);
  }, [armed]);
  useEffect(() => {
    if (!armed || !start) return;
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
  }, [armed, start, value, duration, delay]);
  return n;
}

export function CountUp({
  value, start, armed, decimals = 0, duration, delay, format,
}: {
  value: number;
  start: boolean;
  armed?: boolean;
  decimals?: number;
  duration?: number;
  delay?: number;
  format?: (n: number) => string;
}) {
  const n = useCountUp(value, start, armed, duration, delay);
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
  const { ref, hidden } = useRevealed();
  const Tag = motion[as];
  return (
    <Tag
      ref={ref as any}
      className={className}
      initial={false}
      animate={hidden ? { opacity: 0, y } : { opacity: 1, y: 0 }}
      transition={hidden ? { duration: 0 } : { duration: 0.7, ease: EASE, delay }}
    >
      {children}
    </Tag>
  );
}
