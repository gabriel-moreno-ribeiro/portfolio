// STUB do orquestrador para todo mundo compilar desde o primeiro minuto.
// Entrega sempre o ESTADO FINAL (que é exatamente o comportamento sob reduced-motion).
// O platform-engineer substitui a implementação mantendo estas assinaturas (CONTRACTS.md §4).
import { useMotionValue } from 'motion/react';
import { createElement, useEffect, useState, type ReactElement } from 'react';
import type {
  CounterProps,
  ElementRef,
  LivePulseProps,
  PathSample,
  PathSampler,
  RevealProps,
  SectionProgress,
  SectionProgressOptions,
  TickerProps,
  TypewriterProps,
  VisibleOptions,
  WidgetStateProps,
} from './types';

export * from './types';

const RM_QUERY = '(prefers-reduced-motion: reduce)';

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => typeof window !== 'undefined' && window.matchMedia(RM_QUERY).matches);
  useEffect(() => {
    const mq = window.matchMedia(RM_QUERY);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);
  return reduced;
}

export function useVisible(ref: ElementRef, { rootMargin = '0px', threshold = 0, once = false }: VisibleOptions = {}): boolean {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (once) io.disconnect();
        } else if (!once) {
          setVisible(false);
        }
      },
      { rootMargin, threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, rootMargin, threshold, once]);
  return visible;
}

export function useSectionProgress(_ref: ElementRef, _opts: SectionProgressOptions = {}): SectionProgress {
  // Stub: estado final.
  const progress = useMotionValue(1);
  const velocity = useMotionValue(0);
  const raw = useMotionValue(1);
  return { progress, velocity, raw };
}

const samplerCache = new Map<string, PathSampler>();

export function pathSampler(d: string): PathSampler {
  const cached = samplerCache.get(d);
  if (cached) return cached;
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', d);
  const length = path.getTotalLength();
  const atLength = (len: number): PathSample => {
    const l = Math.max(0, Math.min(length, len));
    const p = path.getPointAtLength(l);
    const q = path.getPointAtLength(Math.min(length, l + 1));
    const tx = q.x - p.x;
    const ty = q.y - p.y;
    const norm = Math.hypot(tx, ty) || 1;
    return { x: p.x, y: p.y, angle: (Math.atan2(ty, tx) * 180) / Math.PI, tangent: { x: tx / norm, y: ty / norm } };
  };
  const sampler: PathSampler = {
    length,
    atLength,
    at: (t) => atLength(t * length),
    nearest(x, y) {
      let best = 0;
      let bestD = Infinity;
      const steps = 200;
      for (let i = 0; i <= steps; i++) {
        const p = path.getPointAtLength((i / steps) * length);
        const dd = (p.x - x) ** 2 + (p.y - y) ** 2;
        if (dd < bestD) {
          bestD = dd;
          best = i / steps;
        }
      }
      return best;
    },
  };
  samplerCache.set(d, sampler);
  return sampler;
}

export function Counter({ value, decimals = 0, prefix = '', suffix = '', grouping = true, className }: CounterProps): ReactElement {
  const text = grouping
    ? value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    : value.toFixed(decimals);
  return createElement('span', { className }, `${prefix}${text}${suffix}`);
}

export function Ticker({ children, ariaLabel, className }: TickerProps): ReactElement {
  return createElement('div', { className, 'aria-label': ariaLabel, role: ariaLabel ? 'group' : undefined }, children);
}

export function Typewriter({ phrases, className, ariaLive = 'polite' }: TypewriterProps): ReactElement {
  return createElement('span', { className, 'aria-live': ariaLive }, phrases[0] ?? '');
}

export function Reveal({ children, as = 'div', className }: RevealProps): ReactElement {
  return createElement(as, { className }, children);
}

export function LivePulse({ source, className }: LivePulseProps): ReactElement {
  return createElement('span', { className }, source === 'live' ? 'live' : source === 'mock' ? 'demo' : 'local');
}

export function WidgetState({ state, children, loading, error, empty, className }: WidgetStateProps): ReactElement {
  const content = state === 'loading' ? loading ?? children : state === 'error' ? error ?? children : state === 'empty' ? empty ?? children : children;
  return createElement('div', { className, 'data-state': state }, content);
}
