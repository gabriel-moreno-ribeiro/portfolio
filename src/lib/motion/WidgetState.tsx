// Cross-fade de 200 ms entre estados, em uma grade 1×1: os estados se sobrepõem, então a altura
// nunca colapsa durante a troca. Sob reduced-motion, troca seca.
import { AnimatePresence, motion } from 'motion/react';
import type { ReactNode } from 'react';
import type { WidgetStateProps } from './types';
import { useReducedMotion } from './useReducedMotion';

export function WidgetState({ state, children, loading, error, empty, className }: WidgetStateProps) {
  const reduced = useReducedMotion();
  const content: ReactNode =
    state === 'loading'
      ? (loading ?? children)
      : state === 'error'
        ? (error ?? children)
        : state === 'empty'
          ? (empty ?? children)
          : children;

  const cls = className ? `hl-widget ${className}` : 'hl-widget';

  if (reduced) {
    return (
      <div className={cls} data-state={state}>
        <div className="hl-widget__layer">{content}</div>
      </div>
    );
  }

  return (
    <div className={cls} data-state={state}>
      <AnimatePresence initial={false}>
        <motion.div
          key={state}
          className="hl-widget__layer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          {content}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
