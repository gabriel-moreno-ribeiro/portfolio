// Tipos das primitivas de motion e dos helpers. Fonte da verdade do CONTRACTS.md §4.
// Só o orquestrador edita este arquivo.
import type { MotionValue } from 'motion/react';
import type { ReactNode, RefObject } from 'react';
import type { Source } from '../data/types';

export interface VisibleOptions {
  rootMargin?: string;
  threshold?: number | number[];
  /** Depois de visível uma vez, fica true para sempre. */
  once?: boolean;
}

export interface SectionProgressOptions {
  /** 0 = sem suavização; 0.12 = padrão (lerp por frame). */
  smoothing?: number;
}

export interface SectionProgress {
  /** 0..1 suavizado. Sob reduced-motion: 1. */
  progress: MotionValue<number>;
  /** d(progress)/dt em 1/s. Sob reduced-motion: 0. */
  velocity: MotionValue<number>;
  /** 0..1 sem suavização. */
  raw: MotionValue<number>;
}

export interface PathSample {
  x: number;
  y: number;
  /** Graus, sentido horário, 0 = apontando para +x. */
  angle: number;
  tangent: { x: number; y: number };
}

export interface PathSampler {
  length: number;
  at(t: number): PathSample;
  atLength(len: number): PathSample;
  /** t (0..1) do ponto do path mais próximo de (x, y). */
  nearest(x: number, y: number): number;
}

export interface CounterProps {
  value: number;
  /** ms. */
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  grouping?: boolean;
  /** Quando false, fica em 0 até virar true. Default: true. */
  start?: boolean;
  className?: string;
}

export interface TickerProps {
  children: ReactNode;
  /** px/s. */
  speed?: number;
  pauseOnHover?: boolean;
  direction?: 'left' | 'right';
  ariaLabel?: string;
  className?: string;
}

export interface TypewriterProps {
  phrases: string[];
  /** Tempo parado em cada frase. */
  intervalMs?: number;
  /** Tempo por caractere. */
  typeMs?: number;
  ariaLive?: 'polite' | 'off';
  className?: string;
}

export interface RevealProps {
  children: ReactNode;
  /** s. */
  delay?: number;
  /** px de deslocamento inicial. */
  y?: number;
  once?: boolean;
  as?: 'div' | 'section' | 'li' | 'article' | 'span';
  className?: string;
}

export interface LivePulseProps {
  source: Source;
  updatedAt?: number | null;
  stale?: boolean;
  className?: string;
}

export type WidgetStatus = 'loading' | 'ready' | 'error' | 'empty';

export interface WidgetStateProps {
  state: WidgetStatus;
  children: ReactNode;
  loading?: ReactNode;
  error?: ReactNode;
  empty?: ReactNode;
  className?: string;
}

export type ElementRef = RefObject<HTMLElement | null>;
