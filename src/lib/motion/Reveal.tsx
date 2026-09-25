// O conteúdo é renderizado VISÍVEL. Só no layout effect, e só se o elemento ainda estiver fora
// da viewport, ele é escondido para entrar animado. Sem JS ou sem animação: estado final.
import { createElement, useLayoutEffect, useRef, useState } from 'react';
import type { RevealProps } from './types';
import { useReducedMotion } from './useReducedMotion';
import { useVisible } from './useVisible';

export function Reveal({ children, delay = 0, y = 16, once = true, as = 'div', className }: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const [mode, setMode] = useState<'static' | 'hidden' | 'shown'>('static');
  const visible = useVisible(ref, { rootMargin: '0px 0px -10%', once });

  useLayoutEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el || typeof window === 'undefined') return;
    const rect = el.getBoundingClientRect();
    const onScreen = rect.top < window.innerHeight && rect.bottom > 0;
    if (!onScreen) setMode('hidden');
  }, [reduced]);

  useLayoutEffect(() => {
    if (visible) setMode((m) => (m === 'hidden' ? 'shown' : m));
  }, [visible]);

  const style =
    mode === 'hidden'
      ? { opacity: 0, transform: `translate3d(0, ${y}px, 0)` }
      : mode === 'shown'
        ? { opacity: 1, transform: 'translate3d(0, 0, 0)', transitionDelay: `${delay}s` }
        : undefined;

  return createElement(
    as,
    { ref, className: className ? `hl-reveal ${className}` : 'hl-reveal', style, 'data-mode': mode },
    children,
  );
}
