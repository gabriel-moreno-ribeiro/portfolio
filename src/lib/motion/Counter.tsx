// Odômetro: conta do valor anterior até `value` com ease-out cúbico.
// O número final está sempre disponível para leitores de tela; sob reduced-motion não anima.
import { useEffect, useRef, useState } from 'react';
import type { CounterProps } from './types';
import { useReducedMotion } from './useReducedMotion';

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

export function Counter({
  value,
  duration = 1100,
  decimals = 0,
  prefix = '',
  suffix = '',
  grouping = true,
  start = true,
  className,
}: CounterProps) {
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(() => (start && reduced ? value : 0));
  const [done, setDone] = useState(() => start && reduced);
  const fromRef = useRef(0);

  useEffect(() => {
    if (!start) {
      setDisplay(0);
      setDone(false);
      return;
    }
    const from = fromRef.current;
    const jump = () => {
      fromRef.current = value;
      setDisplay(value);
      setDone(true);
    };
    // Sem animação com reduced-motion, com a aba oculta ou quando não há o que animar.
    if (reduced || duration <= 0 || from === value || (typeof document !== 'undefined' && document.hidden)) {
      jump();
      return;
    }

    let rafId = 0;
    let startTime = 0;
    setDone(false);
    const frame = (time: number) => {
      if (!startTime) startTime = time;
      const t = Math.min(1, (time - startTime) / duration);
      setDisplay(from + (value - from) * easeOutCubic(t));
      if (t < 1) rafId = requestAnimationFrame(frame);
      else jump();
    };
    rafId = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(rafId);
      fromRef.current = value;
    };
  }, [value, duration, start, reduced]);

  const format = (n: number) =>
    `${prefix}${n.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      useGrouping: grouping,
    })}${suffix}`;

  return (
    <span className={className}>
      <span aria-hidden="true">{format(display)}</span>
      <span className="sr-only" aria-live="polite">
        {done ? format(value) : ''}
      </span>
    </span>
  );
}
